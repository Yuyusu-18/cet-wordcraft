import Link from "next/link";
import prisma from "@/lib/prisma";
import ContentCard from "@/components/ContentCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recentWords, , recentPassages] = await Promise.all([
    prisma.word.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.phrase.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.passage.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const sectionCards = [
    {
      title: "📝 单词巧记",
      desc: "词根词缀 + 谐音联想 + 拆分联想",
      href: "/words",
      color: "from-orange-400 to-red-400",
      count: await prisma.word.count({ where: { status: "published" } }),
    },
    {
      title: "📖 短语速记",
      desc: "常用搭配，不再死记硬背",
      href: "/phrases",
      color: "from-blue-400 to-cyan-400",
      count: await prisma.phrase.count({ where: { status: "published" } }),
    },
    {
      title: "📚 短文阅读",
      desc: "在语境中巩固词汇记忆",
      href: "/passages",
      color: "from-green-400 to-emerald-400",
      count: await prisma.passage.count({ where: { status: "published" } }),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
          🌟 CET WordCraft
        </h1>
        <p className="text-gray-500 text-lg mb-6">
          用巧记法攻克英语四六级，让背单词不再枯燥
        </p>
        <Link href="/practice" className="btn-primary inline-block text-lg px-8 py-3">
          🎯 开始练习
        </Link>
      </div>

      {/* Three entry cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sectionCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card hover:shadow-md transition-shadow text-center group"
          >
            <div
              className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center text-white text-lg`}
            >
              {card.count}
            </div>
            <h2 className="text-lg font-bold text-gray-800 group-hover:text-warm-600 transition-colors">
              {card.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent words */}
      {recentWords.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">🔥 最新单词</h2>
            <Link href="/words" className="text-warm-600 text-sm hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentWords.map((w) => (
              <ContentCard
                key={w.id}
                title={w.word}
                subtitle={`${w.pronunciation} · ${w.meaning}`}
                href={`/words/${w.id}`}
                badge={w.level}
                tags={JSON.parse(w.tags)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent passages */}
      {recentPassages.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">📚 最新短文</h2>
            <Link href="/passages" className="text-warm-600 text-sm hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentPassages.map((p) => (
              <ContentCard
                key={p.id}
                title={p.title}
                subtitle={p.content.slice(0, 60) + "..."}
                href={`/passages/${p.id}`}
                badge={p.level}
                tags={JSON.parse(p.tags)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}