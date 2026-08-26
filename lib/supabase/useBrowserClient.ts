"use client";

import { useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseClientConfig } from "@/lib/env";

/** Supabase 키가 없으면 null — 화면은 이를 "데이터 없음"으로 취급해 빈 상태를 보여준다. */
export function useSupabaseBrowser(): SupabaseClient | null {
  return useMemo(() => {
    if (!hasSupabaseClientConfig) return null;
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);
}
