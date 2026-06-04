import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import PassageReader from "./PassageReader";

export const dynamic = "force-dynamic";

export default async function PassageDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const passage = await prisma.passage.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!passage || passage.status !== "published") notFound();

  const highlightedIds: number[] = JSON.parse(passage.highlightedWordIds);
  const highlightedWords = highlightedIds.length > 0
    ? await prisma.word.findMany({
        where: { id: { in: highlightedIds } },
      })
    : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/passages" className="text-sm text-warm-600 hover:underline">
        ← 返回短文列表
      </Link>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">{passage.title}</h1>
          <span className="text-xs bg-warm-100 text-warm-700 px-3 py-1 rounded-full">
            {passage.level}
          </span>
        </div>

        <PassageReader
          content={passage.content}
          highlightedWords={highlightedWords}
        />

        <details className="mt-6">
          <summary className="text-sm text-warm-600 cursor-pointer hover:underline">
            查看中文翻译
          </summary>
          <p className="mt-3 text-gray-600 leading-relaxed p-4 bg-gray-50 rounded-xl">
            {passage.translation}
          </p>
        </details>
      </div>
    </div>
  );
}