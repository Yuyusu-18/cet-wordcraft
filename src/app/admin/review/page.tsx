"use client";

import { useEffect, useState, useCallback } from "react";

interface ReviewItem {
  id: number;
  contentId: number;
  status: string;
  rejectReason: string | null;
  reviewedAt: string | null;
  contentType: "word" | "phrase" | "passage";
  content: {
    id: number;
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
  };
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/review");
      const data = await res.json();
      if (res.ok) {
        setReviews((data as { reviews: ReviewItem[] }).reviews || []);
      } else {
        setMessage({ type: "error", text: (data as { error?: string }).error || "获取审核列表失败" });
      }
    } catch {
      setMessage({ type: "error", text: "网络错误，请重试" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (contentId: number) => {
    setActionLoading(contentId);
    setMessage(null);
    try {
      const res = await fetch("/api/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, status: "approved" }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.contentId !== contentId));
        setMessage({ type: "success", text: "已通过审核" });
      } else {
        setMessage({ type: "error", text: (data as { error?: string }).error || "操作失败" });
      }
    } catch {
      setMessage({ type: "error", text: "网络错误，请重试" });
    }
    setActionLoading(null);
  };

  const handleReject = async (contentId: number) => {
    if (!rejectReason.trim()) {
      setMessage({ type: "error", text: "请填写驳回理由" });
      return;
    }
    setActionLoading(contentId);
    setMessage(null);
    try {
      const res = await fetch("/api/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, status: "rejected", rejectReason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.contentId !== contentId));
        setRejectId(null);
        setRejectReason("");
        setMessage({ type: "success", text: "已驳回" });
      } else {
        setMessage({ type: "error", text: (data as { error?: string }).error || "操作失败" });
      }
    } catch {
      setMessage({ type: "error", text: "网络错误，请重试" });
    }
    setActionLoading(null);
  };

  const handleBatchApprove = async () => {
    setBatchLoading(true);
    setMessage(null);
    try {
      const contentIds = reviews.map((r) => r.contentId);
      const res = await fetch("/api/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentIds, status: "approved" }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews([]);
        setMessage({ type: "success", text: `已批量通过 ${contentIds.length} 条内容` });
      } else {
        setMessage({ type: "error", text: (data as { error?: string }).error || "操作失败" });
      }
    } catch {
      setMessage({ type: "error", text: "网络错误，请重试" });
    }
    setBatchLoading(false);
  };

  const renderTags = (tagsJson: string | undefined) => {
    try {
      const tags = tagsJson ? JSON.parse(tagsJson) : [];
      if (!Array.isArray(tags) || tags.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag: string, i: number) => (
            <span key={i} className="bg-warm-100 text-warm-700 text-xs px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      );
    } catch {
      return null;
    }
  };

  const renderContentCard = (item: ReviewItem) => {
    const { content, contentType } = item;

    if (contentType === "passage") {
      return (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">{content.title}</h3>
          <p className="text-gray-600">{content.content}</p>
          {content.translation && (
            <p className="text-gray-400 text-sm">{content.translation}</p>
          )}
          {renderTags(content.tags)}
          <div className="text-xs text-gray-400 mt-1">等级：{content.level}</div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-800">
          {content.word || content.phrase}
          {content.pronunciation && (
            <span className="text-gray-400 font-normal ml-2">/{content.pronunciation}/</span>
          )}
        </h3>
        <p className="text-gray-700">
          <span className="font-medium">释义：</span>
          {content.meaning}
        </p>
        <p className="text-gray-600 text-sm">
          <span className="font-medium">巧记：</span>
          {content.mnemonic}
        </p>
        {content.exampleSentence && (
          <div className="bg-warm-50 rounded-lg p-3 text-sm">
            <p className="text-gray-700">{content.exampleSentence}</p>
            {content.exampleTranslation && (
              <p className="text-gray-400 mt-1">{content.exampleTranslation}</p>
            )}
          </div>
        )}
        {renderTags(content.tags)}
        <div className="text-xs text-gray-400 mt-1">等级：{content.level}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">📋 审核队列</h2>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? "加载中..." : `${reviews.length} 条待审核`}
            </p>
          </div>
          {reviews.length > 0 && (
            <button
              onClick={handleBatchApprove}
              disabled={batchLoading}
              className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
            >
              {batchLoading ? "处理中..." : "✅ 全部通过"}
            </button>
          )}
        </div>
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

      {/* Loading state */}
      {loading && (
        <div className="card text-center py-12">
          <svg className="animate-spin h-8 w-8 mx-auto text-warm-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-400 mt-3">加载审核队列...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && reviews.length === 0 && (
        <div className="card text-center text-gray-400 py-12">
          <p className="text-4xl mb-2">📋</p>
          <p>暂无待审核内容</p>
          <p className="text-xs mt-1">生成内容并提交审核后出现在这里</p>
        </div>
      )}

      {/* Review cards */}
      {!loading &&
        reviews.map((item) => (
          <div key={item.id} className="card relative">
            <div className="absolute top-4 right-4">
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                {item.contentType === "word" ? "单词" : item.contentType === "phrase" ? "短语" : "短文"}
              </span>
            </div>

            {renderContentCard(item)}

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-warm-100 flex items-center gap-3">
              {rejectId === item.contentId ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="驳回理由..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-warm-300 focus:border-warm-400 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleReject(item.contentId)}
                    disabled={actionLoading === item.contentId}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === item.contentId ? "..." : "确认驳回"}
                  </button>
                  <button
                    onClick={() => {
                      setRejectId(null);
                      setRejectReason("");
                    }}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleApprove(item.contentId)}
                    disabled={actionLoading === item.contentId}
                    className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
                  >
                    {actionLoading === item.contentId ? "处理中..." : "✅ 通过"}
                  </button>
                  <button
                    onClick={() => setRejectId(item.contentId)}
                    disabled={actionLoading === item.contentId}
                    className="btn-outline text-sm py-1.5 px-4 disabled:opacity-50"
                  >
                    ❌ 驳回
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}