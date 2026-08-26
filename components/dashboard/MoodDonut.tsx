"use client";

import { useRouter } from "next/navigation";
import { MOOD, MOOD_KEYS, type MoodKey } from "@/lib/mood";

export function MoodDonut({ counts }: { counts: Partial<Record<MoodKey, number>> }) {
  const router = useRouter();
  const total = MOOD_KEYS.reduce((sum, key) => sum + (counts[key] ?? 0), 0);

  if (total === 0) {
    return <p className="text-meta text-[var(--ink-faint)]">아직 무드 데이터가 없어요</p>;
  }

  let cumulative = 0;
  const stops: string[] = [];
  MOOD_KEYS.forEach((key) => {
    const count = counts[key] ?? 0;
    if (count === 0) return;
    const start = (cumulative / total) * 360;
    cumulative += count;
    const end = (cumulative / total) * 360;
    stops.push(`${MOOD[key].hex} ${start}deg ${end}deg`);
  });

  return (
    <div className="flex items-center gap-6">
      <div
        className="w-[132px] h-[132px] rounded-full shrink-0"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="w-[72px] h-[72px] rounded-full bg-[var(--surface)] relative top-[30px] left-[30px]" />
      </div>

      <ul className="flex-1 flex flex-col gap-2">
        {MOOD_KEYS.filter((key) => (counts[key] ?? 0) > 0).map((key) => {
          const pct = Math.round(((counts[key] ?? 0) / total) * 100);
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => router.push(`/feed?mood=${key}`)}
                className="flex items-center gap-2 text-meta w-full"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: MOOD[key].hex }} />
                <span className="text-[var(--ink)]">{MOOD[key].label}</span>
                <span className="text-[var(--ink-faint)] ml-auto tabular-nums">{pct}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
