"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    // 개발 모드에서는 등록하지 않는다 — _next/static 캐시가 SW에 붙잡히면
    // 리빌드된 번들을 브라우저가 계속 옛 버전으로 서빙해 디버깅을 방해한다.
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 서비스워커 등록 실패는 앱 동작을 막지 않는다
    });
  }, []);

  return null;
}
