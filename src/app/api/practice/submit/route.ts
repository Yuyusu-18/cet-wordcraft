import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateNextReview } from "@/lib/spaced-repetition";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id: string }).id);
  const { contentId, exerciseType, isCorrect } = await req.json();

  // Record the exercise
  await prisma.exerciseRecord.create({
    data: {
      userId,
      contentId,
      exerciseType,
      isCorrect,
    },
  });

  // Update progress
  const existing = await prisma.userProgress.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });

  const { mastery, nextReviewAt } = calculateNextReview(
    existing?.mastery ?? 0,
    isCorrect
  );

  await prisma.userProgress.upsert({
    where: { userId_contentId: { userId, contentId } },
    create: {
      userId,
      contentId,
      mastery,
      nextReviewAt,
      correctCount: isCorrect ? 1 : 0,
      incorrectCount: isCorrect ? 0 : 1,
    },
    update: {
      mastery,
      nextReviewAt,
      lastReviewedAt: new Date(),
      correctCount: isCorrect
        ? (existing?.correctCount ?? 0) + 1
        : existing?.correctCount ?? 0,
      incorrectCount: isCorrect
        ? existing?.incorrectCount ?? 0
        : (existing?.incorrectCount ?? 0) + 1,
    },
  });

  // Auto check-in
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCheckIn = await prisma.dailyCheckIn.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!todayCheckIn) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayCheckIn = await prisma.dailyCheckIn.findUnique({
      where: { userId_date: { userId, date: yesterday } },
    });

    const streakCount = (yesterdayCheckIn?.streakCount ?? 0) + 1;

    await prisma.dailyCheckIn.create({
      data: { userId, date: today, streakCount },
    });
  }

  return NextResponse.json({ success: true, mastery, nextReviewAt });
}