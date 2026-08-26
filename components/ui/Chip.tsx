"use client";

import { type ButtonHTMLAttributes } from "react";
import clsx from "@/lib/clsx";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ selected, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={clsx(
        "h-auto px-3.5 py-1.5 rounded-[var(--radius-pill)] text-[12px] font-medium whitespace-nowrap transition-colors",
        selected ? "bg-[var(--accent)] text-[var(--on-accent)]" : "bg-[var(--surface-sunk)] text-[var(--ink)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// 피드/상세 화면의 읽기 전용 태그 텍스트 칩 (# 접두, 무채색)
export function TagText({ children }: { children: React.ReactNode }) {
  return <span className="text-[12px] text-[var(--ink-faint)]">#{children}</span>;
}
