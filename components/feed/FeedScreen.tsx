"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings } from "lucide-react";
import { useSupabaseBrowser } from "@/lib/supabase/useBrowserClient";
import { getSignedUrls } from "@/lib/data/storage";
import { groupByDay } from "@/lib/data/dateGroup";
import type { Photo } from "@/lib/photo";
import { PhotoCard } from "@/components/feed/PhotoCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { MOOD, isMoodKey } from "@/lib/mood";

const PAGE_SIZE = 20;

interface FeedRow {
  id: string;
  storage_path: string;
  captured_at: string;
  source: "camera" | "gallery";
  user_note: string | null;
  caption_ai: string | null;
  caption_user: string | null;
  mood: Photo["mood"];
  mood_edited: boolean;
  status: Photo["status"];
  photo_tags: { tags: { name: string } | null }[];
}

export function FeedScreen() {
  const supabase = useSupabaseBrowser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const moodFilter = searchParams.get("mood");
  const tagFilter = searchParams.get("tag");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(
    async (from: number) => {
      if (!supabase) return;
      loadingRef.current = true;
      setLoading(true);

      const to = from + PAGE_SIZE - 1;

    const selectCols = tagFilter
      ? "id, storage_path, captured_at, source, user_note, caption_ai, caption_user, mood, mood_edited, status, photo_tags!inner(tags!inner(name))"
      : "id, storage_path, captured_at, source, user_note, caption_ai, caption_user, mood, mood_edited, status, photo_tags(tags(name))";

    let query = supabase.from("photos").select(selectCols).order("captured_at", { ascending: false }).range(from, to);

    if (moodFilter) query = query.eq("mood", moodFilter);
    if (tagFilter) query = query.eq("photo_tags.tags.name", tagFilter);

    const { data, error } = await query;

    if (error || !data) {
      setHasMore(false);
      setLoading(false);
      loadingRef.current = false;
      return;
    }

    const rows = data as unknown as FeedRow[];
    const urlMap = await getSignedUrls(
      supabase,
      rows.map((r) => r.storage_path),
      "thumb.webp"
    );

    const mapped: Photo[] = rows.map((r) => ({
      id: r.id,
      thumbUrl: urlMap[r.storage_path] ?? null,
      viewUrl: null,
      lat: null,
      lng: null,
      accuracyM: null,
      capturedAt: r.captured_at,
      source: r.source,
      userNote: r.user_note,
      captionAi: r.caption_ai,
      captionUser: r.caption_user,
      mood: r.mood,
      moodEdited: r.mood_edited,
      status: r.status,
      tags: r.photo_tags.map((pt) => pt.tags?.name).filter((v): v is string => Boolean(v)),
    }));

      setPhotos((prev) => [...prev, ...mapped]);
      offsetRef.current = to + 1;
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
      loadingRef.current = false;
    },
    [supabase, moodFilter, tagFilter]
  );

  // 최초 로드 + 지도·대시보드에서 무드/태그 필터를 달고 들어오면 목록을 리셋
  useEffect(() => {
    if (!supabase) return;
    offsetRef.current = 0;
    loadingRef.current = false;
    queueMicrotask(() => {
      setPhotos([]);
      setHasMore(true);
      fetchPage(0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, moodFilter, tagFilter]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMore) {
          fetchPage(offsetRef.current);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchPage, hasMore]);

  if (!loading && photos.length === 0) {
    return (
      <EmptyState
        message={
          <>
            아직 기록이 없어요.
            <br />
            첫 산책을 남겨보세요.
          </>
        }
        action={
          <Link href="/capture">
            <Button variant="primary">촬영하기</Button>
          </Link>
        }
      />
    );
  }

  const groups = groupByDay(photos);

  return (
    <div className="flex-1 overflow-y-auto px-4">
      <div className="flex items-center justify-between pt-[calc(env(safe-area-inset-top)+16px)] pb-2">
        <h1 className="text-h1">피드</h1>
        <Link href="/settings" aria-label="설정">
          <Settings size={20} className="text-[var(--ink-muted)]" />
        </Link>
      </div>
      {moodFilter || tagFilter ? (
        <div className="pb-3">
          <Chip selected onClick={() => router.push("/feed")}>
            필터: {moodFilter && isMoodKey(moodFilter) ? MOOD[moodFilter].label : tagFilter ? `#${tagFilter}` : ""} ✕
          </Chip>
        </div>
      ) : null}
      {groups.map((group) => (
        <section key={group.key}>
          <div className="sticky top-0 z-10 bg-[var(--bg)] py-2 text-label text-[var(--ink-muted)]">
            {group.label}
          </div>
          <div className="flex flex-col divide-y divide-[var(--line)]">
            {group.items.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        </section>
      ))}
      <div ref={sentinelRef} className="h-8" />
    </div>
  );
}
