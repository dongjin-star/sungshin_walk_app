import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// PRD 20.2 — 오프라인 촬영 큐. localStorage(5MB)로는 Blob을 감당할 수
// 없어 IndexedDB를 쓴다. id는 클라이언트에서 생성해 photos.client_id와
// 짝을 이루므로, 업로드 재시도가 중복 사진을 만들지 않는다(dedupe).

export interface QueueItem {
  id: string;
  thumb: Blob;
  view: Blob;
  original: Blob;
  width: number;
  height: number;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  capturedAt: string;
  source: "camera" | "gallery";
  userNote: string | null;
  createdAt: number;
}

interface QueueDB extends DBSchema {
  captureQueue: { key: string; value: QueueItem };
}

let dbPromise: Promise<IDBPDatabase<QueueDB>> | null = null;

function getDb() {
  if (typeof indexedDB === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB<QueueDB>("walkq-offline", 1, {
      upgrade(db) {
        db.createObjectStore("captureQueue", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function enqueue(item: Omit<QueueItem, "createdAt">): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.put("captureQueue", { ...item, createdAt: Date.now() });

  if ("storage" in navigator && navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

export async function listQueue(): Promise<QueueItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.getAll("captureQueue");
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete("captureQueue", id);
}

let draining = false;

/**
 * online 이벤트 · visibilitychange(iOS는 Background Sync가 없어 앱 재진입이
 * 유일한 복구 경로) · 콜드스타트 3곳에서 호출된다. 업로드+DB INSERT가 모두
 * 성공한 항목만 큐에서 지운다.
 */
export async function drainQueue(uploadFn: (item: QueueItem) => Promise<boolean>): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    const items = await listQueue();
    for (const item of items) {
      const ok = await uploadFn(item);
      if (ok) await removeFromQueue(item.id);
    }
  } finally {
    draining = false;
  }
}
