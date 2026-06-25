"use server";

import { connectDB } from "@/lib/mongodb";
import Todo from "@/lib/models/Todo";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await requireSession();
  return session.userId;
}

export async function createTodo(text: string, deadlineStr?: string) {
  try {
    const userId = await getUserId();
    await connectDB();
    
    // Find the max position to append to the end
    const lastTodo = await Todo.findOne({ userId }).sort({ position: -1 }).select("position");
    const position = lastTodo && typeof lastTodo.position === "number" ? lastTodo.position + 1 : 0;

    const todo = await Todo.create({
      userId,
      text,
      completed: false,
      position,
      deadline: deadlineStr ? new Date(deadlineStr) : undefined,
    });

    revalidatePath("/dashboard/todo");
    return { success: true, todo: JSON.parse(JSON.stringify(todo)) };
  } catch (error) {
    console.error("Create todo error:", error);
    return { success: false, error: "Failed to create to-do item" };
  }
}

export async function getTodos() {
  try {
    const userId = await getUserId();
    await connectDB();

    const todos = await Todo.find({ userId }).sort({ position: 1 });
    return JSON.parse(JSON.stringify(todos));
  } catch (error) {
    console.error("Get todos error:", error);
    return [];
  }
}

export async function updateTodo(
  id: string,
  data: { text?: string; completed?: boolean; deadline?: string | null }
) {
  try {
    const userId = await getUserId();
    await connectDB();

    const updateData: { text?: string; completed?: boolean; deadline?: Date | null } = {};
    if (data.text !== undefined) updateData.text = data.text;
    if (data.completed !== undefined) updateData.completed = data.completed;
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true }
    );

    if (!todo) return { success: false, error: "Todo item not found" };

    revalidatePath("/dashboard/todo");
    return { success: true, todo: JSON.parse(JSON.stringify(todo)) };
  } catch (error) {
    console.error("Update todo error:", error);
    return { success: false, error: "Failed to update to-do item" };
  }
}

export async function deleteTodo(id: string) {
  try {
    const userId = await getUserId();
    await connectDB();

    const result = await Todo.findOneAndDelete({ _id: id, userId });
    if (!result) return { success: false, error: "Todo item not found" };

    revalidatePath("/dashboard/todo");
    return { success: true };
  } catch (error) {
    console.error("Delete todo error:", error);
    return { success: false, error: "Failed to delete to-do item" };
  }
}

export async function reorderTodos(orderedIds: string[]) {
  try {
    const userId = await getUserId();
    await connectDB();

    // Perform bulk updates to update positions
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, userId },
        update: { $set: { position: index } },
      },
    }));

    if (bulkOps.length > 0) {
      await Todo.bulkWrite(bulkOps);
    }

    revalidatePath("/dashboard/todo");
    return { success: true };
  } catch (error) {
    console.error("Reorder todos error:", error);
    return { success: false, error: "Failed to save reordered list" };
  }
}
