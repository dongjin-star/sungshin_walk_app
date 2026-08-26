import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, hasSupabaseClientConfig } from "@/lib/env";

const PUBLIC_PREFIXES = ["/onboarding", "/login", "/manifest.json", "/sw.js", "/icons", "/fonts"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  // 키가 없으면(로컬 개발 초기) 인증 게이트를 걸지 않고 UI만 확인할 수
  // 있게 통과시킨다 — 실제 데이터 접근은 각 페이지의 Supabase 호출이
  // 그 시점에 실패한다.
  if (!hasSupabaseClientConfig) {
    return response;
  }

  const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/caption|api/account|auth/callback).*)"],
};
