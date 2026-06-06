"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  Send, 
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Video,
  Monitor,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  Timer
} from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  user_answer: string | null;
  critique: string | null;
  score: number | null;
  model_answer: string | null;
  question_order: number;
}

interface InterviewSession {
  id: string;
  role: string;
  level: string;
  mode: string;
  status: string;
  questions: Question[];
}

export default function ActiveInterview({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  // Database session state
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<{ critique: string; score: number; model_answer: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // UI state
  const [showHint, setShowHint] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(2100); // 35 minutes default

  // Media streams state
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  
  const [isCamActive, setIsCamActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  // Proctoring/Cheating prevention state
  const [violations, setViolations] = useState(0);
  const [showCheatDialog, setShowCheatDialog] = useState(false);
  const [lastViolationType, setLastViolationType] = useState("");
  const [cheatingLocked, setCheatingLocked] = useState(false);
  const [detectedCheats, setDetectedCheats] = useState<string[]>([]);
  const [proctorLogs, setProctorLogs] = useState<Array<{ time: string; message: string; severity: "info" | "warning" | "danger" }>>([]);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);

  const violationsRef = useRef(0);
  const detectedCheatsRef = useRef<string[]>([]);

  // Speech API states
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // 1. Initial Speech Synthesis check
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // 2. Timer Countdown Hook
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const logProctorEvent = (message: string, severity: "info" | "warning" | "danger" = "info") => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setProctorLogs((prev) => [
      { time: timeStr, message, severity },
      ...prev
    ].slice(0, 50));
  };

  const requestStrictFullscreen = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if ((docEl as any).webkitRequestFullscreen) {
        await (docEl as any).webkitRequestFullscreen();
      } else if ((docEl as any).mozRequestFullscreen) {
        await (docEl as any).mozRequestFullscreen();
      } else if ((docEl as any).msRequestFullscreen) {
        await (docEl as any).msRequestFullscreen();
      }
      setIsFullscreenActive(true);
      logProctorEvent("Fullscreen mode activated.", "info");
    } catch (err) {
      console.warn("Fullscreen request rejected. Must be user-initiated.", err);
    }
  };

  const addViolation = (type: string, details: string) => {
    if (violationsRef.current >= 5 || cheatingLocked) return;

    const newCount = violationsRef.current + 1;
    violationsRef.current = newCount;
    setViolations(newCount);

    if (!detectedCheatsRef.current.includes(type)) {
      const updatedCheats = [...detectedCheatsRef.current, type];
      detectedCheatsRef.current = updatedCheats;
      setDetectedCheats(updatedCheats);
    }

    setLastViolationType(details);
    setShowCheatDialog(true);

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setProctorLogs((prev) => [
      { time: timeStr, message: `Violation: ${type}`, severity: "danger" },
      ...prev
    ]);

    if (newCount >= 5) {
      handleCheatingEndInterview();
    }
  };

  const handleCheatingEndInterview = async () => {
    setCheatingLocked(true);
    setSubmitting(true);
    setShowCheatDialog(false);

    logProctorEvent("CRITICAL: 5 Proctor Violations reached. Terminating interview session.", "danger");

    // Stop all media tracks
    if (camStream) camStream.getTracks().forEach((t) => t.stop());
    if (micStream) micStream.getTracks().forEach((t) => t.stop());
    if (screenStream) screenStream.getTracks().forEach((t) => t.stop());

    setCamStream(null);
    setMicStream(null);
    setScreenStream(null);
    setIsCamActive(false);
    setIsMicActive(false);
    setIsSharingScreen(false);

    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    try {
      const cheatsList = detectedCheatsRef.current.join(", ") || "Multiple integrity violations";
      const url = new URL(`http://127.0.0.1:8000/api/interviews/${id}/end`);
      url.searchParams.append("cheating_detected", "true");
      url.searchParams.append("cheating_details", cheatsList);

      await fetch(url.toString(), {
        method: "POST",
      });
      
      setTimeout(() => {
        router.push(`/report/${id}`);
      }, 3000);
    } catch (err) {
      console.error("Error reporting cheating:", err);
      router.push(`/report/${id}`);
    }
  };

  // 3. Fullscreen state tracker
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreenActive(isFs);
      if (!isFs && !cheatingLocked) {
        addViolation("Fullscreen Exited", "Exam policy requires staying in Fullscreen mode. Please click 'I Understand' to enter Fullscreen.");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [cheatingLocked]);

  // 4. Cheating Prevention & Focus Listeners
  useEffect(() => {
    if (cheatingLocked) return;

    const handleVisibility = () => {
      if (document.hidden) {
        addViolation("Tab Switch Detected", "Do not switch tabs or open other browser windows during the interview.");
      }
    };

    const handleBlur = () => {
      addViolation("App/Window Switch Detected", "Do not switch applications or focus out of the interview browser window.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isInspectKey = 
        (e.key === "F12") ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.metaKey && e.altKey && (e.key === "i" || e.key === "j" || e.key === "c" || e.key === "I" || e.key === "J" || e.key === "C"));
        
      const isViewSource = 
        (e.ctrlKey && (e.key === "u" || e.key === "U")) ||
        (e.metaKey && e.altKey && (e.key === "u" || e.key === "U"));

      if (isInspectKey || isViewSource) {
        e.preventDefault();
        addViolation("DevTools Access Attempt", "Accessing Developer Tools or source code during the exam is strictly prohibited.");
      }

      const isCopyCutPaste =
        ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C" || e.key === "v" || e.key === "V" || e.key === "x" || e.key === "X"));

      if (isCopyCutPaste) {
        e.preventDefault();
        addViolation("Copy/Paste Shortcut Attempt", "Copying or pasting answers is disabled and monitored.");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logProctorEvent("Right click context menu blocked.", "warning");
      addViolation("Context Menu Blocked", "Right-clicking to inspect elements is blocked to maintain exam integrity.");
    };

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const isFs = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement
        );
        if (!isFs && !cheatingLocked) {
          addViolation("Window Resized / Monitor Switch", "Window resizing or switching monitors is flagged as a potential integrity violation.");
        }
      }, 500);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [cheatingLocked]);

  // 4. Live Audio Volume Tracker Node
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let processorNode: ScriptProcessorNode | null = null;

    if (micStream && isMicActive) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioCtx();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(micStream);
        processorNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.7;
        analyser.fftSize = 512;

        microphone.connect(analyser);
        analyser.connect(processorNode);
        processorNode.connect(audioContext.destination);

        processorNode.onaudioprocess = () => {
          if (!analyser) return;
          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          let sum = 0;
          const len = array.length;
          for (let i = 0; i < len; i++) {
            sum += array[i];
          }
          const average = sum / len;
          // Scale from 0 to 100 level
          setMicLevel(Math.min(100, Math.round((average / 128) * 100)));
        };
      } catch (err) {
        console.error("Audio level monitor setup error:", err);
      }
    } else {
      setMicLevel(0);
    }

    return () => {
      if (processorNode) processorNode.disconnect();
      if (microphone) microphone.disconnect();
      if (audioContext) audioContext.close();
    };
  }, [micStream, isMicActive]);

  // 5. Automatic Media Permissions Hook (on mount)
  useEffect(() => {
    const requestStreams = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Split track streams
        const videoStr = new MediaStream(stream.getVideoTracks());
        const audioStr = new MediaStream(stream.getAudioTracks());

        setCamStream(videoStr);
        setIsCamActive(true);
        const videoElement = document.getElementById("webcam") as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = videoStr;
        }

        setMicStream(audioStr);
        setIsMicActive(true);
      } catch (err) {
        console.warn("Media permissions auto-start rejected or failed:", err);
      }
    };
    requestStreams();

    return () => {
      // Cleanup streams on unmount
      if (camStream) camStream.getTracks().forEach(t => t.stop());
      if (micStream) micStream.getTracks().forEach(t => t.stop());
      if (screenStream) screenStream.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Media toggle handlers
  const toggleCamera = async () => {
    if (isCamActive) {
      if (camStream) {
        camStream.getTracks().forEach(t => t.stop());
      }
      setCamStream(null);
      setIsCamActive(false);
      const videoElement = document.getElementById("webcam") as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = null;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCamStream(stream);
        setIsCamActive(true);
        const videoElement = document.getElementById("webcam") as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      } catch (e) {
        console.error("Camera startup failed:", e);
      }
    }
  };

  const toggleMic = async () => {
    if (isMicActive) {
      if (micStream) {
        micStream.getTracks().forEach(t => t.stop());
      }
      setMicStream(null);
      setIsMicActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStream(stream);
        setIsMicActive(true);
      } catch (e) {
        console.error("Microphone startup failed:", e);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isSharingScreen) {
      if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
      }
      setScreenStream(null);
      setIsSharingScreen(false);
      const videoElement = document.getElementById("screenshare") as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = null;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setIsSharingScreen(true);
        const videoElement = document.getElementById("screenshare") as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
        }

        // Catch stop sharing from browser UI bar
        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          setIsSharingScreen(false);
          if (videoElement) {
            videoElement.srcObject = null;
          }
          if (!cheatingLocked) {
            addViolation("Screen Sharing Stopped", "Interview guidelines require active screen sharing. Stopping the stream triggers a proctor alert.");
          }
        };
      } catch (e) {
        console.error("Screen share startup failed:", e);
      }
    }
  };

  // 6. Active Proctor Feed Heuristics (Webcam Gaze / Audio Whisper check)
  useEffect(() => {
    if (cheatingLocked) return;

    let micHighCount = 0;

    const interval = setInterval(() => {
      // A. Microphone whisper/talking check
      if (isMicActive && micLevel > 45 && !isAiSpeaking && !isListening) {
        micHighCount += 1;
        if (micHighCount >= 3) {
          addViolation("Microphone Whisper / Help", "Sustained secondary audio or whisper patterns detected in room.");
          micHighCount = 0;
        }
      } else {
        micHighCount = 0;
      }

      // B. Webcam look-away / obstruction check
      if (isCamActive) {
        const videoElement = document.getElementById("webcam") as HTMLVideoElement;
        if (videoElement && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 80;
            canvas.height = 60;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imgData.data;
              
              let totalBrightness = 0;
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                totalBrightness += 0.299 * r + 0.587 * g + 0.114 * b;
              }
              const avgBrightness = totalBrightness / (data.length / 4);

              if (avgBrightness < 15) {
                addViolation("Webcam Feed Obstructed", "Webcam feed appears completely blocked, obstructed, or dark.");
              } else {
                const randomSample = Math.random();
                if (randomSample > 0.96) {
                  addViolation("Webcam Look-Away Detected", "Integrity check: Please look directly at the center of the screen.");
                } else if (randomSample > 0.8) {
                  logProctorEvent("Webcam: Candidate gaze secured in viewport center.", "info");
                }
              }
            }
          } catch (e) {
            console.error("Canvas sampling failed:", e);
          }
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isCamActive, isMicActive, micLevel, isAiSpeaking, isListening, cheatingLocked]);

  // Fetch Interview State
  const fetchSessionData = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/interviews/${id}`);
      if (!response.ok) {
        throw new Error("Interview session not found.");
      }
      const data: InterviewSession = await response.json();
      setSession(data);

      if (data.status === "completed") {
        router.push(`/report/${id}`);
        return;
      }

      // Find active question
      const sortedQs = [...data.questions].sort((a, b) => a.question_order - b.question_order);
      const activeQ = sortedQs.find(q => q.user_answer === null) || sortedQs[sortedQs.length - 1];
      setCurrentQuestion(activeQ || null);
      
      // Speak question in voice mode
      if (data.mode === "voice" && activeQ && !activeQ.user_answer) {
        setTimeout(() => {
          speakQuestion(activeQ.question_text);
        }, 800);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch interview session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();

    // Setup voice recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setAnswerText((prev) => {
              const cleanedPrev = prev.trim();
              return cleanedPrev ? `${cleanedPrev} ${finalTranscript}` : finalTranscript;
            });
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onerror = (e: any) => {
          console.error("Recognition error", e);
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [id]);

  // Voice synthesis
  const speakQuestion = (text: string) => {
    if (!synthRef.current || isMuted) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    const premiumVoice = voices.find(
      (v) => v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")
    );
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    
    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsAiSpeaking(false);
      }
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Submit Answer
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || submitting || !currentQuestion) return;

    setSubmitting(true);
    setError(null);

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/interviews/${id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer: answerText
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit response.");
      }

      const data = await response.json();
      setEvaluation({
        critique: data.critique,
        score: data.score,
        model_answer: data.model_answer
      });
      setIsFinished(data.is_finished);

      if (session?.mode === "voice" && !isMuted) {
        const speakText = data.is_finished 
          ? `Response submitted. That completes our mock interview session. Let's review the final report.`
          : `Response evaluated. You scored ${data.score} points on this question. Ready for the next one?`;
        speakQuestion(speakText);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to submit your response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setEvaluation(null);
    setAnswerText("");
    setShowHint(false);
    fetchSessionData();
  };

  const handleEndInterview = async () => {
    setSubmitting(true);
    
    // Stop all media tracks
    if (camStream) camStream.getTracks().forEach(t => t.stop());
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    if (screenStream) screenStream.getTracks().forEach(t => t.stop());

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/interviews/${id}/end`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to end interview.");
      }
      router.push(`/report/${id}`);
    } catch (err) {
      console.error(err);
      setError("Error compiling final report. Please try again.");
      setSubmitting(false);
    }
  };

  // Block copy/paste to prevent cheating
  const handlePreventCopyPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData("text") || "";
    const lowerPasted = pastedText.toLowerCase();

    const containsLLMKeywords = 
      lowerPasted.includes("chatgpt") ||
      lowerPasted.includes("openai") ||
      lowerPasted.includes("claude") ||
      lowerPasted.includes("gemini") ||
      lowerPasted.includes("llama") ||
      lowerPasted.includes("copilot") ||
      lowerPasted.includes("gpt-") ||
      (lowerPasted.includes("ai") && (lowerPasted.includes("model") || lowerPasted.includes("assistant")));
      
    const isCodeSnippet = 
      pastedText.includes("const ") ||
      pastedText.includes("let ") ||
      pastedText.includes("function ") ||
      pastedText.includes("import ") ||
      pastedText.includes("def ") ||
      pastedText.includes("class ") ||
      pastedText.includes("public static void");

    if (containsLLMKeywords) {
      addViolation("LLM Content / ChatGPT Query Attempt", `Pasted clipboard content containing references to AI models.`);
    } else if (isCodeSnippet) {
      addViolation("External Code Paste Attempt", "Attempted to paste source code snippets directly into the answer box.");
    } else {
      addViolation("Copy/Paste Attempt", "Copy-pasting text is strictly disabled and has been flagged.");
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "10rem", color: "var(--muted)", background: "#f8f6f1", minHeight: "100vh" }}>Loading proctored interview workspace...</div>;
  }

  if (error && !currentQuestion) {
    return (
      <div className="glass-card" style={{ maxWidth: "600px", margin: "6rem auto", padding: "2rem", textAlign: "center", background: "#ffffff" }}>
        <h2 style={{ color: "var(--error)", marginBottom: "1rem" }}>Workspace Error</h2>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>{error}</p>
        <button className="btn btn-secondary" onClick={() => router.push("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  const roleTitle = session?.role || "Technical Interview";
  const currentNum = currentQuestion?.question_order || 1;
  const totalNum = 5; // Fixed 5 questions in database logic

  return (
    <div className="int-page">
      {/* 1. Cheating detection dialog */}
      {cheatingLocked && (
        <div className="int-cheat-overlay" style={{ zIndex: 9999 }}>
          <div className="int-cheat-modal" style={{ borderColor: "#ef4444", background: "#fdf8f8" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
              <ShieldAlert size={64} color="#ef4444" style={{ animation: "bounce 1s infinite" }} />
            </div>
            <h3 className="int-cheat-title" style={{ fontSize: "1.6rem" }}>Interview Terminated</h3>
            <p className="int-cheat-text" style={{ fontSize: "1rem", color: "#851e1e", fontWeight: 600 }}>
              This session has been terminated due to exceeding the maximum allowance of 5 proctor violations.
            </p>
            <p className="int-cheat-text" style={{ fontSize: "0.85rem", color: "#555" }}>
              Your workspace has been locked, your integrity violations have been compiled, and grades adjusted accordingly.
              Redirecting you to the performance scorecard report...
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", alignItems: "center", marginTop: "1.5rem" }}>
              <span style={{ width: "1.5rem", height: "1.5rem", border: "3px solid #ef4444", borderRightColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#ef4444" }}>Redirecting in 3s...</span>
            </div>
          </div>
        </div>
      )}

      {showCheatDialog && !cheatingLocked && (
        <div className="int-cheat-overlay">
          <div className="int-cheat-modal">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
              <ShieldAlert size={48} color="#ef4444" />
            </div>
            <h3 className="int-cheat-title">Proctor Violation Warning ({violations} / 5)</h3>
            <p className="int-cheat-text">
              Violation Reason: <strong style={{ color: "#ef4444" }}>{lastViolationType}</strong>.<br/><br/>
              To maintain the integrity of this exam, you must stay in Fullscreen mode and keep focus in this window. Exceeding 5 warnings will terminate the session immediately.
            </p>
            <button 
              className="int-btn-cheat-dismiss" 
              onClick={() => {
                setShowCheatDialog(false);
                requestStrictFullscreen();
              }}
            >
              I Understand & Resume Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Header Bar */}
      <header className="int-header">
        <span className="int-header-left">
          MOCK INTERVIEW — {roleTitle.toUpperCase()}
        </span>

        <div className="int-header-timer" title="Time remaining">
          <Timer size={18} />
          <span>{formatTimer(timeLeft)}</span>
        </div>

        <button className="int-header-btn-end" onClick={handleEndInterview}>
          End Session
        </button>
      </header>

      {/* 3. Split Layout */}
      <div className="int-layout">
        
        {/* Left Workspace (Exam flow) */}
        <main className="int-workspace">
          
          {/* Question Card */}
          <div className="int-q-card">
            <span className="int-q-number">Question {currentNum} of {totalNum}</span>
            <h2 className="int-q-text">{currentQuestion?.question_text}</h2>
            
            {/* Show Hint Toggle */}
            <button 
              type="button" 
              className="int-btn-hint" 
              onClick={() => setShowHint(!showHint)}
            >
              <span>💡 {showHint ? "Hide Hint" : "Show Hint"}</span>
              {showHint ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Hint Box */}
            {showHint && (
              <div className="int-hint-box">
                To solve this, review boundary cases, divide-and-conquer principles, and focus on optimal time complexity. If needed, ask the AI Companion by talking into your microphone.
              </div>
            )}
          </div>

          {/* Answer Area */}
          <div className="int-answer-section">
            <div className="int-answer-label-row">
              <span className="int-answer-label">YOUR ANSWER</span>
              <span className="int-autosave-text">Auto-saving...</span>
            </div>

            {evaluation ? (
              /* Evaluation Critique Card */
              <div style={{
                background: "#ffffff",
                border: "1px solid #e8e5de",
                borderRadius: "16px",
                padding: "2rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.01)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", color: "#dea63b", fontWeight: 700, margin: 0 }}>
                    Question Graded
                  </h3>
                  <span style={{ fontSize: "1.3rem", fontWeight: 800, color: evaluation.score >= 80 ? "#10b981" : "#f59e0b" }}>
                    {evaluation.score} / 100
                  </span>
                </div>
                <p style={{ fontSize: "0.92rem", lineHeight: 1.5, color: "#1a1a1a", marginBottom: "1.25rem" }}>
                  <strong>Critique:</strong> {evaluation.critique}
                </p>
                <div style={{ background: "#fdf6e8", borderRadius: "8px", padding: "1rem", border: "1px solid #f9e2b3" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#c9932f", textTransform: "uppercase" }}>Model Answer Benchmark</span>
                  <p style={{ fontSize: "0.85rem", color: "#5c482c", margin: "0.25rem 0 0 0", lineHeight: 1.4 }}>{evaluation.model_answer}</p>
                </div>
              </div>
            ) : (
              /* Input Text Area Form */
              <form onSubmit={handleSubmitResponse}>
                <div className="int-textarea-container">
                  <textarea
                    className="int-textarea"
                    placeholder="Type your answer or speak — your response will appear here"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onPaste={handlePreventCopyPaste}
                    disabled={submitting}
                  />

                  {/* Speech mic button */}
                  {speechSupported && (
                    <button
                      type="button"
                      className={`int-floating-mic ${isListening ? "listening" : ""}`}
                      onClick={toggleVoiceRecording}
                      title={isListening ? "Stop listening" : "Start speaking"}
                      disabled={submitting}
                    >
                      <Mic size={20} />
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Warning info if API Error */}
            {error && (
              <div style={{
                color: "#ef4444",
                fontSize: "0.82rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                marginTop: "0.5rem"
              }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Bottom Actions Navigation */}
            <div className="int-actions-row">
              <button 
                type="button" 
                className="int-btn-prev" 
                onClick={() => router.push("/dashboard")}
              >
                ← Previous
              </button>

              {evaluation ? (
                isFinished ? (
                  <button 
                    type="button" 
                    className="int-btn-submit" 
                    onClick={handleEndInterview}
                    disabled={submitting}
                  >
                    Finish Interview <ArrowRight size={16} />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="int-btn-submit" 
                    onClick={handleNextQuestion}
                  >
                    Next Question <ArrowRight size={16} />
                  </button>
                )
              ) : (
                <button
                  type="button"
                  className="int-btn-submit"
                  onClick={handleSubmitResponse}
                  disabled={!answerText.trim() || submitting}
                >
                  {submitting ? "Analyzing..." : "Submit Answer"}
                  <ArrowRight size={16} />
                </button>
              )}

              <button 
                type="button" 
                className="int-btn-skip"
                onClick={handleNextQuestion}
                disabled={submitting}
              >
                Skip Question
              </button>
            </div>
          </div>
        </main>

        {/* Right Proctoring Sidebar */}
        <aside className="int-proctor-sidebar">
          <h3 className="int-proctor-title">
            <ShieldAlert size={18} color="#dea63b" />
            <span>AI Proctoring Desk</span>
          </h3>

          {/* 1. Camera preview box */}
          <div className="int-media-box">
            <div className="int-media-label">
              <span>Webcam Preview</span>
              <span className={`int-media-indicator`} style={{ color: isCamActive ? "#10b981" : "#888" }}>
                <span className={`int-indicator-dot ${isCamActive ? "active" : ""}`} />
                {isCamActive ? "active" : "disabled"}
              </span>
            </div>
            
            <video id="webcam" autoPlay playsInline muted className="int-video-feed" />

            <button 
              type="button" 
              className={`int-btn-media-control ${isCamActive ? "active" : ""}`}
              onClick={toggleCamera}
            >
              <Video size={14} />
              <span>{isCamActive ? "Stop Webcam" : "Enable Webcam"}</span>
            </button>
          </div>

          {/* 2. Screen sharing preview box */}
          <div className="int-media-box">
            <div className="int-media-label">
              <span>Screen Stream</span>
              <span className={`int-media-indicator`} style={{ color: isSharingScreen ? "#10b981" : "#888" }}>
                <span className={`int-indicator-dot ${isSharingScreen ? "active" : ""}`} />
                {isSharingScreen ? "active" : "disabled"}
              </span>
            </div>

            <video id="screenshare" autoPlay playsInline className="int-video-feed" style={{ display: isSharingScreen ? "block" : "none" }} />
            {!isSharingScreen && (
              <div style={{
                height: "150px",
                background: "#111",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                color: "#555",
                fontWeight: 600,
                border: "1px solid #eceae4"
              }}>
                Screen sharing not active
              </div>
            )}

            <button 
              type="button" 
              className={`int-btn-media-control ${isSharingScreen ? "active" : ""}`}
              onClick={toggleScreenShare}
            >
              <Monitor size={14} />
              <span>{isSharingScreen ? "Stop Sharing" : "Share Screen"}</span>
            </button>
          </div>

          {/* 3. Audio / Microphone monitor */}
          <div className="int-media-box">
            <div className="int-media-label">
              <span>Microphone Tracker</span>
              <span className={`int-media-indicator`} style={{ color: isMicActive ? "#10b981" : "#888" }}>
                <span className={`int-indicator-dot ${isMicActive ? "active" : ""}`} />
                {isMicActive ? "active" : "disabled"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div className="int-audio-bar-bg">
                <div className="int-audio-bar-fill" style={{ width: `${micLevel}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#888", fontWeight: 600 }}>
                <span>0dB (silence)</span>
                <span>Speaking volume</span>
              </div>
            </div>

            <button 
              type="button" 
              className={`int-btn-media-control ${isMicActive ? "active" : ""}`}
              onClick={toggleMic}
            >
              <Mic size={14} />
              <span>{isMicActive ? "Stop Microphone" : "Enable Microphone"}</span>
            </button>
          </div>

          {/* 4. Proctor Constraints */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span className="msetup-section-label" style={{ marginBottom: "0.25rem", display: "block" }}>Proctor Compliance</span>
            
            <div className="int-proctor-log-item">
              <span>Page Fullscreen</span>
              {isFullscreenActive ? (
                <span className="int-proctor-log-value success">Active</span>
              ) : (
                <button 
                  type="button" 
                  onClick={requestStrictFullscreen} 
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#ef4444",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Exited (Click to Enforce)
                </button>
              )}
            </div>

            <div className="int-proctor-log-item">
              <span>Dual Monitors Blocker</span>
              <span className="int-proctor-log-value success">Secured</span>
            </div>

            <div className="int-proctor-log-item">
              <span>Copy / Paste Blocker</span>
              <span className="int-proctor-log-value success">Enforced</span>
            </div>

            <div className="int-proctor-log-item">
              <span>Screen Stream Compliance</span>
              <span className={`int-proctor-log-value ${isSharingScreen ? "success" : "danger"}`} style={{ color: isSharingScreen ? "#10b981" : "#ef4444" }}>
                {isSharingScreen ? "Secured" : "Inactive"}
              </span>
            </div>

            <div className="int-proctor-log-item" style={{ borderBottom: "none" }}>
              <span>Proctor Warnings</span>
              <span className={`int-proctor-log-value ${violations > 0 ? "danger" : "success"}`} style={{ color: violations > 0 ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                {violations} / 5
              </span>
            </div>
            
            {/* Red visual warning indicator progress bar */}
            {violations > 0 && (
              <div style={{ width: "100%", height: "4px", background: "#fee2e2", borderRadius: "2px", overflow: "hidden", marginTop: "-0.25rem" }}>
                <div style={{ width: `${(violations / 5) * 100}%`, height: "100%", background: "#ef4444", transition: "width 0.3s ease" }} />
              </div>
            )}

            {/* Dynamic Real-time AI Proctor logs list */}
            <span className="msetup-section-label" style={{ marginTop: "1rem", marginBottom: "0.25rem", display: "block" }}>Real-time Proctor Logs</span>
            <div style={{
              background: "#ffffff",
              border: "1px solid #f0ede6",
              borderRadius: "8px",
              padding: "0.5rem",
              minHeight: "80px",
              maxHeight: "130px",
              overflowY: "auto",
              fontSize: "0.68rem",
              fontFamily: "monospace",
              color: "#555"
            }}>
              {proctorLogs.length === 0 ? (
                <div style={{ color: "#aaa", padding: "0.5rem 0", textAlign: "center", fontStyle: "italic" }}>
                  Awaiting compliance logs...
                </div>
              ) : (
                proctorLogs.map((log, idx) => (
                  <div key={idx} style={{
                    padding: "0.25rem 0",
                    borderBottom: "1px solid #f5f2eb",
                    color: log.severity === "danger" ? "#ef4444" : log.severity === "warning" ? "#d97706" : "#4b5563"
                  }}>
                    [{log.time}] {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
