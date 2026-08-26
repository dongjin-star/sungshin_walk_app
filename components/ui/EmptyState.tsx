import type { ReactNode } from "react";

export function EmptyState({ message, action }: { message: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="text-body text-[var(--ink-muted)]">{message}</p>
      {action}
    </div>
  );
}
