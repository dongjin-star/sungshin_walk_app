const LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const MAX_BAR_HEIGHT = 96;

export function WeekdayBars({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);
  const topDay = counts.indexOf(Math.max(...counts));

  return (
    <div className="flex items-end justify-between gap-2 h-[120px]">
      {LABELS.map((label, i) => {
        const count = counts[i] ?? 0;
        const height = count === 0 ? 4 : Math.max(6, Math.round((count / max) * MAX_BAR_HEIGHT));
        const isTop = i === topDay && count > 0;
        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full rounded-[6px]"
              style={{ height, backgroundColor: isTop ? "var(--accent)" : "var(--line-strong)" }}
            />
            <span className={`text-label ${isTop ? "text-[var(--accent)] font-semibold" : "text-[var(--ink-faint)]"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
