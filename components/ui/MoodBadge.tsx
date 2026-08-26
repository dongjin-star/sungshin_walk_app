import { MOOD, type MoodKey } from "@/lib/mood";
import clsx from "@/lib/clsx";

interface MoodBadgeProps {
  mood: MoodKey;
  size?: "sm" | "lg";
  className?: string;
}

export function MoodBadge({ mood, size = "sm", className }: MoodBadgeProps) {
  const info = MOOD[mood];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--surface-sunk)]",
        size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3.5 py-2 text-[14px]",
        "text-[var(--ink-muted)] font-medium",
        className
      )}
    >
      <span
        aria-hidden
        className={clsx("rounded-full shrink-0", size === "sm" ? "w-2 h-2" : "w-3 h-3")}
        style={{ backgroundColor: info.hex }}
      />
      {info.label}
    </span>
  );
}

// 순수 색점 (지도 핀 테두리 등에서 색만 필요할 때는 인라인 style로 직접 사용)
export function MoodDot({ mood, size = 10 }: { mood: MoodKey; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block rounded-full shrink-0"
      style={{ backgroundColor: MOOD[mood].hex, width: size, height: size }}
    />
  );
}
