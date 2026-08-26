import { z } from "zod";

// anon/publishable key라 노출돼도 안전하다 (RLS가 방어선) — 프로젝트가
// 고정이라 env var로 안 돌리고 코드에 직접 박아 넣는다.
const SUPABASE_URL = "https://dilsncxfjnvgiaoteaiy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pZOhwYa5pkbiHD-8DoaH-w_cMPXBRT-";

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse({
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
});

// 키가 비어 있어도 next dev/build는 죽지 않아야 한다 — 실제로 그 값을
// 쓰는 코드 경로가 실행될 때만 에러를 낸다 (PRD 17.1).
const raw = parsed.success ? parsed.data : { GEMINI_API_KEY: undefined, GEMINI_MODEL: undefined };

export const env = {
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
  geminiApiKey: raw.GEMINI_API_KEY,
  // 이미지 입력을 지원하는 Gemini 무료 티어 모델 중 요청 한도(15 RPM · 1000 RPD)가
  // 가장 넉넉한 모델 — gemini-2.5-flash 대비 일일 한도가 4배다.
  geminiModel: raw.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
};

export const hasGeminiKey = Boolean(env.geminiApiKey);
