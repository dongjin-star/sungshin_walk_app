"use client";

import { useEffect, useState } from "react";

const MIN_HOLD_MS = 400; // 인위적 연출 지연이 아니라, 첫 프레임 깜빡임 방지용 최소치
const MAX_HOLD_MS = 2000; // PRD 7.1 — 초과 시 로딩 인디케이터 노출

/**
 * PWA standalone 실행 시에만 보이는 스플래시. 브라우저 탭 접속 시에는
 * 아예 렌더링하지 않는다 (PRD 7.1). "브랜드 연출"이 아니라 앱 셸 로딩을
 * 가리는 장치이므로 세션당 1회만 보여준다.
 */
export function SplashOverlay() {
  const [visible, setVisible] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    const alreadyShown = sessionStorage.getItem("walkq:splash-shown") === "1";

    if (!isStandalone || alreadyShown) return;

    sessionStorage.setItem("walkq:splash-shown", "1");

    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let loadingTimer: ReturnType<typeof setTimeout> | undefined;

    queueMicrotask(() => {
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), MIN_HOLD_MS);
      loadingTimer = setTimeout(() => setShowLoading(true), MAX_HOLD_MS);
    });

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(loadingTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[var(--accent)]">
      <p className="text-[28px] font-semibold text-[var(--on-accent)]">워크크</p>
      <p className="text-body text-[var(--on-accent)] opacity-80">산책이 기록이 되는 순간</p>
      {showLoading ? (
        <div className="absolute bottom-16 w-32 h-[3px] rounded-full bg-white/20 overflow-hidden">
          <div className="h-full w-1/3 bg-white/70 animate-pulse" />
        </div>
      ) : null}
    </div>
  );
}
