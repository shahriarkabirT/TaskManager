"use client";

import TaskCard from "./TaskCard";

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

interface TaskListProps {
  tasks: TaskData[];
  onEdit: (task: TaskData) => void;
  onRefresh: () => void;
  emptyMessage?: string;
  emptyIcon?: string;
}

export default function TaskList({
  tasks,
  onEdit,
  onRefresh,
  emptyMessage = "No tasks found",
  emptyIcon = "📭",
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">{emptyIcon}</div>
        <div className="empty-title">{emptyMessage}</div>
        <div className="empty-description">
          Click &ldquo;Add Task&rdquo; to get started with your schedule.
        </div>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          onEdit={onEdit}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
