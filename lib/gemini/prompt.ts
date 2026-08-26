import "server-only";
import { Type, type Schema } from "@google/genai";
import { z } from "zod";
import { MOOD, MOOD_KEYS } from "@/lib/mood";

// 프롬프트는 기획 결정 대상이 아니다 — 코드에 상수로 내장되어 배포된다.
// 설정 화면도, 사용자 입력도, 운영자 튜닝 UI도 없다 (WALK-PRD.md 17장).
export const PROMPT_VERSION = "2026-08-26.1";

export const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    caption: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    mood: { type: Type.STRING, enum: [...MOOD_KEYS] },
  },
  required: ["caption", "tags", "mood"],
};

const moodDefinitions = MOOD_KEYS.map((key) => `- ${key} (${MOOD[key].label}): ${MOOD[key].definition}`).join("\n");

export function buildPrompt(params: {
  capturedAtLabel: string; // "오후 4시 12분" 형태, Asia/Seoul 기준으로 이미 변환된 값
  userNote: string | null;
  existingTags: string[];
}): string {
  const { capturedAtLabel, userNote, existingTags } = params;

  return `당신은 산책 중 찍은 사진에 짧은 시 같은 한 줄 캡션과 태그, 무드를 붙이는 어시스턴트입니다.

[촬영 시각]
${capturedAtLabel}

[사용자가 남긴 한마디]
${userNote ? userNote : "(없음)"}

[기존에 자주 쓴 태그 — 가능하면 재사용]
${existingTags.length > 0 ? existingTags.join(", ") : "(없음)"}

[무드 8종 정의 — 반드시 이 중 하나를 고른다]
${moodDefinitions}

[캡션 작성 규칙]
- 30자 이내, 은유적인 짧은 시 톤. 설명문 금지.
- 사진에 없는 사물·사람·동물을 지어내지 않는다.
- 시각·기온·장소명 등 메타데이터를 캡션에 직접 쓰지 않는다.
- 이모지·해시태그·마침표를 쓰지 않는다.
- "~하는 듯했다", "~같았다" 같은 상투적 표현을 쓰지 않는다.
- 사용자의 한마디가 있으면 그 정서를 최우선으로 반영한다.

[태그 규칙]
- 1~4개. 각 6자 이내. 기존 태그 재사용을 우선한다.

[무드 규칙]
- 애매해도 지배적 인상 하나를 고른다. calm으로 쏠리지 않도록 신중히 판단한다.

응답은 반드시 지정된 JSON 스키마 형식으로만 출력한다.`;
}

export const geminiOutputSchema = z.object({
  caption: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .refine((v) => !v.includes("\n"), "캡션에 개행이 포함될 수 없습니다"),
  tags: z
    .array(z.string().trim().min(1).max(6).transform((t) => t.replace(/^#/, "")))
    .min(1)
    .max(4),
  mood: z.enum(MOOD_KEYS),
});

export type GeminiOutput = z.infer<typeof geminiOutputSchema>;
