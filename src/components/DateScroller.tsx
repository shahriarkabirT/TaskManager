"use client";

import { getDayNumber, getDayName, getMonthName, isToday } from "@/lib/utils";

interface DateScrollerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  taskCounts: Record<string, { total: number; done: number }>;
}

export default function DateScroller({
  selectedDate,
  onSelectDate,
  taskCounts,
}: DateScrollerProps) {
  const dates: Date[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }

  function toKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  return (
    <div className="date-scroller-container">
      <div className="date-scroller-label">30-Day Schedule</div>
      <div className="date-scroller">
        {dates.map((date) => {
          const key = toKey(date);
          const count = taskCounts[key];
          const active = selectedDate === key;
          const today = isToday(date);

          return (
            <div
              key={key}
              className={`date-item ${active ? "active" : ""} ${today ? "today" : ""}`}
              onClick={() => onSelectDate(key)}
            >
              <div className="date-item-day">{getDayName(date)}</div>
              <div className="date-item-num">{getDayNumber(date)}</div>
              <div className="date-item-month">{getMonthName(date)}</div>
              {count && count.total > 0 && (
                <div className="date-item-badge">{count.total}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
