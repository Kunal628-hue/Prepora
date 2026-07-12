import os

file_path = "/Users/rohitkgupta/Planora/Prepora/frontend/src/app/interview/[id]/page.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace recognitionRef with mediaRecorderRef and audioChunksRef
content = content.replace("const recognitionRef = useRef<any>(null);", 
"""const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isTranscribingRef = useRef<boolean>(false);""")

# Remove the SpeechRecognition setup block (lines 758-804)
# We can find it by "Setup voice recognition"
import re
content = re.sub(
    r'// Setup voice recognition.*?if \(typeof window !== "undefined"\) \{.*?\}\s*\}', 
    '// Setup voice recognition (now using MediaRecorder handled in toggleVoiceRecording)', 
    content, 
    flags=re.DOTALL
)

# Replace recognitionRef cleanup
content = content.replace(
"""      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }""",
"""      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }"""
)

content = content.replace(
"""    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }""",
"""    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }"""
)

# Replace toggleVoiceRecording
old_toggle = """  const toggleVoiceRecording = () => {
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
  };"""

new_toggle = """  const toggleVoiceRecording = async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsAiSpeaking(false);
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (isTranscribingRef.current) return;
          isTranscribingRef.current = true;
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");

          try {
            const res = await fetch(`${API_BASE_URL}/api/audio/transcribe`, {
              method: "POST",
              body: formData,
            });
            if (res.ok) {
              const data = await res.json();
              if (data.text) {
                setAnswerText((prev) => (prev.trim() ? `${prev.trim()} ${data.text}` : data.text));
                setTranscriptText((prev) => (prev.trim() ? `${prev.trim()} ${data.text}` : data.text));
              }
            }
          } catch (e) {
            console.error("Transcription failed", e);
          } finally {
            isTranscribingRef.current = false;
            // stop tracks
            stream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorder.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    }
  };"""

content = content.replace(old_toggle, new_toggle)

# Fix handleSubmitResponse stopping recognition
content = content.replace(
"""    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }""",
"""    if (isListening && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }"""
)

with open(file_path, "w") as f:
    f.write(content)
