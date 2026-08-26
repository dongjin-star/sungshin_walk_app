import type { SupabaseClient } from "@supabase/supabase-js";

// photos.storage_path는 파일별 접두 폴더다: `{user_id}/{photo_id}`.
// 실제 파일은 그 아래 thumb.webp / view.webp / original.jpg 로 존재한다
// (WALK-PRD.md 16.2). private 버킷이므로 항상 서명 URL로만 접근한다.

const BUCKET = "photos";
const SIGNED_URL_TTL_SECONDS = 3600;

export async function getSignedUrls(
  supabase: SupabaseClient,
  storagePaths: string[],
  file: "thumb.webp" | "view.webp" | "original.jpg" = "thumb.webp"
): Promise<Record<string, string>> {
  if (storagePaths.length === 0) return {};

  const targets = storagePaths.map((p) => `${p}/${file}`);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(targets, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return {};

  const map: Record<string, string> = {};
  data.forEach((item, i) => {
    if (item.signedUrl) map[storagePaths[i]] = item.signedUrl;
  });
  return map;
}

export async function getSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  file: "thumb.webp" | "view.webp" | "original.jpg" = "view.webp"
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(`${storagePath}/${file}`, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}
