"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const contentTypes = [
  { value: "words", label: "📝 单词", desc: "练习四六级词汇" },
  { value: "phrases", label: "📖 短语", desc: "练习常用短语" },
];

const levels = [
  { value: "CET4", label: "四级" },
  { value: "CET6", label: "六级" },
];

const modes = [
  { value: "flashcard", label: "📇 闪卡", desc: "翻转卡片，标记认识/不认识" },
  { value: "quiz", label: "📝 选择题", desc: "四选一，英中互译 + 语境填空" },
  { value: "spelling", label: "⌨️ 拼写", desc: "看释义和提示，拼出单词" },
];

export default function PracticePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [contentType, setContentType] = useState("words");
  const [level, setLevel] = useState("CET4");
  const [mode, setMode] = useState("flashcard");

  const handleStart = () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    router.push(`/practice/${mode}?type=${contentType}&level=${level}`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🎯 练习中心</h1>
        <p className="text-gray-500 text-sm mt-1">选择内容类型、级别和练习模式</p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">内容类型</h3>
        <div className="grid grid-cols-2 gap-2">
          {contentTypes.map((ct) => (
            <button
              key={ct.value}
              onClick={() => setContentType(ct.value)}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                contentType === ct.value
                  ? "border-warm-500 bg-warm-50"
                  : "border-gray-200 bg-white hover:border-warm-200"
              }`}
            >
              <div className="font-bold text-gray-800">{ct.label}</div>
              <div className="text-xs text-gray-500 mt-1">{ct.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">考试级别</h3>
        <div className="flex gap-2">
          {levels.map((l) => (
            <button
              key={l.value}
              onClick={() => setLevel(l.value)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                level === l.value
                  ? "bg-warm-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-warm-50"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">练习模式</h3>
        <div className="grid grid-cols-1 gap-2">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                mode === m.value
                  ? "border-warm-500 bg-warm-50"
                  : "border-gray-200 bg-white hover:border-warm-200"
              }`}
            >
              <div className="font-bold text-gray-800">{m.label}</div>
              <div className="text-xs text-gray-500 mt-1">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleStart} className="btn-primary w-full text-lg py-3">
        🚀 开始练习
      </button>
    </div>
  );
}