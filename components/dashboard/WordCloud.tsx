"use client";

import { useRouter } from "next/navigation";

interface TagCount {
  name: string;
  useCount: number;
}

// PRD 11장 — 라이브러리 없이 빈도 -> font-size 스케일 + flex-wrap. 회전/곡선 배치는
// 읽기만 어려워지므로 쓰지 않는다.
export function WordCloud({ tags }: { tags: TagCount[] }) {
  const router = useRouter();
  if (tags.length === 0) {
    return <p className="text-meta text-[var(--ink-faint)]">아직 태그가 없어요</p>;
  }

  const max = Math.max(...tags.map((t) => t.useCount));
  const min = Math.min(...tags.map((t) => t.useCount));
  const scale = (count: number) => {
    if (max === min) return 16;
    const ratio = (count - min) / (max - min);
    return Math.round(13 + ratio * 15); // 13px ~ 28px
  };

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-2 items-baseline">
      {tags.map((tag) => (
        <button
          key={tag.name}
          type="button"
          onClick={() => router.push(`/feed?tag=${encodeURIComponent(tag.name)}`)}
          className="font-medium text-[var(--ink)]"
          style={{ fontSize: `${scale(tag.useCount)}px` }}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
