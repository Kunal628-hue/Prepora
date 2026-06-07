"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Settings, LogOut } from "lucide-react";
import { useNotifications } from "./NotificationContext";

interface DashboardHeaderProps {
  activeTab?: "home" | "practice" | "mock" | "negotiation" | "progress" | "none";
  style?: React.CSSProperties;
}

export default function DashboardHeader({ activeTab = "none", style }: DashboardHeaderProps) {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    showNotifications, 
    setShowNotifications, 
    markAllAsRead 
  } = useNotifications();

  const [userName, setUserName] = useState("Arjun");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [targetSkills, setTargetSkills] = useState<string[]>([]);
  const [lightMode, setLightMode] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("prepora_user_name");
      if (storedName) {
        setUserName(storedName);
      }
      const storedId = localStorage.getItem("prepora_user_id");
      if (storedId) {
        fetch(`http://127.0.0.1:8000/api/users/${storedId}`)
          .then(res => {
            if (res.ok) return res.json();
            throw new Error("Failed to load user settings");
          })
          .then(data => {
            if (data.role_targeting) {
              setTargetRole(data.role_targeting);
              localStorage.setItem("prepora_target_role", data.role_targeting);
            }
            if (data.target_companies) {
              setTargetCompanies(data.target_companies);
              localStorage.setItem("prepora_target_companies", JSON.stringify(data.target_companies));
            }
            if (data.skills) {
              setTargetSkills(data.skills);
              localStorage.setItem("prepora_target_skills", JSON.stringify(data.skills));
            }
          })
          .catch(err => {
            console.error("Using local fallbacks for settings:", err);
            const localRole = localStorage.getItem("prepora_target_role") || "Software Engineer";
            setTargetRole(localRole);
            try {
              setTargetCompanies(JSON.parse(localStorage.getItem("prepora_target_companies") || "[]"));
              setTargetSkills(JSON.parse(localStorage.getItem("prepora_target_skills") || "[]"));
            } catch {}
          });
      }
      const theme = localStorage.getItem("prepora_theme");
      setLightMode(theme !== "dark");
    }
  }, []);

  const saveSettingsToBackend = async (
    updatedRole = targetRole, 
    updatedCompanies = targetCompanies, 
    updatedSkills = targetSkills
  ) => {
    const storedId = localStorage.getItem("prepora_user_id");
    if (!storedId) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${storedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role_targeting: updatedRole,
          skills: updatedSkills,
          target_companies: updatedCompanies
        })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("prepora_target_role", data.role_targeting || "");
        localStorage.setItem("prepora_target_companies", JSON.stringify(data.target_companies || []));
        localStorage.setItem("prepora_target_skills", JSON.stringify(data.skills || []));
        window.dispatchEvent(new Event("prepora_settings_updated"));
      }
    } catch (e) {
      console.error("Error saving user settings to backend:", e);
    }
  };

  const handleCompanyToggle = (company: string) => {
    const nextCompanies = targetCompanies.includes(company)
      ? targetCompanies.filter(c => c !== company)
      : [...targetCompanies, company];
    setTargetCompanies(nextCompanies);
    saveSettingsToBackend(targetRole, nextCompanies, targetSkills);
  };

  const handleSkillToggle = (skill: string) => {
    const nextSkills = targetSkills.includes(skill)
      ? targetSkills.filter(s => s !== skill)
      : [...targetSkills, skill];
    setTargetSkills(nextSkills);
    saveSettingsToBackend(targetRole, targetCompanies, nextSkills);
  };

  const handleSignOut = () => {
    localStorage.removeItem("prepora_user_id");
    localStorage.removeItem("prepora_user_name");
    router.push("/");
  };

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
    setShowUserMenu(false);
    setShowSettingsMenu(false);
  };

  const toggleSettings = () => {
    setShowSettingsMenu(prev => !prev);
    setShowNotifications(false);
    setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(prev => !prev);
    setShowNotifications(false);
    setShowSettingsMenu(false);
  };

  return (
    <header className="dash-header" style={{ position: "relative", ...style }}>
      {/* Premium Keyframes and Styles */}
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .premium-dropdown {
          animation: fadeInScale 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top right;
        }
        .settings-input:focus {
          border-color: #dea63b !important;
          box-shadow: 0 0 0 3px rgba(222, 166, 59, 0.15);
        }
        .header-dropdown-item:hover {
          background-color: #faf9f6;
        }
      `}</style>

      <Link href="/dashboard" className="dash-logo-wrap" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="dashLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#dea63b" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <linearGradient id="dashGlowGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#dea63b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" fill="url(#dashGlowGrad)" stroke="rgba(222, 166, 59, 0.2)" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="10" y="8" width="4" height="16" rx="2" fill="url(#dashLogoGrad)" />
          <path d="M14 8 H19 C22.3 8 25 10.7 25 14 C25 17.3 22.3 20 19 20 H14" stroke="url(#dashLogoGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 11 L18 14 L15 17" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="dash-logo-text" style={{ fontSize: "1.2rem", fontWeight: 800 }}>Prepora</span>
      </Link>

      <nav className="dash-nav">
        <span 
          className={`dash-nav-link ${activeTab === "home" ? "active" : ""}`} 
          style={{ cursor: "pointer" }} 
          onClick={() => router.push("/dashboard")}
        >
          Home
        </span>
        <span 
          className={`dash-nav-link ${activeTab === "practice" ? "active" : ""}`} 
          style={{ cursor: "pointer" }} 
          onClick={() => router.push("/practice")}
        >
          Practice
        </span>
        <span 
          className={`dash-nav-link ${activeTab === "mock" ? "active" : ""}`} 
          style={{ cursor: "pointer" }} 
          onClick={() => router.push("/setup")}
        >
          Mock Interview
        </span>
        <span 
          className={`dash-nav-link ${activeTab === "negotiation" ? "active" : ""}`} 
          style={{ cursor: "pointer" }} 
          onClick={() => router.push("/negotiate")}
        >
          Negotiation
        </span>
        <span 
          className={`dash-nav-link ${activeTab === "progress" ? "active" : ""}`} 
          style={{ cursor: "pointer" }} 
          onClick={() => router.push("/progress")}
        >
          Progress
        </span>
      </nav>

      <div className="dash-header-actions" style={{ position: "relative", display: "flex", gap: "1rem", alignItems: "center" }}>
        
        {/* Notifications Button */}
        <button 
          className="dash-icon-btn" 
          aria-label="Notifications" 
          onClick={toggleNotifications}
          style={{ position: "relative", background: "none", border: "none", cursor: "pointer" }}
        >
          <Bell size={18} style={{ color: unreadCount > 0 ? "var(--primary)" : "#888" }} />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: "1px", right: "1px", width: "6px", height: "6px", background: "#ef4444", borderRadius: "50%" }} />
          )}
        </button>

        {showNotifications && (
          <div className="premium-dropdown" style={{ 
            position: "absolute", 
            top: "2.8rem", 
            right: 0, 
            width: "320px", 
            background: "rgba(255, 255, 255, 0.96)", 
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(222, 166, 59, 0.25)", 
            borderRadius: "14px", 
            boxShadow: "0 10px 25px rgba(28,25,23,0.06), 0 3px 10px rgba(222,166,59,0.02)", 
            padding: "1rem", 
            zIndex: 1100, 
            display: "flex", 
            flexDirection: "column", 
            gap: "0.75rem" 
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e8e5de", paddingBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1c1917" }}>Notifications</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}
              >
                Mark all as read
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "220px", overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <span style={{ fontSize: "0.74rem", color: "var(--muted)", textAlign: "center", padding: "1rem 0" }}>No notifications</span>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #f0ede6", paddingBottom: "0.5rem", alignItems: "flex-start", opacity: notif.read ? 0.6 : 1 }}>
                    <span style={{ fontSize: "0.9rem" }}>{notif.icon}</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", textAlign: "left" }}>
                      <span style={{ fontSize: "0.74rem", color: "#1c1917", fontWeight: notif.read ? 500 : 700, lineHeight: 1.3 }}>
                        {notif.text}
                      </span>
                      <span style={{ fontSize: "0.62rem", color: "var(--muted)" }}>{notif.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Settings Button */}
        <button 
          className="dash-icon-btn" 
          style={{ background: "none", border: "none", cursor: "pointer" }} 
          aria-label="Settings" 
          onClick={toggleSettings}
        >
          <Settings size={18} />
        </button>

        {showSettingsMenu && (
          <div className="premium-dropdown" style={{ 
            position: "absolute", 
            top: "2.8rem", 
            right: "2rem", 
            width: "300px", 
            background: "rgba(255, 255, 255, 0.96)", 
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(222, 166, 59, 0.25)", 
            borderRadius: "14px", 
            boxShadow: "0 10px 25px rgba(28,25,23,0.06), 0 3px 10px rgba(222,166,59,0.02)", 
            padding: "1.25rem", 
            zIndex: 1100, 
            display: "flex", 
            flexDirection: "column", 
            gap: "0.85rem",
            color: "#1c1917"
          }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 800 }}>Workspace Settings</div>
            <div style={{ height: "1px", background: "#f0ede6" }} />
            
            {/* Target Role input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.05em" }}>TARGET ROLE</label>
              <input 
                type="text" 
                value={targetRole} 
                onChange={(e) => setTargetRole(e.target.value)}
                onBlur={() => saveSettingsToBackend()}
                className="settings-input"
                placeholder="Software Engineer"
                style={{ 
                  fontSize: "0.78rem", 
                  padding: "0.5rem 0.75rem", 
                  border: "1px solid #e8e5de", 
                  borderRadius: "8px",
                  background: "#ffffff",
                  outline: "none",
                  transition: "all 0.2s"
                }} 
              />
            </div>

            {/* Target Companies */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.05em" }}>TARGET COMPANIES</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {["Google", "Amazon", "Microsoft", "Flipkart"].map((company) => {
                  const isChecked = targetCompanies.includes(company);
                  return (
                    <button 
                      key={company}
                      type="button"
                      onClick={() => handleCompanyToggle(company)}
                      style={{ 
                        padding: "0.3rem 0.65rem", 
                        fontSize: "0.72rem", 
                        fontWeight: 700, 
                        border: isChecked ? "1px solid #dea63b" : "1px solid #e8e5de", 
                        background: isChecked ? "rgba(222, 166, 59, 0.08)" : "#ffffff",
                        color: isChecked ? "#dea63b" : "#6b6661",
                        borderRadius: "8px",
                        cursor: "pointer",
                        outline: "none",
                        transition: "all 0.15s"
                      }}
                    >
                      {company}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Skills */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.05em" }}>FOCUS SKILLS</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {["React", "Python", "DSA", "System Design", "SQL"].map((skill) => {
                  const isSelected = targetSkills.includes(skill);
                  return (
                    <button 
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      style={{ 
                        padding: "0.3rem 0.65rem", 
                        fontSize: "0.72rem", 
                        fontWeight: 700, 
                        border: isSelected ? "1px solid #dea63b" : "1px solid #e8e5de", 
                        background: isSelected ? "rgba(222, 166, 59, 0.08)" : "#ffffff",
                        color: isSelected ? "#dea63b" : "#6b6661",
                        borderRadius: "8px",
                        cursor: "pointer",
                        outline: "none",
                        transition: "all 0.15s"
                      }}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ height: "1px", background: "#f0ede6" }} />

            {/* Switch Toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700 }}>Force Light Mode</span>
              <div 
                onClick={() => {
                  const nextLight = !lightMode;
                  setLightMode(nextLight);
                  if (nextLight) {
                    document.documentElement.classList.add("light-theme");
                    document.body.classList.add("light-theme");
                    localStorage.setItem("prepora_theme", "light");
                  } else {
                    document.documentElement.classList.remove("light-theme");
                    document.body.classList.remove("light-theme");
                    localStorage.setItem("prepora_theme", "dark");
                  }
                  window.dispatchEvent(new Event("prepora_settings_updated"));
                }}
                style={{ 
                  width: "38px", 
                  height: "20px", 
                  background: lightMode ? "#dea63b" : "#ccc", 
                  borderRadius: "10px", 
                  position: "relative", 
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
              >
                <div style={{ 
                  width: "16px", 
                  height: "16px", 
                  background: "#ffffff", 
                  borderRadius: "50%", 
                  position: "absolute", 
                  top: "2px", 
                  left: lightMode ? "20px" : "2px",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                }} />
              </div>
            </div>
          </div>
        )}

        {/* User Profile Avatar */}
        <div className="dash-avatar" style={{ cursor: "pointer" }} onClick={toggleUserMenu} title="User Profile">
          {userName.charAt(0).toUpperCase()}
        </div>

        {showUserMenu && (
          <div className="premium-dropdown" style={{ 
            position: "absolute", 
            top: "2.8rem", 
            right: 0, 
            width: "200px", 
            background: "rgba(255, 255, 255, 0.96)", 
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(222, 166, 59, 0.25)", 
            borderRadius: "14px", 
            boxShadow: "0 10px 25px rgba(28,25,23,0.06), 0 3px 10px rgba(222,166,59,0.02)", 
            padding: "0.75rem", 
            zIndex: 1100, 
            display: "flex", 
            flexDirection: "column", 
            gap: "0.5rem" 
          }}>
            <div style={{ padding: "0.25rem 0.5rem" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1c1917", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{userName}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "0.1rem" }}>Prepora Member</div>
            </div>
            <div style={{ height: "1px", background: "#f0ede6", margin: "0.25rem 0" }} />
            <button 
              onClick={handleSignOut}
              className="header-dropdown-item"
              style={{ 
                width: "100%", 
                background: "none", 
                border: "none", 
                textAlign: "left", 
                padding: "0.5rem", 
                fontSize: "0.78rem", 
                fontWeight: 700, 
                color: "#ef4444", 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                borderRadius: "6px",
                transition: "background-color 0.15s"
              }}
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
