import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueueItem } from "@/lib/offline/queue";
import { triggerCaption } from "@/lib/caption/trigger";

/**
 * 업로드 25MB 상한(PRD 18.2-4)은 촬영 시점 리사이즈로 사실상 항상 충족되지만,
 * 방어적으로 한 번 더 확인한다.
 */
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export async function uploadQueueItem(
  supabase: SupabaseClient,
  userId: string,
  accessToken: string | null,
  item: Omit<QueueItem, "createdAt">
): Promise<boolean> {
  if (item.original.size > MAX_UPLOAD_BYTES) return false;

  try {
    const basePath = `${userId}/${item.id}`;
    // 파일명은 항상 original.jpg로 고정한다 (PRD 16.2 스토리지 트리와 일치).
    // 실제 인코딩은 Storage의 contentType 메타데이터가 따로 보존한다.

    const results = await Promise.all([
      supabase.storage.from("photos").upload(`${basePath}/thumb.webp`, item.thumb, {
        contentType: "image/webp",
        upsert: true,
      }),
      supabase.storage.from("photos").upload(`${basePath}/view.webp`, item.view, {
        contentType: "image/webp",
        upsert: true,
      }),
      supabase.storage.from("photos").upload(`${basePath}/original.jpg`, item.original, {
        contentType: item.original.type || "image/jpeg",
        upsert: true,
      }),
    ]);
    if (results.some((r) => r.error)) return false;

    const location = item.lat != null && item.lng != null ? `SRID=4326;POINT(${item.lng} ${item.lat})` : null;

    const { data: photoRow, error } = await supabase
      .from("photos")
      .upsert(
        {
          user_id: userId,
          client_id: item.id,
          storage_path: basePath,
          width: item.width,
          height: item.height,
          location,
          accuracy_m: item.accuracyM,
          captured_at: item.capturedAt,
          source: item.source,
          user_note: item.userNote,
          status: location ? "pending" : "no_location",
        },
        { onConflict: "client_id" }
      )
      .select("id")
      .single();

    if (error || !photoRow) return false;

    if (accessToken) {
      void triggerCaption(accessToken, photoRow.id as string);
    }

    return true;
  } catch {
    return false;
  }
}
