const UNLOCK_THRESHOLD = 10;

export function LockedPanel({ photoCount }: { photoCount: number }) {
  const pct = Math.min(100, Math.round((photoCount / UNLOCK_THRESHOLD) * 100));

  return (
    <div className="flex flex-col items-center gap-3 py-10 px-6 rounded-[var(--radius-card)] bg-[var(--surface-sunk)] text-center">
      <p className="text-body text-[var(--ink-muted)]">
        사진 10장이 모이면 분석이 열려요
        <br />
        (지금 {photoCount}장)
      </p>
      <div className="w-full max-w-[200px] h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
        <div className="h-full rounded-full bg-[var(--accent)] transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
