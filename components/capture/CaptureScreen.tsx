"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Camera, Images } from "lucide-react";
import { getCurrentLocation, type GeoResult } from "@/lib/geo/location";
import { createImageDerivatives } from "@/lib/image/resize";
import { enqueue } from "@/lib/offline/queue";
import { uploadQueueItem } from "@/lib/offline/upload";
import { useSupabaseBrowser } from "@/lib/supabase/useBrowserClient";
import { useToast } from "@/components/ui/Toast";
import { SaveSheet } from "@/components/capture/SaveSheet";
import { DiscardModal } from "@/components/capture/DiscardModal";

type Phase = "idle" | "confirm-gallery-location" | "preview";

export function CaptureScreen() {
  const router = useRouter();
  const supabase = useSupabaseBrowser();
  const { showToast } = useToast();

  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [source, setSource] = useState<"camera" | "gallery">("camera");
  const [location, setLocation] = useState<GeoResult | null>(null);
  const [capturedAt, setCapturedAt] = useState<string>(new Date().toISOString());
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const pendingGalleryFile = useRef<File | null>(null);

  // PRD 9.4 — 셔터 후가 아니라 카메라 화면 진입 시 선제 호출
  useEffect(() => {
    getCurrentLocation().then(setLocation);
  }, []);

  const openPreview = useCallback((f: File, src: "camera" | "gallery", loc: GeoResult | null) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setSource(src);
    setLocation(loc);
    setCapturedAt(f.lastModified ? new Date(f.lastModified).toISOString() : new Date().toISOString());
    setPhase("preview");
  }, []);

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    openPreview(f, "camera", location);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    pendingGalleryFile.current = f;
    setPhase("confirm-gallery-location");
  };

  const confirmGalleryLocation = (useLocation: boolean) => {
    const f = pendingGalleryFile.current;
    pendingGalleryFile.current = null;
    if (!f) return;
    openPreview(f, "gallery", useLocation ? location : null);
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setPhase("idle");
  };

  const handleSave = async (note: string) => {
    if (!file) return;
    setSaving(true);
    try {
      const derivatives = await createImageDerivatives(file);
      const item = {
        id: crypto.randomUUID(),
        thumb: derivatives.thumb,
        view: derivatives.view,
        original: derivatives.original,
        width: derivatives.width,
        height: derivatives.height,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        accuracyM: location?.accuracyM ?? null,
        capturedAt,
        source,
        userNote: note.trim() || null,
      };

      await enqueue(item);
      showToast("사진을 저장했어요");
      closePreview();
      router.push("/");

      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const ok = await uploadQueueItem(supabase, session.user.id, session.access_token, item);
          if (ok) {
            const { removeFromQueue } = await import("@/lib/offline/queue");
            await removeFromQueue(item.id);
            setTimeout(() => showToast("캡션이 도착했어요"), 4200);
          }
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--capture-bg)] text-[var(--on-accent)] relative">
      <div className="flex items-center justify-between px-4" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
        <button
          type="button"
          aria-label="닫기"
          onClick={() => router.push("/")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
        >
          <X size={20} color="white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-meta text-white/70">위치 정보로 사진 위치를 기록해요</p>
      </div>

      <div className="flex items-center justify-center gap-10 pb-10" style={{ paddingBottom: "max(40px, env(safe-area-inset-bottom))" }}>
        <button
          type="button"
          aria-label="갤러리에서 선택"
          onClick={() => galleryInputRef.current?.click()}
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"
        >
          <Images size={20} color="white" />
        </button>

        <button
          type="button"
          aria-label="촬영"
          onClick={() => cameraInputRef.current?.click()}
          className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center"
        >
          <Camera size={28} color="var(--capture-bg)" />
        </button>

        <div className="w-11 h-11" aria-hidden />
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraChange}
      />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryChange} />

      {phase === "confirm-gallery-location" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8" style={{ background: "var(--dim-strong)" }}>
          <div className="w-full max-w-[320px] rounded-[var(--radius-modal)] bg-[var(--surface)] p-5 flex flex-col gap-4">
            <p className="text-body text-[var(--ink)]">여기서 찍은 사진인가요?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => confirmGalleryLocation(false)}
                className="flex-1 h-11 rounded-[var(--radius-btn-sm)] border border-[var(--line-strong)] text-[14px] text-[var(--ink)]"
              >
                아니요
              </button>
              <button
                type="button"
                onClick={() => confirmGalleryLocation(true)}
                className="flex-1 h-11 rounded-[var(--radius-btn-sm)] bg-[var(--accent)] text-[14px] text-[var(--on-accent)]"
              >
                네
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SaveSheet
        open={phase === "preview"}
        previewUrl={previewUrl}
        saving={saving}
        onRequestClose={() => setDiscardOpen(true)}
        onSave={handleSave}
      />

      <DiscardModal
        open={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false);
          closePreview();
        }}
      />
    </div>
  );
}
