"use client";

import { useState, useEffect } from "react";
import TaskList from "@/components/TaskList";
import AddTaskModal from "@/components/AddTaskModal";
import { getTodayTasks } from "@/actions/task";

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

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchTasks() {
      setLoading(true);
      const t = await getTodayTasks();
      if (!cancelled) {
        setTasks(t);
        setLoading(false);
      }
    }
    fetchTasks();
    return () => { cancelled = true; };
  }, [refreshKey]);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleEdit(task: TaskData) {
    setEditTask(task);
    setShowModal(true);
  }

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((t) => t.status === "DONE");

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">🎯 Today&apos;s Focus</h1>
        <p className="page-subtitle">
          {new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date())}
        </p>
      </div>

      <div className="page-body">
        {/* Quick Summary */}
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card today">
            <div className="stat-icon">⏳</div>
            <div className="stat-value">{pendingTasks.length}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card upcoming">
            <div className="stat-icon">🔄</div>
            <div className="stat-value">{inProgressTasks.length}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{doneTasks.length}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card overdue">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{tasks.length}</div>
            <div className="stat-label">Total Today</div>
          </div>
        </div>

        <div className="section-header">
          <h2 className="section-title">All Tasks for Today</h2>
          <button
            className="add-task-btn"
            onClick={() => {
              setEditTask(null);
              setShowModal(true);
            }}
          >
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
            emptyMessage="No tasks scheduled for today"
            emptyIcon="🎉"
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
        defaultDate={todayStr()}
      />
    </>
  );
}
