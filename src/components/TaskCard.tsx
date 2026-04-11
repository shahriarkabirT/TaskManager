"use client";

import { useState, useRef, useEffect } from "react";
import { updateTaskStatus, deleteTask } from "@/actions/task";
import { isOverdue } from "@/lib/utils";

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

interface TaskCardProps {
  task: TaskData;
  onEdit: (task: TaskData) => void;
  onRefresh: () => void;
}

const STATUS_OPTIONS: { value: string; label: string; className: string }[] = [
  { value: "PENDING", label: "Pending", className: "pending" },
  { value: "IN_PROGRESS", label: "In Progress", className: "in_progress" },
  { value: "DONE", label: "Done", className: "done" },
];

export default function TaskCard({ task, onEdit, onRefresh }: TaskCardProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const overdue =
    isOverdue(new Date(task.date)) && task.status !== "DONE";
  const priorityClass =
    task.priority === 1 ? "high" : task.priority === 2 ? "medium" : "low";
  const statusClass =
    task.status === "PENDING"
      ? "pending"
      : task.status === "IN_PROGRESS"
        ? "in_progress"
        : "done";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
    }
    if (showStatusDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStatusDropdown]);

  async function handleStatusChange(
    newStatus: "PENDING" | "IN_PROGRESS" | "DONE"
  ) {
    setUpdating(true);
    setShowStatusDropdown(false);
    await updateTaskStatus(task._id, newStatus);
    setUpdating(false);
    onRefresh();
  }

  async function handleDelete() {
    setShowConfirm(false);
    await deleteTask(task._id);
    onRefresh();
  }

  return (
    <>
      <div
        className={`task-card ${task.status === "DONE" ? "done" : ""} ${overdue ? "overdue" : ""}`}
      >
        <div className={`task-priority-dot ${priorityClass}`} title={`${priorityClass} priority`} />

        <div className="task-content">
          <div className="task-title">{task.title}</div>
          {task.description && (
            <div className="task-description">{task.description}</div>
          )}
          <div className="task-meta">
            {task.clientName && (
              <span className="task-tag">
                <span className="task-tag-icon">👤</span>
                {task.clientName}
              </span>
            )}
            {task.projectName && (
              <span className="task-tag">
                <span className="task-tag-icon">📁</span>
                {task.projectName}
              </span>
            )}
            <span className="task-tag">
              <span className="task-tag-icon">
                {task.priority === 1 ? "🔴" : task.priority === 2 ? "🟡" : "⚪"}
              </span>
              {task.priority === 1 ? "High" : task.priority === 2 ? "Medium" : "Low"}
            </span>
          </div>
        </div>

        <div className="task-actions" style={{ position: "relative" }} ref={dropdownRef}>
          <button
            className={`status-badge ${overdue && task.status !== "DONE" ? "overdue" : statusClass}`}
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            disabled={updating}
            style={{ opacity: updating ? 0.5 : 1 }}
          >
            <span className="status-badge-dot" />
            {overdue && task.status !== "DONE"
              ? "Overdue"
              : task.status === "PENDING"
                ? "Pending"
                : task.status === "IN_PROGRESS"
                  ? "In Progress"
                  : "Done"}
          </button>

          {showStatusDropdown && (
            <div className="status-dropdown">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`status-option ${opt.className}`}
                  onClick={() =>
                    handleStatusChange(
                      opt.value as "PENDING" | "IN_PROGRESS" | "DONE"
                    )
                  }
                >
                  <span className="status-option-dot" />
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <button
            className="task-action-btn"
            title="Edit"
            onClick={() => onEdit(task)}
          >
            ✏️
          </button>
          <button
            className="task-action-btn delete"
            title="Delete"
            onClick={() => setShowConfirm(true)}
          >
            🗑️
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div
            className="confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-title">Delete Task?</div>
            <div className="confirm-message">
              Are you sure you want to delete &ldquo;{task.title}&rdquo;? This
              action cannot be undone.
            </div>
            <div className="confirm-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
