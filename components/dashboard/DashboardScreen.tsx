"use client";

import { useEffect, useState } from "react";
import { useSupabaseBrowser } from "@/lib/supabase/useBrowserClient";
import type { MoodKey } from "@/lib/mood";
import { StatStrip } from "@/components/dashboard/StatStrip";
import { LockedPanel } from "@/components/dashboard/LockedPanel";
import { WordCloud } from "@/components/dashboard/WordCloud";
import { WeekdayBars } from "@/components/dashboard/WeekdayBars";
import { MoodDonut } from "@/components/dashboard/MoodDonut";

const UNLOCK_THRESHOLD = 10;

export function DashboardScreen() {
  const supabase = useSupabaseBrowser();
  const [summary, setSummary] = useState({ photoCount: 0, dayCount: 0, tagCount: 0 });
  const [weekday, setWeekday] = useState<number[]>(Array(7).fill(0));
  const [mood, setMood] = useState<Partial<Record<MoodKey, number>>>({});
  const [tags, setTags] = useState<{ name: string; useCount: number }[]>([]);

  useEffect(() => {
    if (!supabase) return;

    supabase
      .rpc("dashboard_summary")
      .then(({ data }: { data: { photo_count: number; day_count: number; tag_count: number }[] | null }) => {
        if (data?.[0]) {
          setSummary({
            photoCount: Number(data[0].photo_count),
            dayCount: Number(data[0].day_count),
            tagCount: Number(data[0].tag_count),
          });
        }
      });

    supabase.rpc("dashboard_weekday").then(({ data }: { data: { dow: number; photo_count: number }[] | null }) => {
      if (!data) return;
      const next = Array(7).fill(0);
      data.forEach((row) => {
        if (row.dow >= 0 && row.dow < 7) next[row.dow] = Number(row.photo_count);
      });
      setWeekday(next);
    });

    supabase.rpc("dashboard_mood").then(({ data }: { data: { mood: MoodKey; photo_count: number }[] | null }) => {
      if (!data) return;
      const next: Partial<Record<MoodKey, number>> = {};
      data.forEach((row) => {
        next[row.mood] = Number(row.photo_count);
      });
      setMood(next);
    });

    supabase
      .rpc("dashboard_tag_cloud", { p_limit: 30 })
      .then(({ data }: { data: { name: string; use_count: number }[] | null }) => {
        if (data) setTags(data.map((t) => ({ name: t.name, useCount: t.use_count })));
      });
  }, [supabase]);

  const unlocked = summary.photoCount >= UNLOCK_THRESHOLD;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-8">
      <h1 className="text-h1 pt-[calc(env(safe-area-inset-top)+16px)] pb-4">대시보드</h1>

      <StatStrip photoCount={summary.photoCount} dayCount={summary.dayCount} tagCount={summary.tagCount} />

      {!unlocked ? (
        <div className="pt-4">
          <LockedPanel photoCount={summary.photoCount} />
        </div>
      ) : (
        <div className="flex flex-col gap-8 pt-6">
          <section>
            <h2 className="text-h1 mb-3">태그 워드클라우드</h2>
            <WordCloud tags={tags} />
          </section>

          <section>
            <h2 className="text-h1 mb-3">요일별 기록 수</h2>
            <WeekdayBars counts={weekday} />
          </section>

          <section>
            <h2 className="text-h1 mb-3">무드 분포</h2>
            <MoodDonut counts={mood} />
          </section>
        </div>
      )}
    </div>
  );
}
