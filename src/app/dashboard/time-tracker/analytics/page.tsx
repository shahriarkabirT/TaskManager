"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { getTimeSessionsInRange } from "@/actions/timeSession";

interface SessionData {
  _id: string;
  label: string;
  date: string;
  startTime: string;
  endTime?: string;
  totalDuration: number;
  status: string;
}

type RangeMode = "daily" | "weekly" | "monthly" | "custom";

function formatHours(hours: number): string {
  if (hours < 0.01) return "0h";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekLabel(d: Date): string {
  const start = new Date(d);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString([], { month: "short", day: "numeric" })} – ${end.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

function getMonthLabel(d: Date): string {
  return d.toLocaleDateString([], { month: "long", year: "numeric" });
}

/** Group sessions into daily buckets, returning { date, hours, count } */
function groupByDay(sessions: SessionData[]): Array<{ date: string; hours: number; count: number }> {
  const map: Record<string, { hours: number; count: number }> = {};
  for (const s of sessions) {
    const dk = dateKey(new Date(s.date));
    if (!map[dk]) map[dk] = { hours: 0, count: 0 };
    map[dk].hours += s.totalDuration / 3600000;
    map[dk].count++;
  }
  return Object.entries(map)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Group sessions into weekly buckets */
function groupByWeek(sessions: SessionData[]): Array<{ label: string; hours: number; count: number }> {
  const map: Record<string, { hours: number; count: number }> = {};
  for (const s of sessions) {
    const d = new Date(s.date);
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const key = dateKey(weekStart);
    if (!map[key]) map[key] = { hours: 0, count: 0 };
    map[key].hours += s.totalDuration / 3600000;
    map[key].count++;
  }
  return Object.entries(map)
    .map(([key, data]) => ({ label: getWeekLabel(new Date(key)), ...data }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Group sessions into monthly buckets */
function groupByMonth(sessions: SessionData[]): Array<{ label: string; hours: number; count: number }> {
  const map: Record<string, { hours: number; count: number }> = {};
  for (const s of sessions) {
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map[key]) map[key] = { hours: 0, count: 0 };
    map[key].hours += s.totalDuration / 3600000;
    map[key].count++;
  }
  return Object.entries(map)
    .map(([key, data]) => ({
      label: getMonthLabel(new Date(key + "-01")),
      ...data,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export default function AnalyticsPage() {
  const [mode, setMode] = useState<RangeMode>("daily");
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  // Date range state
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return dateKey(d);
  });
  const [customEnd, setCustomEnd] = useState(() => dateKey(new Date()));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapRef = useRef<HTMLCanvasElement>(null);

  // Compute date range based on mode
  const getRange = useCallback((): { start: string; end: string } => {
    const now = new Date();
    switch (mode) {
      case "daily": {
        const s = new Date();
        s.setDate(s.getDate() - 13); // Last 14 days
        return { start: dateKey(s), end: dateKey(now) };
      }
      case "weekly": {
        const s = new Date();
        s.setDate(s.getDate() - 8 * 7); // Last ~8 weeks
        return { start: dateKey(s), end: dateKey(now) };
      }
      case "monthly": {
        const s = new Date();
        s.setMonth(s.getMonth() - 5); // Last 6 months
        return { start: dateKey(s), end: dateKey(now) };
      }
      case "custom":
        return { start: customStart, end: customEnd };
    }
  }, [mode, customStart, customEnd]);

  // Fetch sessions
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { start, end } = getRange();
      const data = await getTimeSessionsInRange(start, end);
      if (!cancelled) {
        setSessions(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getRange]);

  // ─── Compute analytics data ───────────────────────
  const dailyData = groupByDay(sessions);
  const weeklyData = groupByWeek(sessions);
  const monthlyData = groupByMonth(sessions);

  const chartData = mode === "weekly" ? weeklyData : mode === "monthly" ? monthlyData : dailyData;

  const totalHours = sessions.reduce((s, sess) => s + sess.totalDuration / 3600000, 0);
  const totalDays = dailyData.length || 1;
  const avgHoursPerDay = totalHours / totalDays;

  // Most productive day of week
  const dayOfWeekMap: Record<number, number> = {};
  for (const s of sessions) {
    const dow = new Date(s.date).getDay();
    dayOfWeekMap[dow] = (dayOfWeekMap[dow] || 0) + s.totalDuration / 3600000;
  }
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let mostProductiveDay = "—";
  let maxDayHours = 0;
  for (const [dow, hours] of Object.entries(dayOfWeekMap)) {
    if (hours > maxDayHours) {
      maxDayHours = hours;
      mostProductiveDay = dayNames[Number(dow)];
    }
  }

  // Longest session
  const longestSession = sessions.reduce(
    (max, s) => (s.totalDuration > max ? s.totalDuration : max),
    0
  );

  // ─── Draw bar chart ───────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || chartData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padding = { top: 20, right: 20, bottom: 60, left: 50 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    ctx.clearRect(0, 0, W, H);

    const maxVal = Math.max(...chartData.map((d) => d.hours), 1);
    const barW = Math.min(40, (chartW / chartData.length) * 0.6);
    const gap = (chartW - barW * chartData.length) / (chartData.length + 1);

    // Grid lines
    const gridLines = 5;
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.textAlign = "right";

    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + chartH - (chartH / gridLines) * i;
      const val = ((maxVal / gridLines) * i).toFixed(1);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();
      ctx.fillText(`${val}h`, padding.left - 8, y + 4);
    }

    // Bars with gradient
    chartData.forEach((d, i) => {
      const x = padding.left + gap + i * (barW + gap);
      const barH = (d.hours / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      const grad = ctx.createLinearGradient(x, y + barH, x, y);
      grad.addColorStop(0, "rgba(99, 102, 241, 0.9)");
      grad.addColorStop(0.5, "rgba(139, 92, 246, 0.9)");
      grad.addColorStop(1, "rgba(168, 85, 247, 0.9)");

      // Bar with rounded top
      ctx.beginPath();
      const radius = Math.min(barW / 2, 6);
      ctx.moveTo(x, y + barH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.lineTo(x + barW - radius, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
      ctx.lineTo(x + barW, y + barH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Bar glow
      ctx.shadowColor = "rgba(99, 102, 241, 0.3)";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Value on top
      if (d.hours > 0) {
        ctx.fillStyle = "rgba(241, 245, 249, 0.8)";
        ctx.font = "10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(formatHours(d.hours), x + barW / 2, y - 6);
      }

      // Label
      ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "center";

      let labelText: string;
      if ("date" in d) {
        const dt = new Date(d.date + "T00:00:00");
        labelText = dt.toLocaleDateString([], { month: "short", day: "numeric" });
      } else {
        labelText = (d as { label: string }).label;
      }

      // Rotate label if too many bars
      if (chartData.length > 8) {
        ctx.save();
        ctx.translate(x + barW / 2, padding.top + chartH + 12);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = "right";
        ctx.fillText(labelText, 0, 0);
        ctx.restore();
      } else {
        ctx.fillText(labelText, x + barW / 2, padding.top + chartH + 18);
      }
    });
  }, [chartData, loading]);

  // ─── Draw heatmap ─────────────────────────────────
  useEffect(() => {
    const canvas = heatmapRef.current;
    if (!canvas || loading) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    ctx.clearRect(0, 0, W, rect.height);

    // Build 90-day map
    const dayMap: Record<string, number> = {};
    for (const s of sessions) {
      const dk = dateKey(new Date(s.date));
      dayMap[dk] = (dayMap[dk] || 0) + s.totalDuration / 3600000;
    }

    const days = 91; // ~13 weeks
    const cellSize = Math.min(14, (W - 40) / 14);
    const cellGap = 3;
    const totalCellSize = cellSize + cellGap;

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    // Day-of-week labels
    ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "right";
    const dowLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
    dowLabels.forEach((label, i) => {
      if (label) {
        ctx.fillText(label, 28, 16 + i * totalCellSize + cellSize / 2 + 3);
      }
    });

    // Cells
    const maxHours = Math.max(...Object.values(dayMap), 1);

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dk = dateKey(d);
      const hours = dayMap[dk] || 0;
      const dow = d.getDay();

      const weekIndex = Math.floor(
        (d.getTime() - startDate.getTime() + (startDate.getDay() * 86400000)) / (7 * 86400000)
      );

      const x = 34 + weekIndex * totalCellSize;
      const y = 10 + dow * totalCellSize;

      // Skip future dates
      if (d > today) continue;

      const intensity = hours / maxHours;
      let color: string;
      if (hours === 0) {
        color = "rgba(255,255,255,0.04)";
      } else if (intensity < 0.25) {
        color = "rgba(99, 102, 241, 0.25)";
      } else if (intensity < 0.5) {
        color = "rgba(99, 102, 241, 0.45)";
      } else if (intensity < 0.75) {
        color = "rgba(139, 92, 246, 0.65)";
      } else {
        color = "rgba(168, 85, 247, 0.85)";
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, cellSize, cellSize, 3);
      ctx.fill();
    }

    // Legend
    const legendX = W - 120;
    const legendY = 10 + 7 * totalCellSize + 10;
    ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Less", legendX, legendY + cellSize / 2 + 3);

    const legendColors = [
      "rgba(255,255,255,0.04)",
      "rgba(99, 102, 241, 0.25)",
      "rgba(99, 102, 241, 0.45)",
      "rgba(139, 92, 246, 0.65)",
      "rgba(168, 85, 247, 0.85)",
    ];
    legendColors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.roundRect(legendX + 30 + i * (cellSize + 2), legendY, cellSize, cellSize, 2);
      ctx.fill();
    });

    ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
    ctx.fillText("More", legendX + 30 + legendColors.length * (cellSize + 2) + 4, legendY + cellSize / 2 + 3);
  }, [sessions, loading]);

  return (
    <>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 className="page-title">Time Analytics</h1>
            <p className="page-subtitle">Visualize your productivity trends.</p>
          </div>
          <Link href="/dashboard/time-tracker" className="tt-analytics-btn">
            ⏱ Timer
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Range Selector */}
        <div className="tt-range-selector">
          {(["daily", "weekly", "monthly", "custom"] as RangeMode[]).map((m) => (
            <button
              key={m}
              className={`tt-range-pill ${mode === m ? "active" : ""}`}
              onClick={() => setMode(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {mode === "custom" && (
          <div className="tt-custom-range">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="tt-summary-grid">
          <div className="tt-summary-card">
            <span className="tt-summary-icon">⏱</span>
            <span className="tt-summary-value">{formatHours(totalHours)}</span>
            <span className="tt-summary-label">Total Hours</span>
          </div>
          <div className="tt-summary-card">
            <span className="tt-summary-icon">📈</span>
            <span className="tt-summary-value">{formatHours(avgHoursPerDay)}</span>
            <span className="tt-summary-label">Avg / Day</span>
          </div>
          <div className="tt-summary-card">
            <span className="tt-summary-icon">💪</span>
            <span className="tt-summary-value">{mostProductiveDay}</span>
            <span className="tt-summary-label">Best Day</span>
          </div>
          <div className="tt-summary-card">
            <span className="tt-summary-icon">🏆</span>
            <span className="tt-summary-value">{formatHours(longestSession / 3600000)}</span>
            <span className="tt-summary-label">Longest Session</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="tt-chart-card">
          <h3 className="tt-chart-title">
            {mode === "daily" && "Daily Hours (Last 14 Days)"}
            {mode === "weekly" && "Weekly Hours (Last 8 Weeks)"}
            {mode === "monthly" && "Monthly Hours (Last 6 Months)"}
            {mode === "custom" && "Hours in Selected Range"}
          </h3>
          {loading ? (
            <div className="skeleton" style={{ height: 300 }} />
          ) : chartData.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <div className="empty-icon">📊</div>
              <div className="empty-title">No data yet</div>
              <div className="empty-description">Start tracking time to see your chart.</div>
            </div>
          ) : (
            <canvas ref={canvasRef} className="tt-chart-canvas" />
          )}
        </div>

        {/* Activity Heatmap */}
        <div className="tt-chart-card">
          <h3 className="tt-chart-title">Activity Heatmap (Last 90 Days)</h3>
          {loading ? (
            <div className="skeleton" style={{ height: 160 }} />
          ) : (
            <canvas ref={heatmapRef} className="tt-heatmap-canvas" />
          )}
        </div>

        {/* Daily Breakdown Table */}
        {dailyData.length > 0 && (
          <div className="tt-chart-card">
            <h3 className="tt-chart-title">Daily Breakdown</h3>
            <div className="tt-table-wrap">
              <table className="tt-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Hours</th>
                    <th>Sessions</th>
                    <th>Avg Session</th>
                  </tr>
                </thead>
                <tbody>
                  {[...dailyData].reverse().map((d) => (
                    <tr key={d.date}>
                      <td>
                        {new Date(d.date + "T00:00:00").toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="tt-table-hours">{formatHours(d.hours)}</td>
                      <td>{d.count}</td>
                      <td>{formatHours(d.hours / d.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
