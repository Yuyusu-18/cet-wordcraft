"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useMemo } from "react";
import { useSession } from "next-auth/react";
import QuizQuestion from "@/components/QuizQuestion";
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

interface QuizItem {
  item: PracticeItem;
  questionType: "en2cn" | "cn2en" | "fillblank";
  options: string[];
  correctIndex: number;
}

interface ResultItem extends PracticeItem {
  correct: boolean;
}

const QUESTION_TYPES: ("en2cn" | "cn2en" | "fillblank")[] = [
  "en2cn",
  "cn2en",
  "fillblank",
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildQuizItems(items: PracticeItem[]): QuizItem[] {
  return items.map((item, idx) => {
    const questionType = pickOne(QUESTION_TYPES);
    const word = item.word || item.phrase || "";
    const meaning = item.meaning;

    // Determine the correct answer and pool for distractors
    let correctAnswer: string;
    let distractorPool: string[];

    switch (questionType) {
      case "en2cn":
        // Question: word -> meaning, options are meanings
        correctAnswer = meaning;
        distractorPool = items
          .filter((_, i) => i !== idx)
          .map((i) => i.meaning);
        break;
      case "cn2en":
        // Question: meaning -> word, options are words
        correctAnswer = word;
        distractorPool = items
          .filter((_, i) => i !== idx)
          .map((i) => i.word || i.phrase || "")
          .filter((w) => w !== "");
        break;
      case "fillblank":
        // Question: sentence with blank, options are words
        correctAnswer = word;
        distractorPool = items
          .filter((_, i) => i !== idx)
          .map((i) => i.word || i.phrase || "")
          .filter((w) => w !== "");
        break;
    }

    const distractors = pickRandom(
      distractorPool.filter((d) => d !== correctAnswer),
      3
    );

    // If we don't have enough distractors, fill with plausible alternatives
    while (distractors.length < 3) {
      const filler = `[选项${distractors.length + 1}]`;
      distractors.push(filler);
    }

    // Build options array with 1 correct + 3 wrong, shuffled
    const allOptions = [correctAnswer, ...distractors];
    const shuffled = allOptions
      .map((opt, i) => ({ opt, originalIndex: i }))
      .sort(() => Math.random() - 0.5);

    return {
      item,
      questionType,
      options: shuffled.map((s) => s.opt),
      correctIndex: shuffled.findIndex((s) => s.originalIndex === 0),
    };
  });
}

function QuizContent() {
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

  // Generate quiz items once we have the practice items
  const quizItems = useMemo(() => buildQuizItems(items), [items]);

  const handleAnswer = async (correct: boolean) => {
    const quizItem = quizItems[currentIndex];
    const item = quizItem.item;
    const result: ResultItem = { ...item, correct };
    setResults([...results, result]);

    const type = searchParams.get("type") || "words";
    await fetch("/api/practice/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: item.id,
        contentType: type,
        exerciseType: "quiz",
        isCorrect: correct,
      }),
    });

    if (currentIndex < quizItems.length - 1) {
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

  if (quizItems.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-2">🎉</p>
        <p>没有需要练习的内容，所有词都已掌握！</p>
      </div>
    );
  }

  if (currentIndex >= quizItems.length) {
    return (
      <ResultSummary
        results={results.map((r) => ({
          front: r.word || r.phrase || "",
          meaning: r.meaning,
          known: r.correct,
        }))}
        onRestart={() => {
          setCurrentIndex(0);
          setResults([]);
        }}
        onBack={() => router.push("/practice")}
      />
    );
  }

  const quizItem = quizItems[currentIndex];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <ProgressBar current={currentIndex + 1} total={quizItems.length} />
      <QuizQuestion
        questionType={quizItem.questionType}
        word={quizItem.item.word || quizItem.item.phrase || ""}
        meaning={quizItem.item.meaning}
        pronunciation={quizItem.item.pronunciation}
        mnemonic={quizItem.item.mnemonic}
        exampleSentence={quizItem.item.exampleSentence}
        exampleTranslation={quizItem.item.exampleTranslation}
        options={quizItem.options}
        correctIndex={quizItem.correctIndex}
        onAnswer={handleAnswer}
      />
    </div>
  );
}

export default function QuizPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-warm-300 border-t-warm-600 rounded-full" />
          </div>
        }
      >
        <QuizContent />
      </Suspense>
    </AuthGuard>
  );
}