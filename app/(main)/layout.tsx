import { TabBar } from "@/components/app-shell/TabBar";
import { OfflineQueueSync } from "@/components/app-shell/OfflineQueueSync";
import { UploadQueueBanner } from "@/components/app-shell/UploadQueueBanner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex-1 flex flex-col relative" style={{ paddingBottom: "var(--tabbar-height)" }}>
        <UploadQueueBanner />
        {children}
      </div>
      <TabBar />
      <OfflineQueueSync />
    </div>
  );
}
