"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { getTaskStats } from "@/actions/task";

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
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    async function fetchStats() {
      const s = await getTaskStats();
      if (isMounted.current) setStats(s);
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000);

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
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">{children}</main>
    </div>
  );
}
