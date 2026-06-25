"use client";

import { useState, useEffect, useRef } from "react";
import {
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
  reorderTodos,
} from "@/actions/todo";
import { formatDate, isToday, isOverdue } from "@/lib/utils";
import CalendarPicker from "@/components/CalendarPicker";

interface TodoItem {
  _id: string;
  text: string;
  completed: boolean;
  position: number;
  deadline?: string;
}

export default function TodoPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newText, setNewText] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const isMounted = useRef(true);

  // Drag and Drop Ref
  const draggedIndexRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    let cancelled = false;

    async function loadTodos() {
      const data = await getTodos();
      if (!cancelled) {
        setTodos(data);
        setLoading(false);
      }
    }

    loadTodos();
    return () => {
      isMounted.current = false;
      cancelled = true;
    };
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;

    setActionLoading(true);
    const res = await createTodo(newText.trim(), newDeadline || undefined);
    setActionLoading(false);

    if (res.success && res.todo) {
      setTodos((prev) => [...prev, res.todo!]);
      setNewText("");
      setNewDeadline("");
    }
  }

  async function handleToggleComplete(todo: TodoItem) {
    const updatedCompleted = !todo.completed;
    
    // Immediate UI update
    setTodos((prev) =>
      prev.map((t) => (t._id === todo._id ? { ...t, completed: updatedCompleted } : t))
    );

    await updateTodo(todo._id, { completed: updatedCompleted });
  }

  function handleStartEdit(todo: TodoItem) {
    setEditingId(todo._id);
    setEditText(todo.text);
    setEditDeadline(todo.deadline ? todo.deadline.split("T")[0] : "");
  }

  async function handleSaveEdit(id: string) {
    if (!editText.trim()) return;

    setTodos((prev) =>
      prev.map((t) =>
        t._id === id
          ? {
              ...t,
              text: editText.trim(),
              deadline: editDeadline ? new Date(editDeadline).toISOString() : undefined,
            }
          : t
      )
    );

    setEditingId(null);
    await updateTodo(id, {
      text: editText.trim(),
      deadline: editDeadline || null,
    });
  }

  async function handleDelete(id: string) {
    // Immediate UI update
    setTodos((prev) => prev.filter((t) => t._id !== id));
    await deleteTodo(id);
  }

  // ─── Drag and Drop Handlers ────────────────────────
  const handleDragStart = (e: React.DragEvent, index: number) => {
    draggedIndexRef.current = index;
    isDraggingRef.current = true;
    e.dataTransfer.effectAllowed = "move";
    // Setup drag image transparency / effect
    const target = e.currentTarget as HTMLElement;
    target.classList.add("dragging");
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const draggedIndex = draggedIndexRef.current;
    if (draggedIndex === null || draggedIndex === index) return;

    // Swap items locally
    const newTodos = [...todos];
    const [draggedItem] = newTodos.splice(draggedIndex, 1);
    newTodos.splice(index, 0, draggedItem);
    setTodos(newTodos);
    draggedIndexRef.current = index;
  };

  const handleDragEnd = async (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove("dragging");
    draggedIndexRef.current = null;
    isDraggingRef.current = false;

    // Save ordering to database
    const orderedIds = todos.map((t) => t._id);
    await reorderTodos(orderedIds);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">To-Do List</h1>
        <p className="page-subtitle">
          Manage quick tasks, set deadlines, and drag to prioritize order.
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: "800px" }}>
        {/* Quick Add Form */}
        <form onSubmit={handleAdd} className="todo-add-form">
          <input
            type="text"
            className="form-input todo-add-input"
            placeholder="Write a quick to-do..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            disabled={actionLoading}
            required
          />
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <CalendarPicker
              value={newDeadline}
              onChange={setNewDeadline}
              placeholder="Set deadline (optional)"
              disabled={actionLoading}
            />
            <div style={{ flex: 1 }} />
            <button
              type="submit"
              className="btn-primary todo-add-btn"
              disabled={actionLoading || !newText.trim()}
            >
              + Add Task
            </button>
          </div>
        </form>


        {/* Todo List Container */}
        {loading ? (
          <div className="todo-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 60, marginBottom: 12, borderRadius: 14 }} />
            ))}
          </div>
        ) : todos.length === 0 ? (
          <div className="empty-state" style={{ padding: "48px 0" }}>
            <div className="empty-icon">📋</div>
            <div className="empty-title">Your list is empty</div>
            <div className="empty-description">
              Add some items above and drag them around to set your priorities.
            </div>
          </div>
        ) : (
          <div className="todo-list">
            {todos.map((todo, index) => {
              const isEditing = editingId === todo._id;
              const hasDeadline = !!todo.deadline;
              const deadlineDate = hasDeadline ? new Date(todo.deadline!) : null;
              
              let deadlineStatus: "overdue" | "today" | "future" | "completed" = "future";
              if (todo.completed) {
                deadlineStatus = "completed";
              } else if (deadlineDate) {
                if (isOverdue(deadlineDate)) {
                  deadlineStatus = "overdue";
                } else if (isToday(deadlineDate)) {
                  deadlineStatus = "today";
                }
              }

              return (
                <div
                  key={todo._id}
                  className={`todo-item ${todo.completed ? "completed" : ""}`}
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Left Side: Drag Handle & Checkbox */}
                  <div className="todo-item-left">
                    {!isEditing && (
                      <span className="todo-drag-handle" title="Drag to reorder">
                        ⋮⋮
                      </span>
                    )}
                    <label className="todo-checkbox-label">
                      <input
                        type="checkbox"
                        className="todo-checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleComplete(todo)}
                      />
                      <span className="todo-custom-checkbox" />
                    </label>

                    {/* Todo Text Content / Edit Field */}
                    {isEditing ? (
                      <div className="todo-edit-wrap">
                        <input
                          type="text"
                          className="form-input todo-edit-input"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(todo._id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                        <CalendarPicker
                          value={editDeadline}
                          onChange={setEditDeadline}
                        />
                      </div>
                    ) : (
                      <span
                        className="todo-text"
                        onDoubleClick={() => handleStartEdit(todo)}
                        title="Double click to edit"
                      >
                        {todo.text}
                      </span>
                    )}
                  </div>

                  {/* Right Side: Deadline badge & CRUD actions */}
                  <div className="todo-item-right">
                    {/* Deadline Badge */}
                    {!isEditing && hasDeadline && deadlineDate && (
                      <span className={`todo-deadline-badge ${deadlineStatus}`}>
                        {deadlineStatus === "overdue" && "⚠️ "}
                        {deadlineStatus === "today" && "⏰ "}
                        {deadlineStatus === "overdue"
                          ? `Overdue: ${formatDate(deadlineDate)}`
                          : deadlineStatus === "today"
                          ? "Due Today"
                          : `Due ${formatDate(deadlineDate)}`}
                      </span>
                    )}

                    {/* Actions */}
                    {isEditing ? (
                      <div className="todo-actions">
                        <button
                          className="task-action-btn complete"
                          onClick={() => handleSaveEdit(todo._id)}
                          title="Save Changes"
                        >
                          💾
                        </button>
                        <button
                          className="task-action-btn delete"
                          onClick={() => setEditingId(null)}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="todo-actions">
                        <button
                          className="task-action-btn edit"
                          onClick={() => handleStartEdit(todo)}
                          title="Edit task"
                        >
                          ✏️
                        </button>
                        <button
                          className="task-action-btn delete"
                          onClick={() => handleDelete(todo._id)}
                          title="Delete task"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
