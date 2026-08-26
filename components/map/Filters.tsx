"use client";

import { SlidersHorizontal } from "lucide-react";
import { MOOD_KEYS, MOOD, type MoodKey } from "@/lib/mood";
import { Chip } from "@/components/ui/Chip";
import { MoodDot } from "@/components/ui/MoodBadge";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";

interface FilterChipBarProps {
  selectedMoods: MoodKey[];
  onToggleMood: (mood: MoodKey) => void;
  onOpenFilter: () => void;
}

export function FilterChipBar({ selectedMoods, onToggleMood, onOpenFilter }: FilterChipBarProps) {
  return (
    <div
      className="absolute top-0 left-0 right-0 px-4 flex items-center gap-2"
      style={{ paddingTop: "max(16px, calc(env(safe-area-inset-top) + 8px))" }}
    >
      <div className="flex-1 flex gap-2 overflow-x-auto">
        {MOOD_KEYS.map((key) => (
          <Chip key={key} selected={selectedMoods.includes(key)} onClick={() => onToggleMood(key)}>
            <span className="inline-flex items-center gap-1.5">
              <MoodDot mood={key} size={8} />
              {MOOD[key].label}
            </span>
          </Chip>
        ))}
      </div>
      <button
        type="button"
        onClick={onOpenFilter}
        aria-label="필터"
        className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center shrink-0"
        style={{ boxShadow: "var(--shadow-badge)" }}
      >
        <SlidersHorizontal size={16} className="text-[var(--ink)]" />
      </button>
    </div>
  );
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  selectedMoods: MoodKey[];
  onToggleMood: (mood: MoodKey) => void;
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onReset: () => void;
  onApply: () => void;
}

export function FilterSheet({
  open,
  onClose,
  selectedMoods,
  onToggleMood,
  tags,
  selectedTags,
  onToggleTag,
  onReset,
  onApply,
}: FilterSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} strongShadow>
      <div className="px-5 pb-6 flex flex-col gap-5">
        <h2 className="text-h1">필터</h2>

        <div>
          <h3 className="text-label text-[var(--ink-muted)] mb-2">무드</h3>
          <div className="flex flex-wrap gap-2">
            {MOOD_KEYS.map((key) => (
              <Chip key={key} selected={selectedMoods.includes(key)} onClick={() => onToggleMood(key)}>
                <span className="inline-flex items-center gap-1.5">
                  <MoodDot mood={key} size={8} />
                  {MOOD[key].label}
                </span>
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-label text-[var(--ink-muted)] mb-2">태그</h3>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Chip key={tag} selected={selectedTags.includes(tag)} onClick={() => onToggleTag(tag)}>
                  #{tag}
                </Chip>
              ))}
            </div>
          ) : (
            <p className="text-meta text-[var(--ink-faint)]">아직 태그가 없어요</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onReset}>
            초기화
          </Button>
          <Button variant="primary" onClick={onApply}>
            적용
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
