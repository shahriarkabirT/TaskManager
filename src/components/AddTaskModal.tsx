"use client";

import { useState, useEffect } from "react";
import { createTask, updateTask } from "@/actions/task";

interface TaskFormData {
  _id?: string;
  title: string;
  description?: string;
  date: string;
  status?: "PENDING" | "IN_PROGRESS" | "DONE";
  priority?: 1 | 2 | 3;
  clientName?: string;
  projectName?: string;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTask?: TaskFormData | null;
  defaultDate?: string;
}

export default function AddTaskModal({
  isOpen,
  onClose,
  onSuccess,
  editTask,
  defaultDate,
}: AddTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<TaskFormData>({
    title: "",
    description: "",
    date: defaultDate || new Date().toISOString().split("T")[0],
    status: "PENDING",
    priority: 2,
    clientName: "",
    projectName: "",
  });

  useEffect(() => {
    if (editTask) {
      setForm({
        ...editTask,
        date: editTask.date
          ? new Date(editTask.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    } else {
      setForm({
        title: "",
        description: "",
        date: defaultDate || new Date().toISOString().split("T")[0],
        status: "PENDING",
        priority: 2,
        clientName: "",
        projectName: "",
      });
    }
  }, [editTask, defaultDate, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;

    setLoading(true);
    try {
      if (editTask?._id) {
        await updateTask(editTask._id, {
          title: form.title,
          description: form.description,
          date: form.date,
          status: form.status,
          priority: form.priority,
          clientName: form.clientName,
          projectName: form.projectName,
        });
      } else {
        await createTask({
          title: form.title,
          description: form.description,
          date: form.date,
          status: form.status,
          priority: form.priority,
          clientName: form.clientName,
          projectName: form.projectName,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Task save error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editTask?._id ? "Edit Task" : "Add New Task"}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input
                className="form-input"
                type="text"
                placeholder="What needs to be done?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Add details or notes..."
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: Number(e.target.value) as 1 | 2 | 3,
                    })
                  }
                >
                  <option value={1}>🔴 High</option>
                  <option value={2}>🟡 Medium</option>
                  <option value={3}>⚪ Low</option>
                </select>
              </div>
            </div>

            {editTask?._id && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as
                        | "PENDING"
                        | "IN_PROGRESS"
                        | "DONE",
                    })
                  }
                >
                  <option value="PENDING">⏳ Pending</option>
                  <option value="IN_PROGRESS">🔄 In Progress</option>
                  <option value="DONE">✅ Done</option>
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. John's Agency"
                  value={form.clientName || ""}
                  onChange={(e) =>
                    setForm({ ...form, clientName: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Website Redesign"
                  value={form.projectName || ""}
                  onChange={(e) =>
                    setForm({ ...form, projectName: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={loading || !form.title.trim()}
            >
              {loading
                ? "Saving..."
                : editTask?._id
                  ? "Save Changes"
                  : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
