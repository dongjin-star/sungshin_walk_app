import type { MoodKey } from "@/lib/mood";

// 사진 상태 머신 6종 — 지도 핀 · 피드 카드 · 상세 화면이 전부 이 값을
// 단일 소스로 분기한다 (WALK-PRD.md 9.3).
export type PhotoStatus = "queued_offline" | "pending" | "generating" | "ready" | "failed" | "no_location";

export interface Photo {
  id: string;
  thumbUrl: string | null;
  viewUrl: string | null;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  capturedAt: string; // ISO
  source: "camera" | "gallery";
  userNote: string | null;
  captionAi: string | null;
  captionUser: string | null;
  mood: MoodKey | null;
  moodEdited: boolean;
  status: PhotoStatus;
  tags: string[];
}

export function displayCaption(photo: Pick<Photo, "captionUser" | "captionAi">): string | null {
  return photo.captionUser ?? photo.captionAi ?? null;
}

export function isPendingLike(status: PhotoStatus): boolean {
  return status === "pending" || status === "generating" || status === "queued_offline";
}
