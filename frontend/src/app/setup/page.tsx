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

  // Form selections
  const [selectedType, setSelectedType] = useState<"technical" | "system-design" | "behavioral">("technical");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [selectedDuration, setSelectedDuration] = useState<"20" | "40" | "60">("40");
  const [companyInput, setCompanyInput] = useState("");

  // API loading / error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          mode: "voice" // Default voice synthesis and recording mode
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
