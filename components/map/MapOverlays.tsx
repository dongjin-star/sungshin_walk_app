"use client";

import Image from "next/image";
import { ArrowDown, LocateFixed } from "lucide-react";
import clsx from "@/lib/clsx";
import type { MapPin } from "@/lib/map/types";

export function PinCounter({ pinCount, dayCount, emphasize }: { pinCount: number; dayCount: number; emphasize?: boolean }) {
  return (
    <div
      className={clsx(
        "px-3.5 py-2 rounded-[var(--radius-pill)] bg-[var(--surface)] tabular-nums font-semibold",
        emphasize ? "text-[20px]" : "text-counter"
      )}
      style={{ boxShadow: "var(--shadow-badge)" }}
    >
      핀 {pinCount} · {dayCount}일
    </div>
  );
}

export function EmptyMapHint() {
  return (
    <div className="absolute left-0 right-0 bottom-[112px] flex flex-col items-center gap-2 pointer-events-none px-8 text-center">
      <p
        className="text-body text-[var(--ink)] bg-[var(--surface)] px-4 py-2.5 rounded-[var(--radius-card)]"
        style={{ boxShadow: "var(--shadow-badge)" }}
      >
        마음에 드는 장면을 찍어
        <br />
        첫 핀을 꽂아보세요
      </p>
      <ArrowDown className="text-[var(--accent)]" size={22} />
    </div>
  );
}

export function LocateButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="현재 위치로 이동"
      className="absolute right-4 bottom-[112px] w-11 h-11 rounded-full bg-[var(--surface)] flex items-center justify-center"
      style={{ boxShadow: "var(--shadow-badge)" }}
    >
      <LocateFixed size={18} className="text-[var(--accent)]" />
    </button>
  );
}

interface BottomThumbSheetProps {
  pins: MapPin[];
  expanded: boolean;
  onToggle: () => void;
  label: string;
}

export function BottomThumbSheet({ pins, expanded, onToggle, label }: BottomThumbSheetProps) {
  return (
    <div
      className="absolute left-0 right-0 bottom-0 bg-[var(--surface)] rounded-t-[var(--radius-sheet)] transition-[padding] duration-[280ms]"
      style={{ boxShadow: expanded ? "var(--shadow-sheet-strong)" : "var(--shadow-sheet)" }}
    >
      <button type="button" onClick={onToggle} className="w-full flex flex-col items-center pt-2 pb-1">
        <span className="w-9 h-1 rounded-full bg-[var(--line)]" aria-hidden />
      </button>
      <div className="px-4 pb-4">
        <p className="text-label text-[var(--ink-muted)] mb-2">{label}</p>
        {expanded ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pins.map((pin) => (
              <div
                key={pin.id}
                className="w-20 h-20 shrink-0 rounded-[var(--radius-card)] overflow-hidden bg-[var(--surface-sunk)] relative"
              >
                {pin.thumbUrl ? <Image src={pin.thumbUrl} alt="" fill sizes="80px" className="object-cover" /> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
