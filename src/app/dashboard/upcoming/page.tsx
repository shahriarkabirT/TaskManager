"use client";

import { useState, useEffect } from "react";
import TaskCard from "@/components/TaskCard";
import AddTaskModal from "@/components/AddTaskModal";
import { getUpcomingTasks } from "@/actions/task";
import { formatDate, isToday, isTomorrow, toDateString } from "@/lib/utils";

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

export default function UpcomingPage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchTasks() {
      setLoading(true);
      const t = await getUpcomingTasks();
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
        <h1 className="page-title">📅 Upcoming Tasks</h1>
        <p className="page-subtitle">Next 7 days at a glance</p>
      </div>

      <div className="page-body">
        <div className="section-header">
          <h2 className="section-title">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} coming up
          </h2>
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
        ) : dateKeys.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No upcoming tasks</div>
            <div className="empty-description">
              Your next 7 days are clear. Add tasks to plan ahead!
            </div>
          </div>
        ) : (
          dateKeys.map((dateKey) => {
            const dateTasks = grouped[dateKey];
            const dateObj = new Date(dateKey + "T00:00:00");
            const today = isToday(dateObj);
            const tomorrow = isTomorrow(dateObj);
            const label = today
              ? "Today"
              : tomorrow
                ? "Tomorrow"
                : formatDate(dateObj);

            return (
              <div key={dateKey} className="date-group">
                <div
                  className={`date-group-header ${today ? "today" : ""}`}
                >
                  <h3 className="date-group-title">{label}</h3>
                  <span className="date-group-badge">
                    {dateTasks.length} task{dateTasks.length !== 1 ? "s" : ""}
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
          })
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
