"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Read auth credentials on mount and pathname updates
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("prepora_user_id"));
      setUserName(localStorage.getItem("prepora_user_name"));
    }
  }, [pathname]);

  const handleSignOut = () => {
    localStorage.removeItem("prepora_user_id");
    localStorage.removeItem("prepora_user_name");
    setUserId(null);
    setUserName(null);
    router.push("/");
  };

  if (pathname === "/signup") return null;

  return (
    <header className="navbar">
      <Link href="/">
        <div className="logo" style={{ cursor: "pointer" }}>
          <span className="logo-icon" />
          <span>PREPORA</span>
        </div>
      </Link>
      
      <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        <Link href={userId ? "/dashboard" : "/signup"} className={`nav-link ${pathname === "/dashboard" ? "nav-link-active" : ""}`}>
          Modules
        </Link>
        <Link href="/setup" className={`nav-link ${pathname === "/setup" ? "nav-link-active" : ""}`}>
          Simulations
        </Link>
        <Link href="/setup" className="nav-link">
          Calibration
        </Link>
        <a href="#pricing" className="nav-link">
          Pricing
        </a>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        {userId ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#fff", fontWeight: 600 }}>
              <div style={{ 
                width: "24px", 
                height: "24px", 
                borderRadius: "50%", 
                background: "var(--primary-glow)", 
                border: "1px solid var(--primary)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: "var(--primary)"
              }}>
                <User size={12} />
              </div>
              <span style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userName || "Operator"}
              </span>
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", display: "inline-flex", gap: "0.25rem", border: "1px solid var(--border)", color: "var(--muted)" }}
              onClick={handleSignOut}
            >
              <LogOut size={12} /> Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted)" }} className="nav-link">
              Sign In
            </Link>
            <Link href="/signup">
              <button className="btn btn-primary" style={{ padding: "0.45rem 1.25rem", fontSize: "0.75rem", borderRadius: "4px" }}>
                Start Forging
              </button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
