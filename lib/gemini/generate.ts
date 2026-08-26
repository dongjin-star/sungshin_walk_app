import "server-only";
import { GoogleGenAI, createPartFromBase64 } from "@google/genai";
import { env } from "@/lib/env";
import { buildPrompt, geminiOutputSchema, RESPONSE_SCHEMA, type GeminiOutput } from "@/lib/gemini/prompt";

interface GenerateParams {
  imageBytes: Uint8Array;
  mimeType: string;
  capturedAtLabel: string;
  userNote: string | null;
  existingTags: string[];
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

/** 사진에 캡션·태그·무드를 붙인다. 서버 재검증까지 통과한 값만 반환한다. */
export async function generateCaption(params: GenerateParams): Promise<GeminiOutput> {
  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

  const prompt = buildPrompt({
    capturedAtLabel: params.capturedAtLabel,
    userNote: params.userNote,
    existingTags: params.existingTags,
  });

  const imagePart = createPartFromBase64(toBase64(params.imageBytes), params.mimeType);

  const response = await ai.models.generateContent({
    model: env.geminiModel,
    contents: [{ role: "user", parts: [imagePart, { text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini 응답이 비어 있습니다.");

  const parsed = geminiOutputSchema.parse(JSON.parse(text));

  // 태그 중복 제거 — PRD 17.3
  const uniqueTags = Array.from(new Set(parsed.tags)).slice(0, 4);

  return { ...parsed, tags: uniqueTags };
}
