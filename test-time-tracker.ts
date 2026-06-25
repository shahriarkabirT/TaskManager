import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import { connectDB } from "./src/lib/mongodb";
import TimeSession from "./src/lib/models/TimeSession";

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

async function testLogic() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to DB");
  
  // Create a mock user ID
  const userId = "test_user_123";

  // Mock server time: let's pretend we are the server
  const now = new Date();
  
  // 1. Create a session started 2 hours ago
  const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  // It was paused after 1 hour, resumed after 30 mins
  const pausedAt = new Date(startTime.getTime() + 60 * 60 * 1000);
  const resumedAt = new Date(pausedAt.getTime() + 30 * 60 * 1000);
  const endTime = new Date(resumedAt.getTime() + 30 * 60 * 1000); // completed now
  
  // total elapsed = 2 hours
  // total breaks = 30 mins
  // total duration = 1.5 hours = 5400000 ms

  const totalElapsed = endTime.getTime() - startTime.getTime();
  let totalBreakMs = 0;
  totalBreakMs += resumedAt.getTime() - pausedAt.getTime();
  const totalDuration = Math.max(0, totalElapsed - totalBreakMs);

  console.log("Expected Duration:", 1.5 * 60 * 60 * 1000);
  console.log("Calculated Duration:", totalDuration);

  // Let's create a seed
  await TimeSession.deleteMany({ userId });

  const session1 = await TimeSession.create({
    userId,
    label: "Test Task 1",
    date: new Date(startTime.setHours(0,0,0,0)),
    startTime: startTime,
    endTime: endTime,
    breaks: [{ pausedAt, resumedAt }],
    totalDuration,
    status: "COMPLETED"
  });

  console.log("Seeded Session 1");

  // Fetch stats logic (from getTimeStats)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const todaySessions = await TimeSession.find({
    userId,
    date: { $gte: today, $lte: endOfToday },
    status: "COMPLETED",
  }).lean();

  const todayMs = todaySessions.reduce(
    (sum: number, s: any) => sum + s.totalDuration,
    0
  );

  console.log("Today MS:", todayMs, "Expected:", totalDuration);
  console.log("Today Hours:", Math.round((todayMs / 3600000) * 100) / 100);

  // Now test streak
  let streak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

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

  console.log("Streak:", streak);

  await mongoose.disconnect();
}

testLogic();
