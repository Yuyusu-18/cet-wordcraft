"use client";

import { useState } from "react";

interface SpellingInputProps {
  word: string;
  meaning: string;
  pronunciation: string;
  mnemonic: string;
  exampleSentence: string;
  exampleTranslation: string;
  onAnswer: (correct: boolean) => void;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function isNearMatch(input: string, word: string): boolean {
  const normalizedInput = input.trim().toLowerCase();
  const normalizedWord = word.trim().toLowerCase();
  if (normalizedInput === normalizedWord) return true;
  // Allow 1 character Levenshtein distance tolerance
  return levenshteinDistance(normalizedInput, normalizedWord) <= 1;
}

export default function SpellingInput({
  word,
  meaning,
  pronunciation,
  mnemonic,
  exampleSentence,
  exampleTranslation,
  onAnswer,
}: SpellingInputProps) {
  const [userInput, setUserInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (submitted || !userInput.trim()) return;
    const correct = isNearMatch(userInput, word);
    setIsCorrect(correct);
    setSubmitted(true);

    setTimeout(() => {
      onAnswer(correct);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Prompt card */}
      <div className="card text-center">
        <div className="text-xs font-bold text-warm-500 uppercase mb-1">
          拼写练习
        </div>
        <div className="text-lg font-medium text-gray-700 mb-2">{meaning}</div>
        <div className="text-sm text-gray-400 mb-3">{pronunciation}</div>
        <div className="bg-warm-50 rounded-xl p-3 text-sm text-gray-700 inline-block">
          💡 {mnemonic}
        </div>
      </div>

      {/* Input area */}
      {!submitted ? (
        <div className="space-y-3">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入单词拼写..."
            autoFocus
            className="w-full p-4 rounded-xl border-2 border-warm-200 bg-white text-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:border-warm-400 transition-colors text-center"
          />
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim()}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认提交
          </button>
        </div>
      ) : (
        /* Feedback after submission */
        <div
          className={`rounded-xl p-4 border-2 ${
            isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{isCorrect ? "✅" : "❌"}</span>
            <span
              className={`font-bold ${
                isCorrect ? "text-green-700" : "text-red-700"
              }`}
            >
              {isCorrect ? "拼写正确！" : "拼写有误"}
            </span>
          </div>

          {!isCorrect && (
            <div className="mb-3 space-y-1">
              <div className="text-sm text-gray-600">
                你的输入: <span className="text-red-600 font-medium">{userInput}</span>
              </div>
              <div className="text-sm text-gray-600">
                正确拼写: <span className="text-green-600 font-bold text-lg">{word}</span>
              </div>
            </div>
          )}

          <div className="bg-warm-50 rounded-xl p-3 text-sm text-gray-700">
            💡 {mnemonic}
          </div>
          <div className="text-xs text-gray-500 mt-3 space-y-1">
            <p>📝 {exampleSentence}</p>
            <p className="text-gray-400">{exampleTranslation}</p>
          </div>
        </div>
      )}
    </div>
  );
}