"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "@/lib/clsx";

type Variant = "primary" | "secondary" | "small" | "text";
type Tone = "default" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  tone?: Tone;
}

const base = "inline-flex items-center justify-center gap-1.5 transition-colors disabled:cursor-default";

const variantClass: Record<Variant, string> = {
  primary: "h-[52px] px-5 rounded-[var(--radius-btn)] text-[15px] font-semibold w-full",
  secondary:
    "h-[52px] px-5 rounded-[var(--radius-btn)] text-[15px] font-semibold w-full border bg-transparent",
  small: "h-11 px-4 rounded-[var(--radius-btn-sm)] text-[14px] font-medium border bg-transparent",
  text: "h-auto px-1 text-[14px] font-medium",
};

function toneClass(variant: Variant, tone: Tone, disabled?: boolean) {
  if (disabled) {
    if (variant === "primary") {
      return "bg-[var(--surface-sunk)] text-[var(--ink-faint)]";
    }
    return "border-[var(--line)] text-[var(--line-strong)]";
  }

  if (tone === "destructive") {
    if (variant === "primary") return "bg-[var(--error)] text-[var(--on-accent)] active:opacity-90";
    return "border-[var(--error)] text-[var(--error)] active:bg-[var(--warn-soft)]";
  }

  if (variant === "primary") {
    return "bg-[var(--accent)] text-[var(--on-accent)] active:bg-[var(--accent-hover)]";
  }
  if (variant === "text") {
    return "text-[var(--accent)] active:opacity-70";
  }
  return "border-[var(--line-strong)] text-[var(--ink)] active:bg-[var(--surface-sunk)]";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", tone = "default", className, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(base, variantClass[variant], toneClass(variant, tone, disabled), className)}
      {...props}
    />
  );
});
