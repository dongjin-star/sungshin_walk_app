import clsx from "@/lib/clsx";

// 정적 스켈레톤. shimmer 애니메이션을 쓰지 않는다 — PRD 14.6.
// "아직 안 됐다"를 강조하지 않고, 캡션 자리만 조용히 잡아둔다.
export function SkeletonLine({ width = "70%", className }: { width?: string; className?: string }) {
  return (
    <div
      className={clsx("skeleton h-[18px]", className)}
      style={{ width }}
      aria-hidden
    />
  );
}
