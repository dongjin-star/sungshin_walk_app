"use client";

import { useEffect } from "react";
import { useSupabaseBrowser } from "@/lib/supabase/useBrowserClient";
import { drainQueue } from "@/lib/offline/queue";
import { uploadQueueItem } from "@/lib/offline/upload";
import { resumePendingCaptions } from "@/lib/caption/trigger";

/**
 * iOS는 Background Sync를 지원하지 않으므로 online 이벤트만으로는
 * 부족하다. 앱 재진입(visibilitychange)과 콜드스타트(mount)에서도
 * 드레인을 시도한다 — PRD 20.2.
 */
export function OfflineQueueSync() {
  const supabase = useSupabaseBrowser();

  useEffect(() => {
    if (!supabase) return;

    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const accessToken = session.access_token;
      const userId = session.user.id;

      await drainQueue((item) => uploadQueueItem(supabase, userId, accessToken, item));
      await resumePendingCaptions(supabase, accessToken);
    };

    run();

    const onOnline = () => run();
    const onVisibility = () => {
      if (!document.hidden) run();
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [supabase]);

  return null;
}
