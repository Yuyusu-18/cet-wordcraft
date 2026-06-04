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

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const contentIds = bookmarks.map((b) => b.contentId);

  // Resolve contentIds against Word and Phrase tables
  const [words, phrases] = await Promise.all([
    contentIds.length > 0
      ? prisma.word.findMany({
          where: { id: { in: contentIds }, status: "published" },
          select: {
            id: true,
            word: true,
            meaning: true,
            level: true,
          },
        })
      : ([] as { id: number; word: string; meaning: string; level: string }[]),
    contentIds.length > 0
      ? prisma.phrase.findMany({
          where: { id: { in: contentIds }, status: "published" },
          select: {
            id: true,
            phrase: true,
            meaning: true,
            level: true,
          },
        })
      : ([] as { id: number; phrase: string; meaning: string; level: string }[]),
  ]);

  const wordMap = new Map(words.map((w) => [w.id, { type: "word" as const, title: w.word, meaning: w.meaning, level: w.level }]));
  const phraseMap = new Map(phrases.map((p) => [p.id, { type: "phrase" as const, title: p.phrase, meaning: p.meaning, level: p.level }]));

  const result = bookmarks.map((b) => ({
    id: b.id,
    contentId: b.contentId,
    createdAt: b.createdAt.toISOString(),
    content: wordMap.get(b.contentId) ?? phraseMap.get(b.contentId) ?? null,
  }));

  return NextResponse.json({ bookmarks: result });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id: string }).id);
  const { contentId } = await req.json();

  if (!contentId || typeof contentId !== "number") {
    return NextResponse.json({ error: "请提供有效的 contentId" }, { status: 400 });
  }

  // Check if already bookmarked
  const existing = await prisma.bookmark.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });

  if (existing) {
    return NextResponse.json({ error: "已收藏" }, { status: 409 });
  }

  const bookmark = await prisma.bookmark.create({
    data: { userId, contentId },
  });

  return NextResponse.json(
    {
      id: bookmark.id,
      contentId: bookmark.contentId,
      createdAt: bookmark.createdAt.toISOString(),
    },
    { status: 201 }
  );
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id: string }).id);
  const { contentId } = await req.json();

  if (!contentId || typeof contentId !== "number") {
    return NextResponse.json({ error: "请提供有效的 contentId" }, { status: 400 });
  }

  const existing = await prisma.bookmark.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });

  if (!existing) {
    return NextResponse.json({ error: "未找到收藏" }, { status: 404 });
  }

  await prisma.bookmark.delete({
    where: { userId_contentId: { userId, contentId } },
  });

  return NextResponse.json({ success: true });
}