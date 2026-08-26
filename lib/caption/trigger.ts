import type { SupabaseClient } from "@supabase/supabase-js";

// PRD 17.1 — 업로드 직후 자동 호출. 실패해도 조용히 넘어간다 — 앱 진입 시
// pending 회수(resumePendingCaptions)가 나중에 다시 시도한다.
export async function triggerCaption(accessToken: string, photoId: string): Promise<void> {
  try {
    await fetch("/api/caption", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ photoId }),
    });
  } catch {
    // 네트워크 실패 — pending 회수가 다시 시도한다
  }
}

/** 앱 진입 시 아직 캡션이 안 붙은 사진을 회수해 다시 시도한다. */
export async function resumePendingCaptions(supabase: SupabaseClient, accessToken: string): Promise<void> {
  const { data } = await supabase
    .from("photos")
    .select("id")
    .in("status", ["pending", "no_location"])
    .lt("retry_count", 3)
    .is("caption_ai", null);

  if (!data) return;
  for (const row of data as { id: string }[]) {
    await triggerCaption(accessToken, row.id);
  }
}
