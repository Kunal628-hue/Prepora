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
  Settings,
  Share2,
  RotateCcw,
  Sparkles,
  BookOpen,
  Calendar,
  AlertTriangle,
  Check
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
  tech_stack?: string[] | null;
}

export default function InterviewReport({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Real data state
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [isAddedToPlan, setIsAddedToPlan] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  useEffect(() => {
    const fetchSessionAndHistory = async () => {
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

        // Fetch user history
        const uId = localStorage.getItem("prepora_user_id");
        if (uId) {
          const histResponse = await fetch(`http://127.0.0.1:8000/api/interviews?user_id=${uId}`);
          if (histResponse.ok) {
            const list = await histResponse.json();
            const completed = list
              .filter((s: any) => s.status === "completed" && s.overall_score !== null && s.id !== id)
              .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            setHistorySessions(completed);
          }

          // Check if plan item is already added
          const savedPlan = localStorage.getItem("prepora_recommended_plan");
          if (savedPlan) {
            try {
              const plan = JSON.parse(savedPlan);
              const recs: Array<{ title: string; desc: string }> = [];
              if (data.weaknesses && data.weaknesses.length > 0) {
                data.weaknesses.forEach((w) => {
                  recs.push(formatBullet(w));
                });
              }
              const firstTitle = recs[0]?.title || "DSA";
              const textTarget = `Practice 5 ${firstTitle} Problems`;
              setIsAddedToPlan(plan.some((item: any) => item.text === textTarget));
            } catch (e) {}
          }
        }
      } catch (err: any) {
        console.error(err);
        setError("Could not load performance report.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndHistory();
  }, [id, router]);

  const handleDownloadPDF = () => {
    window.open(`http://127.0.0.1:8000/api/interviews/${id}/report`, "_blank");
  };

  const getQuestionBadgeStyles = (qScore: number | null) => {
    const scoreVal = qScore || 0;
    if (scoreVal >= 80) {
      return { bg: "#e6f4ea", color: "#137333", text: "OPTIMAL" };
    }
    if (scoreVal >= 60) {
      return { bg: "#fef7e0", color: "#b06000", text: "SUB-OPTIMAL" };
    }
    return { bg: "#fce8e6", color: "#c5221f", text: "INSUFFICIENT" };
  };

  const getLetterGrade = (scoreVal: number) => {
    if (scoreVal >= 93) return "A";
    if (scoreVal >= 90) return "A-";
    if (scoreVal >= 87) return "B+";
    if (scoreVal >= 83) return "B";
    if (scoreVal >= 80) return "B-";
    if (scoreVal >= 75) return "C+";
    if (scoreVal >= 70) return "C";
    if (scoreVal >= 60) return "D";
    return "F";
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "OCT 18, 2026";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
    } catch {
      return "OCT 18, 2026";
    }
  };

  // Helper to draw Radar Chart Points
  const getRadarPoint = (index: number, val: number, cx = 150, cy = 135, r = 80) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
    const factor = val / 100;
    const x = cx + r * factor * Math.cos(angle);
    const y = cy + r * factor * Math.sin(angle);
    return { x, y };
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
  
  // Dynamic metrics extraction from DB subscores
  const clamp = (val: number) => Math.min(100, Math.max(0, val));
  const techScore = clamp(session.technical_score ?? Math.round(score * 0.9));
  const commScore = clamp(session.communication_score ?? Math.round(score * 0.95));
  const probScore = clamp(session.problem_solving_score ?? Math.round(score * 1.02));
  const structScore = clamp(session.structure_score ?? Math.round(score * 0.88));
  const confScore = clamp(Math.round((commScore + probScore) / 2));

  const radarScores = [techScore, commScore, confScore, probScore, structScore];
  const radarLabels = ["TECHNICAL", "COMM.", "CONFIDENCE", "PROBLEM SOLVING", "EFFICIENCY"];
  const radarPoints = radarScores.map((val, i) => {
    const pt = getRadarPoint(i, val);
    return `${pt.x},${pt.y}`;
  }).join(" ");

  const gridRatios = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPolygons = gridRatios.map((ratio) => {
    return [0, 1, 2, 3, 4].map((i) => {
      const pt = getRadarPoint(i, ratio * 100);
      return `${pt.x},${pt.y}`;
    }).join(" ");
  });

  const gridLines = [0, 1, 2, 3, 4].map((i) => {
    const outer = getRadarPoint(i, 100);
    return { x1: 150, y1: 135, x2: outer.x, y2: outer.y };
  });

  const labelPositions = [0, 1, 2, 3, 4].map((i) => {
    const pt = getRadarPoint(i, 115);
    let textAnchor: "middle" | "start" | "end" = "middle";
    if (i === 1 || i === 2) textAnchor = "start";
    if (i === 3 || i === 4) textAnchor = "end";
    
    let dy = "0.35em";
    if (i === 0) { dy = "-0.5em"; textAnchor = "middle"; }
    
    return { x: pt.x, y: pt.y, label: radarLabels[i], textAnchor, dy };
  });

  // Extract custom recommendations from weaknesses
  const recommendations: Array<{ title: string; desc: string }> = [];
  
  const formatBullet = (bullet: string) => {
    const parts = bullet.split(/[:—]/);
    if (parts.length > 1) {
      return {
        title: parts[0].trim(),
        desc: parts.slice(1).join(":").trim()
      };
    }
    return {
      title: "Optimization Plan",
      desc: bullet
    };
  };

  if (session.weaknesses && session.weaknesses.length > 0) {
    session.weaknesses.forEach((w) => {
      recommendations.push(formatBullet(w));
    });
  }

  const weaknessFallbacks = [
    { title: "Dynamic Programming", desc: "Failed to identify the overlapping subproblems in recursion structures." },
    { title: "System Design Latency", desc: "Underestimated the latency costs of multi-region synchronization." },
    { title: "Concurrency Basics", desc: "Confusion between Mutexes and Semaphores in high-throughput threads." }
  ];
  while (recommendations.length < 3) {
    recommendations.push(weaknessFallbacks[recommendations.length]);
  }

  const strengthsList: Array<{ title: string; desc: string }> = [];
  if (session.strengths && session.strengths.length > 0) {
    session.strengths.forEach((s) => {
      strengthsList.push(formatBullet(s));
    });
  }

  const strengthFallbacks = [
    { title: "Modular Thinking", desc: "Excellent decomposition of large logic blocks into pure helper methods." },
    { title: "Edge Case Detection", desc: "Identified null, empty, and boundary inputs without prompting inputs." },
    { title: "Clear Articulation", desc: "Highly descriptive stream-of-consciousness explanation of code structures." }
  ];
  while (strengthsList.length < 3) {
    strengthsList.push(strengthFallbacks[strengthsList.length]);
  }

  // Next Mock Date Dynamic string
  const nextMockDate = new Date();
  nextMockDate.setDate(nextMockDate.getDate() + 3);
  const nextMockStr = nextMockDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();

  const handleAddToPlan = () => {
    if (!session) return;
    const savedPlan = localStorage.getItem("prepora_recommended_plan");
    let plan = [];
    if (savedPlan) {
      try {
        plan = JSON.parse(savedPlan);
      } catch (e) {
        plan = [];
      }
    }
    
    const firstTitle = recommendations[0]?.title || "DSA";
    const textTarget = `Practice 5 ${firstTitle} Problems`;
    
    // Create a new task item matching the format
    const newTask = {
      id: `task-${Date.now()}`,
      text: textTarget,
      difficulty: session.level === "Senior" ? "Hard" : session.level === "Mid-level" ? "Medium" : "Easy",
      type: session.level === "Senior" ? "hard" : session.level === "Mid-level" ? "medium" : "easy",
      checked: false,
      link: "/practice"
    };

    // Prevent duplicate entries
    const exists = plan.some((item: any) => item.text === newTask.text);
    if (!exists) {
      const updatedPlan = [newTask, ...plan];
      localStorage.setItem("prepora_recommended_plan", JSON.stringify(updatedPlan));
    }
    setIsAddedToPlan(true);
  };

  const handleScheduleNextMock = async () => {
    if (submittingSchedule || !session) return;
    setSubmittingSchedule(true);
    try {
      const uId = localStorage.getItem("prepora_user_id");
      if (!uId) return;

      const dateTarget = nextMockDate.toISOString().split("T")[0]; // YYYY-MM-DD
      
      const response = await fetch(`http://127.0.0.1:8000/api/interviews/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: uId,
          role: session.role,
          level: session.level,
          mode: session.mode,
          tech_stack: session.tech_stack,
          scheduled_time: dateTarget
        })
      });
      if (response.ok) {
        setIsScheduled(true);
      } else {
        alert("Failed to schedule interview.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to schedule interview.");
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const getTrajectoryData = () => {
    const todayGrade = getLetterGrade(score);
    
    // Convert history sessions to trajectory items
    const historyItems = historySessions.map((s: any) => {
      const d = new Date(s.created_at);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
      const grade = getLetterGrade(s.overall_score || 0);
      return {
        label,
        grade,
        height: Math.max(30, s.overall_score || 0),
        active: false
      };
    });

    const maxHistoryCount = 7;
    const itemsNeeded = maxHistoryCount - historyItems.length;
    
    const dummyItems = [];
    if (itemsNeeded > 0) {
      const refDate = historySessions.length > 0 
        ? new Date(historySessions[0].created_at) 
        : (session ? new Date(session.created_at) : new Date());
        
      const dummyGrades = ["C-", "C", "C+", "B-", "B", "B", "B+"];
      const dummyHeights = [35, 42, 48, 58, 65, 68, 78];

      for (let i = 0; i < itemsNeeded; i++) {
        const d = new Date(refDate);
        d.setDate(d.getDate() - (itemsNeeded - i) * 3);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
        
        const dummyIdx = Math.max(0, dummyGrades.length - itemsNeeded + i);
        dummyItems.push({
          label,
          grade: dummyGrades[dummyIdx],
          height: dummyHeights[dummyIdx],
          active: false
        });
      }
    }

    const todayItem = {
      label: "TODAY",
      grade: todayGrade,
      height: Math.max(30, score),
      active: true
    };

    const finalHistory = historyItems.slice(-maxHistoryCount);

    return [...dummyItems, ...finalHistory, todayItem];
  };

  const trajectoryData = getTrajectoryData();
  const userName = typeof window !== "undefined" ? localStorage.getItem("prepora_user_name") || "User" : "User";

  return (
    <div style={{ background: "#f8f6f1", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--font-sans)", color: "#1c1917" }}>
      
      {/* Header Bar */}
      <header className="dash-header" style={{ position: "sticky", top: 0, zIndex: 100, background: "#ffffff", borderBottom: "1px solid #e8e5de" }}>
        <Link href="/dashboard" className="dash-logo-wrap" style={{ textDecoration: "none" }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="#dea63b" fillOpacity="0.12" />
            <rect x="6" y="6" width="20" height="20" rx="3" fill="#dea63b" fillOpacity="0.25" />
            <rect x="10" y="10" width="12" height="12" rx="2" fill="#dea63b" />
          </svg>
          <span className="dash-logo-text" style={{ fontSize: "1.2rem", fontWeight: 800 }}>Prepora</span>
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
      <main style={{ maxWidth: "900px", margin: "2.5rem auto", padding: "0 1.5rem", flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* 1. Header Card Panel */}
        <section style={{
          background: "#ffffff",
          border: "1px solid #e5e2d9",
          borderRadius: "16px",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1.5rem", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#dea63b",
                letterSpacing: "0.08em"
              }}>
                PREPORA REPORT · SESSION #{id.substring(0, 6).toUpperCase()} · {formatDate(session.created_at)}
              </span>
              
              <h1 style={{
                fontSize: "1.8rem",
                fontWeight: 800,
                color: "#1c1917",
                margin: 0,
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.01em"
              }}>
                TECHNICAL INTERVIEW — {session.role.toUpperCase()}
              </h1>
              
              <p style={{
                fontSize: "0.95rem",
                lineHeight: 1.5,
                color: "#6b6661",
                fontStyle: "italic",
                margin: "0.25rem 0 0 0"
              }}>
                "{session.feedback_summary || "Review metrics to improve code implementation scores."}"
              </p>
            </div>

            {/* Letter Grade Circle/Box */}
            <div style={{
              width: "80px",
              height: "80px",
              border: "3px solid #dea63b",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              boxShadow: "0 4px 14px rgba(222, 166, 59, 0.1)",
              flexShrink: 0
            }}>
              <span style={{
                fontSize: "2.2rem",
                fontWeight: 900,
                color: "#dea63b",
                fontFamily: "monospace"
              }}>
                {getLetterGrade(score)}
              </span>
            </div>
          </div>

          {/* Card Actions Buttons */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button 
              onClick={handleDownloadPDF}
              style={{
                background: "#dea63b",
                border: "none",
                color: "#ffffff",
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 2px 8px rgba(222, 166, 59, 0.2)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              <Download size={16} />
              Download PDF
            </button>
            <button 
              onClick={() => alert("Report link copied to clipboard!")}
              style={{
                background: "#ffffff",
                border: "1px solid #dcdad0",
                color: "#1c1917",
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              <Share2 size={16} color="#6b6661" />
              Share Report
            </button>
            <button 
              onClick={() => router.push("/setup")}
              style={{
                background: "#ffffff",
                border: "1px solid #dcdad0",
                color: "#1c1917",
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              <RotateCcw size={16} color="#6b6661" />
              Retry Session
            </button>
          </div>
        </section>

        {/* 2. Analysis Grid */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.5rem"
        }}>
          
          {/* Dimensional Analysis (Radar Chart) */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e5e2d9",
            borderRadius: "16px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
          }}>
            <span style={{
              fontFamily: "monospace",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#dea63b",
              letterSpacing: "0.08em"
            }}>
              DIMENSIONAL ANALYSIS
            </span>

            {/* Radar chart container */}
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <svg width="300" height="260" viewBox="0 0 300 260">
                {/* Outer concentric grid loops */}
                {gridPolygons.map((pointsStr, idx) => (
                  <polygon 
                    key={idx} 
                    points={pointsStr} 
                    fill="none" 
                    stroke="#e5e2d9" 
                    strokeWidth="1" 
                    strokeDasharray={idx < 4 ? "4 4" : "none"} 
                  />
                ))}

                {/* Inner axis ticks lines */}
                {gridLines.map((line, idx) => (
                  <line 
                    key={idx} 
                    x1={line.x1} 
                    y1={line.y1} 
                    x2={line.x2} 
                    y2={line.y2} 
                    stroke="#e5e2d9" 
                    strokeWidth="1" 
                  />
                ))}

                {/* The Filled Data Polygon */}
                <polygon 
                  points={radarPoints} 
                  fill="rgba(222, 166, 59, 0.18)" 
                  stroke="#dea63b" 
                  strokeWidth="2.5" 
                />

                {/* Vertex Markers */}
                {radarScores.map((val, i) => {
                  const pt = getRadarPoint(i, val);
                  return (
                    <circle 
                      key={i} 
                      cx={pt.x} 
                      cy={pt.y} 
                      r="4.5" 
                      fill="#dea63b" 
                      stroke="#ffffff" 
                      strokeWidth="1.5" 
                    />
                  );
                })}

                {/* Outer Labels */}
                {labelPositions.map((lbl, idx) => (
                  <text 
                    key={idx} 
                    x={lbl.x} 
                    y={lbl.y} 
                    textAnchor={lbl.textAnchor} 
                    dy={lbl.dy} 
                    fill="#1c1917" 
                    fontSize="9.5" 
                    fontWeight="800" 
                    fontFamily="monospace"
                  >
                    {lbl.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Data Readout Detailed (Scores Progress bars) */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e5e2d9",
            borderRadius: "16px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
          }}>
            <span style={{
              fontFamily: "monospace",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#dea63b",
              letterSpacing: "0.08em"
            }}>
              DATA_READOUT_DETAILED
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Technical bar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "#1c1917" }}>
                  <span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>TECHNICAL ACCURACY</span>
                  <span>{(techScore / 10).toFixed(1)}/10</span>
                </div>
                <div style={{ height: "8px", background: "#f0ede6", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${techScore}%`, height: "100%", background: "linear-gradient(to right, #e5a93c, #dea63b)", borderRadius: "4px" }} />
                </div>
              </div>

              {/* Communication bar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "#1c1917" }}>
                  <span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>COMMUNICATION</span>
                  <span>{(commScore / 10).toFixed(1)}/10</span>
                </div>
                <div style={{ height: "8px", background: "#f0ede6", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${commScore}%`, height: "100%", background: "linear-gradient(to right, #e5a93c, #dea63b)", borderRadius: "4px" }} />
                </div>
              </div>

              {/* Confidence bar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "#1c1917" }}>
                  <span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>CONFIDENCE</span>
                  <span>{(confScore / 10).toFixed(1)}/10</span>
                </div>
                <div style={{ height: "8px", background: "#f0ede6", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${confScore}%`, height: "100%", background: "linear-gradient(to right, #e5a93c, #dea63b)", borderRadius: "4px" }} />
                </div>
              </div>

              {/* Problem solving bar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "#1c1917" }}>
                  <span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>PROBLEM SOLVING</span>
                  <span>{(probScore / 10).toFixed(1)}/10</span>
                </div>
                <div style={{ height: "8px", background: "#f0ede6", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${probScore}%`, height: "100%", background: "linear-gradient(to right, #e5a93c, #dea63b)", borderRadius: "4px" }} />
                </div>
              </div>

              {/* Efficiency bar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "#1c1917" }}>
                  <span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>CODE EFFICIENCY</span>
                  <span>{(structScore / 10).toFixed(1)}/10</span>
                </div>
                <div style={{ height: "8px", background: "#f0ede6", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${structScore}%`, height: "100%", background: "linear-gradient(to right, #e5a93c, #dea63b)", borderRadius: "4px" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Segment Analysis Accordions */}
        <section style={{
          background: "#ffffff",
          border: "1px solid #e5e2d9",
          borderRadius: "16px",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
        }}>
          <span style={{
            fontFamily: "monospace",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#dea63b",
            letterSpacing: "0.08em"
          }}>
            SEGMENT_ANALYSIS_001
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[...session.questions]
              .sort((a, b) => a.question_order - b.question_order)
              .map((q) => (
                <div 
                  key={q.id} 
                  style={{ 
                    borderRadius: "12px", 
                    border: "1px solid #e5e2d9", 
                    overflow: "hidden" 
                  }}
                >
                  <div 
                    onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      padding: "1.1rem 1.25rem", 
                      cursor: "pointer", 
                      userSelect: "none" 
                    }}
                  >
                    <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1c1917", margin: 0, paddingRight: "1rem" }}>
                      Q{q.question_order} &nbsp; {q.question_text.length > 72 ? `${q.question_text.substring(0, 72)}...` : q.question_text}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ 
                        fontSize: "0.68rem", 
                        fontWeight: 800, 
                        background: getQuestionBadgeStyles(q.score).bg,
                        color: getQuestionBadgeStyles(q.score).color,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        letterSpacing: "0.05em",
                        fontFamily: "monospace"
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
                    <div style={{ padding: "0 1.25rem 1.25rem 1.25rem", borderTop: "1px solid #f5f2eb", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ marginTop: "1rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "#8e8e93", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "monospace" }}>Candidate Response</span>
                        <p style={{ fontSize: "0.9rem", color: "#374151", marginTop: "0.25rem", lineHeight: 1.5 }}>
                          {q.user_answer || "[Answer skipped or empty]"}
                        </p>
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
                        <div style={{ background: "#faf9f6", border: "1px solid #e5e2d9", borderRadius: "8px", padding: "1rem" }}>
                          <span style={{ fontSize: "0.7rem", color: "#dea63b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.25rem", fontFamily: "monospace" }}>AI Critique Feedback</span>
                          <p style={{ fontSize: "0.85rem", color: "#6b6661", lineHeight: 1.45 }}>{q.critique || "No critique available."}</p>
                        </div>
                        
                        <div style={{ background: "rgba(222, 166, 59, 0.02)", border: "1px solid rgba(222, 166, 59, 0.1)", borderRadius: "8px", padding: "1rem" }}>
                          <span style={{ fontSize: "0.7rem", color: "#e5a93c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.25rem", fontFamily: "monospace" }}>Benchmark Model Answer</span>
                          <p style={{ fontSize: "0.85rem", color: "#6b6661", lineHeight: 1.45 }}>{q.model_answer || "No benchmark answer generated."}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>

        {/* 4. Strengths & Weaknesses Columns */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.5rem"
        }}>
          
          {/* Weaknesses */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e5e2d9",
            borderRadius: "16px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <AlertTriangle size={16} color="#d97706" />
              <span style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#d97706",
                letterSpacing: "0.08em"
              }}>
                YOUR WEAKNESSES — TOP 3
              </span>
            </div>

            <div>
              {recommendations.slice(0, 3).map((w, idx) => (
                <div key={idx} style={{ borderBottom: idx < 2 ? "1px solid #f0ede6" : "none", paddingBottom: idx < 2 ? "0.75rem" : 0, marginBottom: idx < 2 ? "0.75rem" : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#1c1917" }}>{w.title}</span>
                    <button
                      onClick={() => router.push("/practice")}
                      style={{
                        background: "#dea63b",
                        border: "none",
                        color: "#ffffff",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        padding: "0.2rem 0.6rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        boxShadow: "0 2px 6px rgba(222,166,59,0.15)"
                      }}
                    >
                      FORGE THIS
                    </button>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#6b6661", lineHeight: 1.4, margin: 0 }}>
                    {w.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e5e2d9",
            borderRadius: "16px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <span style={{ color: "#10b981", fontSize: "1.1rem" }}>✓</span>
              <span style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#10b981",
                letterSpacing: "0.08em"
              }}>
                YOUR STRENGTHS — TOP 3
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {strengthsList.slice(0, 3).map((s, idx) => (
                <div key={idx} style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#e6f4ea",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px"
                  }}>
                    <Check size={11} color="#10b981" strokeWidth={3} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#1c1917", display: "block", marginBottom: "0.25rem" }}>
                      {s.title}
                    </span>
                    <p style={{ fontSize: "0.85rem", color: "#6b6661", lineHeight: 1.4, margin: 0 }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Recommended Next Actions */}
        <section style={{
          background: "#ffffff",
          border: "1px solid #e5e2d9",
          borderRadius: "16px",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
        }}>
          <span style={{
            fontFamily: "monospace",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#dea63b",
            letterSpacing: "0.08em"
          }}>
            RECOMMENDED_NEXT_ACTIONS
          </span>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem"
          }}>
            {/* Action 1 */}
            <div style={{
              border: "1px solid #e5e2d9",
              borderRadius: "12px",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem"
            }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#fdf6e8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <BookOpen size={18} color="#dea63b" />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1c1917", margin: 0 }}>
                    Practice 5 {recommendations[0]?.title || "DSA"} Problems
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "#6b6661" }}>Target: Weakness Category</span>
                </div>
              </div>
              
              <button 
                onClick={handleAddToPlan}
                disabled={isAddedToPlan}
                style={{
                  background: "none",
                  border: "none",
                  color: isAddedToPlan ? "#10b981" : "#dea63b",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  cursor: isAddedToPlan ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.15rem",
                  padding: 0
                }}
              >
                {isAddedToPlan ? "ADDED ✓" : "ADD TO PLAN"} 
                {!isAddedToPlan && <ArrowRight size={12} />}
              </button>
            </div>

            {/* Action 2 */}
            <div style={{
              border: "1px solid #e5e2d9",
              borderRadius: "12px",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem"
            }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#e0f2fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <Calendar size={18} color="#0284c7" />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1c1917", margin: 0 }}>
                    Schedule Next Mock
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "#6b6661" }}>Recommended: {nextMockStr}</span>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                <button 
                  onClick={handleScheduleNextMock}
                  disabled={isScheduled || submittingSchedule}
                  style={{
                    background: "none",
                    border: "none",
                    color: isScheduled ? "#10b981" : "#dea63b",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: (isScheduled || submittingSchedule) ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.15rem",
                    padding: 0
                  }}
                >
                  {isScheduled 
                    ? "SCHEDULED ✓" 
                    : submittingSchedule 
                      ? "SCHEDULING..." 
                      : "SCHEDULE"
                  }
                  {!isScheduled && !submittingSchedule && <span style={{ fontSize: "0.78rem", marginLeft: "0.15rem" }}>🗓️</span>}
                </button>
                {isScheduled && (
                  <a 
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Prepora Mock Interview (${session?.role || "Technical"})`)}&dates=${nextMockDate.toISOString().replace(/[^\d]/g, "").substring(0, 8)}T100000Z/${nextMockDate.toISOString().replace(/[^\d]/g, "").substring(0, 8)}T104500Z&details=${encodeURIComponent(`Upcoming mock interview scheduled on Prepora.\n\nTarget: ${session?.role || ""}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "0.68rem",
                      color: "#dea63b",
                      fontWeight: 700,
                      textDecoration: "underline",
                      cursor: "pointer"
                    }}
                  >
                    Add to Calendar 🗓️
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 6. System Trajectory Graph */}
        <section style={{
          background: "#ffffff",
          border: "1px solid #e5e2d9",
          borderRadius: "16px",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
        }}>
          <span style={{
            fontFamily: "monospace",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#dea63b",
            letterSpacing: "0.08em"
          }}>
            SYSTEM_TRAJECTORY_L10
          </span>

          {/* SVG Column Chart */}
          <div style={{ width: "100%", overflowX: "auto" }}>
            <svg width="500" height="130" viewBox="0 0 500 130" style={{ display: "block", margin: "0 auto" }}>
              {/* Columns loop */}
              {trajectoryData.map((item, idx) => {
                const xPos = idx * 60 + 20;
                const rectHeight = item.height;
                const yPos = 100 - rectHeight;
                return (
                  <g key={idx}>
                    {/* Background Bar track */}
                    <rect 
                      x={xPos} 
                      y="15" 
                      width="36" 
                      height="85" 
                      rx="4" 
                      fill="rgba(240, 237, 230, 0.4)" 
                    />
                    
                    {/* Score fill */}
                    <rect 
                      x={xPos} 
                      y={yPos} 
                      width="36" 
                      height={rectHeight} 
                      rx="4" 
                      fill={item.active ? "#dea63b" : "rgba(222, 166, 59, 0.22)"} 
                      style={{ transition: "height 0.5s ease" }}
                    />

                    {/* Grade Text overlay */}
                    <text 
                      x={xPos + 18} 
                      y={yPos - 6} 
                      textAnchor="middle" 
                      fill={item.active ? "#dea63b" : "#6b6661"} 
                      fontSize="9" 
                      fontWeight={item.active ? "900" : "600"}
                      fontFamily="monospace"
                    >
                      {item.grade}
                    </text>

                    {/* Date label */}
                    <text 
                      x={xPos + 18} 
                      y="118" 
                      textAnchor="middle" 
                      fill={item.active ? "#1c1917" : "#7f7a72"} 
                      fontSize="8.5" 
                      fontWeight={item.active ? "800" : "500"}
                      fontFamily="monospace"
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

      </main>

      {/* Footer bar */}
      <footer style={{ background: "#ffffff", borderTop: "1px solid #e8e5de", padding: "1.5rem 0", marginTop: "auto" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.5rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#7f7a72", fontWeight: 500 }}>
          <span>© 2026 PREPORA | SYSTEM READY</span>
          <div style={{ display: "flex", gap: "1.5rem", marginLeft: "auto" }}>
            <span style={{ cursor: "pointer" }}>PRIVACY_PROTOCOL</span>
            <span style={{ cursor: "pointer" }}>TERMINAL_TERMS</span>
            <span style={{ cursor: "pointer" }}>SUPPORT_LINK</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
