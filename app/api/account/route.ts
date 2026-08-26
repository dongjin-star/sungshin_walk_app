import "server-only";
import { NextResponse } from "next/server";
import { verifyBearerUser } from "@/lib/supabase/route";

// PRD 13.1 — 계정 삭제는 v1 필수. Storage 객체까지 완전 제거한다.
// service_role 없이 본인 소유 리소스만 지운다: Storage는 RLS로 본인
// 폴더에 대한 권한이 이미 있고, auth.users 삭제는 0005 마이그레이션의
// security definer RPC(delete_own_account)로 위임한다.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const auth = await verifyBearerUser(request);
  if (!auth) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });

  const { user, supabase } = auth;
  const userId = user.id;

  const { data: photoFolders } = await supabase.storage.from("photos").list(userId, { limit: 1000 });
  if (photoFolders) {
    for (const folder of photoFolders) {
      const { data: files } = await supabase.storage.from("photos").list(`${userId}/${folder.name}`, { limit: 100 });
      if (files && files.length > 0) {
        await supabase.storage.from("photos").remove(files.map((f) => `${userId}/${folder.name}/${f.name}`));
      }
    }
  }

  // photos / tags / profiles는 auth.users에 ON DELETE CASCADE로 걸려 있어
  // 계정 삭제만으로 함께 정리된다 (0001_init.sql).
  const { error } = await supabase.rpc("delete_own_account");
  if (error) return NextResponse.json({ code: "DELETE_FAILED" }, { status: 500 });

  return NextResponse.json({ status: "deleted" });
}
