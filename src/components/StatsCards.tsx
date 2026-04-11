interface StatsCardsProps {
  stats: {
    todayCount: number;
    upcomingCount: number;
    overdueCount: number;
    completedThisWeek: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      className: "today",
      icon: "🎯",
      value: stats.todayCount,
      label: "Today's Tasks",
    },
    {
      className: "upcoming",
      icon: "📅",
      value: stats.upcomingCount,
      label: "Upcoming (7d)",
    },
    {
      className: "overdue",
      icon: "⚠️",
      value: stats.overdueCount,
      label: "Overdue",
    },
    {
      className: "completed",
      icon: "✅",
      value: stats.completedThisWeek,
      label: "Done This Week",
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <div key={card.className} className={`stat-card ${card.className}`}>
          <div className="stat-icon">{card.icon}</div>
          <div className="stat-value">{card.value}</div>
          <div className="stat-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
