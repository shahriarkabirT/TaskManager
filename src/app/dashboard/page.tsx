"use client";

import { useState, useEffect, } from "react";
import StatsCards from "@/components/StatsCards";
import DateScroller from "@/components/DateScroller";
import TaskList from "@/components/TaskList";
import AddTaskModal from "@/components/AddTaskModal";
import {
  getTaskStats,
  getTaskCountsByDate,
  getTasks,
} from "@/actions/task";
import { formatFullDate } from "@/lib/utils";

interface TaskData {
  _id: string;
  title: string;
  description?: string;
  date: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  priority: 1 | 2 | 3;
  clientName?: string;
  projectName?: string;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todayCount: 0,
    upcomingCount: 0,
    overdueCount: 0,
    completedThisWeek: 0,
  });
  const [taskCounts, setTaskCounts] = useState<
    Record<string, { total: number; done: number }>
  >({});
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load stats and date counts
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      const [s, counts] = await Promise.all([
        getTaskStats(),
        getTaskCountsByDate(),
      ]);
      if (!cancelled) {
        setStats(s);
        setTaskCounts(counts);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [refreshKey]);

  // Load tasks for selected date
  useEffect(() => {
    let cancelled = false;
    async function fetchTasks() {
      setLoading(true);
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const t = await getTasks({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      if (!cancelled) {
        setTasks(t);
        setLoading(false);
      }
    }
    fetchTasks();
    return () => { cancelled = true; };
  }, [selectedDate, refreshKey]);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleEdit(task: TaskData) {
    setEditTask(task);
    setShowModal(true);
  }

  function handleAddNew() {
    setEditTask(null);
    setShowModal(true);
  }

  const displayDate = new Date(selectedDate + "T00:00:00");

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome back! Here&apos;s your task overview.
        </p>
      </div>

      <div className="page-body">
        <StatsCards stats={stats} />

        <DateScroller
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          taskCounts={taskCounts}
        />

        <div className="section-header">
          <div>
            <h2 className="section-title">
              {selectedDate === todayKey()
                ? "Today's Tasks"
                : formatFullDate(displayDate)}
            </h2>
          </div>
          <button className="add-task-btn" onClick={handleAddNew}>
            ➕ Add Task
          </button>
        </div>

        {loading ? (
          <div className="task-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 80, marginBottom: 10 }} />
            ))}
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onEdit={handleEdit}
            onRefresh={handleRefresh}
            emptyMessage={
              selectedDate === todayKey()
                ? "No tasks for today"
                : "No tasks scheduled"
            }
            emptyIcon={selectedDate === todayKey() ? "🎉" : "📭"}
          />
        )}
      </div>

      <AddTaskModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditTask(null);
        }}
        onSuccess={handleRefresh}
        editTask={editTask}
        defaultDate={selectedDate}
      />
    </>
  );
}
