import Link from "next/link";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function WordsPage({
  searchParams,
}: {
  searchParams: { level?: string };
}) {
  const level = searchParams.level;
  const where = { status: "published" as const, ...(level ? { level } : {}) };

  const words = await prisma.word.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const cet4Count = await prisma.word.count({
    where: { status: "published", level: "CET4" },
  });
  const cet6Count = await prisma.word.count({
    where: { status: "published", level: "CET6" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📝 单词巧记</h1>
        <p className="text-gray-500 text-sm mt-1">
          AI 生成的巧记法帮你高效记忆，已发布 {cet4Count + cet6Count} 个单词
        </p>
      </div>

      {/* Level filter tabs */}
      <div className="flex gap-2">
        <Link
          href="/words"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !level ? "bg-warm-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-warm-50"
          }`}
        >
          全部
        </Link>
        <Link
          href="/words?level=CET4"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            level === "CET4" ? "bg-warm-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-warm-50"
          }`}
        >
          四级 ({cet4Count})
        </Link>
        <Link
          href="/words?level=CET6"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            level === "CET6" ? "bg-warm-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-warm-50"
          }`}
        >
          六级 ({cet6Count})
        </Link>
      </div>

      {/* Word list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {words.map((w) => (
          <Link
            key={w.id}
            href={`/words/${w.id}`}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-lg font-bold text-gray-800">{w.word}</span>
              <span className="text-xs bg-warm-100 text-warm-700 px-2 py-0.5 rounded-full">
                {w.level}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-2">{w.pronunciation}</p>
            <p className="text-sm text-gray-600">{w.meaning}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {JSON.parse(w.tags).map((tag: string) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {words.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p>暂无单词，等待管理员添加内容</p>
        </div>
      )}
    </div>
  );
}