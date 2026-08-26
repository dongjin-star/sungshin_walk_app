import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
});

// 키가 비어 있어도 next dev/build는 죽지 않아야 한다 — 실제로 그 값을
// 쓰는 코드 경로가 실행될 때만 에러를 낸다 (PRD 17.1과 동일한 원칙을
// Supabase 부재 상황에도 자연스럽게 확장).
const raw = parsed.success
  ? parsed.data
  : {
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      GEMINI_API_KEY: undefined,
      GEMINI_MODEL: undefined,
    };

export const env = {
  supabaseUrl: raw.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  geminiApiKey: raw.GEMINI_API_KEY,
  // 이미지 입력을 지원하는 Gemini 무료 티어 모델 중 요청 한도(15 RPM · 1000 RPD)가
  // 가장 넉넉한 모델 — gemini-2.5-flash 대비 일일 한도가 4배다.
  geminiModel: raw.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
};

export const hasSupabaseClientConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const hasGeminiKey = Boolean(env.geminiApiKey);
