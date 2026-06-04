export default function ResultSummary({
  results,
  onRestart,
  onBack,
}: {
  results: { front: string; meaning: string; known: boolean }[];
  onRestart: () => void;
  onBack: () => void;
}) {
  const correct = results.filter((r) => r.known).length;
  const pct = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;
  const weakWords = results.filter((r) => !r.known);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="card text-center">
        <div className="text-4xl mb-3">{pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚"}</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">练习完成！</h2>
        <div className="text-5xl font-bold text-warm-600 my-4">{pct}%</div>
        <p className="text-gray-500">
          正确 {correct} / {results.length}
        </p>
      </div>

      {weakWords.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-3">
            ⚠️ 需要加强的词汇 ({weakWords.length})
          </h3>
          <div className="space-y-2">
            {weakWords.map((w, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-800">{w.front}</span>
                <span className="text-gray-500">{w.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onRestart} className="btn-primary flex-1">
          🔄 再来一轮
        </button>
        <button onClick={onBack} className="btn-outline flex-1">
          ← 返回练习中心
        </button>
      </div>
    </div>
  );
}