"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

interface SaveSheetProps {
  open: boolean;
  previewUrl: string | null;
  saving: boolean;
  onRequestClose: () => void;
  onSave: (note: string) => void;
}

export function SaveSheet({ open, previewUrl, saving, onRequestClose, onSave }: SaveSheetProps) {
  const [note, setNote] = useState("");

  return (
    <BottomSheet open={open} onClose={onRequestClose} strongShadow>
      <div className="px-5 pb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-label text-[var(--ink-muted)]">저장</span>
          <button type="button" aria-label="닫기" onClick={onRequestClose}>
            <X size={20} className="text-[var(--ink-faint)]" />
          </button>
        </div>

        <div className="relative w-full aspect-[4/3] rounded-[var(--radius-photo-lg)] overflow-hidden bg-[var(--surface-sunk)]">
          {previewUrl ? <Image src={previewUrl} alt="" fill sizes="480px" className="object-cover" unoptimized /> : null}
        </div>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="한마디 (선택)"
          className="w-full h-12 px-4 rounded-[var(--radius-btn)] border border-[var(--line)] bg-[var(--surface)] text-[15px] placeholder:text-[var(--ink-faint)] outline-none focus:border-[var(--accent)]"
        />

        <Button variant="primary" disabled={saving} onClick={() => onSave(note)}>
          {saving ? "저장 중…" : "저장"}
        </Button>
      </div>
    </BottomSheet>
  );
}
