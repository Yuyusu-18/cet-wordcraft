"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import Flashcard from "@/components/Flashcard";
import ProgressBar from "@/components/ProgressBar";
import ResultSummary from "@/components/ResultSummary";
import AuthGuard from "@/components/AuthGuard";

interface PracticeItem {
  id: number;
  word?: string;
  phrase?: string;
  pronunciation: string;
  meaning: string;
  mnemonic: string;
  exampleSentence: string;
  exampleTranslation: string;
}

interface ResultItem extends PracticeItem {
  known: boolean;
}

function FlashcardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [items, setItems] = useState<PracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    const type = searchParams.get("type") || "words";
    const level = searchParams.get("level") || "CET4";

    fetch(`/api/practice?type=${type}&level=${level}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, searchParams]);

  const handleResult = async (known: boolean) => {
    const item = items[currentIndex];
    const result: ResultItem = { ...item, known };
    setResults([...results, result]);

    const type = searchParams.get("type") || "words";
    await fetch("/api/practice/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: item.id,
        contentType: type,
        exerciseType: "flashcard",
        isCorrect: known,
      }),
    });

    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-warm-300 border-t-warm-600 rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-2">🎉</p>
        <p>没有需要练习的内容，所有词都已掌握！</p>
      </div>
    );
  }

  if (currentIndex >= items.length) {
    return (
      <ResultSummary
        results={results.map((r) => ({
          front: r.word || r.phrase || "",
          meaning: r.meaning,
          known: r.known,
        }))}
        onRestart={() => {
          setCurrentIndex(0);
          setResults([]);
        }}
        onBack={() => router.push("/practice")}
      />
    );
  }

  const item = items[currentIndex];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <ProgressBar current={currentIndex + 1} total={items.length} />
      <Flashcard
        front={item.word || item.phrase || ""}
        sub={item.pronunciation}
        back={{
          meaning: item.meaning,
          mnemonic: item.mnemonic,
          example: item.exampleSentence,
          exampleTranslation: item.exampleTranslation,
        }}
        onResult={handleResult}
      />
    </div>
  );
}

export default function FlashcardPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-warm-300 border-t-warm-600 rounded-full" /></div>}>
        <FlashcardContent />
      </Suspense>
    </AuthGuard>
  );
}