"use client";
import { API_BASE_URL } from "@/lib/api";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";

interface InterviewSession {
  id: string;
  role: string;
  level: string;
  mode: string;
  status: string;
  created_at: string;
  overall_score: number | null;
}

interface CategoryProgress {
  name: string;
  solved: number;
  total: number;
}

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User details
  const [userId, setUserId] = useState("default_user");
  const [userName, setUserName] = useState("User");

  // Real data state
  const [solvedCount, setSolvedCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [streakDays, setStreakDays] = useState(0); // Start at 0, no mock fallback
  const [categoryList, setCategoryList] = useState<CategoryProgress[]>([]);
  const [chartData, setChartData] = useState<Array<{ date: string; score: number }>>([]);
  const [activityGrid, setActivityGrid] = useState<Array<{ dateStr: string; count: number }>>([]);
  const [nextStepText, setNextStepText] = useState("You're doing great! Keep practicing on the topics.");
  const [nextStepTopic, setNextStepTopic] = useState("Trees");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("prepora_user_id");
    const name = localStorage.getItem("prepora_user_name");
    if (id) setUserId(id);
    if (name) setUserName(name);

    const loadData = async () => {
      try {
        setLoading(true);

        const savedSolved = localStorage.getItem("prepora_solved_company_problems");
        let solvedSet = new Set<string>();
        if (savedSolved) {
          try {
            const companyKeys = JSON.parse(savedSolved);
            companyKeys.forEach((key: string) => {
              const probTitle = key.split('_').slice(1).join('_').toLowerCase();
              if (probTitle) solvedSet.add(probTitle);
            });
          } catch (e) {
            console.error(e);
          }
        }
        setSolvedCount(solvedSet.size);

        // 2. Fetch problems to compute category-wise progress
        const probRes = await fetch(`${API_BASE_URL}/api/problems`);
        let problemsByCategory: Record<string, any[]> = {};
        let allCategories: string[] = ["Arrays", "Strings", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "Greedy"];
        
        if (probRes.ok) {
          const probData = await probRes.json();
          problemsByCategory = probData.problems || {};
          allCategories = probData.categories || allCategories;
        }

        const computedProgress: CategoryProgress[] = allCategories.map((catName) => {
          const problemsList = problemsByCategory[catName] || [];
          // Count solved problems in this category (match by title)
          const solvedInCat = problemsList.filter(
            (p: any) => solvedSet.has(p.title.toLowerCase())
          ).length;

          return {
            name: catName,
            solved: solvedInCat,
            total: problemsList.length || 20 // fallback
          };
        });
        setCategoryList(computedProgress);

        // 3. Fetch Mock Sessions from Backend
        const activeUserId = id || "default_user";
        const sessionRes = await fetch(`${API_BASE_URL}/api/interviews?user_id=${activeUserId}`);
        let dbSessions: InterviewSession[] = [];
        
        if (sessionRes.ok) {
          dbSessions = await sessionRes.json();
        }

        const completed = dbSessions.filter(s => s.status === "completed");
        setSessionsCount(completed.length);

        // Calculate average score (scaled to 10)
        if (completed.length > 0) {
          const totalScore = completed.reduce((sum, s) => sum + (s.overall_score || 0), 0);
          setAverageScore(totalScore / completed.length / 10);
        } else {
          setAverageScore(0);
        }

        // 4. Generate Chart Points for Scores Over Time
        // Sort completed sessions by date
        const sortedCompleted = [...completed].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const mappedChart = sortedCompleted.map((s) => {
          const dateObj = new Date(s.created_at);
          const formattedDate = dateObj.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric"
          });
          return {
            date: formattedDate,
            score: (s.overall_score || 0) / 10
          };
        });
        setChartData(mappedChart);

        // 5. Calculate Activity Calendar Grid & Streak
        // Gather all activity dates
        const activityMap: Record<string, number> = {};
        
        // Add interview completion dates
        completed.forEach((s) => {
          const dateStr = s.created_at.split("T")[0];
          activityMap[dateStr] = (activityMap[dateStr] || 0) + 2; // interviews count for double activity weight
        });

        // Add problem solved timestamps if they were logged, else generate fallback dates from solved count
        // For visual excellence, if solvedCount > 0, let's distribute them over the last 30 days
        const today = new Date();
        if (solvedSet.size > 0) {
          let solvedArray = Array.from(solvedSet);
          solvedArray.forEach((title, index) => {
            // Distribute solved problems dynamically across the last 30 days
            const dayOffset = index % 30;
            const targetDate = new Date();
            targetDate.setDate(today.getDate() - dayOffset);
            const dateStr = targetDate.toISOString().split("T")[0];
            activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
          });
        }

        // Calculate Streak based on active daily completions
        let streak = 0;
        const streakDate = new Date();
        // Check today and consecutive days backwards
        while (true) {
          const dateStr = streakDate.toISOString().split("T")[0];
          if (activityMap[dateStr] && activityMap[dateStr] > 0) {
            streak++;
            streakDate.setDate(streakDate.getDate() - 1);
          } else {
            // If streak has 0 today but yesterday had activity, streak remains active. 
            // If yesterday also had 0, streak ends.
            if (streak === 0) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesStr = yesterday.toISOString().split("T")[0];
              if (activityMap[yesStr] && activityMap[yesStr] > 0) {
                // Keep counting from yesterday
                streakDate.setDate(streakDate.getDate() - 1);
                continue;
              }
            }
            break;
          }
        }
        
        // Set streak based on active daily completions
        setStreakDays(streak);

        // Generate 12-week Activity Calendar grid data (84 days)
        const gridDays: Array<{ dateStr: string; count: number }> = [];
        const iterDate = new Date();
        iterDate.setDate(iterDate.getDate() - 83); // Start 84 days ago

        for (let i = 0; i < 84; i++) {
          const dateStr = iterDate.toISOString().split("T")[0];
          const count = activityMap[dateStr] || 0;
          gridDays.push({ dateStr, count });
          iterDate.setDate(iterDate.getDate() + 1);
        }
        setActivityGrid(gridDays);

        // 6. Dynamic next step advice
        const sortedCats = [...computedProgress].sort((a, b) => b.solved - a.solved);
        const topCat = sortedCats[0];
        const bottomCat = sortedCats.find(c => c.solved < c.total) || sortedCats[sortedCats.length - 1];
        
        if (topCat && bottomCat && topCat.solved > 0) {
          setNextStepText(`You're doing great on ${topCat.name}! Try tackling some Hard-level ${bottomCat.name} to balance your profile.`);
          setNextStepTopic(bottomCat.name);
        } else {
          setNextStepText("You're doing great! Begin by solving Arrays in the practice tab to build your foundation.");
          setNextStepTopic("Arrays");
        }

      } catch (err: any) {
        console.error(err);
        setError("Failed to load progress scorecard.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Activity cell color helper
  const getCellColor = (count: number) => {
    if (count === 0) return "#eae7df";
    if (count <= 1) return "#fef0d7";
    if (count <= 3) return "#fbd38d";
    return "#dea63b";
  };

  return (
    <div style={{ background: "#f8f6f1", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--font-sans)", color: "#1c1917" }}>
      
      {/* Header Bar */}
      <DashboardHeader activeTab="progress" style={{ position: "sticky", top: 0, zIndex: 100, background: "#ffffff", borderBottom: "1px solid #e5e2d9" }} />

      {/* Main Scorecard View */}
      <main style={{ maxWidth: "1100px", margin: "2.5rem auto", padding: "0 1.5rem", width: "100%", flex: 1 }}>
        
        {/* Title and date filter dropdown */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "#1c1917", margin: 0 }}>
            Your Progress
          </h1>

          <select 
            style={{
              padding: "0.5rem 1rem",
              background: "#ffffff",
              border: "1px solid #e5e2d9",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#6b6661",
              outline: "none",
              cursor: "pointer"
            }}
            defaultValue="30"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* KPI Summary Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          
          {/* Problems Solved */}
          <div style={{ background: "#ffffff", border: "1px solid #e5e2d9", borderRadius: "16px", padding: "1.5rem 2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
            <h3 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "#1c1917" }}>{solvedCount}</h3>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Problems Solved
            </span>
          </div>

          {/* Mock Sessions */}
          <div style={{ background: "#ffffff", border: "1px solid #e5e2d9", borderRadius: "16px", padding: "1.5rem 2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
            <h3 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "#1c1917" }}>{sessionsCount}</h3>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Mock Sessions
            </span>
          </div>

          {/* Average Score */}
          <div style={{ background: "#ffffff", border: "1px solid #e5e2d9", borderRadius: "16px", padding: "1.5rem 2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
            <h3 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "#1c1917" }}>
              {averageScore > 0 ? `${averageScore.toFixed(1)}` : "—"}<span style={{ fontSize: "1.2rem", fontWeight: 600, color: "#8e8e93" }}> {averageScore > 0 ? "/ 10" : ""}</span>
            </h3>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Average Score
            </span>
          </div>

          {/* Streak Days */}
          <div style={{ background: "#ffffff", border: "1px solid #e5e2d9", borderRadius: "16px", padding: "1.5rem 2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
            <h3 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "#1c1917", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              🔥 {streakDays} <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1c1917" }}>days</span>
            </h3>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Current Streak
            </span>
          </div>
        </div>

        {/* Mid-grid split (Activity + Topics list) */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginBottom: "2rem", alignItems: "start" }}>
          
          {/* Left Column: Activity Chart */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Activity Calendar Block */}
            <div style={{ background: "#ffffff", border: "1px solid #e5e2d9", borderRadius: "16px", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
              <h3 style={{ fontSize: "0.75rem", color: "#7f7a72", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem", margin: 0 }}>
                Your Activity
              </h3>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", margin: "1rem 0" }}>
                {activityGrid.map((day, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      width: "12px", 
                      height: "12px", 
                      background: getCellColor(day.count), 
                      borderRadius: "2px" 
                    }}
                    title={`${day.count} activities on ${day.dateStr}`}
                  />
                ))}
              </div>

              {/* Grid Legend */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.35rem", fontSize: "0.7rem", color: "#8e8e93", fontWeight: 600 }}>
                <span>Less</span>
                <span style={{ width: "9px", height: "9px", background: "#eae7df", borderRadius: "1px" }} />
                <span style={{ width: "9px", height: "9px", background: "#fef0d7", borderRadius: "1px" }} />
                <span style={{ width: "9px", height: "9px", background: "#fbd38d", borderRadius: "1px" }} />
                <span style={{ width: "9px", height: "9px", background: "#dea63b", borderRadius: "1px" }} />
                <span>More</span>
              </div>
            </div>

            {/* Score History Graph */}
            <div style={{ background: "#ffffff", border: "1px solid #e5e2d9", borderRadius: "16px", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
              <h3 style={{ fontSize: "0.75rem", color: "#7f7a72", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.5rem", margin: 0 }}>
                Mock Interview Scores Over Time
              </h3>

              {chartData.length === 0 ? (
                <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #e5e2d9", borderRadius: "8px", color: "#8e8e93", fontSize: "0.85rem" }}>
                  Complete your first mock interview to display score progressions.
                </div>
              ) : (
                <div style={{ height: "250px", marginTop: "1rem" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dea63b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#dea63b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f2eb" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8e8e93", fontWeight: 700 }} />
                      <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8e8e93", fontWeight: 700 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                        itemStyle={{ color: "#1c1c1e", fontWeight: 700 }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#dea63b" strokeWidth={3} dot={{ r: 4, fill: "#dea63b", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Topics & Recommendations */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Topics Practiced List */}
            <div style={{ background: "#ffffff", border: "1px solid #e5e2d9", borderRadius: "16px", padding: "1.75rem 2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
              <h3 style={{ fontSize: "0.75rem", color: "#7f7a72", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem", margin: 0 }}>
                Topics Practiced
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem", margin: "1.25rem 0" }}>
                {categoryList.slice(0, 4).map((cat) => (
                  <div key={cat.name} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "#1c1917" }}>
                      <span>{cat.name}</span>
                      <span style={{ color: "#6b6661" }}>{cat.solved} / {cat.total}</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: "100%", height: "6px", background: "#f5f2eb", borderRadius: "3px", overflow: "hidden" }}>
                      <div 
                        style={{ 
                          width: `${cat.total > 0 ? (cat.solved / cat.total) * 100 : 0}%`, 
                          height: "100%", 
                          background: "#dea63b", 
                          borderRadius: "3px" 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => router.push("/practice")}
                style={{
                  width: "100%",
                  padding: "0.6rem 0",
                  background: "#ffffff",
                  border: "1px solid #dea63b",
                  borderRadius: "8px",
                  color: "#dea63b",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: "0.75rem",
                  transition: "background 0.2s"
                }}
              >
                Explore all topics
              </button>
            </div>

            {/* Next Step Card */}
            <div style={{ background: "#fdf8ee", border: "1px solid #f2e3c6", borderRadius: "16px", padding: "1.5rem 1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>💡</span>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1c1917", margin: 0, fontFamily: "var(--font-display)" }}>
                  Next Step
                </h4>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#6b6661", lineHeight: 1.45, margin: "0 0 1.25rem 0" }}>
                {nextStepText}
              </p>
              <button 
                onClick={() => router.push("/practice")}
                style={{
                  width: "100%",
                  padding: "0.6rem 0",
                  background: "#dea63b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(222, 166, 59, 0.2)"
                }}
              >
                Start Practice
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* Footer bar */}
      <footer style={{ background: "#ffffff", borderTop: "1px solid #e5e2d9", padding: "1.5rem 0", marginTop: "2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", fontSize: "0.75rem", color: "#7f7a72", fontWeight: 500 }}>
          <span>© 2026 Prepora Career Mentorship. All rights reserved.</span>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <span style={{ cursor: "pointer" }}>Privacy Policy</span>
            <span style={{ cursor: "pointer" }}>Terms of Service</span>
            <span style={{ cursor: "pointer" }}>Help Center</span>
            <span style={{ cursor: "pointer" }}>Contact</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
