"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabaseBrowser } from "@/lib/supabase/useBrowserClient";
import { getSignedUrls } from "@/lib/data/storage";
import { getCurrentLocation } from "@/lib/geo/location";
import type { BboxParams, MapPin } from "@/lib/map/types";
import type { MoodKey } from "@/lib/mood";
import type { PhotoStatus } from "@/lib/photo";
import { PinCounter, EmptyMapHint, LocateButton, BottomThumbSheet } from "@/components/map/MapOverlays";
import { FilterChipBar, FilterSheet } from "@/components/map/Filters";

const MapCanvas = dynamic(() => import("@/components/map/MapCanvas").then((m) => m.MapCanvas), { ssr: false });

interface BboxRow {
  id: string;
  storage_path: string;
  lng: number;
  lat: number;
  mood: MoodKey | null;
  status: PhotoStatus;
  caption: string | null;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function MapScreen() {
  const supabase = useSupabaseBrowser();
  const [pins, setPins] = useState<MapPin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState({ photoCount: 0, dayCount: 0 });
  const [tagCloud, setTagCloud] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<MoodKey[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pendingMoods, setPendingMoods] = useState<MoodKey[]>([]);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);
  const lastBboxRef = useRef<BboxParams | null>(null);

  useEffect(() => {
    getCurrentLocation().then((loc) => {
      if (loc) setInitialCenter([loc.lat, loc.lng]);
    });
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .rpc("dashboard_summary")
      .then(({ data }: { data: { photo_count: number; day_count: number }[] | null }) => {
        if (data?.[0]) setSummary({ photoCount: Number(data[0].photo_count), dayCount: Number(data[0].day_count) });
      });
    supabase.rpc("dashboard_tag_cloud", { p_limit: 30 }).then(({ data }: { data: { name: string }[] | null }) => {
      if (data) setTagCloud(data.map((t) => t.name));
    });
  }, [supabase]);

  const loadPins = useCallback(
    async (bbox: BboxParams) => {
      if (!supabase) return;
      lastBboxRef.current = bbox;

      const { data, error } = await supabase.rpc("get_photos_in_bbox", {
        min_lng: bbox.minLng,
        min_lat: bbox.minLat,
        max_lng: bbox.maxLng,
        max_lat: bbox.maxLat,
      });
      if (error || !data) return;

      let rows = data as BboxRow[];
      if (selectedMoods.length > 0) {
        rows = rows.filter((r) => r.mood && selectedMoods.includes(r.mood));
      }
      if (selectedTags.length > 0 && rows.length > 0) {
        const { data: tagRows } = await supabase
          .from("photo_tags")
          .select("photo_id, tags(name)")
          .in(
            "photo_id",
            rows.map((r) => r.id)
          );
        const matched = new Set(
          (tagRows ?? [])
            .filter((tr) => {
              const tag = tr.tags as unknown as { name: string } | null;
              return tag && selectedTags.includes(tag.name);
            })
            .map((tr) => tr.photo_id as string)
        );
        rows = rows.filter((r) => matched.has(r.id));
      }

      const urlMap = await getSignedUrls(
        supabase,
        rows.map((r) => r.storage_path),
        "thumb.webp"
      );

      setPins(
        rows.map((r) => ({
          id: r.id,
          storagePath: r.storage_path,
          lng: r.lng,
          lat: r.lat,
          mood: r.mood,
          status: r.status,
          caption: r.caption,
          thumbUrl: urlMap[r.storage_path],
        }))
      );
    },
    [supabase, selectedMoods, selectedTags]
  );

  useEffect(() => {
    if (lastBboxRef.current) loadPins(lastBboxRef.current);
  }, [loadPins]);

  const density: "empty" | "few" | "normal" =
    summary.photoCount === 0 ? "empty" : summary.photoCount <= 3 ? "few" : "normal";

  useEffect(() => {
    queueMicrotask(() => setSheetExpanded(density === "few"));
  }, [density]);

  const handleLocate = useCallback(() => {
    getCurrentLocation().then((loc) => {
      if (loc) setInitialCenter([loc.lat, loc.lng]);
    });
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden">
      <MapCanvas
        pins={pins}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onBoundsChange={loadPins}
        fitToPins={density === "few"}
        initialCenter={initialCenter}
      />

      <FilterChipBar
        selectedMoods={selectedMoods}
        onToggleMood={(m) => setSelectedMoods((prev) => toggle(prev, m))}
        onOpenFilter={() => {
          setPendingMoods(selectedMoods);
          setPendingTags(selectedTags);
          setFilterOpen(true);
        }}
      />

      <div className="absolute left-4" style={{ top: "calc(env(safe-area-inset-top) + 64px)" }}>
        <PinCounter pinCount={summary.photoCount} dayCount={summary.dayCount} emphasize={density === "few"} />
      </div>

      {density === "empty" ? <EmptyMapHint /> : null}

      <LocateButton onClick={handleLocate} />

      {density !== "empty" ? (
        <BottomThumbSheet
          pins={pins}
          expanded={sheetExpanded}
          onToggle={() => setSheetExpanded((v) => !v)}
          label={density === "few" ? `쌓이는 중 · ${summary.photoCount}장` : `핀 ${pins.length}개`}
        />
      ) : null}

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        selectedMoods={pendingMoods}
        onToggleMood={(m) => setPendingMoods((prev) => toggle(prev, m))}
        tags={tagCloud}
        selectedTags={pendingTags}
        onToggleTag={(t) => setPendingTags((prev) => toggle(prev, t))}
        onReset={() => {
          setPendingMoods([]);
          setPendingTags([]);
        }}
        onApply={() => {
          setSelectedMoods(pendingMoods);
          setSelectedTags(pendingTags);
          setFilterOpen(false);
        }}
      />
    </div>
  );
}
