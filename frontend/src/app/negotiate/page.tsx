"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight, 
  Send, 
  Coins, 
  Briefcase, 
  TrendingUp, 
  Award,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { useNotifications } from "@/components/NotificationContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NegotiatePage() {
  const router = useRouter();

  // Profile / Auth state
  const [userName, setUserName] = useState("Arjun");
  const [userId, setUserId] = useState<string | null>(null);

  // Chat/Negotiation States
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Hi Arjun, congratulations on passing the interview rounds! We are thrilled to offer you the position of Software Engineer. Our initial package is $120,000 base salary with a $10,000 sign-on bonus. Let me know if you have any questions or when you are ready to finalize." 
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Scorecard Metrics (Returned from LLM or state-driven)
  const [currentOffer, setCurrentOffer] = useState("$120,000 base + $10,000 bonus");
  const [negotiationScore, setNegotiationScore] = useState(50);
  const [leverageRating, setLeverageRating] = useState("Standard initial offer");
  const [status, setStatus] = useState<"active" | "accepted" | "rejected">("active");
  const [error, setError] = useState<string | null>(null);
  const [offerHistory, setOfferHistory] = useState<number[]>([120000]);
  const [activeTactic, setActiveTactic] = useState<number | null>(null);
  const { addNotification } = useNotifications();

  // Chat scroll anchor ref
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("prepora_user_id");
      const storedName = localStorage.getItem("prepora_user_name");
      if (storedId) setUserId(storedId);
      if (storedName) setUserName(storedName);
    }
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const parseSalary = (offerStr: string): number => {
    const cleanStr = offerStr.replace(/,/g, '');
    const match = cleanStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 120000;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading || status !== "active") return;

    const userMessage = inputText.trim();
    setInputText("");
    setError(null);

    const updatedMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/negotiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: updatedMessages,
          message: userMessage
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to recruiter model.");
      }

      const data = await response.json();
      setMessages([...updatedMessages, { role: "assistant" as const, content: data.recruiter_reply }]);
      setCurrentOffer(data.current_offer);
      setNegotiationScore(data.negotiation_score);
      setLeverageRating(data.leverage_rating);
      setStatus(data.status);
      
      const newSalary = parseSalary(data.current_offer);
      setOfferHistory(prev => [...prev, newSalary]);


    } catch (err: any) {
      console.error(err);
      setError("Recruiter took too long to respond. Please check your backend FastAPI server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = () => {
    setStatus("accepted");
    setMessages(prev => [
      ...prev, 
      { role: "assistant", content: "Wonderful! We are extremely excited to have you join the team. I will get the formal contract written up and sent to your email. Welcome aboard!" }
    ]);
    addNotification("🎉 Offer Accepted! Welcome aboard to your new role.", "🎉");
  };

  const handleRejectOffer = () => {
    setStatus("rejected");
    setMessages(prev => [
      ...prev, 
      { role: "assistant", content: "I understand. Unfortunately, we aren't able to match those expectations, so we'll have to rescind or withdraw the offer. We wish you the best of luck elsewhere." }
    ]);
    addNotification("⚠️ Offer Declined: Negotiation session closed.", "⚠️");
  };

  return (
    <div className="msetup-page" style={{ background: "#f8f6f1", minHeight: "100vh" }}>
      {/* Header Bar */}
      <DashboardHeader activeTab="negotiation" />

      {/* Main split dashboard content */}
      <main style={{ maxWidth: "1200px", margin: "2rem auto", padding: "0 1.5rem", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem" }}>
        
        {/* Left Side: Negotiation Chat Panel */}
        <section style={{ background: "#ffffff", border: "1px solid #e8e5de", borderRadius: "16px", display: "flex", flexDirection: "column", height: "620px", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e8e5de", background: "#faf9f6", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#dea63b" }} />
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1c1917" }}>Sarah Miller</div>
              <div style={{ fontSize: "0.74rem", color: "var(--muted)" }}>Senior Lead Tech Recruiter</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                  display: "flex",
                  gap: "0.75rem"
                }}
              >
                {msg.role !== "user" && (
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#dea63b", color: "#ffffff", fontWeight: 800, fontSize: "0.8rem", display: "flex", alignItems: "center", flexShrink: 0, justifyContent: "center" }}>
                    S
                  </div>
                )}
                <div style={{
                  background: msg.role === "user" ? "var(--primary)" : "#f0ede6",
                  color: msg.role === "user" ? "#ffffff" : "#1c1917",
                  padding: "0.85rem 1.1rem",
                  borderRadius: msg.role === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                  fontWeight: msg.role === "user" ? 600 : 500
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: "0.75rem", alignSelf: "flex-start" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#dea63b", color: "#ffffff", fontWeight: 800, fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>S</div>
                <div style={{ background: "#f0ede6", padding: "0.85rem 1.1rem", borderRadius: "16px 16px 16px 2px", display: "flex", gap: "0.3rem", alignItems: "center" }}>
                  <span style={{ width: "6px", height: "6px", background: "#1c1917", borderRadius: "50%", display: "inline-block", animation: "bounce 1s infinite 0.1s" }} />
                  <span style={{ width: "6px", height: "6px", background: "#1c1917", borderRadius: "50%", display: "inline-block", animation: "bounce 1s infinite 0.2s" }} />
                  <span style={{ width: "6px", height: "6px", background: "#1c1917", borderRadius: "50%", display: "inline-block", animation: "bounce 1s infinite 0.3s" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form input and controls */}
          {error && (
            <div style={{ background: "#fef2f2", borderTop: "1px solid #fca5a5", borderBottom: "1px solid #fca5a5", color: "#b91c1c", padding: "0.75rem 1.5rem", fontSize: "0.8rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {status === "active" ? (
            <form onSubmit={handleSendMessage} style={{ padding: "1.25rem", borderTop: "1px solid #e8e5de", display: "flex", gap: "0.5rem", background: "#faf9f6" }}>
              <input
                type="text"
                placeholder="Pitch your counter-offer, arguments, and details..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading}
                style={{
                  flex: 1,
                  background: "#ffffff",
                  border: "1px solid #e8e5de",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  color: "#1c1917",
                  outline: "none",
                  fontSize: "0.88rem"
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                style={{
                  background: "var(--primary)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.75rem 1.25rem",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  opacity: inputText.trim() ? 1 : 0.6
                }}
              >
                <span>Send</span>
                <Send size={14} />
              </button>
            </form>
          ) : (
            <div style={{ padding: "1.5rem", borderTop: "1px solid #e8e5de", background: "#faf9f6", textAlign: "center" }}>
              <span style={{ 
                fontSize: "0.85rem", 
                fontWeight: 700, 
                color: status === "accepted" ? "#10b981" : "#ef4444", 
                textTransform: "uppercase", 
                letterSpacing: "0.06em",
                display: "block",
                marginBottom: "0.5rem"
              }}>
                Negotiation Completed &mdash; {status.toUpperCase()}
              </span>
              <button 
                type="button" 
                onClick={() => router.push("/dashboard")} 
                className="btn btn-secondary"
                style={{ width: "200px", margin: "0 auto" }}
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </section>

        {/* Right Side: Scorecard & Actions Panel */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Current Offer Status Card */}
          <div style={{ background: "#ffffff", border: "1px solid #e8e5de", borderRadius: "16px", padding: "1.5rem" }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Current Offer Standings</span>
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(242, 166, 50, 0.05)", border: "1px solid rgba(242, 166, 50, 0.15)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Coins size={18} />
              </div>
              <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1c1917" }}>{currentOffer}</div>
                <div style={{ fontSize: "0.74rem", color: "var(--muted)", marginTop: "0.15rem" }}>Base salary compensation package</div>
              </div>
            </div>

            {status === "active" && (
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button 
                  type="button" 
                  onClick={handleRejectOffer}
                  style={{ flex: 1, padding: "0.6rem", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Walk Away
                </button>
                <button 
                  type="button" 
                  onClick={handleAcceptOffer}
                  style={{ flex: 1, padding: "0.6rem", background: "#10b981", border: "none", color: "#ffffff", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 800, cursor: "pointer" }}
                >
                  Accept Offer
                </button>
              </div>
            )}
          </div>

          {/* Recruiter Strategy Scorecard */}
          <div style={{ background: "#ffffff", border: "1px solid #e8e5de", borderRadius: "16px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Negotiation Performance Scorecard</span>

            {/* Score gauge bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", fontWeight: 700, color: "#1c1917", marginBottom: "0.4rem" }}>
                <span>Score rating</span>
                <span>{negotiationScore} / 100</span>
              </div>
              <div style={{ height: "6px", background: "#f0ede6", borderRadius: "3px" }}>
                <div style={{ height: "100%", width: `${negotiationScore}%`, background: negotiationScore >= 75 ? "#10b981" : negotiationScore >= 50 ? "var(--primary)" : "#ef4444", borderRadius: "3px" }} />
              </div>
            </div>

            {/* Leverage Status */}
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Candidate Leverage Stance</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.35rem" }}>
                <TrendingUp size={14} style={{ color: "var(--primary)" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1c1917" }}>{leverageRating}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Offer Valuation & Trend Graph */}
          <div style={{ background: "#ffffff", border: "1px solid #e8e5de", borderRadius: "16px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Offer Valuation Trend</span>
            
            {/* Dynamic Line Graph representing the salary offer progression */}
            <div style={{ position: "relative", width: "100%", height: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {(() => {
                // Calculate SVG coordinates based on offerHistory
                const width = 280;
                const height = 100;
                const padding = 15;
                const chartWidth = width - padding * 2;
                const chartHeight = height - padding * 2;
                
                // Min/Max bounds
                const minVal = 100000;
                const maxVal = 160000;
                const range = maxVal - minVal;
                
                // Generate points
                const points = offerHistory.map((val, idx) => {
                  const x = padding + (offerHistory.length > 1 ? (idx / (offerHistory.length - 1)) * chartWidth : chartWidth / 2);
                  const clampedVal = Math.min(Math.max(val, minVal), maxVal);
                  const y = height - padding - ((clampedVal - minVal) / range) * chartHeight;
                  return { x, y, val };
                });
                
                // SVG path string
                let d = "";
                if (points.length === 1) {
                  // If only one, draw a straight line across
                  d = `M ${padding} ${points[0].y} L ${width - padding} ${points[0].y}`;
                } else {
                  d = points.reduce((acc, p, idx) => {
                    return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
                  }, "");
                }
                
                // Area path for gradient fill
                let dArea = "";
                if (points.length === 1) {
                  dArea = `M ${padding} ${points[0].y} L ${width - padding} ${points[0].y} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;
                } else if (points.length > 1) {
                  dArea = `${d} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
                }

                return (
                  <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dea63b" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#dea63b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid Lines */}
                    {[110000, 130000, 150000].map((gridVal, i) => {
                      const gridY = height - padding - ((gridVal - minVal) / range) * chartHeight;
                      return (
                        <g key={i}>
                          <line x1={padding} y1={gridY} x2={width - padding} y2={gridY} stroke="#e8e5de" strokeDasharray="3 3" />
                          <text x={padding - 5} y={gridY + 3} fill="#888" fontSize="7" textAnchor="end">${gridVal / 1000}k</text>
                        </g>
                      );
                    })}

                    {/* Gradient Area under curve */}
                    {dArea && <path d={dArea} fill="url(#chartGlow)" />}
                    
                    {/* Line path */}
                    <path d={d} fill="none" stroke="#dea63b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Data Points */}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#dea63b" stroke="#ffffff" strokeWidth="1.5" />
                        {/* Tooltip on last element */}
                        {idx === points.length - 1 && (
                          <g>
                            <rect x={p.x - 22} y={p.y - 20} width="44" height="13" rx="3" fill="#dea63b" />
                            <text x={p.x} y={p.y - 11} fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle">${p.val / 1000}k</text>
                          </g>
                        )}
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>

            {/* Market Reference Ranges */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid #e8e5de", paddingTop: "0.75rem", fontSize: "0.74rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                <span>Prepora Minimum Offer</span>
                <span style={{ color: "#1c1917", fontWeight: 700 }}>$110,000</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                <span>Market Average Range</span>
                <span style={{ color: "#dea63b", fontWeight: 700 }}>$125,000 - $135,000</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                <span>Recruiter Budget Cap</span>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>$155,000</span>
              </div>
            </div>
          </div>

          {/* Negotiate hints cards */}
          <div style={{ background: "#ffffff", border: "1px solid #e8e5de", borderRadius: "16px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Negotiation Tactics to Leverage</span>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { 
                  title: "Review Market Value", 
                  desc: "Show average salary packages for Software Engineers in this area.",
                  detailedTip: "Present industry standard benchmarks (e.g. from Glassdoor or Levels.fyi) for a Software Engineer with your experience in this location. Keep it objective and professional.",
                  sampleScript: "Based on current market data for this role, the standard range is around $135k to $145k. I'd love to discuss if we can align closer to those benchmarks."
                },
                { 
                  title: "Mention Competing Offers", 
                  desc: "Bring up other offer deadlines to build competitive tension.",
                  detailedTip: "Gently indicate that you are in late stages with other companies or have active offers. This creates healthy urgency without sounding demanding.",
                  sampleScript: "I'm currently reviewing another offer this week, but Prepora is my top choice. If we can increase the base salary slightly, I'm ready to sign today."
                },
                { 
                  title: "Highlight Niche Technical Skills", 
                  desc: "Remind them of your experience in React, Python, or SQL Connect.",
                  detailedTip: "Remind them of your specialized expertise (e.g. React performance optimization, full-stack systems, or database schema design) that matches their core needs.",
                  sampleScript: "Given my background building scalable database architectures and optimizing web app performance, I can hit the ground running on day one."
                }
              ].map((card, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveTactic(activeTactic === idx ? null : idx)}
                  style={{ 
                    padding: "0.75rem", 
                    background: "#faf9f6", 
                    border: "1px solid #e8e5de", 
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1c1917", display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <ChevronRight 
                        size={12} 
                        style={{ 
                          color: "var(--primary)", 
                          transform: activeTactic === idx ? "rotate(90deg)" : "none",
                          transition: "transform 0.2s" 
                        }} 
                      />
                      <span>{card.title}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.2rem", paddingLeft: "0.8rem" }}>{card.desc}</div>
                  
                  {activeTactic === idx && (
                    <div 
                      style={{ 
                        borderTop: "1px solid #e8e5de", 
                        marginTop: "0.6rem", 
                        paddingTop: "0.6rem", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "0.5rem" 
                      }}
                      onClick={(e) => e.stopPropagation()} // Prevent closing accordion when clicking inside content
                    >
                      <div style={{ fontSize: "0.72rem", color: "#6b6661", lineHeight: 1.4 }}>
                        <strong>Strategy Tip:</strong> {card.detailedTip}
                      </div>
                      <div style={{ background: "#f0ede6", border: "1px solid #e8e5de", borderRadius: "6px", padding: "0.5rem" }}>
                        <div style={{ fontSize: "0.6rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>Suggested Script</div>
                        <div style={{ fontSize: "0.74rem", color: "#1c1917", fontStyle: "italic", lineHeight: 1.35 }}>
                          "{card.sampleScript}"
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setInputText(card.sampleScript)}
                        className="btn btn-secondary"
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.68rem", alignSelf: "flex-end", margin: 0, height: "auto" }}
                      >
                        Use Script Draft
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
