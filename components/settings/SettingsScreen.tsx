"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useSupabaseBrowser } from "@/lib/supabase/useBrowserClient";
import { Button } from "@/components/ui/Button";
import clsx from "@/lib/clsx";

const BYTES_PER_PHOTO_MB = 4.3; // PRD 18.4 추정치 (원본 4MB + view 200KB + thumb 30KB)

function SettingsRow({
  label,
  value,
  onClick,
  destructive,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="w-full flex items-center justify-between py-4 border-b border-[var(--line)] text-left disabled:opacity-100"
    >
      <span className={clsx("text-body", destructive ? "text-[var(--error)]" : "text-[var(--ink)]")}>{label}</span>
      <span className="flex items-center gap-1 text-meta text-[var(--ink-faint)]">
        {value}
        {onClick && !value ? <ChevronRight size={16} /> : null}
      </span>
    </button>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const supabase = useSupabaseBrowser();
  const [email, setEmail] = useState("walker@example.com");
  const [photoCount, setPhotoCount] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
    supabase.rpc("dashboard_summary").then(({ data }: { data: { photo_count: number }[] | null }) => {
      if (data?.[0]) setPhotoCount(Number(data[0].photo_count));
    });
  }, [supabase]);

  const handleReplayOnboarding = () => {
    localStorage.removeItem("walkq:onboarded");
    router.push("/onboarding");
  };

  const handleExport = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("photos")
      .select("id, captured_at, caption_ai, caption_user, mood, user_note, source, status")
      .order("captured_at", { ascending: false });

    const blob = new Blob([JSON.stringify(data ?? [], null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "walkq-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleDeleteAccount = async () => {
    if (!supabase) return;
    setDeleting(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      await fetch("/api/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    }
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const storageLabel = photoCount != null ? `${(photoCount * BYTES_PER_PHOTO_MB).toFixed(1)}MB 사용 중` : "계산 중…";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center gap-3 px-4 pb-2" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
        <button type="button" aria-label="뒤로" onClick={() => router.back()}>
          <ArrowLeft size={20} className="text-[var(--ink)]" />
        </button>
        <h1 className="text-h1">설정</h1>
      </div>

      <div className="px-4">
        <p className="text-meta text-[var(--ink-faint)] py-3">{email}</p>

        <SettingsRow label="저장 용량" value={storageLabel} />
        <SettingsRow label="온보딩 다시 보기" onClick={handleReplayOnboarding} />
        <SettingsRow label="데이터 내보내기" onClick={handleExport} />
        <SettingsRow label="로그아웃" onClick={handleLogout} />
        <SettingsRow label="계정 삭제" destructive onClick={() => setDeleteConfirmOpen(true)} />
      </div>

      {deleteConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8" style={{ background: "var(--dim-strong)" }}>
          <div className="w-full max-w-[320px] rounded-[var(--radius-modal)] bg-[var(--surface)] p-5 flex flex-col gap-4">
            <p className="text-body text-[var(--ink)] text-center">
              계정을 삭제할까요?
              <br />
              모든 사진과 기록이 영구히 사라져요.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)} className="flex-1">
                취소
              </Button>
              <Button variant="primary" tone="destructive" disabled={deleting} onClick={handleDeleteAccount} className="flex-1">
                삭제
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
