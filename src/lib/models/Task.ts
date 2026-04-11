import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  date: Date;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  priority: 1 | 2 | 3; // 1=high, 2=medium, 3=low
  clientName?: string;
  projectName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "DONE"],
      default: "PENDING",
    },
    priority: {
      type: Number,
      enum: [1, 2, 3],
      default: 2,
    },
    clientName: { type: String, default: "" },
    projectName: { type: String, default: "" },
  },
  { timestamps: true }
);

// Prevent model recompilation in dev mode
const Task = mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default Task;
