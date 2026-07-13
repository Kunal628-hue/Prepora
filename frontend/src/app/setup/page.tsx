"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Code, 
  Network, 
  Users, 
  ArrowRight,
  AlertCircle,
  Mic,
  Zap,
  Calendar,
  Sliders
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";

export default function SetupPage() {
  const router = useRouter();

  // Auth/User State
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Arjun");

  // Resume Upload/Parsing State
  const [parsingResume, setParsingResume] = useState(false);
  const [parsedTechStack, setParsedTechStack] = useState<string[]>([]);
  const [resumeSuccess, setResumeSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Form selections
  const [selectedType, setSelectedType] = useState<"technical" | "system-design" | "behavioral">("technical");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [selectedDuration, setSelectedDuration] = useState<"20" | "40" | "60">("40");
  const [companyInput, setCompanyInput] = useState("");
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);

  // Advanced features & Scheduling States
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // default to 2 days from now
    return d.toISOString().split("T")[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("10:00 AM");
  const [selectedMode, setSelectedMode] = useState<"voice" | "text">("voice");
  const [interviewerPersona, setInterviewerPersona] = useState<"encouraging" | "standard" | "stress">("standard");
  const [feedbackStyle, setFeedbackStyle] = useState<"detailed" | "summary">("detailed");
  
  // Success Confirmation Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scheduledSessionId, setScheduledSessionId] = useState<string | null>(null);
  const [scheduledSessionRole, setScheduledSessionRole] = useState("");

  // Cancel Confirmation Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);

  // Resume vs Job Description Gap Analyzer States
  const [jobDescription, setJobDescription] = useState("");
  const [analyzingGap, setAnalyzingGap] = useState(false);
  const [gapReport, setGapReport] = useState<any | null>(null);
  const [showGapModal, setShowGapModal] = useState(false);
  
  // Accordion state
  const [expertSettingsOpen, setExpertSettingsOpen] = useState(false);

  // Scheduled sessions state
  const [scheduledSessionsList, setScheduledSessionsList] = useState<any[]>([]);

  const fetchScheduledSessions = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/interviews?user_id=${id}`);
      if (response.ok) {
        const data = await response.json();
        const scheduled = data.filter((s: any) => s.scheduled_time && s.status !== "completed");
        setScheduledSessionsList(scheduled);
      }
    } catch (err) {
      console.error("Failed to fetch scheduled sessions:", err);
    }
  };

  const handleCancelScheduled = (sessionId: string) => {
    setSessionToCancel(sessionId);
    setShowCancelModal(true);
  };

  const executeCancelScheduled = async () => {
    if (!sessionToCancel) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/interviews/${sessionToCancel}`, {
        method: "DELETE",
      });
      if (response.ok) {
        if (userId) {
          fetchScheduledSessions(userId);
        } else {
          const storedId = localStorage.getItem("prepora_user_id");
          if (storedId) fetchScheduledSessions(storedId);
        }
      } else {
        const errData = await response.json();
        setError(errData.detail || "Failed to cancel interview.");
      }
    } catch (err) {
      console.error("Failed to cancel interview:", err);
      setError("Failed to connect to the backend server.");
    } finally {
      setShowCancelModal(false);
      setSessionToCancel(null);
    }
  };

  const handleRunGapAnalysis = async () => {
    setAnalyzingGap(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/resume-gap-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: companyInput || "Software Engineer",
          level: selectedDifficulty,
          tech_stack: parsedTechStack,
          job_description: jobDescription
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to run gap analysis.");
      }

      const data = await response.json();
      setGapReport(data);
      setShowGapModal(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze gaps. Make sure the backend server is running.");
    } finally {
      setAnalyzingGap(false);
    }
  };

  const formatScheduledTime = (dateStr: string) => {
    try {
      const rawDate = dateStr.includes(" at ") ? dateStr.split(" at ")[0] : dateStr;
      const rawTime = dateStr.includes(" at ") ? dateStr.split(" at ")[1] : "10:00 AM";
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase() + " AT " + rawTime.toUpperCase();
    } catch {
      return dateStr;
    }
  };

  // API loading / error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResumeUpload = async (file: File) => {
    if (!file) return;
    setParsingResume(true);
    setError(null);
    setResumeSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/resume/parse`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to parse resume.");
      }

      const data = await response.json();
      
      // Pre-populate fields based on response
      if (data.role) {
        const parsedRoleLower = data.role.toLowerCase();
        if (parsedRoleLower.includes("system") || parsedRoleLower.includes("architect") || parsedRoleLower.includes("infrastructure")) {
          setSelectedType("system-design");
        } else if (parsedRoleLower.includes("product") || parsedRoleLower.includes("behavioral") || parsedRoleLower.includes("manager")) {
          setSelectedType("behavioral");
        } else {
          setSelectedType("technical");
        }
        setCompanyInput(data.role);
      }
      
      if (data.level) {
        const lvl = data.level.toLowerCase();
        if (lvl.includes("senior") || lvl.includes("lead") || lvl.includes("staff")) {
          setSelectedDifficulty("Hard");
        } else if (lvl.includes("junior") || lvl.includes("entry") || lvl.includes("fresher")) {
          setSelectedDifficulty("Easy");
        } else {
          setSelectedDifficulty("Medium");
        }
      }

      if (data.tech_stack) {
        setParsedTechStack(data.tech_stack);
      }

      setResumeSuccess(`Resume "${file.name}" analyzed successfully!`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze resume. Please try again.");
    } finally {
      setParsingResume(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("prepora_user_id");
      const storedName = localStorage.getItem("prepora_user_name");
      if (storedId) {
        setUserId(storedId);
        fetchScheduledSessions(storedId);
      }
      if (storedName) {
        setUserName(storedName);
      }
    }

    const fetchCompanies = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/companies`);
        if (res.ok) {
          const data = await res.json();
          setCompanies(data);
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  const getGoogleCalendarUrl = (sessionObj: any) => {
    const title = encodeURIComponent(`Prepora Mock Interview (${sessionObj.role})`);
    let dateStr = "20260609T100000Z";
    let endDateStr = "20260609T104500Z";
    
    if (sessionObj.scheduled_time) {
      const cleanDate = sessionObj.scheduled_time.replace(/[^\d-]/g, ""); // "2026-06-09"
      const parts = cleanDate.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1].padStart(2, "0");
        const day = parts[2].padStart(2, "0");
        
        // Match selected time slot
        let hourStr = "10";
        let minStr = "00";
        if (selectedTimeSlot.includes("AM")) {
          const val = parseInt(selectedTimeSlot.split(":")[0]);
          hourStr = val.toString().padStart(2, "0");
        } else if (selectedTimeSlot.includes("PM")) {
          const val = parseInt(selectedTimeSlot.split(":")[0]);
          const parsedHour = val === 12 ? 12 : val + 12;
          hourStr = parsedHour.toString().padStart(2, "0");
        }
        
        dateStr = `${year}${month}${day}T${hourStr}${minStr}00Z`;
        
        // Add duration
        const durationMin = parseInt(selectedDuration);
        const endMin = (parseInt(minStr) + durationMin) % 60;
        const carryHour = Math.floor((parseInt(minStr) + durationMin) / 60);
        const endHour = (parseInt(hourStr) + carryHour) % 24;
        
        const endHourStr = endHour.toString().padStart(2, "0");
        const endMinStr = endMin.toString().padStart(2, "0");
        
        endDateStr = `${year}${month}${day}T${endHourStr}${endMinStr}00Z`;
      }
    }
    
    const details = encodeURIComponent(`Your upcoming mock interview session for ${sessionObj.role} is scheduled on Prepora.\n\nLink to workspace: http://localhost:3000/interview/${sessionObj.id}`);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${endDateStr}&details=${details}`;
  };

  const handleBeginInterview = async () => {
    setError(null);
    setLoading(true);

    const activeUserId = userId || localStorage.getItem("prepora_user_id") || "demo_user_id";

    // Map selection type to printable name
    let typeName = "Technical Interview";
    if (selectedType === "system-design") {
      typeName = "System Design Interview";
    } else if (selectedType === "behavioral") {
      typeName = "Behavioral Interview";
    }

    const companyName = companyInput.trim();
    // Build combined role name matching user prompt
    const finalRole = companyName ? `${companyName} ${typeName}` : typeName;

    try {
      const response = await fetch(`${API_BASE_URL}/api/interviews/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: activeUserId,
          role: finalRole,
          level: selectedDifficulty,
          mode: selectedMode,
          scheduled_time: isScheduled ? `${selectedDate} at ${selectedTimeSlot}` : null,
          tech_stack: parsedTechStack.length > 0 ? parsedTechStack : null,
          company_name: companyName || null
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to initialize interview.");
      }

      const session = await response.json();
      
      if (isScheduled) {
        setScheduledSessionId(session.id);
        setScheduledSessionRole(finalRole);
        setShowSuccessModal(true);
        fetchScheduledSessions(activeUserId);
        setLoading(false);
      } else {
        // Redirect to the newly created active interview session page
        router.push(`/interview/${session.id}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start interview. Ensure backend FastAPI server is running on port 8000.");
      setLoading(false);
    }
  };

  return (
    <div className="msetup-page">
      {/* Header bar matches standard dashboard/practice top bar */}
      <DashboardHeader activeTab="mock" />

      {/* Main card centered area */}
      <main className="msetup-main">
        <div className="msetup-card">
          <h1 className="msetup-card-title">Start a Mock Interview</h1>
          <p className="msetup-card-subtitle">
            The AI will ask you questions and give feedback after.
          </p>

          {/* Resume Upload Box */}
          <div className="msetup-section" style={{ marginBottom: "1.75rem" }}>
            <span className="msetup-section-label">UPLOAD RESUME TO TAILOR INTERVIEW (PDF OR IMAGE)</span>
            
            <div 
              className={`msetup-upload-zone ${dragActive ? "drag-active" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleResumeUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => document.getElementById("resume-file-input")?.click()}
            >
              <input 
                id="resume-file-input"
                type="file" 
                accept=".pdf,image/png,image/jpeg,image/jpg" 
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleResumeUpload(e.target.files[0]);
                  }
                }}
              />
              
              {parsingResume ? (
                <>
                  <div className="msetup-spinner" />
                  <span className="msetup-upload-title">Analyzing Resume...</span>
                  <span className="msetup-upload-desc">Gemini is extracting experience and technology stack</span>
                </>
              ) : (
                <>
                  <div className="msetup-upload-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <span className="msetup-upload-title">
                    {resumeSuccess ? "Replace Resume" : "Upload your Resume / Portfolio Photo"}
                  </span>
                  <span className="msetup-upload-desc">
                    Drag and drop or click to browse (PDF, PNG, JPG up to 10MB)
                  </span>
                </>
              )}
            </div>

            {resumeSuccess && (
              <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span>✓</span> {resumeSuccess}
              </div>
            )}

            {parsedTechStack.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.5rem" }}>
                  DETECTED TECHNOLOGY STACK:
                </span>
                <div className="msetup-badge-container">
                  {parsedTechStack.map((tech) => (
                    <span key={tech} className="msetup-badge">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Target Job Description Input */}
            <div style={{ marginTop: "1.25rem" }}>
              <span className="msetup-section-label">TARGET JOB DESCRIPTION (OPTIONAL FOR GAP ANALYSIS)</span>
              <div className="msetup-input-wrap" style={{ marginTop: "0.5rem" }}>
                <textarea
                  className="msetup-input"
                  style={{ minHeight: "100px", padding: "0.75rem", resize: "vertical", fontFamily: "inherit" }}
                  placeholder="Paste the target job description here to analyze skill gaps and get a custom 5-day preparation roadmap..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Gap Analysis Button */}
            {resumeSuccess && jobDescription.trim() && (
              <button
                type="button"
                className="msetup-confirm-btn-secondary"
                style={{ marginTop: "1rem", width: "100%" }}
                onClick={handleRunGapAnalysis}
                disabled={analyzingGap}
              >
                {analyzingGap ? "Analyzing Gaps..." : "✓ Run AI Fit & Gap Analysis"}
              </button>
            )}
          </div>

          {/* Form Error Message */}
          {error && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#b91c1c",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.5rem"
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Timing Mode Toggle */}
          <div className="msetup-section">
            <span className="msetup-section-label">TIMING</span>
            <div className="msetup-timing-toggle">
              <button
                type="button"
                className={`msetup-timing-btn ${!isScheduled ? "selected" : ""}`}
                onClick={() => setIsScheduled(false)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem" }}
              >
                <Zap size={14} />
                <span>Live Session</span>
              </button>
              <button
                type="button"
                className={`msetup-timing-btn ${isScheduled ? "selected" : ""}`}
                onClick={() => setIsScheduled(true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem" }}
              >
                <Calendar size={14} />
                <span>Scheduled Drill</span>
              </button>
            </div>
          </div>

          {/* Conditional Date & Time Selectors */}
          {isScheduled && (
            <div className="msetup-datetime-container">
              <div className="msetup-date-picker-wrap">
                <span className="msetup-section-label">SELECT DATE</span>
                <input
                  type="date"
                  className="msetup-date-input"
                  min={new Date().toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="msetup-time-picker-wrap">
                <span className="msetup-section-label">SELECT TIME SLOT</span>
                <div className="msetup-time-grid">
                  {["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM"].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`msetup-time-btn ${selectedTimeSlot === slot ? "selected" : ""}`}
                      onClick={() => setSelectedTimeSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section: What Type? */}
          <div className="msetup-section">
            <span className="msetup-section-label">WHAT TYPE?</span>
            <div className="msetup-type-grid">
              {/* Technical */}
              <button
                type="button"
                className={`msetup-type-card ${selectedType === "technical" ? "selected" : ""}`}
                onClick={() => setSelectedType("technical")}
              >
                <span className="msetup-type-icon">
                  <Code size={20} />
                </span>
                <span className="msetup-type-label">Technical</span>
              </button>

              {/* System Design */}
              <button
                type="button"
                className={`msetup-type-card ${selectedType === "system-design" ? "selected" : ""}`}
                onClick={() => setSelectedType("system-design")}
              >
                <span className="msetup-type-icon">
                  <Network size={20} />
                </span>
                <span className="msetup-type-label">System Design</span>
              </button>

              {/* Behavioral */}
              <button
                type="button"
                className={`msetup-type-card ${selectedType === "behavioral" ? "selected" : ""}`}
                onClick={() => setSelectedType("behavioral")}
              >
                <span className="msetup-type-icon">
                  <Users size={20} />
                </span>
                <span className="msetup-type-label">Behavioral</span>
              </button>
            </div>
          </div>

          {/* Section: How Tough? */}
          <div className="msetup-section">
            <span className="msetup-section-label">HOW TOUGH?</span>
            <div className="msetup-pills-row">
              {(["Easy", "Medium", "Hard"] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  className={`msetup-pill ${selectedDifficulty === diff ? "selected" : ""}`}
                  onClick={() => setSelectedDifficulty(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Section: How Long? */}
          <div className="msetup-section">
            <span className="msetup-section-label">HOW LONG?</span>
            <div className="msetup-pills-row">
              {(["20", "40", "60"] as const).map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`msetup-pill ${selectedDuration === mins ? "selected" : ""}`}
                  onClick={() => setSelectedDuration(mins)}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Section: Target Company (Optional) */}
          <div className="msetup-section" style={{ marginBottom: "2.25rem" }}>
            <span className="msetup-section-label">ANY COMPANY IN MIND? (OPTIONAL)</span>
            <div className="msetup-input-wrap">
              <select
                className="msetup-input"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "#ffffff",
                  border: "1px solid #e5e2d9",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#1c1917",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="">Select a company (Optional)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Collapsible Expert Settings Accordion */}
          <div className="msetup-section">
            <div 
              className="msetup-accordion-header"
              onClick={() => setExpertSettingsOpen(!expertSettingsOpen)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem 0",
                borderBottom: "1px dashed #e8e5de",
                cursor: "pointer",
                marginBottom: "1rem"
              }}
            >
              <span className="msetup-accordion-title" style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <Sliders size={14} />
                <span>Expert & Interviewer Settings</span>
              </span>
              <span style={{ fontSize: "0.85rem", color: "#888", fontWeight: 700 }}>
                {expertSettingsOpen ? "▲" : "▼"}
              </span>
            </div>
            
            <div 
              className={`msetup-accordion-content ${expertSettingsOpen ? "open" : ""}`}
              style={{
                maxHeight: expertSettingsOpen ? "500px" : "0",
                overflow: "hidden",
                transition: "max-height 0.3s ease-in-out"
              }}
            >
              <div style={{ paddingTop: "0.5rem" }}>
                {/* Interview Mode Selector */}
                <div className="msetup-select-wrap">
                  <span className="msetup-section-label">INTERVIEW FORMAT</span>
                  <select
                    className="msetup-select"
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value as "voice" | "text")}
                  >
                    <option value="voice">Interactive AI Voice (Speak & Listen)</option>
                    <option value="text">Written Sandbox (Code & Write Text)</option>
                  </select>
                </div>

                {/* Interviewer Persona Selector */}
                <div className="msetup-select-wrap" style={{ marginTop: "1rem" }}>
                  <span className="msetup-section-label">INTERVIEWER PERSONA</span>
                  <select
                    className="msetup-select"
                    value={interviewerPersona}
                    onChange={(e) => setInterviewerPersona(e.target.value as "encouraging" | "standard" | "stress")}
                  >
                    <option value="encouraging">Friendly & Encouraging (Helpful hints, guided setup)</option>
                    <option value="standard">Standard Industry (Standard FAANG/Startup neutral interviewer)</option>
                    <option value="stress">Stress Test / FAANG Interviewer (Tough grilling, rapid follow-ups)</option>
                  </select>
                </div>

                {/* Feedback Style Selector */}
                <div className="msetup-select-wrap" style={{ marginTop: "1rem" }}>
                  <span className="msetup-section-label">FEEDBACK STYLE</span>
                  <select
                    className="msetup-select"
                    value={feedbackStyle}
                    onChange={(e) => setFeedbackStyle(e.target.value as "detailed" | "summary")}
                  >
                    <option value="detailed">Detailed & Constructive (Itemized scoring breakdown)</option>
                    <option value="summary">High-Level Summary (Macro trends and key highlights)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduled Sessions List */}
          {scheduledSessionsList.length > 0 && (
            <div className="msetup-section" style={{ borderTop: "1px dashed #e8e5de", paddingTop: "1.25rem", marginTop: "1.5rem" }}>
              <span className="msetup-section-label">Your Scheduled Interviews</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.5rem" }}>
                {scheduledSessionsList.map((session) => (
                  <div 
                    key={session.id} 
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem 1rem",
                      background: "#faf9f6",
                      border: "1px solid #e8e5de",
                      borderRadius: "8px"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1c1917" }}>
                        {session.role}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#6b6661", marginTop: "0.15rem", fontWeight: 600 }}>
                        {formatScheduledTime(session.scheduled_time || "")} ({session.level})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancelScheduled(session.id)}
                      style={{
                        padding: "0.3rem 0.65rem",
                        background: "transparent",
                        border: "1px solid #ef4444",
                        color: "#ef4444",
                        borderRadius: "5px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="button"
            className="msetup-btn-begin"
            onClick={handleBeginInterview}
            disabled={loading}
          >
            {loading ? "Initializing..." : (isScheduled ? "Schedule Interview" : "Begin Interview")}
            <ArrowRight size={18} />
          </button>
          
          <div className="msetup-mic-notice">
            <Mic size={13} />
            <span>{selectedMode === "voice" ? "Your mic will be used during the session" : "No microphone access required for written format"}</span>
          </div>
        </div>
      </main>

      {/* Footer matches mockup */}
      <footer className="msetup-footer">
        <span className="msetup-footer-left">
          © 2026 Prepora. The Encouraging Mentor.
        </span>
        <div className="msetup-footer-right">
          <Link href="/setup" className="msetup-footer-link">
            Privacy Policy
          </Link>
          <Link href="/setup" className="msetup-footer-link">
            Terms of Service
          </Link>
          <Link href="/setup" className="msetup-footer-link">
            Support
          </Link>
          <Link href="/setup" className="msetup-footer-link">
            Contact
          </Link>
        </div>
      </footer>

      {/* Scheduling Success Modal */}
      {showSuccessModal && (
        <div className="msetup-confirm-overlay">
          <div className="msetup-confirm-card">
            <div className="msetup-confirm-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="msetup-confirm-title">Interview Scheduled!</h2>
            <p className="msetup-confirm-desc">
              Your mock interview session has been locked in and added to your dashboard.
            </p>
            
            <div className="msetup-confirm-details">
              <div className="msetup-confirm-detail-row">
                <span className="msetup-confirm-label">Interview Track:</span>
                <span className="msetup-confirm-value">{scheduledSessionRole}</span>
              </div>
              <div className="msetup-confirm-detail-row">
                <span className="msetup-confirm-label">Difficulty Level:</span>
                <span className="msetup-confirm-value">{selectedDifficulty}</span>
              </div>
              <div className="msetup-confirm-detail-row">
                <span className="msetup-confirm-label">Date:</span>
                <span className="msetup-confirm-value">{selectedDate}</span>
              </div>
              <div className="msetup-confirm-detail-row">
                <span className="msetup-confirm-label">Time Slot:</span>
                <span className="msetup-confirm-value">{selectedTimeSlot}</span>
              </div>
              <div className="msetup-confirm-detail-row">
                <span className="msetup-confirm-label">Format:</span>
                <span className="msetup-confirm-value">
                  {selectedMode === "voice" ? "Interactive Voice" : "Written Sandbox"}
                </span>
              </div>
              <div className="msetup-confirm-detail-row">
                <span className="msetup-confirm-label">Persona:</span>
                <span className="msetup-confirm-value" style={{ textTransform: "capitalize" }}>
                  {interviewerPersona}
                </span>
              </div>
            </div>
            
            <div className="msetup-confirm-actions">
              <a 
                href={getGoogleCalendarUrl({ id: scheduledSessionId, role: scheduledSessionRole, scheduled_time: selectedDate })}
                target="_blank"
                rel="noopener noreferrer"
                className="msetup-confirm-btn-secondary"
              >
                Add to Google Calendar
              </a>
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/dashboard");
                }}
                className="msetup-confirm-btn-primary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (() => {
        const session = scheduledSessionsList.find(s => s.id === sessionToCancel);
        return (
          <div className="msetup-confirm-overlay">
            <div className="msetup-confirm-card" style={{ maxWidth: "420px" }}>
              <div className="msetup-confirm-icon" style={{ background: "#fef2f2", color: "#ef4444" }}>
                <AlertCircle size={28} />
              </div>
              <h2 className="msetup-confirm-title">Cancel Interview?</h2>
              <p className="msetup-confirm-desc" style={{ marginBottom: "1.25rem" }}>
                Are you sure you want to cancel this scheduled mock interview? This action cannot be undone.
              </p>
              
              {session && (
                <div className="msetup-confirm-details" style={{ borderLeft: "4px solid #ef4444" }}>
                  <div className="msetup-confirm-detail-row">
                    <span className="msetup-confirm-label">Interview Track:</span>
                    <span className="msetup-confirm-value">{session.role}</span>
                  </div>
                  <div className="msetup-confirm-detail-row">
                    <span className="msetup-confirm-label">Difficulty Level:</span>
                    <span className="msetup-confirm-value">{session.level}</span>
                  </div>
                  <div className="msetup-confirm-detail-row">
                    <span className="msetup-confirm-label">Scheduled For:</span>
                    <span className="msetup-confirm-value">{formatScheduledTime(session.scheduled_time || "")}</span>
                  </div>
                </div>
              )}
              
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button 
                  type="button"
                  onClick={() => { setShowCancelModal(false); setSessionToCancel(null); }} 
                  className="msetup-confirm-btn-secondary" 
                  style={{ flex: 1, margin: 0 }}
                >
                  No, Keep it
                </button>
                <button 
                  type="button"
                  onClick={executeCancelScheduled} 
                  className="msetup-confirm-btn-primary" 
                  style={{ 
                    flex: 1, 
                    background: "#ef4444", 
                    border: "1px solid #ef4444", 
                    margin: 0,
                    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                    e.currentTarget.style.borderColor = "#dc2626";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#ef4444";
                    e.currentTarget.style.borderColor = "#ef4444";
                  }}
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Gap Analysis Modal */}
      {showGapModal && gapReport && (
        <div className="msetup-confirm-overlay" style={{ zIndex: 1010 }}>
          <div className="msetup-confirm-card" style={{ maxWidth: "560px", textAlign: "left", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e8e5de", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
              <h2 className="msetup-confirm-title" style={{ margin: 0, fontSize: "1.35rem" }}>Fit & Gap Analysis</h2>
              <button 
                type="button" 
                onClick={() => setShowGapModal(false)}
                style={{ background: "none", border: "none", color: "#888", fontSize: "1.2rem", cursor: "pointer", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            {/* Match Score Display */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "#faf9f6", border: "1px solid #e8e5de", borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem" }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.2rem",
                background: gapReport.match_score >= 80 ? "#ecfdf5" : gapReport.match_score >= 60 ? "#fffbeb" : "#fef2f2",
                color: gapReport.match_score >= 80 ? "#059669" : gapReport.match_score >= 60 ? "#d97706" : "#dc2626",
                border: `3px solid ${gapReport.match_score >= 80 ? "#10b981" : gapReport.match_score >= 60 ? "#fbbf24" : "#ef4444"}`
              }}>
                {gapReport.match_score}%
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1c1917" }}>Match Score Compatibility</div>
                <div style={{ fontSize: "0.8rem", color: "#6b6661", marginTop: "0.15rem" }}>
                  {gapReport.match_score >= 80 ? "Excellent profile match for this role!" : gapReport.match_score >= 60 ? "Good potential. Focus on bridging the highlighted gaps." : "Significant gaps identified. Use the roadmap below to prepare."}
                </div>
              </div>
            </div>

            {/* Missing Skills */}
            {gapReport.missing_skills && gapReport.missing_skills.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <span className="msetup-section-label" style={{ fontSize: "0.7rem" }}>IDENTIFIED TECH GAP (MISSING SKILLS)</span>
                <div className="msetup-badge-container" style={{ marginTop: "0.4rem" }}>
                  {gapReport.missing_skills.map((skill: string) => (
                    <span key={skill} className="msetup-badge" style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5" }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Soft Skills Tips */}
            {gapReport.soft_skills_tips && gapReport.soft_skills_tips.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <span className="msetup-section-label" style={{ fontSize: "0.7rem" }}>INTERVIEW & BEHAVIORAL TIPS</span>
                <ul style={{ margin: "0.4rem 0 0 1rem", padding: 0, fontSize: "0.8rem", color: "#444", lineHeight: 1.45 }}>
                  {gapReport.soft_skills_tips.map((tip: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: "0.3rem" }}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prep Roadmap */}
            {gapReport.roadmap && gapReport.roadmap.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <span className="msetup-section-label" style={{ fontSize: "0.7rem" }}>TAILORED 5-DAY PREP ROADMAP</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem", maxHeight: "200px", overflowY: "auto", paddingRight: "0.5rem" }}>
                  {gapReport.roadmap.map((day: any) => (
                    <div key={day.day} style={{ padding: "0.75rem", background: "#faf9f6", border: "1px solid #e8e5de", borderRadius: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#dea63b" }}>DAY {day.day}</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1c1917" }}>{day.focus}</span>
                      </div>
                      <ul style={{ margin: "0.35rem 0 0 1rem", padding: 0, fontSize: "0.74rem", color: "#555", lineHeight: 1.4 }}>
                        {day.tasks.map((task: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: "0.15rem" }}>{task}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGapModal(false)}
              className="msetup-confirm-btn-primary"
              style={{ width: "100%", margin: 0 }}
            >
              Got it, Let's Prepare!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
