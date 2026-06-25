"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  startTimeSession,
  pauseTimeSession,
  resumeTimeSession,
  stopTimeSession,
  getActiveTimeSession,
  getTimeSessionsByDate,
  deleteTimeSession,
  getTimeStats,
} from "@/actions/timeSession";

interface BreakEntry {
  pausedAt: string;
  resumedAt?: string;
}

interface SessionData {
  _id: string;
  label: string;
  startTime: string;
  endTime?: string;
  breaks: BreakEntry[];
  totalDuration: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
}

interface TimeStatsData {
  todayHours: number;
  weekHours: number;
  streak: number;
  sessionsToday: number;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatHours(hours: number): string {
  if (hours < 0.01) return "0h";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function RenderHours({ hours }: { hours: number }) {
  if (hours < 0.01) {
    return (
      <>
        0<span className="stat-unit">h</span>
      </>
    );
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) {
    return (
      <>
        {m}
        <span className="stat-unit">m</span>
      </>
    );
  }
  if (m === 0) {
    return (
      <>
        {h}
        <span className="stat-unit">h</span>
      </>
    );
  }
  return (
    <>
      {h}
      <span className="stat-unit">h</span> {m}
      <span className="stat-unit">m</span>
    </>
  );
}

/** Calculate elapsed working ms for a live session (excluding breaks) */
function calcLiveElapsed(session: SessionData): number {
  const now = Date.now();
  const start = new Date(session.startTime).getTime();
  const totalElapsed = now - start;

  let breakMs = 0;
  for (const b of session.breaks) {
    const resumed = b.resumedAt ? new Date(b.resumedAt).getTime() : now;
    breakMs += resumed - new Date(b.pausedAt).getTime();
  }

  return Math.max(0, totalElapsed - breakMs);
}

export default function TimeTrackerPage() {
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [todaySessions, setTodaySessions] = useState<SessionData[]>([]);
  const [stats, setStats] = useState<TimeStatsData>({
    todayHours: 0,
    weekHours: 0,
    streak: 0,
    sessionsToday: 0,
  });
  const [, setTick] = useState(0); // Re-render trigger for live timer
  const [label, setLabel] = useState("");
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  // ─── Shared data fetch (for event handlers) ───────
  async function refreshData() {
    const [active, sessions, s] = await Promise.all([
      getActiveTimeSession(),
      getTimeSessionsByDate(todayKey()),
      getTimeStats(),
    ]);
    if (!isMounted.current) return;
    setActiveSession(active);
    setTodaySessions(sessions.filter((sess: SessionData) => sess.status === "COMPLETED"));
    setStats(s);
    setLoading(false);
  }

  // ─── Initial data load (inline async to satisfy React 19) ─
  useEffect(() => {
    isMounted.current = true;
    let cancelled = false;

    async function loadInitial() {
      const [active, sessions, s] = await Promise.all([
        getActiveTimeSession(),
        getTimeSessionsByDate(todayKey()),
        getTimeStats(),
      ]);
      if (cancelled) return;
      setActiveSession(active);
      setTodaySessions(sessions.filter((sess: SessionData) => sess.status === "COMPLETED"));
      setStats(s);
      setLoading(false);
    }

    loadInitial();
    return () => {
      isMounted.current = false;
      cancelled = true;
    };
  }, []);

  // ─── Live timer tick (subscription pattern only) ──
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);

    if (activeSession && activeSession.status === "ACTIVE") {
      tickRef.current = setInterval(() => {
        if (isMounted.current) {
          setTick((t) => t + 1); // Trigger re-render; elapsed computed inline
        }
      }, 1000);
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [activeSession]);

  // Elapsed is always computed inline — never stored in state
  const elapsed = activeSession ? calcLiveElapsed(activeSession) : 0;

  // ─── Actions ──────────────────────────────────────
  async function handleStart() {
    if (showLabelInput) {
      setActionLoading(true);
      await startTimeSession(label || undefined);
      setLabel("");
      setShowLabelInput(false);
      setActionLoading(false);
      refreshData();
    } else {
      setShowLabelInput(true);
    }
  }

  async function handleQuickStart() {
    setActionLoading(true);
    await startTimeSession(label || undefined);
    setLabel("");
    setShowLabelInput(false);
    setActionLoading(false);
    refreshData();
  }

  async function handlePause() {
    if (!activeSession) return;
    setActionLoading(true);
    await pauseTimeSession(activeSession._id);
    setActionLoading(false);
    refreshData();
  }

  async function handleResume() {
    if (!activeSession) return;
    setActionLoading(true);
    await resumeTimeSession(activeSession._id);
    setActionLoading(false);
    refreshData();
  }

  async function handleStop() {
    if (!activeSession) return;
    setActionLoading(true);
    await stopTimeSession(activeSession._id);
    setActionLoading(false);
    refreshData();
  }

  async function handleDelete(id: string) {
    await deleteTimeSession(id);
    setDeleteConfirm(null);
    refreshData();
  }

  // ─── Compute today total ──────────────────────────
  const todayTotalMs = todaySessions.reduce((s, sess) => s + sess.totalDuration, 0);

  // ─── Determine timer state ────────────────────────
  const isActive = activeSession?.status === "ACTIVE";
  const isPaused = activeSession?.status === "PAUSED";
  const isIdle = !activeSession;

  return (
    <>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 className="page-title">Time Tracker</h1>
            <p className="page-subtitle">Track your work sessions and analyze productivity.</p>
          </div>
          <Link href="/dashboard/time-tracker/analytics" className="tt-analytics-btn">
            📊 Analytics
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* ─── Stats Cards ─── */}
        <div className="stats-grid tt-stats-grid">
          <div className="stat-card today">
            <div className="stat-icon">⏱</div>
            <div className="stat-value"><RenderHours hours={stats.todayHours} /></div>
            <div className="stat-label">Today&apos;s Hours</div>
          </div>
          <div className="stat-card upcoming">
            <div className="stat-icon">📊</div>
            <div className="stat-value"><RenderHours hours={stats.weekHours} /></div>
            <div className="stat-label">This Week</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-icon">🔥</div>
            <div className="stat-value">{stats.streak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
          <div className="stat-card" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #f59e0b, #f97316)" }} />
            <div className="stat-icon">📅</div>
            <div className="stat-value" style={{ color: "var(--status-pending)" }}>{stats.sessionsToday}</div>
            <div className="stat-label">Sessions Today</div>
          </div>
        </div>

        {/* ─── Timer Panel ─── */}
        <div className={`tt-timer-panel ${isActive ? "active" : ""} ${isPaused ? "paused" : ""}`}>
          {/* Animated ring */}
          <div className={`tt-timer-ring ${isActive ? "active" : ""} ${isPaused ? "paused" : ""}`}>
            <div className="tt-timer-display">
              <span className="tt-timer-digits">{formatDurationMs(elapsed)}</span>
              <span className="tt-timer-state">
                {isActive && "Working"}
                {isPaused && "Paused"}
                {isIdle && "Ready"}
              </span>
            </div>
          </div>

          {/* Session info */}
          {activeSession && (
            <div className="tt-session-info">
              {activeSession.label && (
                <span className="tt-session-label">📝 {activeSession.label}</span>
              )}
              <span className="tt-session-meta">
                Started at {formatTime(activeSession.startTime)}
                {activeSession.breaks.length > 0 && ` · ${activeSession.breaks.length} break${activeSession.breaks.length > 1 ? "s" : ""}`}
              </span>
            </div>
          )}

          {/* Label input */}
          {showLabelInput && isIdle && (
            <div className="tt-label-input-wrap">
              <input
                type="text"
                className="form-input tt-label-input"
                placeholder="What are you working on? (optional)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleQuickStart();
                }}
                autoFocus
              />
            </div>
          )}

          {/* Controls */}
          <div className="tt-controls">
            {isIdle && !showLabelInput && (
              <button className="tt-btn tt-btn-start" onClick={handleStart} disabled={actionLoading}>
                <span className="tt-btn-icon">▶</span> Start
              </button>
            )}
            {isIdle && showLabelInput && (
              <>
                <button className="tt-btn tt-btn-start" onClick={handleQuickStart} disabled={actionLoading}>
                  <span className="tt-btn-icon">▶</span> Start
                </button>
                <button className="tt-btn tt-btn-cancel" onClick={() => { setShowLabelInput(false); setLabel(""); }}>
                  Cancel
                </button>
              </>
            )}
            {isActive && (
              <>
                <button className="tt-btn tt-btn-pause" onClick={handlePause} disabled={actionLoading}>
                  <span className="tt-btn-icon">⏸</span> Pause
                </button>
                <button className="tt-btn tt-btn-stop" onClick={handleStop} disabled={actionLoading}>
                  <span className="tt-btn-icon">⏹</span> Stop
                </button>
              </>
            )}
            {isPaused && (
              <>
                <button className="tt-btn tt-btn-resume" onClick={handleResume} disabled={actionLoading}>
                  <span className="tt-btn-icon">▶</span> Resume
                </button>
                <button className="tt-btn tt-btn-stop" onClick={handleStop} disabled={actionLoading}>
                  <span className="tt-btn-icon">⏹</span> Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* ─── Today's Sessions ─── */}
        <div className="tt-sessions-section">
          <div className="section-header">
            <h2 className="section-title">Today&apos;s Sessions</h2>
            {todaySessions.length > 0 && (
              <span className="tt-total-badge">
                Total: {formatDurationMs(todayTotalMs)}
              </span>
            )}
          </div>

          {loading ? (
            <div className="task-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 72, marginBottom: 10 }} />
              ))}
            </div>
          ) : todaySessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⏱</div>
              <div className="empty-title">No sessions yet</div>
              <div className="empty-description">
                Start tracking your time to see your sessions here.
              </div>
            </div>
          ) : (
            <div className="task-list">
              {todaySessions.map((session) => (
                <div key={session._id} className="tt-session-card">
                  <div className="tt-session-card-left">
                    <div className="tt-session-card-icon">✅</div>
                    <div className="tt-session-card-content">
                      <div className="tt-session-card-title">
                        {session.label || "Work Session"}
                      </div>
                      <div className="tt-session-card-meta">
                        {formatTime(session.startTime)}
                        {session.endTime && ` → ${formatTime(session.endTime)}`}
                        {session.breaks.length > 0 && ` · ${session.breaks.length} break${session.breaks.length > 1 ? "s" : ""}`}
                      </div>
                    </div>
                  </div>
                  <div className="tt-session-card-right">
                    <span className="tt-session-card-duration">
                      {formatDurationMs(session.totalDuration)}
                    </span>
                    <button
                      className="task-action-btn delete"
                      onClick={() => setDeleteConfirm(session._id)}
                      title="Delete session"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Delete Confirm ─── */}
      {deleteConfirm && (
        <div className="confirm-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-title">Delete Session?</div>
            <div className="confirm-message">
              This action cannot be undone. The session data will be permanently removed.
            </div>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
