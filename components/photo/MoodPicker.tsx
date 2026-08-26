"use client";

import { useState } from "react";
import { MOOD_KEYS, MOOD, type MoodKey } from "@/lib/mood";
import { MoodDot } from "@/components/ui/MoodBadge";
import clsx from "@/lib/clsx";

export function MoodPicker({ mood, disabled, onChange }: { mood: MoodKey | null; disabled?: boolean; onChange: (mood: MoodKey) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--surface-sunk)] px-3.5 py-2 text-[14px] font-medium text-[var(--ink)] disabled:opacity-50"
      >
        {mood ? <MoodDot mood={mood} size={10} /> : <span className="w-2.5 h-2.5 rounded-full bg-[var(--line-strong)]" />}
        {mood ? MOOD[mood].label : "무드 선택"}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <ul
            className="absolute z-20 top-[calc(100%+6px)] left-0 w-[150px] rounded-[var(--radius-btn)] bg-[var(--surface)] py-1.5 overflow-hidden"
            style={{ boxShadow: "var(--shadow-dropdown)" }}
          >
            {MOOD_KEYS.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={clsx(
                    "w-full flex items-center gap-2 px-3.5 py-2 text-[14px] text-left",
                    key === mood ? "bg-[var(--surface-sunk)]" : ""
                  )}
                >
                  <MoodDot mood={key} size={10} />
                  {MOOD[key].label}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
