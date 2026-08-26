function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 flex flex-col gap-1 items-center py-4 rounded-[var(--radius-card)] bg-[var(--surface)]" style={{ boxShadow: "var(--shadow-badge)" }}>
      <span className="text-[22px] font-semibold tabular-nums">{value}</span>
      <span className="text-label text-[var(--ink-muted)]">{label}</span>
    </div>
  );
}

export function StatStrip({ photoCount, dayCount, tagCount }: { photoCount: number; dayCount: number; tagCount: number }) {
  return (
    <div className="flex gap-2.5">
      <StatCard label="총 사진" value={photoCount} />
      <StatCard label="기록한 날" value={dayCount} />
      <StatCard label="태그" value={tagCount} />
    </div>
  );
}
