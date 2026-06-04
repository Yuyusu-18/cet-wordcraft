"use client";

import { useState } from "react";

interface FlashcardProps {
  front: string;
  sub?: string;
  back: { meaning: string; mnemonic: string; example: string; exampleTranslation: string };
  onResult: (known: boolean) => void;
}

export default function Flashcard({ front, sub, back, onResult }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="max-w-md mx-auto">
      {!flipped ? (
        <div
          onClick={() => setFlipped(true)}
          className="bg-white rounded-2xl shadow-md border-2 border-warm-200 p-12 text-center cursor-pointer hover:shadow-lg transition-shadow min-h-[200px] flex flex-col items-center justify-center"
        >
          <div className="text-3xl font-bold text-gray-800 mb-2">{front}</div>
          {sub && <div className="text-gray-400">{sub}</div>}
          <div className="text-gray-300 text-sm mt-8">点击翻转查看巧记</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md border-2 border-green-200 p-8 min-h-[280px] flex flex-col">
          <div className="text-2xl font-bold text-gray-800 mb-1">{front}</div>
          {sub && <div className="text-gray-400 text-sm mb-3">{sub}</div>}
          <div className="text-lg font-medium text-gray-700 mb-3">{back.meaning}</div>
          <div className="bg-warm-50 rounded-xl p-4 text-sm text-gray-700 mb-3 flex-1">
            💡 {back.mnemonic}
          </div>
          <div className="text-xs text-gray-500 mb-4">
            📝 {back.example}<br />{back.exampleTranslation}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onResult(false)}
              className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
            >
              😕 不认识
            </button>
            <button
              onClick={() => onResult(true)}
              className="flex-1 py-3 bg-green-50 text-green-600 rounded-xl font-medium hover:bg-green-100 transition-colors"
            >
              😊 认识
            </button>
          </div>
        </div>
      )}
    </div>
  );
}