"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  Settings, 
  Flame, 
  Check, 
  AlertCircle,
  TrendingUp,
  Award,
  ChevronRight
} from "lucide-react";

interface InterviewSession {
  id: string;
  user_id: string;
  role: string;
  level: string;
  mode: string;
  scheduled_time: string | null;
  created_at: string;
  status: string;
  overall_score: number | null;
}

interface CategoryCount {
  name: string;
  count: number;
}

export default function Dashboard() {
  const router = useRouter();

  // Auth & Profile state
  const [userName, setUserName] = useState("Arjun");
  const [userId, setUserId] = useState<string | null>(null);

  // Dynamic Data state
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [totalProblemsCount, setTotalProblemsCount] = useState(450);
  const [solvedProblems, setSolvedProblems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendOffline, setBackendOffline] = useState(false);

  // Recommended plan items (checked state kept locally for micro-interaction)
  const [recommendedPlan, setRecommendedPlan] = useState<Array<{ id: string; text: string; difficulty: string; type: string; checked: boolean; link: string }>>([]);

  // Streak state
  const [streakDays, setStreakDays] = useState(3);

  // Initial demo data injection helper (if user has 0 solved items, seed a few to match visual theme)
  useEffect(() => {
    const savedSolved = localStorage.getItem("prepora_solved_problems");
    if (!savedSolved) {
      // Seed with some default completed problems so progress isn't empty on first run
      const defaultSolved = [
        "ARRAYS-1", "ARRAYS-2", "ARRAYS-3", "ARRAYS-4", "ARRAYS-5",
        "TREES-1", "TREES-2",
        "DYNAMIC PROG.-1"
      ];
      localStorage.setItem("prepora_solved_problems", JSON.stringify(defaultSolved));
      setSolvedProblems(defaultSolved);
    } else {
      try {
        setSolvedProblems(JSON.parse(savedSolved));
      } catch (e) {
        setSolvedProblems([]);
      }
    }

    const savedPlan = localStorage.getItem("prepora_recommended_plan");
    if (savedPlan) {
      try {
        setRecommendedPlan(JSON.parse(savedPlan));
      } catch (e) {
        const defaultPlan = [
          { id: "solve-dsa", text: "Solve 3 Array problems", difficulty: "Medium", type: "medium", checked: false, link: "/practice" },
          { id: "watch-bs", text: "Watch Binary Search explanation", difficulty: "Easy", type: "easy", checked: false, link: "/practice" },
          { id: "complete-mock", text: "Complete 1 mock question", difficulty: "Hard", type: "hard", checked: false, link: "/setup" }
        ];
        setRecommendedPlan(defaultPlan);
      }
    } else {
      const defaultPlan = [
        { id: "solve-dsa", text: "Solve 3 Array problems", difficulty: "Medium", type: "medium", checked: false, link: "/practice" },
        { id: "watch-bs", text: "Watch Binary Search explanation", difficulty: "Easy", type: "easy", checked: false, link: "/practice" },
        { id: "complete-mock", text: "Complete 1 mock question", difficulty: "Hard", type: "hard", checked: false, link: "/setup" }
      ];
      localStorage.setItem("prepora_recommended_plan", JSON.stringify(defaultPlan));
      setRecommendedPlan(defaultPlan);
    }
  }, []);

  // Fetch real data from FastAPI
  useEffect(() => {
    const id = localStorage.getItem("prepora_user_id");
    const name = localStorage.getItem("prepora_user_name");

    if (!id) {
      router.push("/signup");
      return;
    }

    setUserId(id);
    if (name) {
      setUserName(name);
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch sessions
        const sessionRes = await fetch(`http://127.0.0.1:8000/api/interviews?user_id=${id}`);
        if (!sessionRes.ok) throw new Error("Failed to fetch sessions");
        const sessionData: InterviewSession[] = await sessionRes.json();
        setSessions(sessionData);

        // 2. Fetch categories
        const catRes = await fetch("http://127.0.0.1:8000/api/problems/categories");
        if (!catRes.ok) throw new Error("Failed to fetch categories");
        const catData = await catRes.json();
        setCategories(catData.categories || []);
        setTotalProblemsCount(catData.total_count || 450);

        setBackendOffline(false);
      } catch (err) {
        console.error("Backend offline or request failed, using mock fallbacks:", err);
        setBackendOffline(true);
        
        // Setup some demo session history for beautiful visuals if server fails
        setSessions([
          {
            id: "demo-session-1",
            user_id: id,
            role: "Frontend Engineer",
            level: "Mid-level",
            mode: "text",
            scheduled_time: null,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: "completed",
            overall_score: 82
          }
        ]);
        setCategories([
          { name: "ARRAYS", count: 12 },
          { name: "TREES", count: 8 },
          { name: "DYNAMIC PROG.", count: 10 },
          { name: "STRINGS", count: 8 },
          { name: "LINKED LISTS", count: 6 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Recalculate streak whenever sessions update
  useEffect(() => {
    if (sessions.length === 0) {
      setStreakDays(0);
      return;
    }

    // Dynamic streak calculator based on session logs
    try {
      const dates = sessions
        .map(s => new Date(s.created_at).toDateString())
        .filter((value, index, self) => self.indexOf(value) === index); // unique dates

      const uniqueDateMs = dates.map(d => new Date(d).setHours(0,0,0,0));
      uniqueDateMs.sort((a, b) => b - a); // descending order

      const today = new Date().setHours(0,0,0,0);
      const yesterday = today - 24 * 60 * 60 * 1000;

      // If no session today or yesterday, streak is 0
      if (!uniqueDateMs.includes(today) && !uniqueDateMs.includes(yesterday)) {
        setStreakDays(0);
        return;
      }

      let streak = 1;
      let currentDay = uniqueDateMs[0];

      for (let i = 1; i < uniqueDateMs.length; i++) {
        const diff = currentDay - uniqueDateMs[i];
        if (diff === 24 * 60 * 60 * 1000) {
          streak++;
          currentDay = uniqueDateMs[i];
        } else if (diff > 24 * 60 * 60 * 1000) {
          break; // Streak broken
        }
      }
      setStreakDays(streak);
    } catch (e) {
      setStreakDays(0);
    }
  }, [sessions]);

  // Compute solved problem metrics
  const totalSolvedCount = solvedProblems.length;
  
  const getSolvedForCategory = (catName: string) => {
    return solvedProblems.filter(p => p.toLowerCase().startsWith(catName.toLowerCase() + "-")).length;
  };

  const getTotalForCategory = (catName: string) => {
    const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    return cat ? cat.count : 10; // default total count fallback
  };

  const getPercentageForCategory = (catName: string) => {
    const total = getTotalForCategory(catName);
    const solved = getSolvedForCategory(catName);
    if (total === 0) return 0;
    return Math.min(100, Math.round((solved / total) * 100));
  };

  // Extract latest completed session details for Mock Card
  const completedSessions = sessions.filter(s => s.status === "completed" && s.overall_score !== null);
  const latestCompleted = completedSessions[0]; // sorted descending in backend

  // Extract upcoming scheduled session details for Mock Card
  const scheduledSessions = sessions.filter(s => s.scheduled_time && s.status !== "completed");
  const upcomingScheduled = scheduledSessions[0]; // the latest scheduled session

  const formatScheduledTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase() + " AT 10:00 AM";
    } catch {
      return dateStr;
    }
  };

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
        dateStr = `${year}${month}${day}T100000Z`;
        endDateStr = `${year}${month}${day}T104500Z`;
      }
    }
    
    const details = encodeURIComponent(`Your upcoming mock interview session for ${sessionObj.role} (${sessionObj.level}) is scheduled on Prepora.\n\nLink to workspace: http://localhost:3000/interview/${sessionObj.id}`);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${endDateStr}&details=${details}`;
  };

  const getGrade = (score: number) => {
    if (score >= 95) return "A+";
    if (score >= 90) return "A";
    if (score >= 85) return "A-";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "B-";
    if (score >= 65) return "C+";
    if (score >= 60) return "C";
    return "D";
  };

  const hasMocks = completedSessions.length > 0;
  const latestScore = latestCompleted?.overall_score || 0;
  const latestGrade = hasMocks ? getGrade(latestScore) : "—";
  const latestTitle = hasMocks ? "Last Mock Performance" : "No Mock Performance Yet";
  const latestDate = hasMocks 
    ? `Completed on ${new Date(latestCompleted.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "Complete your first interview";
  const buttonText = hasMocks ? "Start a new mock" : "Start your first mock";

  // Toggle recommended plan items
  const togglePlanItem = (id: string) => {
    setRecommendedPlan(prev => {
      const updated = prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item));
      localStorage.setItem("prepora_recommended_plan", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="dash-page">
      {/* Dynamic Offline Warning Header */}
      {backendOffline && (
        <div style={{
          background: "#fffbeb",
          borderBottom: "1px solid #fde68a",
          color: "#b45309",
          padding: "0.6rem 2rem",
          fontSize: "0.82rem",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          justifyContent: "center"
        }}>
          <AlertCircle size={16} />
          <span>Backend offline. Displaying sandbox demonstration data. Please run FastAPI on port 8000 for live updates.</span>
        </div>
      )}

      {/* Header Bar */}
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
          <span className="dash-nav-link active">Home</span>
          <span className="dash-nav-link" onClick={() => router.push("/practice")}>Practice</span>
          <span className="dash-nav-link" onClick={() => router.push("/setup")}>Mock Interview</span>
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

      {/* Main Container */}
      <main className="dash-container">
        {loading ? (
          <div style={{ textAlign: "center", padding: "10rem 0", color: "#888", fontSize: "0.9rem" }}>
            Loading operator logs...
          </div>
        ) : (
          <>
            {/* Greeting Row */}
            <div className="dash-greeting-row">
              <div className="dash-greeting-left">
                <h1 className="dash-greeting">Good morning, {userName} 👋</h1>
                <p className="dash-subtitle">
                  {streakDays > 0 
                    ? `You've practiced ${streakDays} days in a row. Keep it going!`
                    : "Start your first practice session or mock interview to build a streak!"
                  }
                </p>
              </div>
              <div className="dash-streak-badge">
                <Flame size={16} fill="#dea63b" stroke="none" />
                <span>{streakDays} day streak</span>
              </div>
            </div>

            {/* Today's Recommended Plan Card */}
            <div className="dash-card">
              <h2 className="dash-card-title">Today&apos;s recommended plan</h2>
              <div className="dash-plan-list">
                {recommendedPlan.map((item) => (
                  <div key={item.id} className="dash-plan-item">
                    <div className="dash-plan-left">
                      <input 
                        type="checkbox" 
                        className="dash-checkbox" 
                        checked={item.checked} 
                        onChange={() => togglePlanItem(item.id)}
                      />
                      <div className="dash-plan-details">
                        <span className={`dash-plan-text ${item.checked ? "completed" : ""}`}>
                          {item.text}
                        </span>
                        <span className={`dash-badge ${item.type}`}>
                          {item.difficulty}
                        </span>
                      </div>
                    </div>
                    <span onClick={() => router.push(item.link)} className="dash-plan-link">
                      Start link
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle Grid (2 Column Cards) */}
            <div className="dash-grid-2">
              {/* Left Column Card: DSA Progress */}
              <div className="dash-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h2 className="dash-card-title">YOUR DSA PROGRESS</h2>
                  <div className="dash-progress-flex">
                    <div className="dash-circle-wrapper">
                      {/* SVG Circle Gauge */}
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#ece9e2" strokeWidth="6" />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="42" 
                          fill="none" 
                          stroke="#dea63b" 
                          strokeWidth="6" 
                          strokeDasharray="264" 
                          strokeDashoffset={264 - (264 * Math.min(totalSolvedCount, totalProblemsCount)) / totalProblemsCount}
                          strokeLinecap="round" 
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="dash-circle-text">
                        <span className="dash-circle-num">{totalSolvedCount}</span>
                        <span className="dash-circle-denom">/ {totalProblemsCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Categories progress bars */}
                  <div className="dash-categories-list">
                    {/* Arrays */}
                    <div className="dash-cat-item">
                      <div className="dash-cat-label-row">
                        <span className="dash-cat-label">ARRAYS</span>
                        <span className="dash-cat-pct">{getPercentageForCategory("ARRAYS")}%</span>
                      </div>
                      <div className="dash-cat-bar-bg">
                        <div className="dash-cat-bar-fill" style={{ width: `${getPercentageForCategory("ARRAYS")}%` }} />
                      </div>
                    </div>

                    {/* Trees */}
                    <div className="dash-cat-item">
                      <div className="dash-cat-label-row">
                        <span className="dash-cat-label">TREES</span>
                        <span className="dash-cat-pct">{getPercentageForCategory("TREES")}%</span>
                      </div>
                      <div className="dash-cat-bar-bg">
                        <div className="dash-cat-bar-fill" style={{ width: `${getPercentageForCategory("TREES")}%` }} />
                      </div>
                    </div>

                    {/* DP */}
                    <div className="dash-cat-item">
                      <div className="dash-cat-label-row">
                        <span className="dash-cat-label">DP</span>
                        <span className="dash-cat-pct">{getPercentageForCategory("DYNAMIC PROG.")}%</span>
                      </div>
                      <div className="dash-cat-bar-bg">
                        <div className="dash-cat-bar-fill" style={{ width: `${getPercentageForCategory("DYNAMIC PROG.")}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column Card: Mock Interviews */}
              <div className="dash-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "center" }}>
                {upcomingScheduled ? (
                  <div>
                    <h2 className="dash-card-title" style={{ textAlign: "left" }}>MOCK INTERVIEWS</h2>
                    
                    <div style={{ margin: "1.25rem 0", display: "flex", flexDirection: "column", gap: "0.55rem", alignItems: "center" }}>
                      <div style={{
                        padding: "0.2rem 0.6rem",
                        background: "rgba(229, 169, 60, 0.12)",
                        color: "#dea63b",
                        borderRadius: "4px",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        fontFamily: "monospace",
                        letterSpacing: "0.08em"
                      }}>
                        UPCOMING INTERVIEW
                      </div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1c1917", margin: "0.2rem 0 0 0" }}>
                        {upcomingScheduled.role} Track
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "#6b6661", margin: 0, fontWeight: 600 }}>
                        {formatScheduledTime(upcomingScheduled.scheduled_time || "")}
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "1rem" }}>
                      <button 
                        className="dash-btn-gold" 
                        onClick={() => router.push(`/interview/${upcomingScheduled.id}`)}
                        style={{ width: "100%" }}
                      >
                        Start Session
                      </button>
                      <a 
                        href={getGoogleCalendarUrl(upcomingScheduled)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ 
                          width: "100%", 
                          textDecoration: "none", 
                          fontSize: "0.8rem", 
                          padding: "0.6rem 0", 
                          display: "inline-flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          gap: "0.35rem",
                          border: "1px solid #dea63b",
                          color: "#dea63b"
                        }}
                      >
                        Add to Google Calendar 🗓️
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h2 className="dash-card-title" style={{ textAlign: "left" }}>MOCK INTERVIEWS</h2>
                      <div className="dash-grade-circle">
                        {latestGrade}
                      </div>
                      <div className="dash-mock-meta">
                        <h3 className="dash-mock-title">{latestTitle}</h3>
                        <p className="dash-mock-date">{latestDate}</p>
                      </div>
                    </div>
                    <button className="dash-btn-gold" onClick={() => router.push("/setup")}>
                      {buttonText}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Section: Preparing for a Company */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h2 className="dash-company-section-title">PREPARING FOR A COMPANY?</h2>
              
              <div className="dash-companies-grid">
                {/* Google Card */}
                <div className="dash-company-card">
                  <div className="dash-company-logo">
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <span className="dash-company-name">Google</span>
                  <span className="dash-company-diff difficult">DIFFICULT</span>
                  <span onClick={() => router.push("/setup")} className="dash-company-link">
                    Open Track
                  </span>
                </div>

                {/* Amazon Card */}
                <div className="dash-company-card">
                  <div className="dash-company-logo">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="#000000">
                      <path d="M18.8 17.85c-1.3 1-3.2 1.6-5.1 1.6-3 0-5.7-1.4-7.2-3.7-.3-.4 0-.8.4-.6 1.8.8 4 1.3 6.3 1.3 1.7 0 3.5-.3 5.1-1 .5-.2.8.2.5.6zM19.4 15.7c-.2-.3-.5-.2-.8 0-1 1-2.4 1.5-4 1.5-2 0-3.6-1.1-4.4-2.8-.2-.3-.5-.2-.7 0-.3.3-.3.8 0 1.1 1 2 3 3.3 5.3 3.3 2 0 3.8-.7 5.1-2 .3-.3.3-.8 0-1.1zM20.2 11.25c.1.3 0 .7-.3.8L15 15c-.3.2-.7.1-.8-.2l-2.6-4.2c-.2-.3-.1-.7.2-.8.3-.2.7-.1.8.2l2.1 3.4 4.5-2.7c.3-.1.6 0 .7.3z" />
                    </svg>
                  </div>
                  <span className="dash-company-name">Amazon</span>
                  <span className="dash-company-diff moderate">MODERATE</span>
                  <span onClick={() => router.push("/setup")} className="dash-company-link">
                    Open Track
                  </span>
                </div>

                {/* Microsoft Card */}
                <div className="dash-company-card">
                  <div className="dash-company-logo">
                    <svg viewBox="0 0 23 23" width="20" height="20">
                      <rect x="0" y="0" width="10.5" height="10.5" fill="#F25022" />
                      <rect x="12" y="0" width="10.5" height="10.5" fill="#7FBA00" />
                      <rect x="0" y="12" width="10.5" height="10.5" fill="#00A4EF" />
                      <rect x="12" y="12" width="10.5" height="10.5" fill="#FFB900" />
                    </svg>
                  </div>
                  <span className="dash-company-name">Microsoft</span>
                  <span className="dash-company-diff moderate">MODERATE</span>
                  <span onClick={() => router.push("/setup")} className="dash-company-link">
                    Open Track
                  </span>
                </div>

                {/* Flipkart Card */}
                <div className="dash-company-card">
                  <div className="dash-company-logo">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="#172337">
                      <path d="M19.5 2h-15C3.12 2 2 3.12 2 4.5v15C2 20.88 3.12 22 4.5 22h15c1.38 0 2.5-1.12 2.5-2.5v-15C22 3.12 20.88 2 19.5 2zm-8.82 14.93c-.93.93-2.43.93-3.36 0l-3.36-3.36c-.93-.93-.93-2.43 0-3.36.93-.93 2.43-.93 3.36 0l1.68 1.68 4.2-4.2c.93-.93 2.43-.93 3.36 0 .93.93.93 2.43 0 3.36l-5.88 5.88z" />
                    </svg>
                  </div>
                  <span className="dash-company-name">Flipkart</span>
                  <span className="dash-company-diff moderate">MODERATE</span>
                  <span onClick={() => router.push("/setup")} className="dash-company-link">
                    Open Track
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="dash-footer">
        <span>&copy; 2026 Prepora. All rights reserved.</span>
        <div className="dash-footer-links">
          <a href="#" className="dash-footer-link">Privacy Policy</a>
          <a href="#" className="dash-footer-link">Terms of Service</a>
          <a href="#" className="dash-footer-link">Help Center</a>
          <a href="#" className="dash-footer-link">Contact</a>
        </div>
      </footer>
    </div>
  );
}
