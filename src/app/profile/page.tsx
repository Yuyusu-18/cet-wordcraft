import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import StatsCard from "@/components/StatsCard";
import StreakCalendar from "@/components/StreakCalendar";
import ContentCard from "@/components/ContentCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  searchParams: { tab?: string };
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login");
  }

  const userId = parseInt((session.user as { id: string }).id);
  const activeTab = searchParams.tab || "stats";

  // --- Current streak ---
  const latestCheckIn = await prisma.dailyCheckIn.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
    select: { streakCount: true },
  });
  const currentStreak = latestCheckIn?.streakCount ?? 0;

  // --- Mastered words count (mastery >= 4) ---
  const masteredCount = await prisma.userProgress.count({
    where: { userId, mastery: { gte: 4 } },
  });

  // --- Overall accuracy from ExerciseRecords ---
  const [correctCount, totalCount] = await Promise.all([
    prisma.exerciseRecord.count({
      where: { userId, isCorrect: true },
    }),
    prisma.exerciseRecord.count({
      where: { userId },
    }),
  ]);
  const accuracy =
    totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  // --- Check-in dates for last 28 days ---
  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
  twentyEightDaysAgo.setHours(0, 0, 0, 0);

  const checkIns = await prisma.dailyCheckIn.findMany({
    where: { userId, date: { gte: twentyEightDaysAgo } },
    orderBy: { date: "asc" },
    select: { date: true, streakCount: true },
  });

  const checkInData = checkIns.map((c) => ({
    date: c.date.toISOString().split("T")[0],
    streakCount: c.streakCount,
  }));

  // --- Bookmarks with content details ---
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const bookmarkContentIds = bookmarks.map((b) => b.contentId);

  const [bookmarkWords, bookmarkPhrases] = await Promise.all([
    bookmarkContentIds.length > 0
      ? prisma.word.findMany({
          where: { id: { in: bookmarkContentIds }, status: "published" },
          select: { id: true, word: true, meaning: true, level: true },
        })
      : [],
    bookmarkContentIds.length > 0
      ? prisma.phrase.findMany({
          where: { id: { in: bookmarkContentIds }, status: "published" },
          select: { id: true, phrase: true, meaning: true, level: true },
        })
      : [],
  ]);

  const wordMap = new Map(
    bookmarkWords.map((w) => [
      w.id,
      { type: "word" as const, title: w.word, meaning: w.meaning, level: w.level, href: `/words/${w.id}` },
    ])
  );
  const phraseMap = new Map(
    bookmarkPhrases.map((p) => [
      p.id,
      { type: "phrase" as const, title: p.phrase, meaning: p.meaning, level: p.level, href: `/phrases/${p.id}` },
    ])
  );

  const bookmarkDetails = bookmarks.map((b) => {
    const content = wordMap.get(b.contentId) ?? phraseMap.get(b.contentId) ?? null;
    return {
      id: b.id,
      contentId: b.contentId,
      createdAt: b.createdAt.toISOString(),
      content,
    };
  });

  // --- Weak words (mastery <= 2, ordered by incorrectCount desc) ---
  const weakProgress = await prisma.userProgress.findMany({
    where: { userId, mastery: { lte: 2 } },
    orderBy: { incorrectCount: "desc" },
    take: 20,
  });

  const weakContentIds = weakProgress.map((p) => p.contentId);

  const [weakWords, weakPhrases] = await Promise.all([
    weakContentIds.length > 0
      ? prisma.word.findMany({
          where: { id: { in: weakContentIds }, status: "published" },
          select: { id: true, word: true, meaning: true, level: true },
        })
      : [],
    weakContentIds.length > 0
      ? prisma.phrase.findMany({
          where: { id: { in: weakContentIds }, status: "published" },
          select: { id: true, phrase: true, meaning: true, level: true },
        })
      : [],
  ]);

  const weakWordMap = new Map(
    weakWords.map((w) => [
      w.id,
      { type: "word" as const, title: w.word, meaning: w.meaning, level: w.level, href: `/words/${w.id}` },
    ])
  );
  const weakPhraseMap = new Map(
    weakPhrases.map((p) => [
      p.id,
      { type: "phrase" as const, title: p.phrase, meaning: p.meaning, level: p.level, href: `/phrases/${p.id}` },
    ])
  );

  const weakItems = weakProgress.map((p) => {
    const content = weakWordMap.get(p.contentId) ?? weakPhraseMap.get(p.contentId) ?? null;
    return {
      contentId: p.contentId,
      mastery: p.mastery,
      correctCount: p.correctCount,
      incorrectCount: p.incorrectCount,
      content,
    };
  });

  const tabs = [
    { key: "stats", label: "统计" },
    { key: "streak", label: "打卡" },
    { key: "bookmarks", label: "收藏" },
    { key: "weak", label: "薄弱词" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">个人主页</h1>
        <p className="text-gray-500 text-sm mt-1">
          你好，{session.user?.name || "同学"} 👋
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-warm-100 pb-0">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/profile?tab=${tab.key}`}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? "bg-white text-warm-700 border border-b-white border-warm-100 -mb-px"
                : "text-gray-500 hover:text-warm-600 hover:bg-warm-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatsCard label="连续打卡" value={currentStreak} unit="天" emoji="🔥" />
            <StatsCard label="已掌握" value={masteredCount} unit="词" emoji="✅" />
            <StatsCard label="正确率" value={accuracy} unit="%" emoji="🎯" />
            <StatsCard label="练习次数" value={totalCount} unit="次" emoji="📊" />
          </div>

          {totalCount === 0 && (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="text-lg font-bold text-gray-700 mb-1">开始你的学习之旅</h3>
              <p className="text-gray-500 text-sm mb-4">
                还没有练习记录，去练习中心开始学习吧！
              </p>
              <Link href="/practice" className="btn-primary inline-block text-sm">
                去练习
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Streak Tab */}
      {activeTab === "streak" && (
        <div>
          <StreakCalendar checkIns={checkInData} />
          {checkIns.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-4">
              完成一次练习即可自动打卡
            </p>
          )}
        </div>
      )}

      {/* Bookmarks Tab */}
      {activeTab === "bookmarks" && (
        <div className="space-y-3">
          {bookmarkDetails.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">⭐</div>
              <h3 className="text-lg font-bold text-gray-700 mb-1">暂无收藏</h3>
              <p className="text-gray-500 text-sm">
                浏览单词或短语，点击收藏按钮添加到这里
              </p>
            </div>
          ) : (
            bookmarkDetails.map((bm) =>
              bm.content ? (
                <ContentCard
                  key={bm.id}
                  title={bm.content.title}
                  subtitle={bm.content.meaning}
                  href={bm.content.href}
                  tags={[bm.content.level, bm.content.type === "word" ? "单词" : "短语"]}
                  badge={bm.content.type === "word" ? "📝" : "📖"}
                />
              ) : (
                <div
                  key={bm.id}
                  className="card text-gray-400 text-sm"
                >
                  内容 #{bm.contentId} 已不可用
                </div>
              )
            )
          )}
        </div>
      )}

      {/* Weak Words Tab */}
      {activeTab === "weak" && (
        <div className="space-y-3">
          {weakItems.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">💪</div>
              <h3 className="text-lg font-bold text-gray-700 mb-1">没有薄弱词</h3>
              <p className="text-gray-500 text-sm">
                继续加油，你的基础很扎实！
              </p>
            </div>
          ) : (
            weakItems.map((item) =>
              item.content ? (
                <ContentCard
                  key={item.contentId}
                  title={item.content.title}
                  subtitle={item.content.meaning}
                  href={item.content.href}
                  tags={[
                    item.content.level,
                    `正确 ${item.correctCount}`,
                    `错误 ${item.incorrectCount}`,
                  ]}
                >
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">掌握度</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-warm-400 rounded-full transition-all"
                          style={{ width: `${(item.mastery / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{item.mastery}/5</span>
                    </div>
                  </div>
                </ContentCard>
              ) : (
                <div key={item.contentId} className="card text-gray-400 text-sm">
                  内容 #{item.contentId} 已不可用
                </div>
              )
            )
          )}
        </div>
      )}

      {/* Bottom navigation hint */}
      <div className="text-center text-xs text-gray-400 pt-4">
        数据实时更新 · 每天完成练习自动打卡
      </div>
    </div>
  );
}