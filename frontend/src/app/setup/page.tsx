"use client";

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
  Bell,
  Settings
} from "lucide-react";

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
      const response = await fetch("http://127.0.0.1:8000/api/resume/parse", {
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
      }
      if (storedName) {
        setUserName(storedName);
      }
    }
  }, []);

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
      const response = await fetch("http://127.0.0.1:8000/api/interviews/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: activeUserId,
          role: finalRole,
          level: selectedDifficulty,
          mode: "voice", // Default voice synthesis and recording mode
          tech_stack: parsedTechStack.length > 0 ? parsedTechStack : null
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to initialize interview.");
      }

      const session = await response.json();
      
      // Redirect to the newly created active interview session page
      router.push(`/interview/${session.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start interview. Ensure backend FastAPI server is running on port 8000.");
      setLoading(false);
    }
  };

  return (
    <div className="msetup-page">
      {/* Header bar matches standard dashboard/practice top bar */}
      <header className="dash-header">
        <Link href="/dashboard" className="dash-logo-wrap">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="#dea63b" fillOpacity="0.12" />
            <rect x="6" y="6" width="20" height="20" rx="3" fill="#dea63b" fillOpacity="0.25" />
            <rect x="10" y="10" width="12" height="12" rx="2" fill="#dea63b" />
          </svg>
          <span className="dash-logo-text">Prepora</span>
        </Link>

        <nav className="dash-nav">
          <span className="dash-nav-link" onClick={() => router.push("/dashboard")}>Home</span>
          <span className="dash-nav-link" onClick={() => router.push("/practice")}>Practice</span>
          <span className="dash-nav-link active">Mock Interview</span>
          <span className="dash-nav-link" onClick={() => router.push("/progress")}>Progress</span>
        </nav>

        <div className="dash-header-actions">
          <button className="dash-icon-btn" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <button className="dash-icon-btn" aria-label="Settings" onClick={() => router.push("/setup")}>
            <Settings size={18} />
          </button>
          <div className="dash-avatar" onClick={() => {
            localStorage.removeItem("prepora_user_id");
            localStorage.removeItem("prepora_user_name");
            router.push("/");
          }} title="Sign Out">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

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
              <input
                type="text"
                className="msetup-input"
                placeholder="e.g. Google, Amazon..."
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="button"
            className="msetup-btn-begin"
            onClick={handleBeginInterview}
            disabled={loading}
          >
            {loading ? "Initializing..." : "Begin Interview"}
            <ArrowRight size={18} />
          </button>
          
          <div className="msetup-mic-notice">
            <Mic size={13} />
            <span>Your mic will be used during the session</span>
          </div>
        </div>
      </main>

      {/* Footer matches mockup */}
      <footer className="msetup-footer">
        <span className="msetup-footer-left">
          © 2024 Prepora. The Encouraging Mentor.
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
    </div>
  );
}
