import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Server Component / Server Action 전용. RLS는 쿠키에 담긴 사용자 세션을
 * 통해 자동 적용된다. Server Component 렌더 중에는 쿠키를 쓸 수 없으므로
 * setAll 실패는 조용히 무시한다 — 세션 갱신은 proxy.ts가 전담한다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component에서 호출된 경우 — 무시해도 안전하다
        }
      },
    },
  });
}
