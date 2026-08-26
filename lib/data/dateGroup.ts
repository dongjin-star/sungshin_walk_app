// PRD 10장 — 날짜별 스티키 헤더는 사용자 로컬(Asia/Seoul) 기준.
const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayLabelFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  weekday: "long",
});

export function dayKey(iso: string): string {
  return dayKeyFormatter.format(new Date(iso)); // YYYY-MM-DD (Asia/Seoul)
}

export function dayLabel(iso: string): string {
  return dayLabelFormatter.format(new Date(iso)); // "8월 26일 화요일"
}

export function groupByDay<T extends { capturedAt: string }>(items: T[]): { key: string; label: string; items: T[] }[] {
  const groups = new Map<string, { key: string; label: string; items: T[] }>();
  for (const item of items) {
    const key = dayKey(item.capturedAt);
    if (!groups.has(key)) groups.set(key, { key, label: dayLabel(item.capturedAt), items: [] });
    groups.get(key)!.items.push(item);
  }
  return Array.from(groups.values());
}
