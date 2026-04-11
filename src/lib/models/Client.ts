import mongoose, { Schema, Document } from "mongoose";

export interface IClient extends Document {
  name: string;
  status: "ACTIVE" | "INACTIVE";
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

ClientSchema.index({ userId: 1, name: 1 });

const Client = mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);

export default Client;
