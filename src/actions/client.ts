"use server";

import { connectDB } from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createClient(data: { name: string; status?: "ACTIVE" | "INACTIVE" }) {
  try {
    const session = await requireSession();
    await connectDB();
    const client = await Client.create({
      name: data.name,
      status: data.status || "ACTIVE",
      userId: session.userId,
    });
    revalidatePath("/dashboard/clients");
    return { success: true, client: JSON.parse(JSON.stringify(client)) };
  } catch (error) {
    console.error("Create client error:", error);
    return { success: false, error: "Failed to create client" };
  }
}

export async function updateClient(id: string, data: { name?: string; status?: "ACTIVE" | "INACTIVE" }) {
  try {
    const session = await requireSession();
    await connectDB();
    const client = await Client.findOneAndUpdate(
      { _id: id, userId: session.userId },
      data,
      { new: true }
    );
    if (!client) return { success: false, error: "Client not found" };
    revalidatePath("/dashboard/clients");
    return { success: true, client: JSON.parse(JSON.stringify(client)) };
  } catch (error) {
    console.error("Update client error:", error);
    return { success: false, error: "Failed to update client" };
  }
}

export async function deleteClient(id: string) {
  try {
    const session = await requireSession();
    await connectDB();
    const result = await Client.findOneAndDelete({ _id: id, userId: session.userId });
    if (!result) return { success: false, error: "Client not found" };
    revalidatePath("/dashboard/clients");
    return { success: true };
  } catch (error) {
    console.error("Delete client error:", error);
    return { success: false, error: "Failed to delete client" };
  }
}

export async function getClients() {
  try {
    const session = await requireSession();
    await connectDB();
    const clients = await Client.find({ userId: session.userId }).sort({ name: 1 }).lean();
    return JSON.parse(JSON.stringify(clients));
  } catch (error) {
    console.error("Get clients error:", error);
    return [];
  }
}
