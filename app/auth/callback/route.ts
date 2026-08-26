import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 매직링크·OAuth 리다이렉트가 돌아오는 지점 — PKCE 코드를 세션 쿠키로 교환한다.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
