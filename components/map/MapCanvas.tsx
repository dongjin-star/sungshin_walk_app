"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import { MAP_ATTRIBUTION, MAP_TILE_SUBDOMAINS, MAP_TILE_URL } from "@/lib/map/tiles";
import type { BboxParams, MapPin } from "@/lib/map/types";
import { MOOD } from "@/lib/mood";

const PIN_DIAMETER = 46;
const DEFAULT_CENTER: [number, number] = [37.5665, 126.978]; // 서울시청 — 위치 권한 거부 시 기본값

interface MapCanvasProps {
  pins: MapPin[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onBoundsChange: (bbox: BboxParams) => void;
  fitToPins?: boolean; // 핀 1~3개 구간: 핀들이 화면을 채우도록 자동 줌 (PRD 8.3)
  initialCenter?: [number, number] | null;
}

function pinIcon(pin: MapPin, selected: boolean) {
  const size = selected ? PIN_DIAMETER + 12 : PIN_DIAMETER;
  const borderColor =
    pin.status === "ready" && pin.mood ? MOOD[pin.mood].hex : "var(--line-strong)";
  const dashed = pin.status === "queued_offline" ? "dashed" : "solid";
  const img = pin.thumbUrl
    ? `<img src="${pin.thumbUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<div style="width:100%;height:100%;border-radius:50%;background:var(--surface-sunk);"></div>`;
  const pendingDot =
    pin.status === "pending" || pin.status === "generating"
      ? `<span style="position:absolute;right:-2px;bottom:-2px;width:12px;height:12px;border-radius:50%;background:var(--ink-faint);border:2px solid var(--surface);"></span>`
      : "";

  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      <div style="width:100%;height:100%;border-radius:50%;overflow:hidden;border:2px ${dashed} ${borderColor};box-shadow:var(--shadow-pin);background:var(--surface);">
        ${img}
      </div>
      ${pendingDot}
    </div>`;

  return L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

function clusterIcon(count: number) {
  const html = `<div style="width:38px;height:38px;border-radius:50%;background:var(--accent);color:var(--on-accent);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;box-shadow:var(--shadow-pin);">+${count}</div>`;
  return L.divIcon({ html, className: "", iconSize: [38, 38], iconAnchor: [19, 19] });
}

export function MapCanvas({ pins, selectedId, onSelect, onBoundsChange, fitToPins, initialCenter }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: initialCenter ?? DEFAULT_CENTER,
      zoom: 15,
      zoomControl: false,
      attributionControl: true,
    });
    map.attributionControl.setPrefix(false); // "Leaflet" 링크 제거, OSM 저작권 표기는 유지

    L.tileLayer(MAP_TILE_URL, {
      subdomains: MAP_TILE_SUBDOMAINS,
      attribution: MAP_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    const cluster = L.markerClusterGroup({
      iconCreateFunction: (c) => clusterIcon(c.getChildCount()),
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
    });
    map.addLayer(cluster);
    clusterRef.current = cluster;

    const emitBounds = () => {
      const b = map.getBounds();
      onBoundsChange({ minLng: b.getWest(), minLat: b.getSouth(), maxLng: b.getEast(), maxLat: b.getNorth() });
    };
    map.on("moveend", emitBounds);
    map.whenReady(emitBounds);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cluster = clusterRef.current;
    const map = mapRef.current;
    if (!cluster || !map) return;

    cluster.clearLayers();
    markersRef.current.clear();

    const bounds: L.LatLngExpression[] = [];

    pins.forEach((pin) => {
      const marker = L.marker([pin.lat, pin.lng], { icon: pinIcon(pin, pin.id === selectedId) });
      marker.on("click", () => onSelect(pin.id === selectedId ? null : pin.id));
      if (pin.id === selectedId && pin.caption) {
        marker.bindTooltip(pin.caption, { permanent: true, direction: "top", offset: [0, -8], className: "pin-tooltip" });
      }
      cluster.addLayer(marker);
      markersRef.current.set(pin.id, marker);
      bounds.push([pin.lat, pin.lng]);
    });

    if (fitToPins && bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [56, 56], maxZoom: 17 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, selectedId]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
