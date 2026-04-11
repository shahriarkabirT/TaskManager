"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { getTaskStats } from "@/actions/task";
import { getSessionInfo } from "@/actions/user";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    todayCount: 0,
    upcomingCount: 0,
    overdueCount: 0,
    completedThisWeek: 0,
  });
  const [userName, setUserName] = useState("");
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    async function fetchData() {
      const [s, user] = await Promise.all([
        getTaskStats(),
        getSessionInfo(),
      ]);
      if (isMounted.current) {
        setStats(s);
        setUserName(user.name);
      }
    }

    fetchData();
    const interval = setInterval(async () => {
      const s = await getTaskStats();
      if (isMounted.current) setStats(s);
    }, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="dashboard-layout">
      <button
        className="mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      <Sidebar
        stats={stats}
        userName={userName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">{children}</main>
    </div>
  );
}
