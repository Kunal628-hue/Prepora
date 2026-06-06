"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Normalize pathname to handle trailing slashes robustly
  const normalizedPath = pathname.replace(/\/$/, "");

  // Pages that need a full-screen dynamic view without global headers/footers and margins
  const isFullScreen = 
    normalizedPath === "/dashboard" || 
    normalizedPath.startsWith("/practice") ||
    normalizedPath === "/progress" ||
    normalizedPath === "/login" ||
    normalizedPath === "/signup" ||
    normalizedPath === "/setup" ||
    normalizedPath.startsWith("/interview") || 
    normalizedPath.startsWith("/report");

  // Determine if this is a light-themed cream page
  const isLightPage = 
    normalizedPath === "/dashboard" || 
    normalizedPath.startsWith("/practice") ||
    normalizedPath === "/progress" ||
    normalizedPath === "/login" ||
    normalizedPath === "/signup" ||
    normalizedPath === "/setup" ||
    normalizedPath.startsWith("/report");

  // Dynamically toggle the light-theme class on html and body tags
  useEffect(() => {
    if (isLightPage) {
      document.documentElement.classList.add("light-theme");
      document.body.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
      document.body.classList.remove("light-theme");
    }
  }, [isLightPage]);

  if (isFullScreen) {
    const bgStyle = isLightPage ? "#f8f6f1" : "var(--background)";
    return (
      <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", background: bgStyle, overflowX: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container">
        {children}
      </main>
      <footer style={{ borderTop: "1px solid var(--border)", padding: "1.5rem 2rem", textAlign: "center", fontSize: "0.8rem", color: "var(--muted)" }}>
        <p>© {new Date().getFullYear()} Prepora. All rights reserved. Powered by Llama & Gemini Flash.</p>
      </footer>
    </>
  );
}
