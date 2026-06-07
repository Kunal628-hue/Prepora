"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface NotificationItem {
  id: string;
  text: string;
  time: string;
  read: boolean;
  icon: string;
}

interface NotificationContextProps {
  notifications: NotificationItem[];
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  markAllAsRead: () => void;
  addNotification: (text: string, icon?: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("prepora_notifications");
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing stored notifications:", e);
        }
      } else {
        // Seed initial notifications to match old static state
        const initial = [
          { id: "1", text: "🎯 Profile analyzed: Match score is 75% for Software Engineer", time: "5m ago", read: false, icon: "🎯" },
          { id: "2", text: "💼 Offer simulator loaded: Initial base offer is $120,000", time: "10m ago", read: false, icon: "💼" },
          { id: "3", text: "💡 Interview Copilot hints are fully updated and ready", time: "15m ago", read: true, icon: "💡" }
        ];
        setNotifications(initial);
        localStorage.setItem("prepora_notifications", JSON.stringify(initial));
      }
    }
  }, []);

  // Listen for WebSocket notifications
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      console.log("Connecting to WebSocket notifications...");
      
      // Establish WS connection to the FastAPI backend
      socket = new WebSocket("ws://127.0.0.1:8000/api/notifications/ws");

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.text) {
            const newNotif: NotificationItem = {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
              text: data.text,
              time: "Just now",
              read: false,
              icon: data.icon || "🔔"
            };
            setNotifications((prev) => {
              const updated = [newNotif, ...prev];
              localStorage.setItem("prepora_notifications", JSON.stringify(updated));
              return updated;
            });
          }
        } catch (e) {
          console.error("Error parsing incoming WebSocket message:", e);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed. Reconnecting in 5s...");
        if (isMounted) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket encountered an error:", err);
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem("prepora_notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const addNotification = (text: string, icon = "🔔") => {
    const newNotif: NotificationItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      text,
      time: "Just now",
      read: false,
      icon
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev];
      localStorage.setItem("prepora_notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showNotifications,
        setShowNotifications,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
