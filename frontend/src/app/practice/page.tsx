"use client";
import { API_BASE_URL } from "@/lib/api";

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
  PlayCircle
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";

interface Company {
  id: string;
  name: string;
  description: string;
  difficulty: "HARD" | "MEDIUM" | "EASY";
  tags: string[];
  problems_count: number;
  mock_questions_count: number;
}

const API_BASE = `${API_BASE_URL}`;

export default function PracticePage() {
  const router = useRouter();

  // Profile / Auth state
  const [userName, setUserName] = useState("Arjun");
  const [userId, setUserId] = useState<string | null>(null);

  // API state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");

  // Load user details
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("prepora_user_id");
      const storedName = localStorage.getItem("prepora_user_name");
      if (storedId) setUserId(storedId);
      if (storedName) setUserName(storedName);
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

  return (
    <div className="prac-page">
      {/* Header Bar */}
      <DashboardHeader activeTab="practice" />

      {/* Main Track Dashboard */}
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
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "#78716c" }}>
                  No companies match your search.
                </div>
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

            {/* Bottom Marketing Blueprint Banner */}
            <div className="blueprint-banner">
              <div className="blueprint-content">
                <span className="blueprint-label">NEW GUIDE</span>
                <h2 className="blueprint-title">The FAANG Blueprint 2026</h2>
                <p className="blueprint-desc">
                  A comprehensive 12-week schedule designed by engineers from Google and Meta to help you master the fundamentals.
                </p>
                <button
                  type="button"
                  className="btn-blueprint-cta"
                  onClick={() => router.push("/setup")}
                >
                  <span>Get Started</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Graphic mock image box */}
              <div className="blueprint-img-wrap">
                <div 
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    padding: "1rem",
                    textAlign: "center"
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.5rem" }}>FAANG Battle Plan</div>
                  <div style={{ opacity: 0.8 }}>// 12 Weeks to Mastery</div>
                  <div style={{ opacity: 0.8, fontSize: "0.7rem", marginTop: "1rem" }}>Arrays · Graphs · Dynamic Programming · System Design</div>
                </div>
              </div>

              <div className="blueprint-bg-glow"></div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
