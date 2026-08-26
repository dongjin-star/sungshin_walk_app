import Image from "next/image";
import Link from "next/link";
import { MOOD } from "@/lib/mood";
import { displayCaption, isPendingLike, type Photo } from "@/lib/photo";
import { MoodBadge } from "@/components/ui/MoodBadge";
import { TagText } from "@/components/ui/Chip";
import { SkeletonLine } from "@/components/ui/Skeleton";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true }).format(
    new Date(iso)
  );
}

export function PhotoCard({ photo }: { photo: Photo }) {
  const caption = displayCaption(photo);
  const pending = isPendingLike(photo.status);
  const accentColor = photo.mood ? MOOD[photo.mood].hex : "var(--line-strong)";

  return (
    <Link
      href={`/photo/${photo.id}`}
      className="flex gap-3 py-3 border-l-[3px] pl-3"
      style={{ borderColor: accentColor }}
    >
      <div className="relative w-[92px] aspect-[4/3] shrink-0 rounded-[var(--radius-card)] overflow-hidden bg-[var(--surface-sunk)]">
        {photo.thumbUrl ? (
          <Image src={photo.thumbUrl} alt="" fill sizes="92px" className="object-cover" />
        ) : null}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5 justify-center">
        {pending || !caption ? (
          <SkeletonLine width="80%" />
        ) : (
          <p className="text-caption text-[var(--ink)] line-clamp-2">{caption}</p>
        )}

        {!pending && (photo.mood || photo.tags.length > 0) ? (
          <div className="flex items-center gap-2 flex-wrap">
            {photo.mood ? <MoodBadge mood={photo.mood} size="sm" /> : null}
            {photo.tags.slice(0, 3).map((tag) => (
              <TagText key={tag}>{tag}</TagText>
            ))}
          </div>
        ) : null}

        <span className="text-meta text-[var(--ink-faint)]">{formatTime(photo.capturedAt)}</span>
      </div>
    </Link>
  );
}
