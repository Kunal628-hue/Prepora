"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Settings,
  Search,
  Check,
  ExternalLink,
  Sparkles,
  X,
  AlertCircle
} from "lucide-react";

interface Problem {
  num: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  companies: string[];
  topics: string[];
  hints: { title: string; content: string }[];
  terminal_notes: string;
}

interface CategoryInfo {
  name: string;
  count: number;
}

const API_BASE = "http://127.0.0.1:8000";

export default function PracticePage() {
  const router = useRouter();

  // Auth & Profile state
  const [userName, setUserName] = useState("Arjun");
  const [userId, setUserId] = useState<string | null>(null);

  // API state
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [problemsByCategory, setProblemsByCategory] = useState<Record<string, Problem[]>>({});
  const [totalProblemsCount, setTotalProblemsCount] = useState(450);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);

  // UI state
  const [activeCategory, setActiveCategory] = useState("Arrays");
  const [diffFilter, setDiffFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [solvedProblems, setSolvedProblems] = useState<Set<string>>(new Set());
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  
  // AI Helper Drawer state (FAB click)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeHintIndex, setActiveHintIndex] = useState(0);

  // Load user & solved problems from localStorage on mount
  useEffect(() => {
    const id = localStorage.getItem("prepora_user_id");
    const name = localStorage.getItem("prepora_user_name");
    
    if (id) {
      setUserId(id);
    }
    if (name) {
      setUserName(name);
    }

    const savedSolved = localStorage.getItem("prepora_solved_problems");
    if (savedSolved) {
      try {
        setSolvedProblems(new Set(JSON.parse(savedSolved)));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch problems dataset from FastAPI backend
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/problems`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();

        // Convert backend categories to list
        const catInfo: CategoryInfo[] = (data.categories || []).map((name: string) => ({
          name,
          count: (data.problems[name] || []).length
        }));

        setCategories(catInfo);
        setProblemsByCategory(data.problems || {});
        setTotalProblemsCount(data.total_count || 450);

        // Select "Arrays" as default active category
        const defaultCat = catInfo.find(c => c.name.toLowerCase() === "arrays")?.name || catInfo[0]?.name || "Arrays";
        setActiveCategory(defaultCat);
        
        const firstProbs = data.problems[defaultCat] || [];
        if (firstProbs.length > 0) {
          setSelectedProblem(firstProbs[0]);
        }

        setBackendOffline(false);
      } catch (err) {
        console.error("Failed to fetch problems from backend:", err);
        setBackendOffline(true);
        
        // Define robust mockup fallback state matching the requested dashboard categories & counts
        const mockCategories = [
          { name: "Arrays", count: 48 },
          { name: "Strings", count: 32 },
          { name: "Linked Lists", count: 28 },
          { name: "Trees", count: 36 },
          { name: "Graphs", count: 24 },
          { name: "Dynamic Programming", count: 40 },
          { name: "Greedy", count: 18 }
        ];

        // Seed mock problems list
        const mockProblems: Record<string, Problem[]> = {};
        mockCategories.forEach(cat => {
          const probs: Problem[] = [];
          for (let i = 1; i <= cat.count; i++) {
            const numStr = String(i).padStart(3, '0');
            
            // Hardcode some famous ones for Arrays
            let title = `${cat.name} Problem #${i}`;
            let diff: "EASY" | "MEDIUM" | "HARD" = i % 3 === 0 ? "EASY" : i % 3 === 1 ? "MEDIUM" : "HARD";
            let companies = ["Google", "Amazon"];
            let topics = [cat.name];

            if (cat.name === "Arrays") {
              if (i === 1) { title = "Two Sum"; diff = "EASY"; companies = ["Google", "Amazon"]; }
              else if (i === 2) { title = "3Sum"; diff = "MEDIUM"; companies = ["Meta"]; }
              else if (i === 3) { title = "Container With Most Water"; diff = "MEDIUM"; companies = ["Google", "Adobe"]; }
              else if (i === 4) { title = "Trapping Rain Water"; diff = "HARD"; companies = ["Microsoft"]; }
              else if (i === 5) { title = "Best Time to Buy and Sell Stock"; diff = "EASY"; companies = ["Amazon"]; }
            }

            probs.push({
              num: numStr,
              title,
              difficulty: diff,
              companies,
              topics,
              hints: [
                { title: "HINT 01", content: `This is hint 1 for ${title}. Consider edge cases.` },
                { title: "HINT 02", content: `This is hint 2 for ${title}. Try to minimize space complexity.` }
              ],
              terminal_notes: `// Sandbox Solution for ${title}:\n// Time: O(N), Space: O(1)`
            });
          }
          mockProblems[cat.name] = probs;
        });

        setCategories(mockCategories);
        setProblemsByCategory(mockProblems);
        setTotalProblemsCount(226); // total problems in mockup = 226

        // Set default problem
        setSelectedProblem(mockProblems["Arrays"][0]);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  // Sync solved problems to localStorage whenever toggled
  const toggleSolved = (category: string, num: string) => {
    const problemKey = `${category.toUpperCase()}-${num}`;
    setSolvedProblems(prev => {
      const next = new Set(prev);
      if (next.has(problemKey)) {
        next.delete(problemKey);
      } else {
        next.add(problemKey);
      }
      localStorage.setItem("prepora_solved_problems", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const getSolvedCount = () => {
    return solvedProblems.size;
  };

  const getPercentageComplete = () => {
    if (totalProblemsCount === 0) return 0;
    return Math.min(100, Math.round((getSolvedCount() / totalProblemsCount) * 100));
  };

  const selectCategory = useCallback((catName: string) => {
    setActiveCategory(catName);
    const probs = problemsByCategory[catName] || [];
    if (probs.length > 0) {
      setSelectedProblem(probs[0]);
    }
    setDiffFilter("ALL");
    setSearchQuery("");
  }, [problemsByCategory]);

  const selectProblem = (prob: Problem) => {
    setSelectedProblem(prob);
    setActiveHintIndex(0);
  };

  const currentProblems = problemsByCategory[activeCategory] || [];
  
  // Filter by difficulty and search queries
  const filteredProblems = currentProblems.filter(p => {
    if (diffFilter !== "ALL" && p.difficulty !== diffFilter) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="prac-page">
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
          <span>Backend offline. Displaying sandbox demonstration questions. Please run FastAPI on port 8000 for live updates.</span>
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
          <span className="dash-nav-link" onClick={() => router.push("/dashboard")}>Home</span>
          <span className="dash-nav-link active">Practice</span>
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

      {/* Container */}
      <div className="prac-container">
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888", fontSize: "0.95rem" }}>
            Loading DSA Workspace...
          </div>
        ) : (
          <>
            {/* Left Sidebar */}
            <aside className="prac-sidebar">
              <div>
                <div className="prac-sidebar-title-section">
                  <span className="prac-sidebar-label">TOPICS</span>
                  <h3 className="prac-sidebar-subtitle">Master the basics</h3>
                </div>

                <div className="prac-topic-list">
                  {categories.map((cat) => {
                    const isActive = cat.name.toLowerCase() === activeCategory.toLowerCase();
                    return (
                      <button
                        key={cat.name}
                        className={`prac-topic-card ${isActive ? "active" : ""}`}
                        onClick={() => selectCategory(cat.name)}
                      >
                        <div className="prac-topic-left">
                          <span className="prac-topic-label">{cat.name}</span>
                        </div>
                        <span className="prac-topic-count">({cat.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progress Summary at Bottom of Sidebar */}
              <div className="prac-sidebar-bottom">
                <div className="prac-progress-text-row">
                  <span>{getSolvedCount()} done</span>
                  <span>{getPercentageComplete()}% complete</span>
                </div>
                <div className="prac-progress-bar-bg">
                  <div 
                    className="prac-progress-bar-fill" 
                    style={{ width: `${getPercentageComplete()}%` }} 
                  />
                </div>
                <button className="prac-btn-unlock" onClick={() => alert("Unlock Advanced Track coming soon!")}>
                  Unlock Advanced
                </button>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="prac-main-content">
              {/* Content Header */}
              <div className="prac-content-header">
                <h1 className="prac-title">{activeCategory} — {currentProblems.length} Problems</h1>
                <div className="prac-search-wrap">
                  <span className="prac-search-icon">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    className="prac-search-input"
                    placeholder="Search problems..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="prac-filters-row">
                {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
                  <button
                    key={diff}
                    className={`prac-filter-btn ${diffFilter === diff ? "active" : ""}`}
                    onClick={() => setDiffFilter(diff)}
                  >
                    {diff === "ALL" ? "All" : diff.charAt(0) + diff.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Table Card */}
              <div className="prac-card">
                {/* Headers */}
                <div className="prac-table-header">
                  <span>#</span>
                  <span>STATUS</span>
                  <span>PROBLEM</span>
                  <span>DIFFICULTY</span>
                  <span>COMPANIES</span>
                  <span style={{ display: "flex", justifyContent: "center" }}>LINKS</span>
                </div>

                {/* Rows */}
                {filteredProblems.length === 0 ? (
                  <div style={{ padding: "3rem", textAlign: "center", color: "#888", fontSize: "0.85rem" }}>
                    No matching problems found in this category.
                  </div>
                ) : (
                  filteredProblems.map((prob) => {
                    const problemKey = `${activeCategory.toUpperCase()}-${prob.num}`;
                    const isCompleted = solvedProblems.has(problemKey);
                    
                    return (
                      <div 
                        key={prob.num} 
                        className="prac-table-row"
                        onClick={() => selectProblem(prob)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Num */}
                        <span className="prac-col-num">{prob.num}</span>

                        {/* Status Checkbox */}
                        <div className="prac-col-status" onClick={(e) => e.stopPropagation()}>
                          <div 
                            className={`prac-checkbox-custom ${isCompleted ? "checked" : ""}`}
                            onClick={() => toggleSolved(activeCategory, prob.num)}
                          >
                            {isCompleted && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>

                        {/* Problem Title */}
                        <span className={`prac-col-title ${isCompleted ? "completed" : ""}`}>
                          {prob.title}
                        </span>

                        {/* Difficulty Badge */}
                        <div>
                          <span className={`prac-badge ${prob.difficulty.toLowerCase()}`}>
                            {prob.difficulty.charAt(0) + prob.difficulty.slice(1).toLowerCase()}
                          </span>
                        </div>

                        {/* Companies */}
                        <div className="prac-col-companies">
                          {prob.companies.slice(0, 2).map((comp) => (
                            <span key={comp} className="prac-company-tag">
                              {comp}
                            </span>
                          ))}
                        </div>

                        {/* External Link */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <span 
                            className="prac-col-link" 
                            title="Mock Practice"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/setup`);
                            }}
                          >
                            <ExternalLink size={16} />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </main>
          </>
        )}
      </div>

      {/* Floating Action Button (FAB) for AI Companion */}
      {selectedProblem && (
        <button 
          className="prac-fab" 
          aria-label="AI Companion"
          onClick={() => setIsDrawerOpen(true)}
        >
          <Sparkles size={22} fill="#ffffff" stroke="none" />
        </button>
      )}

      {/* Slide-out AI Helper Drawer (FAB Clicked modal) */}
      {isDrawerOpen && selectedProblem && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(4px)",
          zIndex: 200,
          display: "flex",
          justifyContent: "flex-end"
        }}>
          {/* Backdrop Click */}
          <div style={{ flex: 1 }} onClick={() => setIsDrawerOpen(false)} />
          
          {/* Drawer Body */}
          <div style={{
            width: "420px",
            background: "#ffffff",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.06)",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "2rem",
            position: "relative"
          }}>
            <button 
              style={{
                position: "absolute",
                top: "1.5rem",
                right: "1.5rem",
                background: "none",
                border: "none",
                color: "#888",
                cursor: "pointer"
              }}
              onClick={() => setIsDrawerOpen(false)}
            >
              <X size={20} />
            </button>

            <div>
              <span style={{ fontSize: "0.72rem", color: "#dea63b", fontWeight: 700, letterSpacing: "0.08em", display: "block", marginBottom: "0.5rem" }}>
                AI COMPANION // {activeCategory.toUpperCase()}
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", color: "#1a1a1a", fontWeight: 700, marginBottom: "1.5rem" }}>
                {selectedProblem.title}
              </h2>

              {/* Hints list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                {selectedProblem.hints.map((hint, index) => {
                  const isActive = index === activeHintIndex;
                  return (
                    <div 
                      key={index}
                      style={{
                        border: "1px solid",
                        borderColor: isActive ? "#f9e2b3" : "#e8e5de",
                        borderRadius: "8px",
                        padding: "1rem",
                        background: isActive ? "#fdf6e8" : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onClick={() => setActiveHintIndex(index)}
                    >
                      <h3 style={{ fontSize: "0.74rem", fontWeight: 700, color: isActive ? "#dea63b" : "#666", marginBottom: "0.35rem" }}>
                        {hint.title}
                      </h3>
                      {isActive && (
                        <p style={{ fontSize: "0.82rem", color: "#444", lineHeight: 1.45 }}>
                          {hint.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Terminal Notes / AI Strategy */}
              <div style={{ marginTop: "2rem" }}>
                <span style={{ fontSize: "0.72rem", color: "#888", fontWeight: 700, display: "block", marginBottom: "0.55rem" }}>
                  STRATEGY LOGS
                </span>
                <pre style={{
                  background: "#faf9f6",
                  border: "1px solid #e8e5de",
                  borderRadius: "6px",
                  padding: "1rem",
                  fontFamily: "monospace",
                  fontSize: "0.74rem",
                  color: "#166534",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5
                }}>
                  {selectedProblem.terminal_notes}
                </pre>
              </div>
            </div>

            <button 
              className="prac-btn-unlock" 
              onClick={() => {
                setIsDrawerOpen(false);
                router.push(`/setup`);
              }}
            >
              Start Interview Sandbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
