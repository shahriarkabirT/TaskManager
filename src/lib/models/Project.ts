import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  name: string;
  clientId?: mongoose.Types.ObjectId;
  status: "ACTIVE" | "INACTIVE";
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

ProjectSchema.index({ userId: 1, name: 1 });

const Project = mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
