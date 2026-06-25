"use client";

import { useState, useEffect, useRef } from "react";

interface CalendarPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function formatPreview(value: string): string {
  if (!value) return "";
  const d = new Date(value + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toYMD(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarPicker({
  value,
  onChange,
  placeholder = "Set deadline",
  disabled = false,
}: CalendarPickerProps) {
  const today = new Date();
  const todayStr = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.split("-")[0]) : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split("-")[1]) - 1 : today.getMonth());
  const [prevValue, setPrevValue] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Derived-state pattern (React 19 safe): sync view to the selected date during render,
  // not in a useEffect. This avoids the "cascading renders" lint error.
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      setViewYear(parseInt(value.split("-")[0]));
      setViewMonth(parseInt(value.split("-")[1]) - 1);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Build 6-row grid
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { dateStr: string; label: number; isCurrentMonth: boolean }[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ dateStr: toYMD(y, m, d), label: d, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateStr: toYMD(viewYear, viewMonth, d), label: d, isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ dateStr: toYMD(y, m, d), label: d, isCurrentMonth: false });
  }

  const hasValue = !!value;
  const preview = hasValue ? formatPreview(value) : placeholder;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* ─── Trigger Button ─── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 14px",
          background: hasValue ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${hasValue ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: "10px",
          cursor: disabled ? "not-allowed" : "pointer",
          color: hasValue ? "#a5b4fc" : "#94a3b8",
          fontSize: "0.85rem",
          fontWeight: 500,
          whiteSpace: "nowrap",
          transition: "all 0.2s ease",
          opacity: disabled ? 0.5 : 1,
          fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: "1rem" }}>📅</span>
        <span>{preview}</span>
        {hasValue && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            style={{
              marginLeft: "4px",
              color: "#64748b",
              fontSize: "0.8rem",
              cursor: "pointer",
              padding: "0 4px",
              borderRadius: "4px",
              lineHeight: 1,
            }}
            title="Clear"
          >
            ✕
          </span>
        )}
      </button>

      {/* ─── Dropdown Calendar ─── */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 9999,
            width: "300px",
            padding: "16px",
            background: "rgba(10, 14, 26, 0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)",
            animation: "calFadeIn 0.18s ease",
          }}
        >
          {/* Month / Year header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <button
              type="button"
              onClick={prevMonth}
              style={{
                width: "30px", height: "30px", borderRadius: "8px",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s ease", fontFamily: "inherit",
              }}
            >
              ◀
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f1f5f9" }}>
                {MONTH_NAMES[viewMonth]}
              </span>
              <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#6366f1" }}>
                {viewYear}
              </span>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              style={{
                width: "30px", height: "30px", borderRadius: "8px",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s ease", fontFamily: "inherit",
              }}
            >
              ▶
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "8px" }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{
                textAlign: "center", fontSize: "0.72rem", fontWeight: 700,
                color: "#475569", paddingBottom: "6px",
                letterSpacing: "0.04em",
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
            {cells.map((cell, idx) => {
              const isSelected = cell.dateStr === value;
              const isToday = cell.dateStr === todayStr;
              const isPast = cell.dateStr < todayStr && cell.isCurrentMonth;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { onChange(cell.dateStr); setIsOpen(false); }}
                  style={{
                    aspectRatio: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.82rem",
                    fontWeight: isSelected ? 700 : isToday ? 700 : 400,
                    borderRadius: "8px",
                    border: isSelected
                      ? "none"
                      : isToday
                      ? "1.5px solid rgba(99,102,241,0.6)"
                      : "1px solid transparent",
                    cursor: "pointer",
                    background: isSelected
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "transparent",
                    color: isSelected
                      ? "#fff"
                      : isToday
                      ? "#818cf8"
                      : cell.isCurrentMonth
                        ? isPast ? "#475569" : "#cbd5e1"
                        : "#334155",
                    transition: "all 0.12s ease",
                    fontFamily: "inherit",
                    boxShadow: isSelected ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.15)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#a5b4fc";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = isToday
                        ? "#818cf8"
                        : cell.isCurrentMonth
                          ? isPast ? "#475569" : "#cbd5e1"
                          : "#334155";
                    }
                  }}
                >
                  {cell.label}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={goToToday}
              style={{
                background: "none", border: "none", color: "#6366f1",
                fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                padding: "4px 8px", borderRadius: "6px", fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(""); setIsOpen(false); }}
                style={{
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                  color: "#f87171", fontSize: "0.78rem", fontWeight: 500,
                  cursor: "pointer", padding: "4px 10px", borderRadius: "6px",
                  fontFamily: "inherit",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes calFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
