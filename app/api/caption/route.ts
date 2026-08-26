import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasGeminiKey } from "@/lib/env";
import { verifyBearerUser } from "@/lib/supabase/route";
import { generateCaption } from "@/lib/gemini/generate";
import { formatKoreanTime } from "@/lib/gemini/formatTime";
import { PROMPT_VERSION } from "@/lib/gemini/prompt";

// PRD 19장 — 서버리스 함수 필수 설정 3종
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_RETRY = 3;

const bodySchema = z.object({ photoId: z.string().uuid() });

export async function POST(request: Request) {
  // 키 부재 — 사진 저장/지도/피드는 이 라우트와 무관하게 정상 동작한다 (PRD 17.1)
  if (!hasGeminiKey) {
    return NextResponse.json({ code: "GEMINI_NOT_CONFIGURED" }, { status: 503 });
  }

  const auth = await verifyBearerUser(request);
  if (!auth) {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }
  const { user, supabase } = auth;

  const body = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ code: "BAD_REQUEST" }, { status: 400 });
  }
  const { photoId } = parsedBody.data;

  // 레이트리밋 — 서버리스는 상태가 없으므로 반드시 DB RPC로 센다 (PRD 18.2-3)
  // 시간당 한도는 RPC 기본값(60)을 그대로 쓴다 (0002_caption_rpc.sql).
  const { data: allowed, error: quotaError } = await supabase.rpc("consume_caption_quota");
  if (quotaError) {
    return NextResponse.json({ code: "RATE_LIMITED" }, { status: 429 });
  }
  if (!allowed) {
    return NextResponse.json({ code: "RATE_LIMITED" }, { status: 429 });
  }

  // 소유권 확인 — RLS로도 걸리지만 명시적으로 한 번 더 확인한다 (PRD 18.2-2)
  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .select("id, storage_path, captured_at, user_note, status, retry_count, caption_user")
    .eq("id", photoId)
    .eq("user_id", user.id)
    .single();

  if (photoError || !photo) {
    return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  }

  if (photo.retry_count >= MAX_RETRY) {
    return NextResponse.json({ code: "RETRY_EXHAUSTED" }, { status: 409 });
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("photos")
    .download(`${photo.storage_path}/view.webp`);

  if (downloadError || !fileBlob) {
    return NextResponse.json({ code: "STORAGE_DOWNLOAD_FAILED", retryable: true }, { status: 502 });
  }

  await supabase.from("photos").update({ status: "generating" }).eq("id", photoId);

  const { data: tagRows } = await supabase.rpc("dashboard_tag_cloud", { p_limit: 30 });
  const existingTags = (tagRows ?? []).map((t: { name: string }) => t.name);

  try {
    const imageBytes = new Uint8Array(await fileBlob.arrayBuffer());
    const result = await generateCaption({
      imageBytes,
      mimeType: fileBlob.type || "image/webp",
      capturedAtLabel: formatKoreanTime(photo.captured_at),
      userNote: photo.user_note,
      existingTags,
    });

    await supabase
      .from("photos")
      .update({
        caption_ai: result.caption,
        mood: result.mood,
        status: "ready",
        prompt_version: PROMPT_VERSION,
        error_code: null,
      })
      .eq("id", photoId);

    await supabase.rpc("attach_tags", { p_photo_id: photoId, p_tag_names: result.tags });

    return NextResponse.json({ status: "ready", caption: result.caption, tags: result.tags, mood: result.mood });
  } catch (err) {
    const nextRetryCount = photo.retry_count + 1;
    await supabase
      .from("photos")
      .update({
        status: nextRetryCount >= MAX_RETRY ? "failed" : "pending",
        retry_count: nextRetryCount,
        error_code: "GEMINI_ERROR",
      })
      .eq("id", photoId);

    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ code: "GEMINI_ERROR", message, retryable: nextRetryCount < MAX_RETRY }, { status: 502 });
  }
}
