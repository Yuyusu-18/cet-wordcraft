"use client";

import { useState } from "react";

type ContentType = "word" | "phrase" | "passage";
type Level = "CET4" | "CET6";

interface GeneratedResult {
  id?: number;
  word?: string;
  phrase?: string;
  title?: string;
  pronunciation?: string;
  meaning?: string;
  mnemonic?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  content?: string;
  translation?: string;
  level?: string;
  tags?: string;
  status?: string;
}

export default function GeneratePage() {
  const [contentType, setContentType] = useState<ContentType>("word");
  const [level, setLevel] = useState<Level>("CET4");
  const [wordsInput, setWordsInput] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleGenerate = async () => {
    setMessage(null);
    setLoading(true);

    try {
      const words = contentType !== "passage"
        ? wordsInput.split(/[,，]/).map((w) => w.trim()).filter(Boolean)
        : undefined;

      if (contentType !== "passage" && (!words || words.length === 0)) {
        setMessage({ type: "error", text: "请输入至少一个单词/短语" });
        setLoading(false);
        return;
      }

      if (contentType === "passage" && !topic.trim()) {
        setMessage({ type: "error", text: "请输入短文主题" });
        setLoading(false);
        return;
      }

      const body: Record<string, unknown> = { contentType, level };
      if (words) body.words = words;
      if (topic.trim()) body.topic = topic.trim();

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = (data as { error?: string; detail?: string }).detail || (data as { error?: string }).error || "生成失败";
        setMessage({
          type: "error",
          text: detail === "OPENAI_API_KEY not configured"
            ? "AI 服务未配置：请在环境变量中设置 OPENAI_API_KEY"
            : detail,
        });
        setLoading(false);
        return;
      }

      setResults((data as { results: GeneratedResult[] }).results || []);
      setMessage({ type: "success", text: `成功生成 ${(data as { results: GeneratedResult[] }).results.length} 条内容` });
    } catch {
      setMessage({ type: "error", text: "网络错误，请重试" });
    }

    setLoading(false);
  };

  const handleRegenerateWord = async (index: number) => {
    const item = results[index];
    const word = item.word || item.phrase || "";

    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, level, words: [word] }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: (data as { error?: string }).error || "重新生成失败" });
        setLoading(false);
        return;
      }

      const newResults = [...results];
      newResults[index] = (data as { results: GeneratedResult[] }).results[0] || newResults[index];
      setResults(newResults);
      setMessage({ type: "success", text: `已重新生成: ${word}` });
    } catch {
      setMessage({ type: "error", text: "网络错误，请重试" });
    }

    setLoading(false);
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          contentIds: results.filter((r) => r.id).map((r) => r.id!),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: (data as { error?: string }).error || "提交失败" });
      } else {
        setMessage({ type: "success", text: "已批量提交审核" });
      }
    } catch {
      setMessage({ type: "error", text: "网络错误，请重试" });
    }

    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🤖 AI 内容生成</h2>

        {/* Content type selector */}
        <div className="flex gap-3 mb-4">
          {(["word", "phrase", "passage"] as ContentType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setContentType(type);
                setResults([]);
                setMessage(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                contentType === type
                  ? "bg-warm-500 text-white"
                  : "bg-warm-50 text-warm-700 hover:bg-warm-100"
              }`}
            >
              {type === "word" ? "📝 单词" : type === "phrase" ? "📖 短语" : "📚 短文"}
            </button>
          ))}
        </div>

        {/* Level selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">难度等级</label>
          <div className="flex gap-3">
            {(["CET4", "CET6"] as Level[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  level === lvl
                    ? "bg-warm-500 text-white"
                    : "bg-warm-50 text-warm-700 hover:bg-warm-100"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        {contentType === "passage" ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                短文主题
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="如：校园生活、环保、科技..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-warm-300 focus:border-warm-400 outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标词汇（逗号分隔，可选）
              </label>
              <input
                type="text"
                value={wordsInput}
                onChange={(e) => setWordsInput(e.target.value)}
                placeholder="如：campus, library, professor"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-warm-300 focus:border-warm-400 outline-none"
              />
            </div>
          </>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {contentType === "word" ? "单词列表" : "短语列表"}（逗号分隔）
            </label>
            <textarea
              value={wordsInput}
              onChange={(e) => setWordsInput(e.target.value)}
              placeholder={
                contentType === "word"
                  ? "如：abandon, persistent, accommodate"
                  : "如：look forward to, in terms of, take advantage of"
              }
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-warm-300 focus:border-warm-400 outline-none resize-y"
            />
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              生成中...
            </span>
          ) : (
            "🚀 生成"
          )}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-4 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              生成结果 ({results.length})
            </h3>
            <button
              onClick={handleSubmitForReview}
              disabled={submitting}
              className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
            >
              {submitting ? "提交中..." : "📋 批量提交审核"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-warm-100 text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">#</th>
                  {contentType === "passage" ? (
                    <>
                      <th className="py-2 pr-4 font-medium">标题</th>
                      <th className="py-2 pr-4 font-medium">内容</th>
                      <th className="py-2 pr-4 font-medium">翻译</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 pr-4 font-medium">{contentType === "word" ? "单词" : "短语"}</th>
                      <th className="py-2 pr-4 font-medium">释义</th>
                      <th className="py-2 pr-4 font-medium">巧记法</th>
                      <th className="py-2 pr-4 font-medium">例句</th>
                    </>
                  )}
                  <th className="py-2 pr-4 font-medium">标签</th>
                  <th className="py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, idx) => (
                  <tr key={idx} className="border-b border-warm-50 hover:bg-warm-50/50">
                    <td className="py-3 pr-4 text-gray-400">{idx + 1}</td>
                    {contentType === "passage" ? (
                      <>
                        <td className="py-3 pr-4 font-medium">{item.title || "-"}</td>
                        <td className="py-3 pr-4 max-w-xs truncate">{item.content || "-"}</td>
                        <td className="py-3 pr-4 max-w-xs truncate text-gray-500">{item.translation || "-"}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 pr-4 font-medium">{item.word || item.phrase || "-"}</td>
                        <td className="py-3 pr-4">{item.meaning || "-"}</td>
                        <td className="py-3 pr-4 max-w-[200px] truncate text-gray-500">{item.mnemonic || "-"}</td>
                        <td className="py-3 pr-4 max-w-[200px] truncate text-gray-500">
                          {item.exampleSentence ? (
                            <>
                              {item.exampleSentence}
                              {item.exampleTranslation && (
                                <br />
                              )}
                              <span className="text-gray-400">{item.exampleTranslation}</span>
                            </>
                          ) : "-"}
                        </td>
                      </>
                    )}
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          try {
                            const tags = typeof item.tags === "string" ? JSON.parse(item.tags) : item.tags;
                            return (Array.isArray(tags) ? tags : []).map((tag: string, i: number) => (
                              <span key={i} className="bg-warm-100 text-warm-700 text-xs px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ));
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleRegenerateWord(idx)}
                        disabled={loading}
                        className="text-sm text-warm-600 hover:underline disabled:opacity-50"
                      >
                        🔄 重新生成
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && !message && (
        <div className="card text-center text-gray-400 py-12">
          <p className="text-4xl mb-2">🤖</p>
          <p>输入内容后点击「生成」按钮开始</p>
          <p className="text-xs mt-1">
            {process.env.NEXT_PUBLIC_AI_ENABLED === "false"
              ? "AI 功能未启用"
              : "基于 GPT-4o-mini 驱动"}
          </p>
        </div>
      )}
    </div>
  );
}