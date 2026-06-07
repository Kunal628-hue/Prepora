"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  ThumbsUp,
  Plus,
  Play,
  X,
  PlusCircle
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";

interface TrackProblem {
  id: string;
  company_id: string;
  name: string;
  difficulty: "HARD" | "MEDIUM" | "EASY";
  topic: string;
  link: string;
}

interface CompanyTip {
  id: string;
  company_id: string;
  title: string;
  content: string;
  order: number;
}

interface UserFeedbackTip {
  id: string;
  company_id: string;
  content: string;
  author: string;
  time_ago: string;
  likes: number;
}

interface CompanyDetail {
  id: string;
  name: string;
  description: string;
  difficulty: "HARD" | "MEDIUM" | "EASY";
  tags: string[];
  problems_count: number;
  mock_questions_count: number;
  problems: TrackProblem[];
  tips: CompanyTip[];
  user_tips: UserFeedbackTip[];
}

const API_BASE = "http://127.0.0.1:8000";

export default function CompanyTrackPage() {
  const router = useRouter();
  const params = useParams();
  
  // Dynamic path parameter
  const companyNameParam = params?.company as string;

  // Profile / Auth state
  const [userName, setUserName] = useState("Arjun");
  const [userId, setUserId] = useState<string | null>(null);

  // API state
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State ("problems" or "tips")
  const [activeTab, setActiveTab] = useState<"problems" | "tips">("problems");

  // Solved checklist state
  const [solvedProblems, setSolvedProblems] = useState<Set<string>>(new Set());

  // Modal State for adding a tip
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTipAuthor, setNewTipAuthor] = useState("");
  const [newTipContent, setNewTipContent] = useState("");
  const [submittingTip, setSubmittingTip] = useState(false);

  // Load user details & local storage solved problems list
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("prepora_user_id");
      const storedName = localStorage.getItem("prepora_user_name");
      if (storedId) setUserId(storedId);
      if (storedName) setUserName(storedName);

      const savedSolved = localStorage.getItem(`prepora_solved_company_problems`);
      if (savedSolved) {
        try {
          setSolvedProblems(new Set(JSON.parse(savedSolved)));
        } catch (e) {
          console.error("Failed to parse solved list", e);
        }
      }
    }
  }, []);

  // Fetch company details from FastAPI backend
  const fetchCompanyData = async () => {
    if (!companyNameParam) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/companies/${companyNameParam}`);
      if (!res.ok) {
        throw new Error(`Track for '${companyNameParam}' not found.`);
      }
      const data: CompanyDetail = await res.json();
      setCompany(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load company detail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [companyNameParam]);

  // Toggle problem solved status
  const toggleProblemSolved = (probName: string) => {
    if (!company) return;
    const problemKey = `${company.name.toLowerCase()}_${probName.toLowerCase()}`;
    
    setSolvedProblems((prev) => {
      const next = new Set(prev);
      if (next.has(problemKey)) {
        next.delete(problemKey);
      } else {
        next.add(problemKey);
      }
      localStorage.setItem(`prepora_solved_company_problems`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Like a community user tip
  const handleLikeTip = async (tipId: string) => {
    if (!company) return;
    try {
      const res = await fetch(`${API_BASE}/api/companies/${company.id}/tips/${tipId}/like`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to like tip.");
      
      const updatedTip: UserFeedbackTip = await res.json();
      
      // Update local state dynamically
      setCompany((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          user_tips: prev.user_tips.map((ut) =>
            ut.id === tipId ? { ...ut, likes: updatedTip.likes } : ut
          )
        };
      });
    } catch (err) {
      console.error("Error liking tip", err);
    }
  };

  // Submit a new community tip
  const handleAddTipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !newTipContent.trim() || submittingTip) return;

    setSubmittingTip(true);
    try {
      const author = newTipAuthor.trim() ? (newTipAuthor.trim().startsWith("@") ? newTipAuthor.trim() : `@${newTipAuthor.trim()}`) : "@user";
      
      const res = await fetch(`${API_BASE}/api/companies/${company.id}/tips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: newTipContent.trim(),
          author: author,
          time_ago: "Just now"
        })
      });

      if (!res.ok) throw new Error("Failed to add tip.");
      
      const addedTip: UserFeedbackTip = await res.json();

      // Append new tip and close modal
      setCompany((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          user_tips: [addedTip, ...prev.user_tips]
        };
      });

      setNewTipContent("");
      setNewTipAuthor("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding tip", err);
    } finally {
      setSubmittingTip(false);
    }
  };

  return (
    <div className="prac-page">
      {/* Header Bar */}
      <DashboardHeader activeTab="practice" />

      {/* Main Track details */}
      <main className="detail-page-container">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px", color: "#8e8e93" }}>
            Loading track workspace...
          </div>
        ) : error || !company ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", color: "#ef4444" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Failed to open track</span>
            <span style={{ fontSize: "0.85rem", color: "#78716c", marginBottom: "1.5rem" }}>{error}</span>
            <button className="btn-blueprint-cta" style={{ background: "#dea63b", color: "#ffffff" }} onClick={() => router.push("/practice")}>
              Back to Tracks
            </button>
          </div>
        ) : (
          <>
            {/* Header section with brand titles & actions */}
            <div className="detail-header-card">
              <div className="detail-header-left">
                <div className="detail-title-badge-row">
                  <h1 className="detail-title">{company.name}</h1>
                  <span className={`difficulty-pill ${company.difficulty === 'HARD' ? 'diff-hard' : company.difficulty === 'MEDIUM' ? 'diff-medium' : 'diff-easy'}`}>
                    {company.difficulty}
                  </span>
                </div>
                <p className="detail-desc">{company.description} They expect clean, optimized code and a deep understanding of data structures.</p>
              </div>

              <div className="detail-header-actions">
                <button
                  type="button"
                  className="btn-detail-practice"
                  onClick={() => router.push("/setup")}
                >
                  <Play size={15} fill="#ffffff" />
                  <span>Start Practice</span>
                </button>
                <button
                  type="button"
                  className="btn-detail-follow"
                  onClick={() => alert(`Following ${company.name} track!`)}
                >
                  Follow Company
                </button>
              </div>
            </div>

            {/* Tab Selectors */}
            <div className="detail-tabs-row">
              <button
                type="button"
                className={`detail-tab-btn ${activeTab === 'problems' ? 'active' : ''}`}
                onClick={() => setActiveTab("problems")}
              >
                Problem List
              </button>
              <button
                type="button"
                className={`detail-tab-btn ${activeTab === 'tips' ? 'active' : ''}`}
                onClick={() => setActiveTab("tips")}
              >
                Tips
              </button>
            </div>

            {/* TAB CONTENT: Problems list table */}
            {activeTab === "problems" && (
              <div className="detail-table-card">
                {/* Headers */}
                <div className="detail-table-header">
                  <span>Status</span>
                  <span>Problem Name</span>
                  <span>Difficulty</span>
                  <span>Topic</span>
                  <span style={{ textAlign: "center" }}>Links</span>
                </div>

                {/* Rows */}
                {company.problems.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem", color: "#8e8e93" }}>
                    No problems loaded for this company track.
                  </div>
                ) : (
                  company.problems.map((prob) => {
                    const problemKey = `${company.name.toLowerCase()}_${prob.name.toLowerCase()}`;
                    const isCompleted = solvedProblems.has(problemKey);

                    return (
                      <div key={prob.id} className="detail-table-row">
                        {/* Checkbox status */}
                        <div className="detail-col-checkbox">
                          <div
                            className={`detail-checkbox-box ${isCompleted ? 'checked' : ''}`}
                            onClick={() => toggleProblemSolved(prob.name)}
                          >
                            {isCompleted && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>

                        {/* Title */}
                        <div className={`detail-col-name ${isCompleted ? 'completed' : ''}`}>
                          {prob.name}
                        </div>

                        {/* Difficulty */}
                        <div>
                          <span className={`difficulty-pill ${prob.difficulty === 'HARD' ? 'diff-hard' : prob.difficulty === 'MEDIUM' ? 'diff-medium' : 'diff-easy'}`}>
                            {prob.difficulty}
                          </span>
                        </div>

                        {/* Topic */}
                        <div>
                          <span className="detail-col-topic">{prob.topic}</span>
                        </div>

                        {/* Link out */}
                        <div
                          className="detail-col-link"
                          onClick={() => router.push("/setup")}
                          title="Start Sandbox Practice"
                        >
                          <ExternalLink size={16} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB CONTENT: Curated & Community tips */}
            {activeTab === "tips" && (
              <>
                <div className="tips-tab-grid">
                  {/* Curated tips guidelines */}
                  <div className="tips-guide-section">
                    <h2 className="tips-section-title">Ace the {company.name} Interview</h2>
                    {company.tips.length === 0 ? (
                      <div style={{ color: "#8e8e93", fontStyle: "italic" }}>
                        Curated guidance checklist loading...
                      </div>
                    ) : (
                      company.tips
                        .sort((a, b) => a.order - b.order)
                        .map((tip, index) => (
                          <div key={tip.id} className="tips-guide-card">
                            <div className="tips-number-badge">{index + 1}</div>
                            <div>
                              <h3 className="tips-guide-title">{tip.title}</h3>
                              <p className="tips-guide-text">{tip.content}</p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Community Feedback User tips */}
                  <div className="tips-feedback-section">
                    <h2 className="tips-section-title">User Tips</h2>
                    <div className="tips-feedback-list">
                      {company.user_tips.length === 0 ? (
                        <div style={{ color: "#8e8e93", fontStyle: "italic", padding: "1.5rem", border: "1px dashed #e5e2d9", borderRadius: "12px", textAlign: "center" }}>
                          No community feedback yet. Be the first to add a tip!
                        </div>
                      ) : (
                        company.user_tips.map((ut) => (
                          <div key={ut.id} className="feedback-tip-card">
                            <p className="feedback-tip-content">"{ut.content}"</p>
                            <div className="feedback-tip-footer">
                              <div className="feedback-author-row">
                                <span className="feedback-author">{ut.author}</span>
                                <span>·</span>
                                <span>{ut.time_ago}</span>
                              </div>
                              <button
                                type="button"
                                className="feedback-like-btn"
                                onClick={() => handleLikeTip(ut.id)}
                              >
                                <ThumbsUp size={12} />
                                <span>{ut.likes}</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Add a Tip Trigger button */}
                      <button
                        type="button"
                        className="btn-add-tip"
                        onClick={() => setIsModalOpen(true)}
                      >
                        <Plus size={16} />
                        <span>Add a tip</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom promo image banner inside Tips Tab */}
                <div className="tips-bottom-promo">
                  <div className="tips-promo-content">
                    <span className="tips-promo-label">PREPORA ARENA</span>
                    <h2 className="tips-promo-title">Preparation is half the battle.</h2>
                    <p className="tips-promo-desc">
                      Solve company-tagged coding puzzles, run test fixtures against our local compiler sandbox, and schedule adaptive mock interview drills to forge your confidence.
                    </p>
                  </div>
                  
                  {/* Laptop mockup graphic section */}
                  <div className="tips-promo-img-wrap">
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                        borderLeft: "1px solid rgba(222, 166, 59, 0.15)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#a8a29e",
                        fontFamily: "monospace",
                        fontSize: "0.72rem",
                        padding: "1.5rem",
                        textAlign: "left"
                      }}
                    >
                      <div style={{ color: "#dea63b", marginBottom: "0.5rem" }}>$ prepora compiler sandbox --run</div>
                      <div style={{ color: "#10b981" }}>✔ Running test_cases... (4/4 passed)</div>
                      <div style={{ opacity: 0.6, marginTop: "0.5rem" }}>Time: 0.04s</div>
                      <div style={{ opacity: 0.6 }}>Space: 24.1 MB</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ADD A TIP MODAL POPUP DIALOG */}
            {isModalOpen && (
              <div className="modal-overlay">
                <div className="modal-content-card">
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <X size={20} />
                  </button>

                  <h3 className="modal-title">Share Interview Advice</h3>

                  <form onSubmit={handleAddTipSubmit}>
                    <div className="modal-form-group">
                      <label className="modal-form-label">Twitter / Handle (Optional)</label>
                      <input
                        type="text"
                        className="modal-form-input"
                        placeholder="e.g. @alex_dev"
                        value={newTipAuthor}
                        onChange={(e) => setNewTipAuthor(e.target.value)}
                      />
                    </div>

                    <div className="modal-form-group">
                      <label className="modal-form-label">Your Tip</label>
                      <textarea
                        className="modal-form-textarea"
                        required
                        placeholder="Focus on graph traversals, ask for edge cases first..."
                        value={newTipContent}
                        onChange={(e) => setNewTipContent(e.target.value)}
                      />
                    </div>

                    <div className="modal-actions-row">
                      <button
                        type="button"
                        className="btn-modal-cancel"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-modal-submit"
                        disabled={submittingTip}
                      >
                        {submittingTip ? "Submitting..." : "Submit Tip"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
