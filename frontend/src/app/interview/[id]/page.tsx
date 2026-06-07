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
  Timer,
  Lock,
  Unlock
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
  const audioBarRef = useRef<HTMLDivElement | null>(null);
  const micLevelRef = useRef(0);
  const soundwaveBarsRef = useRef<NodeListOf<Element> | null>(null);
  const confidenceBarsRef = useRef<NodeListOf<Element> | null>(null);

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
  const [proctorOpen, setProctorOpen] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [initializingFeeds, setInitializingFeeds] = useState(false);

  // Copilot and Companion states
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotHint, setCopilotHint] = useState<string | null>(null);
  
  const [companionOpen, setCompanionOpen] = useState(false);
  const [companionMessages, setCompanionMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "Hey! I'm your AI Interview Companion. Need a concept explained, syntax clarified, or just some encouragement? Ask away!" }
  ]);
  const [companionInput, setCompanionInput] = useState("");
  const [companionLoading, setCompanionLoading] = useState(false);

  const isCamActiveRef = useRef(isCamActive);
  const isMicActiveRef = useRef(isMicActive);
  const isAiSpeakingRef = useRef(isAiSpeaking);
  const isListeningRef = useRef(isListening);
  const cheatingLockedRef = useRef(cheatingLocked);

  useEffect(() => { isCamActiveRef.current = isCamActive; }, [isCamActive]);
  useEffect(() => { isMicActiveRef.current = isMicActive; }, [isMicActive]);
  useEffect(() => { isAiSpeakingRef.current = isAiSpeaking; }, [isAiSpeaking]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { cheatingLockedRef.current = cheatingLocked; }, [cheatingLocked]);

  interface FeedbackChip {
    id: string;
    type: "complexity" | "filler" | "incorrect";
    label: string;
    value: string;
  }

  const [feedbackChips, setFeedbackChips] = useState<FeedbackChip[]>([]);

  // Sync typed answer with transcript if not speaking
  useEffect(() => {
    if (!isListening && answerText) {
      setTranscriptText(answerText);
    }
  }, [answerText, isListening]);

  // Analyze transcript text for dynamic micro-feedback chips (Debounced to prevent keypress lag)
  useEffect(() => {
    const handler = setTimeout(() => {
      const text = (transcriptText || "").toLowerCase();
      const newChips: FeedbackChip[] = [];

      if (text.includes("redis") || text.includes("cache") || text.includes("central storage")) {
        newChips.push({
          id: "redis",
          type: "complexity",
          label: "Good Complexity Mention",
          value: "Redis central storage"
        });
      }
      if (text.includes("token bucket") || text.includes("rate limit") || text.includes("sliding window")) {
        newChips.push({
          id: "algorithm",
          type: "complexity",
          label: "Good Complexity Mention",
          value: "Token bucket algorithm"
        });
      }
      if (text.includes("postgres") || text.includes("database") || text.includes("nosql")) {
        newChips.push({
          id: "db",
          type: "complexity",
          label: "Good Complexity Mention",
          value: "Database persistence"
        });
      }
      if (text.includes("basically") || text.includes(" um ") || text.includes(" like ") || text.includes(" actually ")) {
        newChips.push({
          id: "filler-word",
          type: "filler",
          label: "Filler Word Detected",
          value: "Filler: basically / like"
        });
      }
      if (text.includes("stateless") || text.includes("spof") || text.includes("single server")) {
        newChips.push({
          id: "assumption",
          type: "incorrect",
          label: "Incorrect Assumption",
          value: "Assumption: single server bottleneck"
        });
      }

      setFeedbackChips(newChips);
    }, 350);

    return () => clearTimeout(handler);
  }, [transcriptText]);

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
          const val = Math.min(100, Math.round((average / 128) * 100));
          micLevelRef.current = val;
          if (audioBarRef.current) {
            audioBarRef.current.style.width = `${val}%`;
          }

          // Direct DOM manipulation for high-performance soundwave rendering
          if (!soundwaveBarsRef.current) {
            soundwaveBarsRef.current = document.querySelectorAll(".int-soundwave-bar");
          }
          const soundwaveBars = soundwaveBarsRef.current;
          soundwaveBars.forEach((bar: any) => {
            const factor = 0.5 + Math.random() * 1.5;
            const barHeight = Math.max(8, Math.min(48, Math.round((val / 100) * 40 * factor)));
            bar.style.height = `${barHeight}px`;
          });

          // Direct DOM manipulation for confidence indicator bars
          if (!confidenceBarsRef.current) {
            confidenceBarsRef.current = document.querySelectorAll(".int-confidence-bar");
          }
          const confidenceBars = confidenceBarsRef.current;
          const activeCount = val > 0 ? Math.max(1, Math.min(5, Math.ceil(val / 20))) : 3;
          confidenceBars.forEach((bar: any, idx) => {
            if (idx < activeCount) {
              bar.classList.add("active");
            } else {
              bar.classList.remove("active");
            }
          });
        };
      } catch (err) {
        console.error("Audio level monitor setup error:", err);
      }
    } else {
      micLevelRef.current = 0;
      if (audioBarRef.current) {
        audioBarRef.current.style.width = "0%";
      }
    }

    return () => {
      if (processorNode) processorNode.disconnect();
      if (microphone) microphone.disconnect();
      if (audioContext) audioContext.close();
    };
  }, [micStream, isMicActive]);

  // 5. Automatic Media Cleanup Hook (on unmount)
  useEffect(() => {
    return () => {
      if (camStream) camStream.getTracks().forEach(t => t.stop());
      if (micStream) micStream.getTracks().forEach(t => t.stop());
      if (screenStream) screenStream.getTracks().forEach(t => t.stop());
    };
  }, [camStream, micStream, screenStream]);

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

  const handleInitializeWorkspace = async () => {
    setInitializingFeeds(true);
    setError(null);
    try {
      // 1. Request Webcam and Mic
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoStr = new MediaStream(stream.getVideoTracks());
      const audioStr = new MediaStream(stream.getAudioTracks());
      
      setCamStream(videoStr);
      setIsCamActive(true);
      
      setMicStream(audioStr);
      setIsMicActive(true);

      // 2. Request Screen Sharing
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(displayStream);
      setIsSharingScreen(true);

      // Set screenshare disconnect handler
      displayStream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        setIsSharingScreen(false);
        if (!cheatingLocked) {
          addViolation("Screen Sharing Stopped", "Interview guidelines require active screen sharing. Stopping the stream triggers a proctor alert.");
        }
      };

      // 3. Request Strict Fullscreen
      await requestStrictFullscreen();

      // 4. Everything is ready!
      setWorkspaceReady(true);
      logProctorEvent("Secure workspace feed initialization complete.", "info");

      // Speak the first question now that user clicked "Begin" (transient user gesture confirmed)
      if (currentQuestion && !currentQuestion.user_answer && session?.mode === "voice") {
        setTimeout(() => {
          speakQuestion(currentQuestion.question_text);
        }, 800);
      }

      // Bind webcam and screenshare srcObject (delayed by DOM mount)
      setTimeout(() => {
        const videoElement = document.getElementById("webcam") as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = videoStr;
        }
        const screenElement = document.getElementById("screenshare") as HTMLVideoElement;
        if (screenElement) {
          screenElement.srcObject = displayStream;
        }
      }, 500);

    } catch (err: any) {
      console.error("Secure workspace feed initialization failed:", err);
      setError("Failed to initialize workspace feeds. Both camera and screen sharing access are strictly required to start this proctored session.");
      setInitializingFeeds(false);
    }
  };

  // 6. Active Proctor Feed Heuristics (Webcam Gaze / Audio Whisper check)
  useEffect(() => {
    let micHighCount = 0;

    const interval = setInterval(() => {
      if (cheatingLockedRef.current) return;

      // A. Microphone whisper/talking check
      if (isMicActiveRef.current && micLevelRef.current > 45 && !isAiSpeakingRef.current && !isListeningRef.current) {
        micHighCount += 1;
        if (micHighCount >= 3) {
          addViolation("Microphone Whisper / Help", "Sustained secondary audio or whisper patterns detected in room.");
          micHighCount = 0;
        }
      } else {
        micHighCount = 0;
      }

      // B. Webcam look-away / obstruction check
      if (isCamActiveRef.current) {
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
  }, []);

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
      
      // Speak question in voice mode (only if workspace is initialized to prevent browser security blocks)
      if (data.mode === "voice" && activeQ && !activeQ.user_answer && workspaceReady) {
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
            setTranscriptText((prev) => {
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
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = synthRef.current.getVoices();
    // Prioritize English voices, then premium names
    let selectedVoice = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))
    );
    if (!selectedVoice) {
      // Fallback to any English voice
      selectedVoice = voices.find((v) => v.lang.startsWith("en"));
    }
    if (!selectedVoice) {
      // Fallback to first available voice
      selectedVoice = voices[0];
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
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
    setCopilotHint(null);
    fetchSessionData();
  };

  const handleGetCopilotHint = async (type: "code" | "complexity" | "edge_cases") => {
    setCopilotLoading(true);
    setCopilotHint(null);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/ai/copilot-hint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_text: currentQuestion?.question_text || "",
          answer_draft: answerText,
          hint_type: type
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setCopilotHint(data.hint);
      } else {
        setCopilotHint("Failed to retrieve hint from AI Copilot.");
      }
    } catch (err) {
      console.error("Copilot error:", err);
      setCopilotHint("Connection failed. Ensure the backend is online.");
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleSendCompanionMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companionInput.trim() || companionLoading) return;
    const userMsg = companionInput.trim();
    setCompanionInput("");
    
    const updatedMsgs = [...companionMessages, { role: "user", content: userMsg }];
    setCompanionMessages(updatedMsgs);
    setCompanionLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/ai/companion-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_text: currentQuestion?.question_text || "",
          answer_draft: answerText,
          history: updatedMsgs,
          message: userMsg
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setCompanionMessages([...updatedMsgs, { role: "assistant", content: data.response }]);
      } else {
        setCompanionMessages([...updatedMsgs, { role: "assistant", content: "Sorry, I encountered an issue connecting to my logic center." }]);
      }
    } catch (err) {
      console.error("Companion chat error:", err);
      setCompanionMessages([...updatedMsgs, { role: "assistant", content: "Sorry, I can't connect to the backend server right now." }]);
    } finally {
      setCompanionLoading(false);
    }
  };

  const handleSkipQuestion = async () => {
    if (submitting || !currentQuestion) return;

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
          answer: "[Question skipped by candidate]"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to skip question.");
      }

      const data = await response.json();
      
      if (data.is_finished) {
        setEvaluation({
          critique: data.critique,
          score: data.score,
          model_answer: data.model_answer
        });
        setIsFinished(true);
        if (session?.mode === "voice" && !isMuted) {
          speakQuestion("Question skipped. That completes our mock interview session. Let's review the final report.");
        }
      } else {
        setEvaluation(null);
        setAnswerText("");
        setShowHint(false);
        await fetchSessionData();
        if (session?.mode === "voice" && !isMuted) {
          speakQuestion("Question skipped. Moving to the next question.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to skip your question. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        background: "#050505", 
        color: "var(--primary)", 
        minHeight: "100vh",
        gap: "1.5rem"
      }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(242, 166, 50, 0.15)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.9rem" }}>Loading proctored interview workspace...</span>
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="glass-card" style={{ maxWidth: "600px", margin: "8rem auto", padding: "2.5rem", textAlign: "center", background: "rgba(10, 10, 10, 0.6)", borderColor: "rgba(239, 68, 68, 0.3)" }}>
        <h2 style={{ color: "var(--error)", marginBottom: "1rem", fontFamily: "var(--font-display)", fontWeight: 800 }}>Workspace Error</h2>
        <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "0.95rem", lineHeight: 1.5 }}>{error}</p>
        <button className="btn btn-secondary" onClick={() => router.push("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  const roleTitle = session?.role || "Technical Interview";
  const currentNum = currentQuestion?.question_order || 1;
  const totalNum = 5; // Fixed 5 questions in database logic

  // Dynamic metrics scores
  const eyeDots = detectedCheats.includes("Webcam Look-Away Detected") ? 1 : 3;
  const pacingDots = isListening ? 3 : 2;
  const fillerDots = feedbackChips.some(c => c.type === "filler") ? 2 : 0;

  if (!workspaceReady) {
    return (
      <div className="int-init-overlay">
        <div className="int-init-card">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
            <div style={{ display: "inline-flex", padding: "1rem", borderRadius: "50%", background: "rgba(242, 166, 50, 0.05)", border: "1px solid rgba(242, 166, 50, 0.15)", color: "var(--primary)" }}>
              <ShieldAlert size={36} />
            </div>
          </div>
          
          <h2 className="int-init-title">Secure Workspace Setup</h2>
          <p className="int-init-desc">
            To begin this mock session, please grant camera, microphone, and screen sharing access. These feeds are analyzed locally for exam integrity.
          </p>

          <div className="int-init-feeds-list">
            <div className="int-init-feed-item">
              <span className="int-init-feed-label">
                <Video size={16} style={{ color: isCamActive && isMicActive ? "#10b981" : "var(--primary)" }} />
                Webcam & Microphone Feed
              </span>
              <span className={`int-init-feed-status ${isCamActive && isMicActive ? 'granted' : 'pending'}`}>
                {isCamActive && isMicActive ? 'Ready' : 'Pending'}
              </span>
            </div>

            <div className="int-init-feed-item">
              <span className="int-init-feed-label">
                <Monitor size={16} style={{ color: isSharingScreen ? "#10b981" : "var(--primary)" }} />
                Screen Share Stream
              </span>
              <span className={`int-init-feed-status ${isSharingScreen ? 'granted' : 'pending'}`}>
                {isSharingScreen ? 'Ready' : 'Pending'}
              </span>
            </div>
          </div>

          {error && (
            <div style={{ color: "#ef4444", fontSize: "0.82rem", marginBottom: "1.5rem", textAlign: "left", lineHeight: 1.4, display: "flex", gap: "0.35rem" }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            className="int-init-btn-start"
            onClick={handleInitializeWorkspace}
            disabled={initializingFeeds || loading || !currentQuestion}
          >
            {initializingFeeds ? (
              <>
                <span style={{ width: "1.1rem", height: "1.1rem", border: "2px solid #050505", borderRightColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite", marginRight: "0.5rem" }} />
                <span>Configuring Workspace...</span>
              </>
            ) : loading ? (
              <>
                <span style={{ width: "1.1rem", height: "1.1rem", border: "2px solid #050505", borderRightColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite", marginRight: "0.5rem" }} />
                <span>Loading Session...</span>
              </>
            ) : (
              <>
                <span>GRANT FEEDS & BEGIN</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="int-page">
      {/* 1. Cheating detection dialog */}
      {cheatingLocked && (
        <div className="int-cheat-overlay" style={{ zIndex: 9999 }}>
          <div className="int-cheat-modal">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
              <ShieldAlert size={64} color="#ef4444" style={{ animation: "bounce 1s infinite" }} />
            </div>
            <h3 className="int-cheat-title" style={{ fontSize: "1.6rem" }}>Interview Terminated</h3>
            <p className="int-cheat-text" style={{ fontSize: "1rem", color: "#f87171", fontWeight: 600 }}>
              This session has been terminated due to exceeding the maximum allowance of 5 proctor violations.
            </p>
            <p className="int-cheat-text" style={{ fontSize: "0.85rem", color: "#8e8e93" }}>
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
          SESSION 1/1 &nbsp;&middot;&nbsp; {roleTitle.toUpperCase()} &nbsp;&nbsp;&middot;&nbsp;&nbsp; 
          <Timer size={14} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--primary)', marginRight: '4px', marginTop: '-2px' }} /> 
          <span style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>{formatTimer(timeLeft)}</span>
        </span>
      </header>

      {/* 3. Split Layout */}
      <div className="int-layout">
        
        {/* Left Workspace (Exam flow) */}
        <main className="int-workspace">
          {/* AI Avatar Face Animation */}
          <div className="ai-avatar-container">
            <div className="ai-avatar-wrapper">
              <div className="ai-avatar-outer"></div>
              <div className="ai-avatar-mid"></div>
              <div className="ai-avatar-inner">
                <div className="ai-avatar-face">
                  <div className="ai-avatar-axis"></div>
                  <div 
                    className="ai-avatar-eye left ai-eye-blink"
                    style={{
                      transform: detectedCheats.includes("Webcam Look-Away Detected") 
                        ? "translateX(-3px) rotate(45deg) scale(0.9)" 
                        : "rotate(45deg)"
                    }}
                  ></div>
                  <div 
                    className="ai-avatar-eye right ai-eye-blink"
                    style={{
                      transform: detectedCheats.includes("Webcam Look-Away Detected") 
                        ? "translateX(-3px) rotate(45deg) scale(0.9)" 
                        : "rotate(45deg)"
                    }}
                  ></div>
                  <svg className="ai-avatar-smile" viewBox="0 0 100 100">
                    <path d="M 25 50 Q 50 68 75 50" fill="none" stroke="#f2a632" strokeWidth="2.5" strokeDasharray="3 3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Soundwave Visualizer */}
          <div className="int-soundwave-wrapper">
            <div className={`int-soundwave-bar ${(isListening || isAiSpeaking) ? 'animating' : ''}`}></div>
            <div className={`int-soundwave-bar ${(isListening || isAiSpeaking) ? 'animating' : ''}`}></div>
            <div className={`int-soundwave-bar ${(isListening || isAiSpeaking) ? 'animating' : ''}`}></div>
            <div className={`int-soundwave-bar ${(isListening || isAiSpeaking) ? 'animating' : ''}`}></div>
            <div className={`int-soundwave-bar ${(isListening || isAiSpeaking) ? 'animating' : ''}`}></div>
            <div className={`int-soundwave-bar ${(isListening || isAiSpeaking) ? 'animating' : ''}`}></div>
            <div className={`int-soundwave-bar ${(isListening || isAiSpeaking) ? 'animating' : ''}`}></div>
            <div className={`int-soundwave-bar ${(isListening || isAiSpeaking) ? 'animating' : ''}`}></div>
          </div>
          
          {/* Question Card */}
          <div className="int-q-card">
            <span className="int-q-number">CURRENT PROMPT</span>
            <h2 className="int-q-text">Q{currentNum}: {currentQuestion?.question_text}</h2>
            
            {/* Interactive AI Coding Copilot Panel */}
            <div style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button 
                  type="button" 
                  className="int-btn-hint" 
                  onClick={() => setShowHint(!showHint)}
                  style={{ gap: "0.4rem" }}
                >
                  <Sparkles size={14} />
                  <span>{showHint ? "Hide AI Copilot" : "Consult AI Copilot"}</span>
                  {showHint ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {showHint && (
                <div className="int-hint-box" style={{ marginTop: "0.75rem", padding: "1rem" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    {[
                      { type: "code" as const, label: "Code Structure" },
                      { type: "complexity" as const, label: "Complexity Bottleneck" },
                      { type: "edge_cases" as const, label: "Edge Cases to Check" }
                    ].map((btn) => (
                      <button
                        key={btn.type}
                        type="button"
                        onClick={() => handleGetCopilotHint(btn.type)}
                        disabled={copilotLoading}
                        style={{
                          padding: "0.4rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid rgba(242, 166, 50, 0.25)",
                          background: "rgba(242, 166, 50, 0.04)",
                          color: "#fff",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "rgba(242, 166, 50, 0.08)"}
                        onMouseOut={(e) => e.currentTarget.style.background = "rgba(242, 166, 50, 0.04)"}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {copilotLoading && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.76rem", color: "var(--muted)" }}>
                      <span className="msetup-spinner" style={{ width: "12px", height: "12px", borderWidth: "2px" }} />
                      <span>Retrieving analysis from AI Copilot...</span>
                    </div>
                  )}

                  {copilotHint && !copilotLoading && (
                    <div style={{ fontSize: "0.8rem", color: "#e4e4e7", lineHeight: 1.45, background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid var(--primary)" }}>
                      {copilotHint}
                    </div>
                  )}

                  {!copilotHint && !copilotLoading && (
                    <div style={{ fontSize: "0.76rem", color: "var(--muted)", fontStyle: "italic" }}>
                      Select a hint perspective above to query the AI Copilot based on your current editor code draft.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Two-Panel Workspace */}
        <aside className="int-right-panel">
          {/* Top Panel: Scratchpad */}
          <div className="int-scratchpad-panel">
            <div className="int-panel-header">
              <span className="int-panel-title">SCRATCHPAD.md</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="int-est-score">
                  EST. SCORE: {evaluation ? `${evaluation.score / 10} / 10` : "-- / 10"}
                </span>
                
                {/* Floating Proctor Toggle */}
                <button 
                  type="button"
                  className="int-proctor-float-btn" 
                  onClick={() => setProctorOpen(!proctorOpen)}
                  title="Toggle Proctoring Camera & Compliance"
                  style={{ color: proctorOpen ? "var(--primary)" : "#8e8e93" }}
                >
                  <Video size={16} />
                </button>
              </div>
            </div>

            {/* Floating Proctor Drawer */}
            {proctorOpen && (
              <div className="int-proctor-float-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>AI Proctoring Desk</span>
                  <button type="button" style={{ background: "none", border: "none", color: "#8e8e93", cursor: "pointer" }} onClick={() => setProctorOpen(false)}>
                    <X size={14} />
                  </button>
                </div>

                {/* Camera preview */}
                <div className="int-media-box">
                  <div className="int-media-label">
                    <span>Webcam Feed</span>
                    <span className="int-media-indicator" style={{ color: isCamActive ? "#10b981" : "#ef4444" }}>
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
                    <Video size={12} />
                    <span>{isCamActive ? "Disable Webcam" : "Enable Webcam"}</span>
                  </button>
                </div>

                {/* Screen share preview */}
                <div className="int-media-box">
                  <div className="int-media-label">
                    <span>Screen Share Stream</span>
                    <span className="int-media-indicator" style={{ color: isSharingScreen ? "#10b981" : "#ef4444" }}>
                      <span className={`int-indicator-dot ${isSharingScreen ? "active" : ""}`} />
                      {isSharingScreen ? "active" : "disabled"}
                    </span>
                  </div>
                  <video id="screenshare" autoPlay playsInline className="int-video-feed" style={{ display: isSharingScreen ? "block" : "none" }} />
                  {!isSharingScreen && (
                    <div style={{ height: "90px", background: "#111", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "#555", fontWeight: 600, border: "1px solid rgba(255, 255, 255, 0.03)" }}>
                      Screen stream inactive
                    </div>
                  )}
                  <button 
                    type="button" 
                    className={`int-btn-media-control ${isSharingScreen ? "active" : ""}`}
                    onClick={toggleScreenShare}
                  >
                    <Monitor size={12} />
                    <span>{isSharingScreen ? "Stop Sharing" : "Share Screen"}</span>
                  </button>
                </div>

                {/* Microphone volume tracker */}
                <div className="int-media-box">
                  <div className="int-media-label">
                    <span>Microphone Levels</span>
                    <span className="int-media-indicator" style={{ color: isMicActive ? "#10b981" : "#ef4444" }}>
                      <span className={`int-indicator-dot ${isMicActive ? "active" : ""}`} />
                      {isMicActive ? "active" : "disabled"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div className="int-audio-bar-bg">
                      <div ref={audioBarRef} className="int-audio-bar-fill" style={{ width: "0%" }} />
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className={`int-btn-media-control ${isMicActive ? "active" : ""}`}
                    onClick={toggleMic}
                  >
                    <Mic size={12} />
                    <span>{isMicActive ? "Disable Mic" : "Enable Mic"}</span>
                  </button>
                </div>

                {/* Proctor Status List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <div className="int-proctor-log-item">
                    <span>Fullscreen Enforced</span>
                    <span className={`int-proctor-log-value ${isFullscreenActive ? 'success' : 'danger'}`}>
                      {isFullscreenActive ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="int-proctor-log-item">
                    <span>Proctor Warnings</span>
                    <span className={`int-proctor-log-value ${violations > 0 ? 'danger' : 'success'}`}>
                      {violations} / 5
                    </span>
                  </div>
                </div>

                {/* Real-time Logs */}
                <div style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#8e8e93", background: "rgba(5,5,5,0.4)", padding: "0.5rem", borderRadius: "4px", maxHeight: "100px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.03)" }}>
                  {proctorLogs.length === 0 ? "Awaiting compliance logs..." : proctorLogs.map((log, idx) => (
                    <div key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", padding: "0.15rem 0", color: log.severity === "danger" ? "#ef4444" : log.severity === "warning" ? "#f97316" : "#8e8e93" }}>
                      [{log.time}] {log.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Answer Text Area Editor */}
            <textarea
              className="int-scratchpad-textarea"
              placeholder="/* Think out loud here... pseudo-code, diagrams... */"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onPaste={handlePreventCopyPaste}
              disabled={submitting || !!evaluation}
            />
          </div>

          {/* Bottom Panel: Real-Time Transcript or Performance critique */}
          <div className="int-transcript-panel">
            <div className="int-panel-header">
              <span className="int-panel-title">
                {evaluation ? "PERFORMANCE CRITIQUE" : "REAL-TIME TRANSCRIPT"}
              </span>
            </div>

            {evaluation ? (
              /* Performance critique output */
              <div style={{ flex: 1, padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", background: "#060606" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Question Score Summary</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: 800, color: evaluation.score >= 80 ? "#10b981" : "#f59e0b" }}>
                    {evaluation.score} / 100
                  </span>
                </div>
                
                <p style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "#e4e4e7" }}>
                  <strong>Critique:</strong> {evaluation.critique}
                </p>

                <div style={{ background: "rgba(242, 166, 50, 0.02)", border: "1px solid rgba(242, 166, 50, 0.1)", borderRadius: "6px", padding: "0.85rem" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Model Answer Benchmark</span>
                  <p style={{ fontSize: "0.8rem", color: "#a1a1aa", marginTop: "0.35rem", lineHeight: 1.45 }}>{evaluation.model_answer}</p>
                </div>

                {/* Behavioral STAR analysis framework card */}
                <div style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid rgba(255, 255, 255, 0.04)", borderRadius: "8px", padding: "1rem", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Behavioral STAR Structurer</span>
                  <p style={{ fontSize: "0.78rem", color: "#a1a1aa", marginTop: "0.25rem", lineHeight: 1.45 }}>
                    Real-time structure validation of your response against the standard STAR model:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                    {[
                      { label: "Situation", val: evaluation.score >= 80 ? 90 : 70, status: evaluation.score >= 80 ? "Detailed context provided" : "Context lacks specificity" },
                      { label: "Task", val: evaluation.score >= 75 ? 85 : 65, status: evaluation.score >= 75 ? "Clear core objective stated" : "Vague target explanation" },
                      { label: "Action", val: evaluation.score >= 80 ? 95 : 60, status: evaluation.score >= 80 ? "Thorough action description" : "Needs specific tech actions" },
                      { label: "Result", val: evaluation.score >= 85 ? 90 : 50, status: evaluation.score >= 85 ? "Good metric achievements" : "Outcomes lack numeric KPIs" }
                    ].map((item) => (
                      <div key={item.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", fontWeight: 600 }}>
                          <span style={{ color: "#fff" }}>{item.label}</span>
                          <span style={{ color: "#a1a1aa" }}>{item.status} ({item.val}%)</span>
                        </div>
                        <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", marginTop: "0.2rem" }}>
                          <div style={{ height: "100%", width: `${item.val}%`, background: item.val >= 80 ? "#10b981" : "#dea63b", borderRadius: "2px" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Speech transcript and feedback chips visual layout */
              <div className="int-transcript-body" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div className="int-transcript-content" style={{ flex: 1 }}>
                  {transcriptText ? (
                    <>
                      {transcriptText}
                      <span className="int-transcript-cursor"></span>
                    </>
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.25)", fontStyle: "italic", fontSize: "0.85rem" }}>
                      Awaiting speech or notes... Talk into your microphone or write code in the editor above.
                    </span>
                  )}
                </div>

                {/* Staggered dynamic feedback chips */}
                {feedbackChips.length > 0 && (
                  <div className="int-transcript-chips-col" style={{ margin: "0.5rem 0" }}>
                    {feedbackChips.map((chip) => (
                      <div key={chip.id} className={`int-feedback-chip ${chip.type}`}>
                        <span>{chip.label}</span>
                        <span className="int-feedback-chip-val">{chip.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Live Speech & Filler Analytics widget */}
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "1rem" }}>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "6px", padding: "0.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>Filler Words</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)", marginTop: "0.15rem" }}>
                      {transcriptText.toLowerCase().split(/\b(like|um|uh|basically|actually)\b/).filter((w, i) => i % 2 === 1).length}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "6px", padding: "0.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>Speaking Pace</div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#10b981", marginTop: "0.35rem" }}>
                      {transcriptText.split(/\s+/).filter(Boolean).length > 40 ? "Optimal (125 wpm)" : transcriptText.split(/\s+/).filter(Boolean).length > 0 ? "Deliberate" : "Awaiting Audio"}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "6px", padding: "0.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>Clarity Index</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)", marginTop: "0.15rem" }}>
                      {Math.max(30, 100 - (transcriptText.toLowerCase().split(/\b(like|um|uh|basically|actually)\b/).filter((w, i) => i % 2 === 1).length * 10))}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transcript metrics footer */}
            <div className="int-transcript-footer">
              <div className="int-metric-item">
                <span>Eye Contact</span>
                <div className="int-metric-dots">
                  <div className={`int-metric-dot ${eyeDots >= 1 ? 'eye-active' : ''}`}></div>
                  <div className={`int-metric-dot ${eyeDots >= 2 ? 'eye-active' : ''}`}></div>
                  <div className={`int-metric-dot ${eyeDots >= 3 ? 'eye-active' : ''}`}></div>
                </div>
              </div>
              <div className="int-metric-item">
                <span>Pacing</span>
                <div className="int-metric-dots">
                  <div className={`int-metric-dot ${pacingDots >= 1 ? 'pacing-active' : ''}`}></div>
                  <div className={`int-metric-dot ${pacingDots >= 2 ? 'pacing-active' : ''}`}></div>
                  <div className={`int-metric-dot ${pacingDots >= 3 ? 'pacing-active' : ''}`}></div>
                </div>
              </div>
              <div className="int-metric-item">
                <span>Filler Words</span>
                <div className="int-metric-dots">
                  <div className={`int-metric-dot ${fillerDots >= 1 ? 'filler-active' : ''}`}></div>
                  <div className={`int-metric-dot ${fillerDots >= 2 ? 'filler-active' : ''}`}></div>
                  <div className={`int-metric-dot ${fillerDots >= 3 ? 'filler-active' : ''}`}></div>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>

      {/* 4. Footer controls bar */}
      <footer className="int-footer">
        <div className="int-footer-left">
          CURRENT TRACK: QUESTION {currentNum} OF {totalNum} &mdash; {roleTitle.toUpperCase()} TRACK
        </div>

        <div className="int-footer-center">
          {/* Mute/Recording mic button */}
          {speechSupported && !evaluation && (
            <button
              type="button"
              className={`int-btn-footer-mic ${isListening ? 'recording' : ''}`}
              onClick={toggleVoiceRecording}
              title={isListening ? "Mute Microphone" : "Unmute Microphone (Record Speech)"}
              disabled={submitting}
            >
              {isListening ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
          )}

          {/* Skip question */}
          {!evaluation && (
            <button
              type="button"
              className="int-btn-footer-skip"
              onClick={handleSkipQuestion}
              disabled={submitting}
            >
              Skip Question
            </button>
          )}

          {/* Submit/Next question */}
          {evaluation ? (
            isFinished ? (
              <button 
                type="button" 
                className="int-btn-footer-submit" 
                onClick={handleEndInterview}
                disabled={submitting}
              >
                Finish Session <ArrowRight size={14} />
              </button>
            ) : (
              <button 
                type="button" 
                className="int-btn-footer-submit" 
                onClick={handleNextQuestion}
              >
                Next Question <ArrowRight size={14} />
              </button>
            )
          ) : (
            <button
              type="button"
              className="int-btn-footer-submit"
              onClick={handleSubmitResponse}
              disabled={!answerText.trim() || submitting}
            >
              {submitting ? "Analyzing..." : "Submit Answer"}
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        <div className="int-footer-right">
          {/* Confidence widget */}
          <div className="int-confidence-widget">
            <span className="int-confidence-label">Confidence</span>
            <div className="int-confidence-bars">
              <div className="int-confidence-bar active" style={{ height: "6px" }}></div>
              <div className="int-confidence-bar active" style={{ height: "9px" }}></div>
              <div className="int-confidence-bar active" style={{ height: "12px" }}></div>
              <div className="int-confidence-bar" style={{ height: "15px" }}></div>
              <div className="int-confidence-bar" style={{ height: "18px" }}></div>
            </div>
          </div>

          <button 
            type="button" 
            className="int-btn-footer-end" 
            onClick={handleEndInterview}
            disabled={submitting}
          >
            End Session
          </button>
        </div>
      </footer>

      {/* Floating AI Chatbot Companion Drawer */}
      {workspaceReady && (
        <div style={{
          position: "fixed",
          bottom: "80px",
          right: "24px",
          zIndex: 500
        }}>
          {/* Chat trigger floating button */}
          <button
            type="button"
            onClick={() => setCompanionOpen(!companionOpen)}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "var(--primary)",
              color: "#050505",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(242, 166, 50, 0.3)",
              transition: "transform 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            {companionOpen ? <X size={20} /> : <Sparkles size={20} />}
          </button>

          {/* Slide-out drawer panel */}
          {companionOpen && (
            <div style={{
              position: "absolute",
              bottom: "60px",
              right: 0,
              width: "320px",
              height: "440px",
              background: "rgba(10, 10, 10, 0.95)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(242, 166, 50, 0.2)",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "slideUp 0.25s ease-out"
            }}>
              {/* Drawer Header */}
              <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                  <Sparkles size={12} />
                  AI MOCK COMPANION
                </span>
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700 }}>ONLINE</span>
              </div>

              {/* Messages Area */}
              <div style={{ flex: 1, padding: "1rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {companionMessages.map((msg, idx) => (
                  <div key={idx} style={{
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    background: msg.role === "user" ? "var(--primary)" : "rgba(255,255,255,0.04)",
                    color: msg.role === "user" ? "#000" : "#fff",
                    padding: "0.6rem 0.8rem",
                    borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    fontSize: "0.78rem",
                    lineHeight: 1.4,
                    fontWeight: msg.role === "user" ? 600 : 500
                  }}>
                    {msg.content}
                  </div>
                ))}
                {companionLoading && (
                  <div style={{ alignSelf: "flex-start", display: "flex", gap: "0.3rem", padding: "0.5rem" }}>
                    <span style={{ width: "6px", height: "6px", background: "var(--primary)", borderRadius: "50%", display: "inline-block", animation: "bounce 1s infinite 0.1s" }} />
                    <span style={{ width: "6px", height: "6px", background: "var(--primary)", borderRadius: "50%", display: "inline-block", animation: "bounce 1s infinite 0.2s" }} />
                    <span style={{ width: "6px", height: "6px", background: "var(--primary)", borderRadius: "50%", display: "inline-block", animation: "bounce 1s infinite 0.3s" }} />
                  </div>
                )}
              </div>

              {/* Form Input Area */}
              <form onSubmit={handleSendCompanionMessage} style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "0.4rem" }}>
                <input
                  type="text"
                  placeholder="Ask companion anything..."
                  value={companionInput}
                  onChange={(e) => setCompanionInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    padding: "0.45rem 0.75rem",
                    color: "#fff",
                    fontSize: "0.78rem",
                    outline: "none"
                  }}
                />
                <button
                  type="submit"
                  disabled={!companionInput.trim() || companionLoading}
                  style={{
                    background: "var(--primary)",
                    border: "none",
                    borderRadius: "6px",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    opacity: companionInput.trim() ? 1 : 0.5
                  }}
                >
                  <Send size={14} color="#000" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
