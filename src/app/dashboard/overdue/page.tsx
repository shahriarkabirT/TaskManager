"use client";

import { useState, useEffect } from "react";
import TaskCard from "@/components/TaskCard";
import AddTaskModal from "@/components/AddTaskModal";
import { getOverdueTasks } from "@/actions/task";
import { formatDate, toDateString } from "@/lib/utils";

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

export default function OverduePage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchTasks() {
      setLoading(true);
      const t = await getOverdueTasks();
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

  // Group tasks by date
  const grouped: Record<string, TaskData[]> = {};
  tasks.forEach((task) => {
    const key = toDateString(new Date(task.date));
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(task);
  });

  const dateKeys = Object.keys(grouped).sort();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">⚠️ Overdue Tasks</h1>
        <p className="page-subtitle">
          Tasks that are past their scheduled date and not yet completed
        </p>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="task-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 80, marginBottom: 10 }} />
            ))}
          </div>
        ) : dateKeys.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <div className="empty-title">No overdue tasks!</div>
            <div className="empty-description">
              Great job! You&apos;re all caught up. Keep up the excellent work!
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 12,
                padding: "14px 20px",
                marginBottom: 24,
                fontSize: "0.85rem",
                color: "#fca5a5",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🚨</span>
              You have {tasks.length} overdue task{tasks.length !== 1 ? "s" : ""}.
              Update their status or reschedule them.
            </div>

            {dateKeys.map((dateKey) => {
              const dateTasks = grouped[dateKey];
              const dateObj = new Date(dateKey + "T00:00:00");

              return (
                <div key={dateKey} className="date-group">
                  <div className="date-group-header overdue">
                    <h3 className="date-group-title">
                      {formatDate(dateObj)}
                    </h3>
                    <span className="date-group-badge">
                      {dateTasks.length} task
                      {dateTasks.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="task-list">
                    {dateTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onEdit={handleEdit}
                        onRefresh={handleRefresh}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
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
      />
    </>
  );
}
