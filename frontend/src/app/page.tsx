"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Terminal, 
  Cpu, 
  Briefcase, 
  Activity, 
  FileSearch, 
  Users, 
  Sparkles, 
  ArrowRight
} from "lucide-react";

export default function Home() {
  const [simulationCount, setSimulationCount] = useState(2848);

  // Live throughput simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulationCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* --- HERO SECTION --- */}
      <section style={{ 
        minHeight: "80vh", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center",
        textAlign: "center",
        padding: "3rem 1rem 4rem 1rem",
        position: "relative"
      }}>
        
        {/* Left Side: Live Network Throughput */}
        <div className="glass-card" style={{ 
          position: "absolute", 
          left: "2rem", 
          top: "40%", 
          transform: "translateY(-50%)",
          padding: "0.75rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          maxWidth: "200px",
          borderLeft: "3px solid var(--primary)",
          borderRadius: "4px 8px 8px 4px",
          background: "rgba(5, 5, 5, 0.6)",
          zIndex: 10
        }}>
          <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            LIVE SYSTEM THROUGHPUT
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ 
              width: "6px", 
              height: "6px", 
              borderRadius: "50%", 
              backgroundColor: "var(--success)", 
              boxShadow: "0 0 8px var(--success)",
              display: "inline-block",
              animation: "pulse 1.5s infinite"
            }} />
            <span style={{ fontSize: "1.1rem", fontFamily: "var(--font-display)", fontWeight: 800, color: "#fff" }}>
              {simulationCount.toLocaleString()}
            </span>
          </div>
          <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 500 }}>
            SIMULATIONS RUN TODAY
          </span>
        </div>

        {/* Right Side: Rotating Cube (System Ready Indicator) */}
        <div style={{ 
          position: "absolute", 
          right: "3rem", 
          top: "40%", 
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
          zIndex: 10
        }}>
          <div className="cube-wrap">
            <div className="cube">
              <div className="cube-face face-front" />
              <div className="cube-face face-back" />
              <div className="cube-face face-right" />
              <div className="cube-face face-left" />
              <div className="cube-face face-top" />
              <div className="cube-face face-bottom" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--primary)", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              SYSTEM READY
            </span>
            <span style={{ fontSize: "0.6rem", color: "var(--muted)", fontWeight: 500 }}>
              VER. 2.94 / MOCKENGINE
            </span>
          </div>
        </div>

        {/* Hero Central Content */}
        <div style={{ maxWidth: "800px", zIndex: 5 }}>
          <span style={{ 
            fontSize: "0.8rem", 
            color: "var(--primary)", 
            fontWeight: 800, 
            letterSpacing: "0.2em",
            display: "inline-block",
            marginBottom: "1.25rem",
            textTransform: "uppercase"
          }}>
            WHERE CANDIDATES ARE FORGED, NOT COACHED
          </span>
          
          <h1 style={{ 
            fontSize: "5rem", 
            fontWeight: 900, 
            letterSpacing: "0.08em", 
            lineHeight: 1, 
            marginBottom: "1.5rem",
            color: "#fff",
            fontFamily: "var(--font-display)"
          }}>
            PREPORA
          </h1>
          
          <p style={{ 
            fontSize: "1.15rem", 
            color: "var(--muted)", 
            maxWidth: "600px", 
            margin: "0 auto 2.5rem auto", 
            lineHeight: 1.5,
            fontWeight: 400
          }}>
            AI mock interviews, adaptive DSA practice, and company-specific battle plans — all in one ruthlessly efficient workspace.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/setup">
              <button className="btn btn-primary" style={{ padding: "0.9rem 2.25rem" }}>
                START FORGING — FREE
              </button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div style={{ 
          marginTop: "6rem", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: "0.5rem",
          color: "var(--muted)",
          fontSize: "0.75rem",
          letterSpacing: "0.1em",
          fontWeight: 600,
          textTransform: "uppercase"
        }}>
          <span>Scroll to forge</span>
          <span style={{ 
            display: "inline-block", 
            animation: "bounce 1s infinite alternate",
            fontSize: "1rem"
          }}>
            ↓
          </span>
        </div>
      </section>

      {/* --- STATS SUMMARY BAR --- */}
      <section style={{ 
        borderTop: "1px solid var(--border)", 
        borderBottom: "1px solid var(--border)",
        background: "rgba(5, 5, 5, 0.4)",
        padding: "2rem 0"
      }}>
        <div className="container" style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
          gap: "2rem",
          padding: "0 1.5rem",
          textAlign: "center"
        }}>
          {[
            { num: "78%", label: "Offer Rate" },
            { num: "2.7x", label: "Faster Results" },
            { num: "418+", label: "Trials" },
            { num: "9min", label: "First Insight" }
          ].map((stat) => (
            <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span style={{ 
                fontFamily: "var(--font-display)", 
                fontSize: "2rem", 
                fontWeight: 800, 
                color: "#fff" 
              }}>{stat.num}</span>
              <span style={{ 
                fontSize: "0.75rem", 
                color: "var(--muted)", 
                fontWeight: 600, 
                textTransform: "uppercase", 
                letterSpacing: "0.05em" 
              }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- FEATURES GRID (Six Weapons) --- */}
      <section style={{ padding: "6rem 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span style={{ 
              fontSize: "0.75rem", 
              color: "var(--primary)", 
              fontWeight: 800, 
              letterSpacing: "0.15em",
              textTransform: "uppercase"
            }}>
              THE FORGE SYSTEM
            </span>
            <h2 style={{ 
              fontSize: "2.25rem", 
              fontFamily: "var(--font-display)", 
              fontWeight: 800, 
              color: "#fff", 
              marginTop: "0.5rem" 
            }}>
              Six weapons for your interview arsenal
            </h2>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
            gap: "2rem" 
          }}>
            {/* Card 1: AI BATTLE ROUNDS */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "2rem" }}>
              <div style={{ color: "var(--primary)" }}><Terminal size={24} /></div>
              <h3 style={{ fontSize: "1.1rem", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                AI BATTLE ROUNDS
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.5 }}>
                Simulate high-pressure behavioral and technical loops with adaptive AI agents designed to push your limits.
              </p>
            </div>

            {/* Card 2: DSA FORGE SHEET */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "2rem" }}>
              <div style={{ color: "var(--primary)" }}><Cpu size={24} /></div>
              <h3 style={{ fontSize: "1.1rem", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                DSA FORGE SHEET
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.5 }}>
                Real-time algorithmic feedback as you code. Not just the solution, but the tactical logic to arrive there faster.
              </p>
            </div>

            {/* Card 3: COMPANY INTEL */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "2rem" }}>
              <div style={{ color: "var(--primary)" }}><Briefcase size={24} /></div>
              <h3 style={{ fontSize: "1.1rem", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                COMPANY INTEL
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.5 }}>
                Battle-tested datasets from Google, Meta, and Netflix. Know the exact difficulty curve of your upcoming panel.
              </p>
            </div>

            {/* Card 4: VOICE ANALYSIS */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "2rem" }}>
              <div style={{ color: "var(--primary)" }}><Activity size={24} /></div>
              <h3 style={{ fontSize: "1.1rem", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                VOICE ANALYSIS
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.5 }}>
                AI-driven biometric feedback. Track filler words, confidence score, and pacing cadence in real-time during mocks.
              </p>
            </div>

            {/* Card 5: RESUME SCANNER */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "2rem" }}>
              <div style={{ color: "var(--primary)" }}><FileSearch size={24} /></div>
              <h3 style={{ fontSize: "1.1rem", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                RESUME SCANNER
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.5 }}>
                Cold-blooded parsing that mirrors ATS systems. Identify "weak spots" before a human recruiter ever sees them.
              </p>
            </div>

            {/* Card 6: PEER ARENA */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "2rem" }}>
              <div style={{ color: "var(--primary)" }}><Users size={24} /></div>
              <h3 style={{ fontSize: "1.1rem", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                PEER ARENA
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.5 }}>
                PvP mocks. Trade feedback with peers on the same track to gain a 360-degree perspective on your performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- LOGO TICKER --- */}
      <section style={{ 
        borderTop: "1px solid var(--border)", 
        borderBottom: "1px solid var(--border)",
        background: "rgba(5, 5, 5, 0.4)",
        padding: "2.5rem 0"
      }}>
        <div className="container" style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexWrap: "wrap",
          gap: "2rem",
          padding: "0 2rem"
        }}>
          {["GOOGLE", "META", "AMAZON", "NETFLIX", "STRIPE", "UBER", "MICROSOFT", "GOLDMAN SACHS"].map((logo) => (
            <span key={logo} style={{ 
              fontSize: "0.85rem", 
              fontWeight: 800, 
              color: "var(--muted)",
              letterSpacing: "0.1em",
              opacity: 0.5
            }}>
              {logo}
            </span>
          ))}
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section style={{ padding: "6rem 0" }}>
        <div className="container">
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
            gap: "2rem"
          }}>
            {/* Quote 1 */}
            <div className="glass-card" style={{ padding: "2rem", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <span style={{ fontSize: "3rem", color: "var(--primary)", fontFamily: "Georgia", lineHeight: 0.1, position: "absolute", left: "1.5rem", top: "2rem" }}>“</span>
              <p style={{ fontSize: "0.95rem", color: "var(--foreground)", lineHeight: 1.6, padding: "1.5rem 0 2rem 0", fontStyle: "italic" }}>
                "Prepora turned my interview anxiety into a mechanical process. The AI's feedback on my voice cadence alone was worth the subscription."
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>Alex Rivera</span>
                <span style={{ 
                  fontSize: "0.65rem", 
                  color: "var(--primary)", 
                  fontWeight: 700, 
                  backgroundColor: "rgba(242, 166, 50, 0.1)", 
                  padding: "0.15rem 0.4rem", 
                  borderRadius: "3px",
                  alignSelf: "flex-start",
                  letterSpacing: "0.05em"
                }}>SWE @ STRIPE</span>
              </div>
            </div>

            {/* Quote 2 */}
            <div className="glass-card" style={{ 
              padding: "2rem", 
              position: "relative", 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "space-between",
              border: "1px solid rgba(242, 166, 50, 0.25)",
              boxShadow: "0 0 24px rgba(242, 166, 50, 0.05)"
            }}>
              <span style={{ fontSize: "3rem", color: "var(--primary)", fontFamily: "Georgia", lineHeight: 0.1, position: "absolute", left: "1.5rem", top: "2rem" }}>“</span>
              <p style={{ fontSize: "0.95rem", color: "var(--foreground)", lineHeight: 1.6, padding: "1.5rem 0 2rem 0", fontStyle: "italic" }}>
                "The Battle Rounds are relentless. After 3 weeks in the Forge, my actual interview at Meta felt like it was in slow motion. I knew every answer before they finished the question."
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>Sarah Chen</span>
                <span style={{ 
                  fontSize: "0.65rem", 
                  color: "var(--primary)", 
                  fontWeight: 700, 
                  backgroundColor: "rgba(242, 166, 50, 0.1)", 
                  padding: "0.15rem 0.4rem", 
                  borderRadius: "3px",
                  alignSelf: "flex-start",
                  letterSpacing: "0.05em"
                }}>PM @ META</span>
              </div>
            </div>

            {/* Quote 3 */}
            <div className="glass-card" style={{ padding: "2rem", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <span style={{ fontSize: "3rem", color: "var(--primary)", fontFamily: "Georgia", lineHeight: 0.1, position: "absolute", left: "1.5rem", top: "2rem" }}>“</span>
              <p style={{ fontSize: "0.95rem", color: "var(--foreground)", lineHeight: 1.6, padding: "1.5rem 0 2rem 0", fontStyle: "italic" }}>
                "No fluff, no 'confidence building' workshops. Just pure data, brutal mock interviews, and a clear path to the offer. Exactly what I needed."
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>Jordan Miller</span>
                <span style={{ 
                  fontSize: "0.65rem", 
                  color: "var(--primary)", 
                  fontWeight: 700, 
                  backgroundColor: "rgba(242, 166, 50, 0.1)", 
                  padding: "0.15rem 0.4rem", 
                  borderRadius: "3px",
                  alignSelf: "flex-start",
                  letterSpacing: "0.05em"
                }}>SRE @ GOOGLE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CALL TO ACTION FOOTER --- */}
      <section style={{ 
        borderTop: "1px solid var(--border)",
        padding: "6rem 0",
        textAlign: "center",
        background: "radial-gradient(at 50% 100%, rgba(242, 166, 50, 0.05) 0px, transparent 60%)"
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 1.5rem" }}>
          <h2 style={{ 
            fontSize: "2.5rem", 
            fontFamily: "var(--font-display)", 
            fontWeight: 800, 
            color: "#fff", 
            marginBottom: "2rem" 
          }}>
            Your next offer starts here.
          </h2>
          
          <Link href="/setup">
            <button className="btn btn-primary" style={{ padding: "0.9rem 3rem", fontSize: "0.95rem" }}>
              BEGIN FREE
            </button>
          </Link>
          
          <div style={{ 
            marginTop: "1.5rem", 
            fontSize: "0.7rem", 
            color: "var(--muted)", 
            fontWeight: 700, 
            letterSpacing: "0.1em",
            textTransform: "uppercase"
          }}>
            INITIAL CALIBRATION TAKES 4 MINUTES
          </div>
        </div>
      </section>


    </div>
  );
}
