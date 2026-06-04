export default function StatsCard({
  label,
  value,
  unit,
  emoji,
}: {
  label: string;
  value: number | string;
  unit?: string;
  emoji: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-warm-100 p-4 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold text-gray-800">
        {value}
        {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}