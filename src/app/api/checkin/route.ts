import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id: string }).id);

  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
  twentyEightDaysAgo.setHours(0, 0, 0, 0);

  const checkIns = await prisma.dailyCheckIn.findMany({
    where: {
      userId,
      date: { gte: twentyEightDaysAgo },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      streakCount: true,
    },
  });

  const result = checkIns.map((c) => ({
    date: c.date.toISOString().split("T")[0],
    streakCount: c.streakCount,
  }));

  return NextResponse.json({ checkIns: result });
}