import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSessionSize } from "@/lib/spaced-repetition";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const contentType = searchParams.get("type") || "words";
  const level = searchParams.get("level") || "CET4";

  const userId = parseInt((session.user as { id: string }).id);

  // Get content IDs that need review (next_review_at <= now)
  const dueProgress = await prisma.userProgress.findMany({
    where: {
      userId,
      nextReviewAt: { lte: new Date() },
    },
    orderBy: { nextReviewAt: "asc" },
  });

  const dueIds = dueProgress.map((p) => p.contentId);

  // Get new content IDs (no progress records yet)
  const existingProgressIds = (
    await prisma.userProgress.findMany({
      where: { userId },
      select: { contentId: true },
    })
  ).map((p) => p.contentId);

  let model: any;
  if (contentType === "words") model = prisma.word;
  else model = prisma.phrase;

  const newItems = await model.findMany({
    where: {
      status: "published",
      level,
      id: { notIn: existingProgressIds },
    },
    orderBy: { createdAt: "desc" },
    take: getSessionSize(50),
  });

  // Get due items
  const dueItems =
    dueIds.length > 0
      ? await model.findMany({
          where: { id: { in: dueIds }, status: "published" },
        })
      : [];

  // Also get some random published items to fill session
  const existingIds = [...dueIds, ...newItems.map((n: any) => n.id)];
  const fillCount = getSessionSize(100) - dueItems.length - newItems.length;
  const fillItems =
    fillCount > 0
      ? await model.findMany({
          where: { status: "published", level, id: { notIn: existingIds } },
          take: fillCount,
        })
      : [];

  const items = [...dueItems, ...newItems, ...fillItems].slice(0, getSessionSize(100));

  return NextResponse.json({
    items,
    total: items.length,
  });
}