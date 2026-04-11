"use server";

import { connectDB } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createProject(data: { name: string; clientId?: string | null; status?: "ACTIVE" | "INACTIVE" }) {
  try {
    const session = await requireSession();
    await connectDB();
    const project = await Project.create({
      name: data.name,
      clientId: data.clientId || null,
      status: data.status || "ACTIVE",
      userId: session.userId,
    });
    revalidatePath("/dashboard/projects");
    return { success: true, project: JSON.parse(JSON.stringify(project)) };
  } catch (error) {
    console.error("Create project error:", error);
    return { success: false, error: "Failed to create project" };
  }
}

export async function updateProject(id: string, data: { name?: string; clientId?: string | null; status?: "ACTIVE" | "INACTIVE" }) {
  try {
    const session = await requireSession();
    await connectDB();
    
    // Explicitly handle clearing clientId if it's explicitly null
    const updateData: Record<string, unknown> = { ...data };
    if (data.clientId === null) {
      updateData.$unset = { clientId: 1 };
      delete updateData.clientId;
    }

    const project = await Project.findOneAndUpdate(
      { _id: id, userId: session.userId },
      data.clientId === null ? updateData : data,
      { new: true }
    );
    if (!project) return { success: false, error: "Project not found" };
    revalidatePath("/dashboard/projects");
    return { success: true, project: JSON.parse(JSON.stringify(project)) };
  } catch (error) {
    console.error("Update project error:", error);
    return { success: false, error: "Failed to update project" };
  }
}

export async function deleteProject(id: string) {
  try {
    const session = await requireSession();
    await connectDB();
    const result = await Project.findOneAndDelete({ _id: id, userId: session.userId });
    if (!result) return { success: false, error: "Project not found" };
    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    console.error("Delete project error:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

export async function getProjects() {
  try {
    const session = await requireSession();
    await connectDB();
    const projects = await Project.find({ userId: session.userId })
      .populate('clientId', 'name')
      .sort({ name: 1 })
      .lean();
    return JSON.parse(JSON.stringify(projects));
  } catch (error) {
    console.error("Get projects error:", error);
    return [];
  }
}
