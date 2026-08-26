"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Pencil } from "lucide-react";
import { useSupabaseBrowser } from "@/lib/supabase/useBrowserClient";
import { getSignedUrl } from "@/lib/data/storage";
import { formatDetailDateTime } from "@/lib/data/formatDetailDate";
import { triggerCaption } from "@/lib/caption/trigger";
import { isPendingLike, type PhotoStatus } from "@/lib/photo";
import type { MoodKey } from "@/lib/mood";
import { MoodPicker } from "@/components/photo/MoodPicker";
import { TagText } from "@/components/ui/Chip";
import { SkeletonLine } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

interface DetailRow {
  id: string;
  storage_path: string;
  lng: number | null;
  lat: number | null;
  accuracy_m: number | null;
  captured_at: string;
  source: "camera" | "gallery";
  user_note: string | null;
  caption_ai: string | null;
  caption_user: string | null;
  mood: MoodKey | null;
  mood_edited: boolean;
  status: PhotoStatus;
  retry_count: number;
  tags: string[];
}

export function PhotoDetailScreen({ photoId }: { photoId: string }) {
  const router = useRouter();
  const supabase = useSupabaseBrowser();

  const [photo, setPhoto] = useState<DetailRow | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [showAiOriginal, setShowAiOriginal] = useState(false);
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.rpc("get_photo_detail", { p_photo_id: photoId }).single();
    if (data) {
      const row = data as DetailRow;
      setPhoto(row);
      const url = await getSignedUrl(supabase, row.storage_path, "view.webp");
      setViewUrl(url);
    }
    setLoading(false);
  }, [supabase, photoId]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  if (loading) {
    return <div className="flex-1" />;
  }

  if (!photo) {
    return (
      <div className="flex-1 flex items-center justify-center px-8 text-center">
        <p className="text-body text-[var(--ink-muted)]">사진을 찾을 수 없어요.</p>
      </div>
    );
  }

  const caption = photo.caption_user ?? photo.caption_ai;
  const pending = isPendingLike(photo.status);

  const saveCaption = async () => {
    if (!supabase) return;
    setBusy(true);
    await supabase.from("photos").update({ caption_user: draft.trim() || null }).eq("id", photoId);
    setEditing(false);
    setBusy(false);
    load();
  };

  const changeMood = async (mood: MoodKey) => {
    if (!supabase) return;
    await supabase.from("photos").update({ mood, mood_edited: true }).eq("id", photoId);
    load();
  };

  const regenerate = async () => {
    if (!supabase) return;
    setBusy(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      await triggerCaption(session.access_token, photoId);
    }
    setRegenConfirmOpen(false);
    setBusy(false);
    setTimeout(load, 1500);
  };

  const handleRegenerateClick = () => {
    if (photo.caption_user) {
      setRegenConfirmOpen(true);
    } else {
      regenerate();
    }
  };

  const downloadOriginal = async () => {
    if (!supabase) return;
    const url = await getSignedUrl(supabase, photo.storage_path, "original.jpg");
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const deletePhoto = async () => {
    if (!supabase) return;
    setBusy(true);
    await supabase.storage
      .from("photos")
      .remove([`${photo.storage_path}/thumb.webp`, `${photo.storage_path}/view.webp`, `${photo.storage_path}/original.jpg`]);
    await supabase.from("photos").delete().eq("id", photoId);
    router.replace("/feed");
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div
        className="flex items-center gap-3 px-4 pb-2"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
      >
        <button type="button" aria-label="뒤로" onClick={() => router.back()}>
          <ArrowLeft size={20} className="text-[var(--ink)]" />
        </button>
        <h1 className="text-h1">사진</h1>
      </div>

      <div className="relative w-full aspect-[4/3] bg-[var(--surface-sunk)]">
        {viewUrl ? <Image src={viewUrl} alt="" fill sizes="480px" className="object-cover" /> : null}
        {pending ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-[var(--radius-pill)] bg-[var(--ink)] text-[var(--on-accent)] text-label flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-[var(--on-accent)]" />
            생성 중
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 px-4 py-5">
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              maxLength={30}
              className="w-full rounded-[var(--radius-btn)] border border-[var(--line)] p-3 text-caption outline-none focus:border-[var(--accent)]"
            />
            <div className="flex gap-2">
              <Button variant="small" onClick={() => setEditing(false)}>
                취소
              </Button>
              <Button variant="primary" disabled={busy} onClick={saveCaption} className="flex-1">
                저장
              </Button>
            </div>
          </div>
        ) : pending || !caption ? (
          <SkeletonLine width="85%" className="h-[24px]" />
        ) : (
          <button
            type="button"
            className="flex items-start gap-2 text-left"
            onClick={() => {
              setDraft(caption ?? "");
              setEditing(true);
            }}
          >
            <p className="text-caption text-[var(--ink)]">{caption}</p>
            <Pencil size={14} className="text-[var(--ink-faint)] shrink-0 mt-1.5" />
          </button>
        )}

        {pending ? <p className="text-meta text-[var(--ink-faint)]">캡션을 준비하고 있어요</p> : null}

        {photo.caption_user && photo.caption_ai ? (
          <button
            type="button"
            className="text-meta text-[var(--accent)] text-left"
            onClick={() => setShowAiOriginal((v) => !v)}
          >
            {showAiOriginal ? "AI가 쓴 원래 문장 접기" : "AI가 쓴 원래 문장 보기"}
          </button>
        ) : null}
        {showAiOriginal && photo.caption_ai ? (
          <p className="text-meta text-[var(--ink-muted)] bg-[var(--surface-sunk)] rounded-[var(--radius-btn-sm)] p-3">
            {photo.caption_ai}
          </p>
        ) : null}

        <div className="flex items-center gap-2 flex-wrap">
          <MoodPicker mood={photo.mood} disabled={pending} onChange={changeMood} />
          {photo.tags.map((tag) => (
            <button key={tag} type="button" onClick={() => router.push(`/feed?tag=${encodeURIComponent(tag)}`)}>
              <TagText>{tag}</TagText>
            </button>
          ))}
        </div>

        <p className="text-meta text-[var(--ink-faint)]">{formatDetailDateTime(photo.captured_at)}</p>

        {photo.user_note ? (
          <div className="rounded-[var(--radius-btn-sm)] bg-[var(--surface-sunk)] p-3">
            <p className="text-body text-[var(--ink)]">한마디: {photo.user_note}</p>
          </div>
        ) : null}

        <div className="rounded-[var(--radius-card)] bg-[var(--surface-sunk)] h-24 flex items-center justify-center gap-2">
          <MapPin size={18} className="text-[var(--ink-faint)]" />
          {photo.lat != null ? (
            <span className="text-meta text-[var(--ink-muted)]">작은 지도 · 핀 1개</span>
          ) : (
            <button type="button" className="text-meta text-[var(--accent)] font-medium">
              위치 지정
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button
              variant="small"
              disabled={pending}
              onClick={() => {
                setDraft(caption ?? "");
                setEditing(true);
              }}
              className="flex-1"
            >
              캡션 수정
            </Button>
            <Button variant="small" disabled={pending || busy} onClick={handleRegenerateClick} className="flex-1">
              다시 만들기
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="small" onClick={downloadOriginal} className="flex-1">
              원본 다운로드
            </Button>
            <Button variant="small" tone="destructive" onClick={() => setDeleteConfirmOpen(true)} className="flex-1">
              삭제
            </Button>
          </div>
        </div>
      </div>

      {regenConfirmOpen ? (
        <ConfirmModal
          message="사용자가 수정한 캡션이 있어요. AI 원본을 새로 만들까요?"
          confirmLabel="새로 만들기"
          busy={busy}
          onCancel={() => setRegenConfirmOpen(false)}
          onConfirm={regenerate}
        />
      ) : null}

      {deleteConfirmOpen ? (
        <ConfirmModal
          message="이 사진을 삭제할까요? 되돌릴 수 없어요."
          confirmLabel="삭제"
          destructive
          busy={busy}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={deletePhoto}
        />
      ) : null}
    </div>
  );
}

function ConfirmModal({
  message,
  confirmLabel,
  destructive,
  busy,
  onCancel,
  onConfirm,
}: {
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-8" style={{ background: "var(--dim-strong)" }}>
      <div className="w-full max-w-[320px] rounded-[var(--radius-modal)] bg-[var(--surface)] p-5 flex flex-col gap-4">
        <p className="text-body text-[var(--ink)] text-center">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            취소
          </Button>
          <Button variant="primary" tone={destructive ? "destructive" : "default"} disabled={busy} onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
