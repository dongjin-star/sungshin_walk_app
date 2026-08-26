import { createClient as createSupabaseJsClient, type User } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Route Handler(`/api/caption`) 전용. PRD 부록 A의 API 계약이 쿠키가 아닌
 * `Authorization: Bearer <access_token>` 헤더를 명시하므로 쿠키 세션을
 * 쓰지 않는다. 이 클라이언트로 실행하는 모든 PostgREST 쿼리는 해당
 * 사용자의 JWT로 인증되어 RLS가 그대로 적용된다.
 */
export function createRouteClient(accessToken: string) {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }
  return createSupabaseJsClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * JWT를 Supabase Auth 서버에 실제로 재확인한다. `getSession()`은 로컬
 * JWT를 그대로 믿기 때문에, 과금되는 외부 API(Gemini)의 게이트로는
 * 반드시 `getUser(token)`을 써야 한다.
 */
export async function verifyBearerUser(
  request: Request
): Promise<{ user: User; supabase: ReturnType<typeof createRouteClient> } | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  const supabase = createRouteClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { user: data.user, supabase };
}
