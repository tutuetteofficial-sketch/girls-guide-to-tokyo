"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  href?: string;
};

type MyListMapProps = {
  places: MapPlace[];
};

export default function MyListMap({
  places,
}: MyListMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(
    null
  );
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!mapRef.current) {
        return;
      }

      /*
       * Leafletはwindowを必要とするため、
       * ブラウザ側でのみdynamic importする。
       */
      const L = await import("leaflet");

      if (cancelled || !mapRef.current) {
        return;
      }

      /*
       * 既にMapが存在する場合は削除してから作り直す。
       */
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      /*
       * Leafletのデフォルトアイコン設定
       */
      delete (
        L.Icon.Default.prototype as any
      )._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const validPlaces = places.filter(
        (place) =>
          typeof place.latitude ===
            "number" &&
          Number.isFinite(place.latitude) &&
          typeof place.longitude ===
            "number" &&
          Number.isFinite(place.longitude)
      );

      /*
       * 店舗がない場合
       */
      if (validPlaces.length === 0) {
        const map = L.map(mapRef.current, {
          zoomControl: true,
        }).setView(
          [35.6762, 139.6503],
          12
        );

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          }
        ).addTo(map);

        leafletMapRef.current = map;

        return;
      }

      /*
       * 複数店舗が入るので、
       * 全店舗が見える範囲に自動調整する。
       */
      const bounds = L.latLngBounds(
        validPlaces.map((place) => [
          place.latitude,
          place.longitude,
        ])
      );

      const map = L.map(mapRef.current, {
        zoomControl: true,
      });

      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 16,
      });

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
      ).addTo(map);

      validPlaces.forEach((place) => {
        const marker = L.marker([
          place.latitude,
          place.longitude,
        ]).addTo(map);

        const address =
  place.address
    ? `<div style="margin-top:4px;color:#777;font-size:12px;">${escapeHtml(
        place.address
      )}</div>`
    : "";

const detailLink = place.href
  ? `
    <a
      href="${escapeHtml(place.href)}"
      style="
        display:inline-block;
        margin-top:10px;
        color:#c8647b;
        font-size:12px;
        text-decoration:none;
      "
    >
      View place →
    </a>
  `
  : "";

marker.bindPopup(`
  <div style="min-width:160px;">
    <div style="font-size:14px;font-weight:600;color:#333;">
      ${escapeHtml(place.name)}
    </div>
    ${address}
    ${detailLink}
  </div>
`);

      });

      leafletMapRef.current = map;
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [places]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#f2e7e2",
      }}
    />
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(
      /'/g,
      "&#039;"
    );
}