"use client";

import { useState } from "react";

interface QuizQuestionProps {
  questionType: "en2cn" | "cn2en" | "fillblank";
  word: string;
  meaning: string;
  pronunciation: string;
  mnemonic: string;
  exampleSentence: string;
  exampleTranslation: string;
  options: string[];
  correctIndex: number;
  onAnswer: (correct: boolean) => void;
}

function getQuestionText(
  questionType: "en2cn" | "cn2en" | "fillblank",
  word: string,
  meaning: string,
  exampleSentence: string
): { prompt: string; highlight: string } {
  switch (questionType) {
    case "en2cn":
      return { prompt: "这个词的中文意思是？", highlight: word };
    case "cn2en":
      return { prompt: "选出对应的英文单词", highlight: meaning };
    case "fillblank": {
      const blankSentence = exampleSentence.replace(
        new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
        "____"
      );
      return { prompt: "选择正确的单词填入空白", highlight: blankSentence };
    }
  }
}

export default function QuizQuestion({
  questionType,
  word,
  meaning,
  pronunciation,
  mnemonic,
  exampleSentence,
  exampleTranslation,
  options,
  correctIndex,
  onAnswer,
}: QuizQuestionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const { prompt, highlight } = getQuestionText(
    questionType,
    word,
    meaning,
    exampleSentence
  );

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedIndex(index);
    setAnswered(true);

    const correct = index === correctIndex;
    setTimeout(() => {
      onAnswer(correct);
    }, 1500);
  };

  const getOptionClass = (index: number) => {
    if (!answered) {
      return "w-full text-left p-4 rounded-xl border-2 border-warm-200 bg-white hover:border-warm-400 hover:bg-warm-50 transition-colors font-medium text-gray-700";
    }
    if (index === correctIndex) {
      return "w-full text-left p-4 rounded-xl border-2 border-green-400 bg-green-50 font-medium text-green-700";
    }
    if (index === selectedIndex) {
      return "w-full text-left p-4 rounded-xl border-2 border-red-400 bg-red-50 font-medium text-red-700";
    }
    return "w-full text-left p-4 rounded-xl border-2 border-warm-100 bg-gray-50 font-medium text-gray-400";
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Question header */}
      <div className="card text-center">
        <div className="text-xs font-bold text-warm-500 uppercase mb-1">
          {questionType === "en2cn"
            ? "英→中"
            : questionType === "cn2en"
            ? "中→英"
            : "语境填空"}
        </div>
        <p className="text-sm text-gray-500 mb-3">{prompt}</p>
        <div className="text-2xl font-bold text-gray-800">{highlight}</div>
        {questionType !== "fillblank" && (
          <div className="text-sm text-gray-400 mt-1">{pronunciation}</div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={answered}
            className={getOptionClass(index)}
          >
            <span className="inline-block w-7 h-7 rounded-full bg-warm-100 text-warm-700 text-sm font-bold text-center leading-7 mr-3">
              {String.fromCharCode(65 + index)}
            </span>
            {option}
          </button>
        ))}
      </div>

      {/* Feedback & mnemonic after answer */}
      {answered && (
        <div
          className={`rounded-xl p-4 border-2 ${
            selectedIndex === correctIndex
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">
              {selectedIndex === correctIndex ? "✅" : "❌"}
            </span>
            <span
              className={`font-bold ${
                selectedIndex === correctIndex ? "text-green-700" : "text-red-700"
              }`}
            >
              {selectedIndex === correctIndex ? "回答正确！" : `正确答案是: ${word}`}
            </span>
          </div>
          {selectedIndex !== correctIndex && (
            <div className="text-sm text-gray-600 mb-2">
              你的选择不正确，正确答案是 <strong>{options[correctIndex]}</strong>
            </div>
          )}
          <div className="bg-warm-50 rounded-xl p-3 text-sm text-gray-700">
            💡 {mnemonic}
          </div>
          <div className="text-xs text-gray-500 mt-3 space-y-1">
            <p>
              📝 {exampleSentence}
            </p>
            <p className="text-gray-400">{exampleTranslation}</p>
          </div>
        </div>
      )}
    </div>
  );
}