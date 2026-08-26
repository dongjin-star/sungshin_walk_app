"use client";

import { useEffect, useState } from "react";
import { listQueue } from "@/lib/offline/queue";
import { Banner } from "@/components/ui/Banner";

// PRD 20.2 — 오프라인 큐는 임시 보관소일 뿐이므로 "업로드 대기 중"임을
// 계속 보여준다. 정확한 실시간 이벤트 버스 없이도 충분하도록 가볍게 폴링한다.
export function UploadQueueBanner() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      listQueue().then((items) => {
        if (!cancelled) setCount(items.length);
      });
    };
    check();
    const interval = setInterval(check, 4000);
    window.addEventListener("online", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("online", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  if (count === 0) return null;

  return (
    <div className="px-4 pt-2">
      <Banner variant="progress">{count}장 업로드 중…</Banner>
    </div>
  );
}
