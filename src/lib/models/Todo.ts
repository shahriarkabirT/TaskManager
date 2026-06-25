import mongoose, { Schema, Document } from "mongoose";

export interface ITodo extends Document {
  userId: string;
  text: string;
  completed: boolean;
  position: number;    // Field to maintain drag-and-drop order
  deadline?: Date;     // Optional deadline date
  createdAt: Date;
  updatedAt: Date;
}

const TodoSchema = new Schema<ITodo>(
  {
    userId: { type: String, required: true, index: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    position: { type: Number, required: true },
    deadline: { type: Date },
  },
  { timestamps: true }
);

// Index on userId and position for fast fetching of sorted list
TodoSchema.index({ userId: 1, position: 1 });

const Todo = mongoose.models.Todo || mongoose.model<ITodo>("Todo", TodoSchema);
export default Todo;
