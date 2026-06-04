import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PhraseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const phrase = await prisma.phrase.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!phrase || phrase.status !== "published") {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/phrases" className="text-sm text-warm-600 hover:underline">
        ← 返回短语列表
      </Link>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{phrase.phrase}</h1>
          </div>
          <div className="flex gap-2">
            <span className="text-xs bg-warm-100 text-warm-700 px-3 py-1 rounded-full">
              {phrase.level}
            </span>
            {JSON.parse(phrase.tags).map((tag: string) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="text-lg text-gray-700 font-medium mb-6">
          {phrase.meaning}
        </div>

        <div className="bg-warm-50 border border-warm-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-bold text-warm-700 mb-2">💡 巧记法</h3>
          <p className="text-gray-700 leading-relaxed">{phrase.mnemonic}</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-600 mb-2">📝 例句</h3>
          <p className="text-gray-800 italic mb-2">{phrase.exampleSentence}</p>
          <p className="text-gray-500 text-sm">{phrase.exampleTranslation}</p>
        </div>
      </div>
    </div>
  );
}