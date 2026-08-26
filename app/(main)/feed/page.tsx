import { Suspense } from "react";
import { FeedScreen } from "@/components/feed/FeedScreen";

export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <FeedScreen />
    </Suspense>
  );
}
