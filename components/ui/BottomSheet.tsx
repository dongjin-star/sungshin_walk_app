"use client";

import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "@/lib/clsx";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  strongShadow?: boolean;
  dimmed?: boolean;
}

export function BottomSheet({ open, onClose, children, strongShadow, dimmed = true }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-40 transition-opacity duration-[280ms]",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-hidden={!open}
    >
      {dimmed ? (
        <div className="absolute inset-0 bg-[var(--dim)]" onClick={onClose} />
      ) : null}
      <div
        className={clsx(
          "absolute left-0 right-0 bottom-0 max-w-[480px] mx-auto bg-[var(--surface)]",
          "rounded-t-[var(--radius-sheet)] pt-2 pb-[env(safe-area-inset-bottom)]",
          "transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{ boxShadow: strongShadow ? "var(--shadow-sheet-strong)" : "var(--shadow-sheet)" }}
      >
        <div className="flex justify-center py-2">
          <span className="w-9 h-1 rounded-full bg-[var(--line)]" aria-hidden />
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
