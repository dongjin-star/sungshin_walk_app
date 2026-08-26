"use client";

import { useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/** 클라이언트 생성이 실패하면 null — 화면은 이를 "데이터 없음"으로 취급해 빈 상태를 보여준다. */
export function useSupabaseBrowser(): SupabaseClient | null {
  return useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);
}
