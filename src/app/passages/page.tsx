import Link from "next/link";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PassagesPage({
  searchParams,
}: {
  searchParams: { level?: string };
}) {
  const level = searchParams.level;
  const where = { status: "published" as const, ...(level ? { level } : {}) };

  const passages = await prisma.passage.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const cet4Count = await prisma.passage.count({
    where: { status: "published", level: "CET4" },
  });
  const cet6Count = await prisma.passage.count({
    where: { status: "published", level: "CET6" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📚 短文阅读</h1>
        <p className="text-gray-500 text-sm mt-1">
          在语境中巩固词汇，已发布 {cet4Count + cet6Count} 篇短文
        </p>
      </div>

      <div className="flex gap-2">
        <Link
          href="/passages"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !level ? "bg-warm-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-warm-50"
          }`}
        >
          全部
        </Link>
        <Link
          href="/passages?level=CET4"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            level === "CET4" ? "bg-warm-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-warm-50"
          }`}
        >
          四级 ({cet4Count})
        </Link>
        <Link
          href="/passages?level=CET6"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            level === "CET6" ? "bg-warm-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-warm-50"
          }`}
        >
          六级 ({cet6Count})
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {passages.map((p) => (
          <Link
            key={p.id}
            href={`/passages/${p.id}`}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-lg font-bold text-gray-800">{p.title}</span>
              <span className="text-xs bg-warm-100 text-warm-700 px-2 py-0.5 rounded-full">
                {p.level}
              </span>
            </div>
            <p className="text-sm text-gray-500">{p.content.slice(0, 60)}...</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {JSON.parse(p.tags).map((tag: string) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {passages.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p>暂无短文，等待管理员添加内容</p>
        </div>
      )}
    </div>
  );
}