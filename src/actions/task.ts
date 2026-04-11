"use server";

import { connectDB } from "@/lib/mongodb";
import Task from "@/lib/models/Task";
import { revalidatePath } from "next/cache";

export interface TaskData {
  title: string;
  description?: string;
  date: string;
  status?: "PENDING" | "IN_PROGRESS" | "DONE";
  priority?: 1 | 2 | 3;
  clientName?: string;
  projectName?: string;
}

export async function createTask(data: TaskData) {
  try {
    await connectDB();
    const task = await Task.create({
      title: data.title,
      description: data.description || "",
      date: new Date(data.date),
      status: data.status || "PENDING",
      priority: data.priority || 2,
      clientName: data.clientName || "",
      projectName: data.projectName || "",
    });
    revalidatePath("/dashboard");
    return { success: true, task: JSON.parse(JSON.stringify(task)) };
  } catch (error) {
    console.error("Create task error:", error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTask(id: string, data: Partial<TaskData>) {
  try {
    await connectDB();
    const updateData: Record<string, unknown> = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    const task = await Task.findByIdAndUpdate(id, updateData, { new: true });
    revalidatePath("/dashboard");
    return { success: true, task: JSON.parse(JSON.stringify(task)) };
  } catch (error) {
    console.error("Update task error:", error);
    return { success: false, error: "Failed to update task" };
  }
}

export async function updateTaskStatus(id: string, status: "PENDING" | "IN_PROGRESS" | "DONE") {
  try {
    await connectDB();
    const task = await Task.findByIdAndUpdate(id, { status }, { new: true });
    revalidatePath("/dashboard");
    return { success: true, task: JSON.parse(JSON.stringify(task)) };
  } catch (error) {
    console.error("Update status error:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function deleteTask(id: string) {
  try {
    await connectDB();
    await Task.findByIdAndDelete(id);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete task error:", error);
    return { success: false, error: "Failed to delete task" };
  }
}

export async function getTasks(filter?: {
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  try {
    await connectDB();
    const query: Record<string, unknown> = {};

    if (filter?.startDate && filter?.endDate) {
      query.date = {
        $gte: new Date(filter.startDate),
        $lte: new Date(filter.endDate),
      };
    }

    if (filter?.status) {
      query.status = filter.status;
    }

    const tasks = await Task.find(query).sort({ date: 1, priority: 1 }).lean();
    return JSON.parse(JSON.stringify(tasks));
  } catch (error) {
    console.error("Get tasks error:", error);
    return [];
  }
}

export async function getTodayTasks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  return getTasks({
    startDate: today.toISOString(),
    endDate: endOfDay.toISOString(),
  });
}

export async function getUpcomingTasks() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  return getTasks({
    startDate: tomorrow.toISOString(),
    endDate: end.toISOString(),
  });
}

export async function getOverdueTasks() {
  try {
    await connectDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await Task.find({
      date: { $lt: today },
      status: { $ne: "DONE" },
    })
      .sort({ date: 1, priority: 1 })
      .lean();

    return JSON.parse(JSON.stringify(tasks));
  } catch (error) {
    console.error("Get overdue tasks error:", error);
    return [];
  }
}

export async function getTaskStats() {
  try {
    await connectDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [todayCount, upcomingCount, overdueCount, completedThisWeek] =
      await Promise.all([
        Task.countDocuments({
          date: { $gte: today, $lte: endOfToday },
          status: { $ne: "DONE" },
        }),
        Task.countDocuments({
          date: { $gt: endOfToday, $lte: endOfWeek },
          status: { $ne: "DONE" },
        }),
        Task.countDocuments({
          date: { $lt: today },
          status: { $ne: "DONE" },
        }),
        Task.countDocuments({
          status: "DONE",
          updatedAt: { $gte: startOfWeek },
        }),
      ]);

    return { todayCount, upcomingCount, overdueCount, completedThisWeek };
  } catch (error) {
    console.error("Get stats error:", error);
    return { todayCount: 0, upcomingCount: 0, overdueCount: 0, completedThisWeek: 0 };
  }
}

export async function getAllTasksFor30Days() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() + 30);
  end.setHours(23, 59, 59, 999);

  try {
    await connectDB();
    const tasks = await Task.find({
      date: { $gte: start, $lte: end },
    })
      .sort({ date: 1, priority: 1 })
      .lean();
    return JSON.parse(JSON.stringify(tasks));
  } catch (error) {
    console.error("Get 30-day tasks error:", error);
    return [];
  }
}

export async function getTaskCountsByDate() {
  try {
    await connectDB();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() + 30);
    end.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      date: { $gte: start, $lte: end },
    })
      .select("date status")
      .lean();

    const counts: Record<string, { total: number; done: number }> = {};
    tasks.forEach((task: { date: Date; status: string }) => {
      const dateStr = new Date(task.date).toISOString().split("T")[0];
      if (!counts[dateStr]) counts[dateStr] = { total: 0, done: 0 };
      counts[dateStr].total++;
      if (task.status === "DONE") counts[dateStr].done++;
    });

    return counts;
  } catch (error) {
    console.error("Get task counts error:", error);
    return {};
  }
}
