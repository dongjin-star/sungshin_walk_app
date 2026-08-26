"use client";

import { Button } from "@/components/ui/Button";

interface DiscardModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DiscardModal({ open, onCancel, onConfirm }: DiscardModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-8" style={{ background: "var(--dim-strong)" }}>
      <div className="w-full max-w-[320px] rounded-[var(--radius-modal)] bg-[var(--surface)] p-5 flex flex-col gap-4">
        <p className="text-body text-[var(--ink)] text-center">사진을 저장하지 않고 나갈까요?</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            계속 쓰기
          </Button>
          <Button variant="primary" tone="destructive" onClick={onConfirm} className="flex-1">
            나가기
          </Button>
        </div>
      </div>
    </div>
  );
}
