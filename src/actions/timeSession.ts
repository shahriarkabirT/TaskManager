"use server";

import { connectDB } from "@/lib/mongodb";
import TimeSession from "@/lib/models/TimeSession";
import { requireSession } from "@/lib/auth";

async function getUserId() {
  const session = await requireSession();
  return session.userId;
}

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Calculate total working duration (ms) excluding breaks */
function calcDuration(
  startTime: Date,
  endTime: Date,
  breaks: Array<{ pausedAt: Date; resumedAt?: Date }>
): number {
  const totalElapsed = endTime.getTime() - startTime.getTime();
  let totalBreakMs = 0;
  for (const b of breaks) {
    const resumed = b.resumedAt ? new Date(b.resumedAt).getTime() : endTime.getTime();
    totalBreakMs += resumed - new Date(b.pausedAt).getTime();
  }
  return Math.max(0, totalElapsed - totalBreakMs);
}

// ─── START ──────────────────────────────────────────
export async function startTimeSession(label?: string) {
  try {
    const userId = await getUserId();
    await connectDB();

    // Check if there's already an active/paused session
    const existing = await TimeSession.findOne({
      userId,
      status: { $in: ["ACTIVE", "PAUSED"] },
    });
    if (existing) {
      return {
        success: false,
        error: "You already have an active session. Stop it first.",
      };
    }

    const now = new Date();
    const session = await TimeSession.create({
      userId,
      label: label || "",
      date: todayMidnight(),
      startTime: now,
      breaks: [],
      totalDuration: 0,
      status: "ACTIVE",
    });

    return { success: true, session: JSON.parse(JSON.stringify(session)) };
  } catch (error) {
    console.error("Start session error:", error);
    return { success: false, error: "Failed to start session" };
  }
}

// ─── PAUSE ──────────────────────────────────────────
export async function pauseTimeSession(id: string) {
  try {
    const userId = await getUserId();
    await connectDB();

    const session = await TimeSession.findOne({ _id: id, userId, status: "ACTIVE" });
    if (!session) return { success: false, error: "No active session found" };

    session.breaks.push({ pausedAt: new Date() });
    session.status = "PAUSED";
    await session.save();

    return { success: true, session: JSON.parse(JSON.stringify(session)) };
  } catch (error) {
    console.error("Pause session error:", error);
    return { success: false, error: "Failed to pause session" };
  }
}

// ─── RESUME ─────────────────────────────────────────
export async function resumeTimeSession(id: string) {
  try {
    const userId = await getUserId();
    await connectDB();

    const session = await TimeSession.findOne({ _id: id, userId, status: "PAUSED" });
    if (!session) return { success: false, error: "No paused session found" };

    // Close the last break
    const lastBreak = session.breaks[session.breaks.length - 1];
    if (lastBreak && !lastBreak.resumedAt) {
      lastBreak.resumedAt = new Date();
    }
    session.status = "ACTIVE";
    await session.save();

    return { success: true, session: JSON.parse(JSON.stringify(session)) };
  } catch (error) {
    console.error("Resume session error:", error);
    return { success: false, error: "Failed to resume session" };
  }
}

// ─── STOP ───────────────────────────────────────────
export async function stopTimeSession(id: string) {
  try {
    const userId = await getUserId();
    await connectDB();

    const session = await TimeSession.findOne({
      _id: id,
      userId,
      status: { $in: ["ACTIVE", "PAUSED"] },
    });
    if (!session) return { success: false, error: "No active/paused session found" };

    const now = new Date();

    // Close any open break
    const lastBreak = session.breaks[session.breaks.length - 1];
    if (lastBreak && !lastBreak.resumedAt) {
      lastBreak.resumedAt = now;
    }

    session.endTime = now;
    session.status = "COMPLETED";
    session.totalDuration = calcDuration(session.startTime, now, session.breaks);
    await session.save();

    return { success: true, session: JSON.parse(JSON.stringify(session)) };
  } catch (error) {
    console.error("Stop session error:", error);
    return { success: false, error: "Failed to stop session" };
  }
}

// ─── GET ACTIVE SESSION ─────────────────────────────
export async function getActiveTimeSession() {
  try {
    const userId = await getUserId();
    await connectDB();

    const session = await TimeSession.findOne({
      userId,
      status: { $in: ["ACTIVE", "PAUSED"] },
    }).lean();

    return session ? JSON.parse(JSON.stringify(session)) : null;
  } catch (error) {
    console.error("Get active session error:", error);
    return null;
  }
}

// ─── GET SESSIONS BY DATE ───────────────────────────
export async function getTimeSessionsByDate(dateStr: string) {
  try {
    const userId = await getUserId();
    await connectDB();

    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    const sessions = await TimeSession.find({
      userId,
      date: { $gte: start, $lte: end },
    })
      .sort({ startTime: -1 })
      .lean();

    return JSON.parse(JSON.stringify(sessions));
  } catch (error) {
    console.error("Get sessions by date error:", error);
    return [];
  }
}

// ─── GET SESSIONS IN RANGE ──────────────────────────
export async function getTimeSessionsInRange(startDate: string, endDate: string) {
  try {
    const userId = await getUserId();
    await connectDB();

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const sessions = await TimeSession.find({
      userId,
      date: { $gte: start, $lte: end },
      status: "COMPLETED",
    })
      .sort({ startTime: 1 })
      .lean();

    return JSON.parse(JSON.stringify(sessions));
  } catch (error) {
    console.error("Get sessions in range error:", error);
    return [];
  }
}

// ─── DELETE SESSION ─────────────────────────────────
export async function deleteTimeSession(id: string) {
  try {
    const userId = await getUserId();
    await connectDB();
    const result = await TimeSession.findOneAndDelete({ _id: id, userId });
    if (!result) return { success: false, error: "Session not found" };
    return { success: true };
  } catch (error) {
    console.error("Delete session error:", error);
    return { success: false, error: "Failed to delete session" };
  }
}

// ─── TIME STATS ─────────────────────────────────────
export async function getTimeStats() {
  try {
    const userId = await getUserId();
    await connectDB();

    const today = todayMidnight();
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Start of current week (Sunday)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Today's completed sessions
    const todaySessions = await TimeSession.find({
      userId,
      date: { $gte: today, $lte: endOfToday },
      status: "COMPLETED",
    }).lean();

    const todayMs = todaySessions.reduce(
      (sum: number, s: { totalDuration: number }) => sum + s.totalDuration,
      0
    );

    // This week's sessions
    const weekSessions = await TimeSession.find({
      userId,
      date: { $gte: startOfWeek },
      status: "COMPLETED",
    }).lean();

    const weekMs = weekSessions.reduce(
      (sum: number, s: { totalDuration: number }) => sum + s.totalDuration,
      0
    );

    // Session count today
    const sessionsToday = todaySessions.length;

    // Streak: consecutive days with completed sessions
    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // Check if today has sessions; if not, start from yesterday
    if (todaySessions.length === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await TimeSession.countDocuments({
        userId,
        date: { $gte: dayStart, $lte: dayEnd },
        status: "COMPLETED",
      });

      if (count > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      todayHours: Math.round((todayMs / 3600000) * 100) / 100,
      weekHours: Math.round((weekMs / 3600000) * 100) / 100,
      streak,
      sessionsToday,
    };
  } catch (error) {
    console.error("Get time stats error:", error);
    return { todayHours: 0, weekHours: 0, streak: 0, sessionsToday: 0 };
  }
}
