"use client";

interface StreakCalendarProps {
  checkIns: { date: string; streakCount: number }[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function StreakCalendar({ checkIns }: StreakCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkedInSet = new Set(checkIns.map((c) => c.date));

  // Build 28-day grid: 7 rows (Mon..Sun) × 4 columns (weeks)
  // Find the Monday of the week that contains (today - 27 days)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 27);

  // Adjust startDate back to the Monday of its week
  const dayOfWeek = startDate.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const gridStart = new Date(startDate);
  gridStart.setDate(gridStart.getDate() + mondayOffset);

  // Build a flat list of 28 dates starting from gridStart
  const days: Date[] = [];
  const cursor = new Date(gridStart);
  for (let i = 0; i < 28; i++) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  // Organize into columns: each column is a week (7 days starting Mon)
  const numCols = 4;
  const columns: Date[][] = [];
  for (let col = 0; col < numCols; col++) {
    const week: Date[] = [];
    for (let row = 0; row < 7; row++) {
      const idx = col * 7 + row;
      if (idx < days.length) {
        week.push(days[idx]);
      }
    }
    if (week.length > 0) {
      columns.push(week);
    }
  }

  const todayStr = getDateString(today);

  const formatDisplayDate = (d: Date) => {
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${month}/${day} ${dayNames[d.getDay()]}`;
  };

  const currentStreak =
    checkIns.length > 0
      ? checkIns.reduce((max, c) => Math.max(max, c.streakCount), 0)
      : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">打卡日历</h3>
          <p className="text-sm text-gray-500">{formatDisplayDate(today)}</p>
        </div>
        {currentStreak > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-warm-600">{currentStreak}</div>
            <div className="text-xs text-gray-400">天连续打卡</div>
          </div>
        )}
      </div>

      <div className="flex gap-1">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-1 mr-1 justify-start">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="w-6 h-6 flex items-center justify-center text-[10px] text-gray-400"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Week columns */}
        <div className="flex gap-1">
          {columns.map((week, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1">
              {week.map((date) => {
                const dateStr = getDateString(date);
                const isCheckedIn = checkedInSet.has(dateStr);
                const isToday = dateStr === todayStr;
                const isPast = date <= today;

                let cellClass = "bg-gray-100"; // future or no check-in
                if (!isPast) {
                  cellClass = "bg-gray-50";
                } else if (isCheckedIn) {
                  cellClass = "bg-warm-400";
                }

                return (
                  <div
                    key={dateStr}
                    title={`${dateStr}${isCheckedIn ? " - 已打卡" : ""}`}
                    className={`w-6 h-6 rounded-sm ${cellClass} ${
                      isToday ? "ring-2 ring-warm-500 ring-offset-1" : ""
                    } transition-colors`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100" />
        <div className="w-3 h-3 rounded-sm bg-warm-200" />
        <div className="w-3 h-3 rounded-sm bg-warm-300" />
        <div className="w-3 h-3 rounded-sm bg-warm-400" />
        <span>More</span>
      </div>
    </div>
  );
}