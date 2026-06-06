"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Download, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Bell,
  Settings
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
  created_at: string;
  overall_score: number | null;
  feedback_summary: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  technical_score: number | null;
  communication_score: number | null;
  problem_solving_score: number | null;
  structure_score: number | null;
  questions: Question[];
}

export default function InterviewReport({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const userName = typeof window !== "undefined" ? localStorage.getItem("prepora_user_name") || "User" : "User";

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/interviews/${id}`);
        if (!response.ok) {
          throw new Error("Report not found.");
        }
        const data: InterviewSession = await response.json();
        
        if (data.status === "active") {
          router.push(`/interview/${id}`);
          return;
        }
        
        setSession(data);
      } catch (err: any) {
        console.error(err);
        setError("Could not load performance report.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id, router]);

  const handleDownloadPDF = () => {
    window.open(`http://127.0.0.1:8000/api/interviews/${id}/report`, "_blank");
  };

  const getQuestionBadgeStyles = (qScore: number | null) => {
    const scoreVal = qScore || 0;
    if (scoreVal >= 80) {
      return { bg: "#e6f4ea", color: "#137333", text: `${(scoreVal / 10).toFixed(0)}/10` };
    }
    if (scoreVal >= 60) {
      return { bg: "#fef7e0", color: "#b06000", text: `${(scoreVal / 10).toFixed(0)}/10` };
    }
    return { bg: "#fce8e6", color: "#c5221f", text: `${(scoreVal / 10).toFixed(0)}/10` };
  };

  if (loading) {
    return (
      <div style={{ background: "#f8f6f1", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", color: "#6b6661" }}>
        Analyzing response logs and generating scorecard...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ background: "#f8f6f1", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", padding: "2rem" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e5e2d9", borderRadius: "16px", padding: "2.5rem", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <h2 style={{ color: "#ef4444", fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>Error Occurred</h2>
          <p style={{ color: "#6b6661", fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>{error || "Session not found."}</p>
          <button className="btn btn-secondary" onClick={() => router.push("/dashboard")} style={{ width: "100%" }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const score = session.overall_score || 0;
  
  // Extract custom recommendations from weaknesses
  const recommendations: Array<{ title: string; desc: string }> = [];
  if (session.weaknesses && session.weaknesses.length > 0) {
    session.weaknesses.forEach((w) => {
      let title = "DSA Concept";
      let desc = w;
      const lowerW = w.toLowerCase();
      
      if (lowerW.includes("binary search")) {
        title = "Binary Search";
      } else if (lowerW.includes("linked list")) {
        title = "Linked Lists";
      } else if (lowerW.includes("time complexity") || lowerW.includes("big o") || lowerW.includes("space complexity")) {
        title = "Big O Notation";
      } else if (lowerW.includes("recursion")) {
        title = "Recursion";
      } else if (lowerW.includes("dynamic programming")) {
        title = "Dynamic Programming";
      } else if (lowerW.includes("graph")) {
        title = "Graph Algorithms";
      } else if (lowerW.includes("tree") || lowerW.includes("bst")) {
        title = "Tree Structures";
      } else {
        const words = w.split(" ").slice(0, 2).join(" ");
        title = words.replace(/[^\w\s]/g, "");
        if (title.length > 20 || title.length < 3) title = "DSA Topic";
      }
      recommendations.push({ title, desc });
    });
  }

  const fallbacks = [
    { title: "Binary Search", desc: "Practice more search algorithms to solidify your foundation." },
    { title: "Linked Lists", desc: "Review deletion logic and boundary conditions." },
    { title: "Big O Notation", desc: "Understand worst-case scenarios and space complexity." }
  ];
  while (recommendations.length < 3) {
    recommendations.push(fallbacks[recommendations.length]);
  }

  return (
    <div style={{ background: "#f8f6f1", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--font-sans)", color: "#1c1917" }}>
      
      {/* Header Bar */}
      <header className="dash-header" style={{ position: "sticky", top: 0, zIndex: 100, background: "#ffffff", borderBottom: "1px solid #e5e2d9" }}>
        <Link href="/dashboard" className="dash-logo-wrap" style={{ textDecoration: "none" }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="#dea63b" fillOpacity="0.12" />
            <rect x="6" y="6" width="20" height="20" rx="3" fill="#dea63b" fillOpacity="0.25" />
            <rect x="10" y="10" width="12" height="12" rx="2" fill="#dea63b" />
          </svg>
          <span className="dash-logo-text" style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1c1917" }}>Prepora</span>
        </Link>

        <nav className="dash-nav">
          <span className="dash-nav-link" style={{ cursor: "pointer" }} onClick={() => router.push("/dashboard")}>Home</span>
          <span className="dash-nav-link" style={{ cursor: "pointer" }} onClick={() => router.push("/practice")}>Practice</span>
          <span className="dash-nav-link active" style={{ cursor: "pointer" }} onClick={() => router.push("/setup")}>Mock Interview</span>
          <span className="dash-nav-link" style={{ cursor: "pointer" }} onClick={() => router.push("/progress")}>Progress</span>
        </nav>

        <div className="dash-header-actions">
          <button className="dash-icon-btn" aria-label="Notifications" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Bell size={18} />
          </button>
          <button className="dash-icon-btn" aria-label="Settings" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => router.push("/setup")}>
            <Settings size={18} />
          </button>
          <div className="dash-avatar" style={{ cursor: "pointer" }} onClick={() => {
            localStorage.removeItem("prepora_user_id");
            localStorage.removeItem("prepora_user_name");
            router.push("/");
          }} title="Sign Out">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: "800px", margin: "3rem auto", padding: "0 1.5rem", flex: 1, width: "100%" }}>
        
        {/* Overall Completion Score Section */}
        <section style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#7f7a72", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Interview Complete
          </span>
          <h1 style={{ fontSize: "4.5rem", fontWeight: 800, color: "#dea63b", margin: "0.25rem 0", lineHeight: 1.1, fontFamily: "var(--font-display)" }}>
            {(score / 10).toFixed(1)} / 10
          </h1>
          <p style={{ fontSize: "1rem", color: "#6b6661", maxWidth: "520px", margin: "0 auto 1.75rem auto", lineHeight: 1.5 }}>
            {session.feedback_summary || "Good effort. Review critique reports to improve score metrics."}
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button 
              onClick={handleDownloadPDF}
              style={{
                background: "#ffffff",
                border: "1px solid #dcdad0",
                color: "#1c1917",
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
            >
              Download PDF
            </button>
            <button 
              onClick={() => router.push("/setup")}
              style={{
                background: "#dea63b",
                border: "none",
                color: "#ffffff",
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(222, 166, 59, 0.2)"
              }}
            >
              Try Again
            </button>
          </div>
        </section>

        {/* Detailed Q&A Feed */}
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "0.75rem", color: "#7f7a72", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
            How you did, question by question
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[...session.questions]
              .sort((a, b) => a.question_order - b.question_order)
              .map((q) => (
                <div 
                  key={q.id} 
                  style={{ 
                    background: "#ffffff", 
                    borderRadius: "12px", 
                    border: "1px solid #e5e2d9", 
                    overflow: "hidden", 
                    boxShadow: "0 2px 8px rgba(0,0,0,0.01)" 
                  }}
                >
                  <div 
                    onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      padding: "1.25rem 1.5rem", 
                      cursor: "pointer", 
                      userSelect: "none" 
                    }}
                  >
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1c1917", margin: 0 }}>
                      {q.question_order}. {q.question_text}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ 
                        fontSize: "0.75rem", 
                        fontWeight: 700, 
                        background: getQuestionBadgeStyles(q.score).bg,
                        color: getQuestionBadgeStyles(q.score).color,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "6px"
                      }}>
                        {getQuestionBadgeStyles(q.score).text}
                      </span>
                      {expandedQuestionId === q.id ? (
                        <ChevronUp size={16} color="#7f7a72" />
                      ) : (
                        <ChevronDown size={16} color="#7f7a72" />
                      )}
                    </div>
                  </div>
                  
                  {expandedQuestionId === q.id && (
                    <div style={{ padding: "0 1.5rem 1.5rem 1.5rem", borderTop: "1px solid #f5f2eb" }}>
                      <div style={{ marginTop: "1rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "#8e8e93", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Response</span>
                        <p style={{ fontSize: "0.92rem", color: "#374151", marginTop: "0.25rem", lineHeight: 1.5 }}>
                          {q.user_answer || "[Answer skipped or empty]"}
                        </p>
                      </div>
                      
                      <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
                        <div style={{ background: "#faf9f6", border: "1px solid #e5e2d9", borderRadius: "8px", padding: "1rem" }}>
                          <span style={{ fontSize: "0.7rem", color: "#dea63b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.25rem" }}>AI Critique Feedback</span>
                          <p style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.45 }}>{q.critique || "No critique available."}</p>
                        </div>
                        
                        <div style={{ background: "rgba(222, 166, 59, 0.02)", border: "1px solid rgba(222, 166, 59, 0.1)", borderRadius: "8px", padding: "1rem" }}>
                          <span style={{ fontSize: "0.7rem", color: "#e5a93c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.25rem" }}>Benchmark Model Answer</span>
                          <p style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.45 }}>{q.model_answer || "No benchmark answer generated."}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>

        {/* Focus Recommendations Section */}
        <section style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "0.75rem", color: "#7f7a72", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
            Focus on these next
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {recommendations.slice(0, 3).map((r, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: "#ffffff", 
                  border: "1px solid #e5e2d9", 
                  borderRadius: "12px", 
                  padding: "1.5rem", 
                  boxShadow: "0 2px 8px rgba(0,0,0,0.01)", 
                  display: "flex", 
                  flexDirection: "column", 
                  justifyContent: "space-between" 
                }}
              >
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#1c1917", margin: "0 0 0.5rem 0", fontFamily: "var(--font-display)" }}>{r.title}</h4>
                  <p style={{ fontSize: "0.82rem", color: "#6b6661", lineHeight: 1.4, margin: "0 0 1.25rem 0" }}>{r.desc}</p>
                </div>
                <button 
                  onClick={() => router.push("/practice")}
                  style={{ 
                    background: "none", 
                    border: "none", 
                    color: "#dea63b", 
                    fontWeight: 700, 
                    fontSize: "0.82rem", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.25rem", 
                    cursor: "pointer", 
                    padding: 0,
                    textAlign: "left"
                  }}
                >
                  Practice <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Want to keep improving bottom widget */}
        <section style={{ textAlign: "center", borderTop: "1px solid #e5e2d9", paddingTop: "3rem", paddingBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1c1917", marginBottom: "1.5rem", fontFamily: "var(--font-display)" }}>
            Want to keep improving?
          </h3>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button 
              onClick={() => router.push("/practice")}
              style={{
                background: "#ffffff",
                border: "1px solid #dcdad0",
                color: "#1c1917",
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              Practice these topics
            </button>
            <button 
              onClick={() => router.push("/setup")}
              style={{
                background: "#dea63b",
                border: "none",
                color: "#ffffff",
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(222, 166, 59, 0.2)"
              }}
            >
              Start another mock
            </button>
          </div>
        </section>

      </main>

      {/* Footer bar */}
      <footer style={{ background: "#ffffff", borderTop: "1px solid #e5e2d9", padding: "1.5rem 0" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1.5rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", fontSize: "0.75rem", color: "#7f7a72", fontWeight: 500 }}>
          <span>© 2026 Prepora Career Mentorship. All rights reserved.</span>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <span style={{ cursor: "pointer" }}>Privacy Policy</span>
            <span style={{ cursor: "pointer" }}>Terms of Service</span>
            <span style={{ cursor: "pointer" }}>Help Center</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
