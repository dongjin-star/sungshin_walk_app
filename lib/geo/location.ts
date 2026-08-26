// PRD 9.4 — EXIF에 의존하지 않는다. navigator.geolocation을 별도로 호출해
// 앱이 묶는다. 권한 거부는 촬영을 막지 않는다.

export interface GeoResult {
  lat: number;
  lng: number;
  accuracyM: number;
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 30000,
};

export function getCurrentLocation(): Promise<GeoResult | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: pos.coords.accuracy });
      },
      () => resolve(null),
      GEO_OPTIONS
    );
  });
}
