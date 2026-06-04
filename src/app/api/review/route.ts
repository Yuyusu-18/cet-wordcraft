import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET — return pending ContentReviews with associated content data
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const reviews = await prisma.contentReview.findMany({
      where: { status: "pending" },
      orderBy: { id: "desc" },
      include: {
        reviewer: {
          select: { id: true, name: true },
        },
      },
    });

    // Resolve content for each review by checking all three content tables
    const contentIds = reviews.map((r) => r.contentId);

    const [words, phrases, passages] = await Promise.all([
      contentIds.length > 0
        ? prisma.word.findMany({ where: { id: { in: contentIds } } })
        : [],
      contentIds.length > 0
        ? prisma.phrase.findMany({ where: { id: { in: contentIds } } })
        : [],
      contentIds.length > 0
        ? prisma.passage.findMany({ where: { id: { in: contentIds } } })
        : [],
    ]);

    const wordMap = new Map(
      words.map((w) => [w.id, { type: "word" as const, data: w }])
    );
    const phraseMap = new Map(
      phrases.map((p) => [p.id, { type: "phrase" as const, data: p }])
    );
    const passageMap = new Map(
      passages.map((p) => [p.id, { type: "passage" as const, data: p }])
    );

    const resolved = reviews.map((review) => {
      const resolvedContent =
        wordMap.get(review.contentId) ||
        phraseMap.get(review.contentId) ||
        passageMap.get(review.contentId);

      return {
        id: review.id,
        contentId: review.contentId,
        status: review.status,
        rejectReason: review.rejectReason,
        reviewedAt: review.reviewedAt?.toISOString() ?? null,
        contentType: resolvedContent?.type ?? null,
        content: resolvedContent
          ? {
              id: resolvedContent.data.id,
              ...("word" in resolvedContent.data
                ? { word: resolvedContent.data.word }
                : {}),
              ...("phrase" in resolvedContent.data
                ? { phrase: resolvedContent.data.phrase }
                : {}),
              ...("title" in resolvedContent.data
                ? { title: resolvedContent.data.title }
                : {}),
              pronunciation:
                "pronunciation" in resolvedContent.data
                  ? resolvedContent.data.pronunciation
                  : undefined,
              meaning:
                "meaning" in resolvedContent.data
                  ? resolvedContent.data.meaning
                  : undefined,
              mnemonic:
                "mnemonic" in resolvedContent.data
                  ? resolvedContent.data.mnemonic
                  : undefined,
              exampleSentence:
                "exampleSentence" in resolvedContent.data
                  ? resolvedContent.data.exampleSentence
                  : undefined,
              exampleTranslation:
                "exampleTranslation" in resolvedContent.data
                  ? resolvedContent.data.exampleTranslation
                  : undefined,
              content:
                "content" in resolvedContent.data
                  ? resolvedContent.data.content
                  : undefined,
              translation:
                "translation" in resolvedContent.data
                  ? resolvedContent.data.translation
                  : undefined,
              level: resolvedContent.data.level,
              tags: resolvedContent.data.tags,
            }
          : null,
      };
    });

    return NextResponse.json({ reviews: resolved });
  } catch (error) {
    console.error("Review GET error:", error);
    return NextResponse.json(
      { error: "获取审核列表失败" },
      { status: 500 }
    );
  }
}

// POST — batch submit content for review (create ContentReview records)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id: string }).id);

  try {
    const body = await req.json();
    const { contentIds } = body as { contentType?: string; contentIds: number[] };

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return NextResponse.json(
        { error: "请提供 contentIds" },
        { status: 400 }
      );
    }

    let created = 0;
    let skipped = 0;

    for (const contentId of contentIds) {
      // Check if review already exists
      const existing = await prisma.contentReview.findFirst({
        where: { contentId },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.contentReview.create({
        data: {
          contentId,
          reviewerId: userId,
          status: "pending",
        },
      });
      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      message: `已创建 ${created} 条审核记录${skipped > 0 ? `，跳过 ${skipped} 条已存在` : ""}`,
    });
  } catch (error) {
    console.error("Review POST error:", error);
    return NextResponse.json(
      { error: "提交审核失败" },
      { status: 500 }
    );
  }
}

// PATCH — update review status (single or batch)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      contentId,
      contentIds,
      status,
      rejectReason,
    } = body as {
      contentId?: number;
      contentIds?: number[];
      status: string;
      rejectReason?: string;
    };

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status 必须是 approved 或 rejected" },
        { status: 400 }
      );
    }

    const ids = contentIds || (contentId ? [contentId] : []);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "请提供 contentId 或 contentIds" },
        { status: 400 }
      );
    }

    if (status === "rejected" && !rejectReason && !contentIds) {
      return NextResponse.json(
        { error: "驳回需要提供理由" },
        { status: 400 }
      );
    }

    let updated = 0;

    for (const id of ids) {
      // Update ContentReview
      const review = await prisma.contentReview.findFirst({
        where: { contentId: id, status: "pending" },
      });

      if (!review) continue;

      await prisma.contentReview.update({
        where: { id: review.id },
        data: {
          status,
          rejectReason: rejectReason || null,
          reviewedAt: new Date(),
        },
      });

      // Update corresponding content status
      // Try all three tables
      const wordRecord = await prisma.word.findUnique({ where: { id } });
      if (wordRecord) {
        await prisma.word.update({
          where: { id },
          data: { status },
        });
        updated++;
        continue;
      }

      const phraseRecord = await prisma.phrase.findUnique({ where: { id } });
      if (phraseRecord) {
        await prisma.phrase.update({
          where: { id },
          data: { status },
        });
        updated++;
        continue;
      }

      const passageRecord = await prisma.passage.findUnique({ where: { id } });
      if (passageRecord) {
        await prisma.passage.update({
          where: { id },
          data: { status },
        });
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      message: `已更新 ${updated} 条内容`,
    });
  } catch (error) {
    console.error("Review PATCH error:", error);
    return NextResponse.json(
      { error: "操作失败" },
      { status: 500 }
    );
  }
}