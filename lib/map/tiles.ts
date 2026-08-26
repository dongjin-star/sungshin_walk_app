// PRD 8.1 — Leaflet + OSM. 공용 서버 URL을 상수화해 두면 트래픽 정책이
// 바뀌었을 때(리스크 #8) 이 파일만 바꾸면 된다.
export const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const MAP_TILE_SUBDOMAINS = ["a", "b", "c"];
