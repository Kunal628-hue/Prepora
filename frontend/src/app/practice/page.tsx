"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Code,
  MessageSquare,
  ArrowRight,
  ShoppingCart,
  Globe,
  LayoutGrid,
  Laptop,
  PlayCircle,
  Check,
  ExternalLink,
  RotateCcw
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { API_BASE_URL } from "@/lib/api";
import { DSA_TOPICS, DSAProblem, DSATopic } from "@/lib/dsaProblems";

const API_BASE = API_BASE_URL;

interface Company {
  id: string;
  name: string;
  description: string;
  difficulty: "HARD" | "MEDIUM" | "EASY";
  tags: string[];
  problems_count: number;
  mock_questions_count: number;
}

export default function PracticePage() {
  const router = useRouter();

  // Profile / Auth state
  const [userName, setUserName] = useState("Arjun");
  const [userId, setUserId] = useState<string | null>(null);

  // API state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-tab selection: "companies" | "dsa"
  const [activeSubTab, setActiveSubTab] = useState<"companies" | "dsa">("companies");

  // Company track search query
  const [searchQuery, setSearchQuery] = useState("");

  // DSA Practice Sheet state
  const [selectedDsaTopic, setSelectedDsaTopic] = useState("arrays");
  const [completedDsaQuestions, setCompletedDsaQuestions] = useState<Set<string>>(new Set());
  const [dsaSearchQuery, setDsaSearchQuery] = useState("");
  const [dsaDifficultyFilter, setDsaDifficultyFilter] = useState<"ALL" | "EASY" | "MEDIUM" | "HARD">("ALL");

  // Load user details & completed DSA progress
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("prepora_user_id");
      const storedName = localStorage.getItem("prepora_user_name");
      if (storedId) setUserId(storedId);
      if (storedName) setUserName(storedName);

      const savedCompleted = localStorage.getItem("prepora_completed_dsa_questions");
      if (savedCompleted) {
        try {
          setCompletedDsaQuestions(new Set(JSON.parse(savedCompleted)));
        } catch (e) {
          console.error("Failed to parse completed DSA questions", e);
        }
      }
    }
  }, []);

  // Fetch company tracks from FastAPI backend
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/companies`);
        if (!res.ok) {
          throw new Error("Failed to load company tracks.");
        }
        const data = await res.json();
        setCompanies(data);
      } catch (err: any) {
        console.error(err);
        setError("Failed to connect to the backend server. Make sure the FastAPI server is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // Filter companies based on search query
  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic AI Track generation state
  const [generatingCompany, setGeneratingCompany] = useState(false);
  const [generatingError, setGeneratingError] = useState<string | null>(null);

  const handleGenerateCompany = async (name: string) => {
    if (!name.trim()) return;
    setGeneratingCompany(true);
    setGeneratingError(null);
    try {
      const res = await fetch(`${API_BASE}/api/companies/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: name.trim() })
      });
      if (!res.ok) {
        throw new Error("Failed to generate company track. Please try again.");
      }
      const newCompany: Company = await res.json();
      
      // Update local state by appending to companies
      setCompanies((prev) => {
        if (prev.some((c) => c.id === newCompany.id)) return prev;
        return [...prev, newCompany];
      });
      
      // Clear search query
      setSearchQuery("");
      
      // Redirect to the new track detail page
      router.push(`/practice/${newCompany.name.toLowerCase()}`);
    } catch (err: any) {
      console.error(err);
      setGeneratingError(err.message || "Something went wrong.");
    } finally {
      setGeneratingCompany(false);
    }
  };

  // Toggle problem solved status for DSA questions
  const toggleQuestionCompleted = (questionId: string) => {
    setCompletedDsaQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      localStorage.setItem("prepora_completed_dsa_questions", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Toggle all questions in a topic
  const toggleTopicAllCompleted = (topicId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Avoid selecting the topic on checkbox click
    const topic = DSA_TOPICS.find((t) => t.id === topicId);
    if (!topic) return;

    const topicProblemIds = topic.problems.map((p) => p.id);
    const allCompleted = topicProblemIds.every((id) => completedDsaQuestions.has(id));

    setCompletedDsaQuestions((prev) => {
      const next = new Set(prev);
      if (allCompleted) {
        topicProblemIds.forEach((id) => next.delete(id));
      } else {
        topicProblemIds.forEach((id) => next.add(id));
      }
      localStorage.setItem("prepora_completed_dsa_questions", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Calculate topic-specific progress
  const getTopicCompletionInfo = (topicId: string) => {
    const topic = DSA_TOPICS.find((t) => t.id === topicId);
    if (!topic) return { count: 0, total: 0, percent: 0 };
    const total = topic.problems.length;
    const count = topic.problems.filter((p) => completedDsaQuestions.has(p.id)).length;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return { count, total, percent };
  };

  // Calculate overall progress
  const getOverallCompletionInfo = () => {
    let total = 0;
    let count = 0;
    DSA_TOPICS.forEach((topic) => {
      total += topic.problems.length;
      count += topic.problems.filter((p) => completedDsaQuestions.has(p.id)).length;
    });
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return { count, total, percent };
  };

  // Reset progress handler
  const resetAllProgress = () => {
    if (window.confirm("Are you sure you want to reset all your DSA practice progress?")) {
      setCompletedDsaQuestions(new Set());
      localStorage.removeItem("prepora_completed_dsa_questions");
    }
  };

  // Helper to render brand logo icons dynamically
  const renderLogoIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName === "google") {
      return <div className="company-logo-badge logo-google">G</div>;
    }
    if (lowerName === "amazon") {
      return (
        <div className="company-logo-badge logo-amazon">
          <ShoppingCart size={18} />
        </div>
      );
    }
    if (lowerName === "meta") {
      return (
        <div className="company-logo-badge logo-meta">
          <Globe size={18} />
        </div>
      );
    }
    if (lowerName === "microsoft") {
      return (
        <div className="company-logo-badge logo-microsoft">
          <LayoutGrid size={18} />
        </div>
      );
    }
    if (lowerName === "apple") {
      return (
        <div className="company-logo-badge logo-apple">
          <Laptop size={18} />
        </div>
      );
    }
    if (lowerName === "netflix") {
      return (
        <div className="company-logo-badge logo-netflix">
          <PlayCircle size={18} />
        </div>
      );
    }
    return <div className="company-logo-badge logo-apple">{name.charAt(0)}</div>;
  };

  // Get active DSA Topic and its filtered problems
  const activeDsaTopic = DSA_TOPICS.find((t) => t.id === selectedDsaTopic) || DSA_TOPICS[0];
  const filteredDsaProblems = activeDsaTopic.problems.filter((prob) => {
    const matchesSearch = prob.name.toLowerCase().includes(dsaSearchQuery.toLowerCase());
    const matchesDifficulty = dsaDifficultyFilter === "ALL" || prob.difficulty === dsaDifficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="prac-page">
      {/* Header Bar */}
      <DashboardHeader activeTab="practice" />

      {/* Modern Sub-navigation Switcher Header */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e8e5de",
        padding: "1rem 2.25rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10
      }}>
        <div style={{ display: "flex", gap: "1.75rem" }}>
          <button
            type="button"
            onClick={() => setActiveSubTab("companies")}
            style={{
              background: "none",
              border: "none",
              color: activeSubTab === "companies" ? "#dea63b" : "#666",
              fontWeight: 700,
              fontSize: "0.95rem",
              paddingBottom: "0.25rem",
              borderBottom: activeSubTab === "companies" ? "3px solid #dea63b" : "3px solid transparent",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              transition: "all 0.25s ease"
            }}
          >
            Company Tracks
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("dsa")}
            style={{
              background: "none",
              border: "none",
              color: activeSubTab === "dsa" ? "#dea63b" : "#666",
              fontWeight: 700,
              fontSize: "0.95rem",
              paddingBottom: "0.25rem",
              borderBottom: activeSubTab === "dsa" ? "3px solid #dea63b" : "3px solid transparent",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              transition: "all 0.25s ease"
            }}
          >
            DSA Practice Sheet
          </button>
        </div>
        
        {activeSubTab === "dsa" && (
          <div style={{ fontSize: "0.8rem", color: "#666", fontWeight: 600 }}>
            Overall progress: <span style={{ color: "#dea63b", fontWeight: 800 }}>{getOverallCompletionInfo().count}/{getOverallCompletionInfo().total}</span> problems solved
          </div>
        )}
      </div>

      {activeSubTab === "companies" ? (
        /* Company Tracks Dashboard */
        <main className="track-dashboard">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px", color: "#8e8e93" }}>
              Loading company tracks...
            </div>
          ) : error ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", color: "#ef4444" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Unable to load page data</span>
              <span style={{ fontSize: "0.85rem", color: "#78716c" }}>{error}</span>
            </div>
          ) : (
            <>
              {/* Header section with page titles & search bar */}
              <div className="track-header">
                <div className="track-title-row">
                  <div>
                    <h1 className="track-page-title">Company Tracks</h1>
                    <p className="track-page-subtitle">Curated interview paths for top companies</p>
                  </div>
                </div>

                <div className="track-search-bar">
                  <span className="track-search-icon">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    className="track-search-input"
                    placeholder="Search companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid of Company Track Cards */}
              <div className="track-grid">
                {filteredCompanies.length === 0 ? (
                  searchQuery.trim() ? (
                    <div 
                      className="company-card" 
                      style={{ 
                        gridColumn: "1 / -1", 
                        maxWidth: "500px", 
                        margin: "2rem auto", 
                        border: "2px dashed #dea63b",
                        background: "#fffdf9",
                        textAlign: "center",
                        padding: "2.5rem 2rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1rem"
                      }}
                    >
                      <div className="company-logo-badge logo-google" style={{ background: "#dea63b", color: "#ffffff", fontSize: "1.2rem", fontWeight: 800 }}>✨</div>
                      <h2 className="company-card-name" style={{ margin: 0 }}>Generate "{searchQuery}" Track</h2>
                      <p className="company-card-desc" style={{ fontSize: "0.85rem", color: "#666", lineHeight: 1.5 }}>
                        Prepora AI will dynamically curate a customized interview preparation track for <strong>{searchQuery}</strong>, including top questions, difficulty ratings, and community tips.
                      </p>
                      
                      {generatingError && (
                        <div style={{ color: "#ef4444", fontSize: "0.8rem", fontWeight: 500 }}>
                          {generatingError}
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn-open-track"
                        onClick={() => handleGenerateCompany(searchQuery)}
                        disabled={generatingCompany}
                        style={{
                          background: "#dea63b",
                          color: "#ffffff",
                          fontWeight: 700,
                          padding: "0.75rem 2rem",
                          borderRadius: "8px",
                          width: "auto",
                          cursor: generatingCompany ? "not-allowed" : "pointer",
                          opacity: generatingCompany ? 0.7 : 1,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}
                      >
                        {generatingCompany ? "Generating Track..." : "Generate AI Track"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "#78716c" }}>
                      No companies match your search.
                    </div>
                  )
                ) : (
                  filteredCompanies.map((company) => (
                    <div key={company.id} className="company-card">
                      <div>
                        {/* Logo and Difficulty badge */}
                        <div className="card-top-row">
                          {renderLogoIcon(company.name)}
                          <span className={`difficulty-pill ${company.difficulty === 'HARD' ? 'diff-hard' : company.difficulty === 'MEDIUM' ? 'diff-medium' : 'diff-easy'}`}>
                            {company.difficulty}
                          </span>
                        </div>

                        {/* Info */}
                        <h2 className="company-card-name">{company.name}</h2>
                        <p className="company-card-desc">{company.description}</p>

                        {/* Tech stack/Tags */}
                        <div className="company-tags-row">
                          {(company.tags || []).map((tag) => (
                            <span key={tag} className="company-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        {/* Stat counters */}
                        <div className="company-counts-row">
                          <div className="count-item">
                            <Code size={14} />
                            <span>{company.problems_count} problems</span>
                          </div>
                          <div className="count-item">
                            <MessageSquare size={14} />
                            <span>{company.mock_questions_count} mock questions</span>
                          </div>
                        </div>

                        {/* Call to Action */}
                        <button
                          type="button"
                          className="btn-open-track"
                          onClick={() => router.push(`/practice/${company.name.toLowerCase()}`)}
                        >
                          Open Track
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </>
          )}
        </main>
      ) : (
        /* Stateful DSA Practice Sheet UI (Collapsible sidebar + filterable question grid) */
        <div className="prac-container">
          {/* Left Sidebar */}
          <aside className="prac-sidebar">
            <div className="prac-sidebar-title-section">
              <span className="prac-sidebar-label">Practice Track</span>
              <span className="prac-sidebar-subtitle">DSA Practice Sheet</span>
            </div>

            <div className="prac-topic-list">
              {DSA_TOPICS.map((topic) => {
                const { count, total, percent } = getTopicCompletionInfo(topic.id);
                const isSelected = selectedDsaTopic === topic.id;
                const allCompleted = total > 0 && count === total;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    className={`prac-topic-card ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedDsaTopic(topic.id)}
                  >
                    <div className="prac-topic-left">
                      <div
                        onClick={(e) => toggleTopicAllCompleted(topic.id, e)}
                        style={{
                          width: "17px",
                          height: "17px",
                          border: "1.5px solid #dcd9d2",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: allCompleted ? "#dea63b" : "#ffffff",
                          borderColor: allCompleted ? "#dea63b" : "#dcd9d2",
                          color: "#ffffff",
                          marginRight: "0.35rem",
                          flexShrink: 0
                        }}
                      >
                        {allCompleted && <Check size={10} strokeWidth={4} />}
                      </div>
                      <span className="prac-topic-label">{topic.name}</span>
                    </div>
                    <span className="prac-topic-count">
                      {percent > 0 ? `${percent}%` : `${count}/${total}`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="prac-sidebar-bottom">
              <div className="prac-progress-text-row">
                <span>Overall Progress</span>
                <span>{getOverallCompletionInfo().percent}%</span>
              </div>
              <div className="prac-progress-bar-bg">
                <div
                  className="prac-progress-bar-fill"
                  style={{ width: `${getOverallCompletionInfo().percent}%` }}
                ></div>
              </div>
              
              <button
                type="button"
                className="prac-btn-unlock"
                onClick={resetAllProgress}
                style={{
                  background: "transparent",
                  border: "1px solid #fca5a5",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  fontSize: "0.8rem",
                  padding: "0.55rem"
                }}
              >
                <RotateCcw size={14} />
                <span>Reset All Progress</span>
              </button>
            </div>
          </aside>

          {/* Right Main Content Panel */}
          <main className="prac-main-content">
            <div className="prac-content-header">
              <h1 className="prac-title">{activeDsaTopic.name}</h1>
              
              {/* Question search bar */}
              <div className="prac-search-wrap">
                <span className="prac-search-icon">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="prac-search-input"
                  placeholder={`Search ${activeDsaTopic.name.toLowerCase()}...`}
                  value={dsaSearchQuery}
                  onChange={(e) => setDsaSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Difficulty Tabs */}
            <div className="prac-filters-row">
              {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  className={`prac-filter-btn ${dsaDifficultyFilter === diff ? "active" : ""}`}
                  onClick={() => setDsaDifficultyFilter(diff)}
                >
                  {diff === "ALL" ? "All Problems" : diff.charAt(0) + diff.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Questions list card table */}
            <div className="prac-card">
              <div className="prac-table-header">
                <span>#</span>
                <span>Status</span>
                <span>Problem Name</span>
                <span>Difficulty</span>
                <span>Target Companies</span>
                <span style={{ textAlign: "center" }}>Link</span>
              </div>

              {filteredDsaProblems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem", color: "#8e8e93" }}>
                  No problems match your current search/filter.
                </div>
              ) : (
                filteredDsaProblems.map((prob, idx) => {
                  const isCompleted = completedDsaQuestions.has(prob.id);
                  return (
                    <div key={prob.id} className="prac-table-row">
                      {/* # Col */}
                      <span className="prac-col-num">{idx + 1}</span>

                      {/* Status Checkbox Col */}
                      <div className="prac-col-status">
                        <div
                          className={`prac-checkbox-custom ${isCompleted ? "checked" : ""}`}
                          onClick={() => toggleQuestionCompleted(prob.id)}
                        >
                          {isCompleted && <Check size={11} strokeWidth={4} />}
                        </div>
                      </div>

                      {/* Title Col */}
                      <span className={`prac-col-title ${isCompleted ? "completed" : ""}`}>
                        {prob.name}
                      </span>

                      {/* Difficulty Badge Col */}
                      <div>
                        <span className={`prac-badge ${prob.difficulty.toLowerCase()}`}>
                          {prob.difficulty}
                        </span>
                      </div>

                      {/* Companies Col */}
                      <div className="prac-col-companies">
                        {prob.companies.map((tag) => (
                          <span key={tag} className="prac-company-tag">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* LeetCode link redirect */}
                      <div>
                        <a
                          href={prob.leetcodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="prac-col-link"
                          title="Open LeetCode problem page"
                          style={{ display: "inline-flex", justifyContent: "center" }}
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
