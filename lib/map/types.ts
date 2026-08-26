import type { MoodKey } from "@/lib/mood";
import type { PhotoStatus } from "@/lib/photo";

export interface MapPin {
  id: string;
  storagePath: string;
  lng: number;
  lat: number;
  mood: MoodKey | null;
  status: PhotoStatus;
  caption: string | null;
  thumbUrl?: string;
}

export interface BboxParams {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}
