"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import clsx from "@/lib/clsx";

interface ToastItem {
  id: number;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  // 서버 렌더와 클라이언트 첫 렌더가 항상 같은 트리(null)를 그리도록,
  // document.body로 순간이동하는 포털은 마운트 이후에만 켠다 — 그렇지
  // 않으면 hydration mismatch가 난다.
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const showToast = useCallback((message: string, durationMs = 2200) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = ++idRef.current;
    setToast({ id, message });
    timerRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, durationMs);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted
        ? createPortal(
            <div
              className={clsx(
                "fixed left-1/2 -translate-x-1/2 z-50 transition-opacity duration-200",
                "bottom-[96px] px-4 py-3 rounded-[var(--radius-btn)]",
                "bg-[var(--ink)] text-[var(--on-accent)] text-meta whitespace-nowrap",
                toast ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              style={{ boxShadow: "var(--shadow-toast)" }}
              role="status"
              aria-live="polite"
            >
              {toast?.message}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast는 ToastProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
