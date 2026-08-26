// 무드 8종 단일 진실 공급원 — DB enum, 프롬프트, 차트 색, 지도 핀 테두리,
// 필터 UI가 전부 이 파일을 참조해야 한다. 정의가 두 곳에 존재하는 순간
// 차트가 거짓말을 시작한다 (WALK-PRD.md 21장).

export const MOOD_KEYS = [
  "calm",
  "warm",
  "lonely",
  "lively",
  "dreamy",
  "fresh",
  "cozy",
  "strange",
] as const;

export type MoodKey = (typeof MOOD_KEYS)[number];

export const MOOD: Record<MoodKey, { label: string; hex: string; definition: string }> = {
  calm: { label: "고요", hex: "#7C8FA0", definition: "정적이고 인적이 드묾. 시간이 멈춘 듯한 장면" },
  warm: { label: "따뜻", hex: "#E0A356", definition: "볕과 온기. 사람의 흔적이 남아 있는 장면" },
  lonely: { label: "쓸쓸", hex: "#4A5878", definition: "비어 있음, 저물어감, 거리감" },
  lively: { label: "활기", hex: "#E2703A", definition: "움직임과 소란, 색이 많음" },
  dreamy: { label: "몽환", hex: "#A38BC4", definition: "흐릿함, 안개, 비현실감" },
  fresh: { label: "청량", hex: "#5FB49C", definition: "맑음, 바람, 초록과 하늘" },
  cozy: { label: "아늑", hex: "#C9A88A", definition: "좁고 편안한 공간, 실내감" },
  strange: { label: "낯섦", hex: "#8E5B7E", definition: "어긋남, 기묘함, 처음 보는 것" },
};

export function isMoodKey(value: string): value is MoodKey {
  return (MOOD_KEYS as readonly string[]).includes(value);
}
