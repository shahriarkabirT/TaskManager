"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";

interface SidebarProps {
  stats: {
    todayCount: number;
    upcomingCount: number;
    overdueCount: number;
    completedThisWeek: number;
  };
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ stats, userName, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: "🏠",
      badge: null,
      exact: true,
    },
    {
      href: "/dashboard/today",
      label: "Today's Focus",
      icon: "🎯",
      badge: stats.todayCount > 0 ? stats.todayCount : null,
      badgeClass: "",
    },
    {
      href: "/dashboard/upcoming",
      label: "Upcoming",
      icon: "📅",
      badge: stats.upcomingCount > 0 ? stats.upcomingCount : null,
      badgeClass: "",
    },
    {
      href: "/dashboard/overdue",
      label: "Overdue",
      icon: "⚠️",
      badge: stats.overdueCount > 0 ? stats.overdueCount : null,
      badgeClass: "overdue",
    },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  // Get initials for avatar
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">📋</span>
            Task Organizer
          </div>
        </div>

        {/* User Info */}
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userName}
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
              }}
            >
              Freelancer
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Navigation</span>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive(item.href, item.exact) ? "active" : ""}`}
              onClick={onClose}
            >
              <span className="nav-link-icon">{item.icon}</span>
              {item.label}
              {item.badge !== null && (
                <span className={`nav-badge ${item.badgeClass || ""}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          <span className="sidebar-section-label" style={{ marginTop: 8 }}>
            Quick Stats
          </span>
          <div
            style={{
              padding: "12px 16px",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              lineHeight: 1.8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>✅ Completed this week</span>
              <span style={{ color: "var(--status-done)", fontWeight: 700 }}>
                {stats.completedThisWeek}
              </span>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <form action={logoutAction}>
            <button type="submit" className="logout-btn">
              <span className="nav-link-icon">🚪</span>
              Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
