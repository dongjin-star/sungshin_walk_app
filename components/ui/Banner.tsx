import clsx from "@/lib/clsx";

type BannerVariant = "info" | "progress" | "warning";

const variantClass: Record<BannerVariant, string> = {
  info: "bg-[var(--accent-soft)] text-[var(--accent)]",
  progress: "bg-[var(--surface-sunk)] text-[var(--ink)]",
  warning: "bg-[var(--warn-soft)] text-[var(--error)]",
};

export function Banner({ variant, children }: { variant: BannerVariant; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        "h-10 flex items-center px-3.5 rounded-[var(--radius-btn-sm)] text-meta font-medium",
        variantClass[variant]
      )}
      role={variant === "warning" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
