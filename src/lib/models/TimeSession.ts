import mongoose, { Schema, Document } from "mongoose";

export interface IBreak {
  pausedAt: Date;
  resumedAt?: Date;
}

export interface ITimeSession extends Document {
  userId: string;
  label: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  breaks: IBreak[];
  totalDuration: number; // milliseconds of actual work (excluding breaks)
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  createdAt: Date;
  updatedAt: Date;
}

const BreakSchema = new Schema<IBreak>(
  {
    pausedAt: { type: Date, required: true },
    resumedAt: { type: Date },
  },
  { _id: false }
);

const TimeSessionSchema = new Schema<ITimeSession>(
  {
    userId: { type: String, required: true, index: true },
    label: { type: String, default: "" },
    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    breaks: { type: [BreakSchema], default: [] },
    totalDuration: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "COMPLETED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

// Efficient per-user date queries
TimeSessionSchema.index({ userId: 1, date: 1 });
// Range queries for analytics
TimeSessionSchema.index({ userId: 1, startTime: 1 });

const TimeSession =
  mongoose.models.TimeSession ||
  mongoose.model<ITimeSession>("TimeSession", TimeSessionSchema);

export default TimeSession;
