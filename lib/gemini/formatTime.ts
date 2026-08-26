// "오후 4시 12분" 형태로 Asia/Seoul 기준 시각을 만든다 — 프롬프트 재료(PRD 17.2).
export function formatKoreanTime(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).formatToParts(date);

  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "0";

  return `${dayPeriod} ${hour}시 ${minute}분`;
}
