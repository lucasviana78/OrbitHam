'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MlMap, Marker, NavigationControl } from 'maplibre-gl';
import type { StyleSpecification, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Satellite, Station, Pass } from '@/types';
import {
  parseTle,
  propagateAt,
  groundTrack,
  footprintRadiusKm,
  type SatState,
} from '@/lib/orbital';
import { subsolarPoint, nightPolygon } from '@/lib/solar';
import { geodesicCircle, splitAntimeridian, type LngLat } from '@/lib/geo';
import { satelliteColor } from '@/lib/satellite-colors';
import type { SatRec } from 'satellite.js';

/** Dark "mission control" basemap built from CARTO raster tiles (no API key). */
const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
};

const EMPTY_FC = { type: 'FeatureCollection', features: [] } as const;

export interface SatelliteMapProps {
  /** One or more satellites to render simultaneously. */
  satellites: Satellite[];
  stations: Station[];
  /** Passes of the primary (first) satellite — drives the rise/set markers. */
  passes?: Pass[];
  /** Reports the primary satellite's live state once per second (side panel). */
  onState?: (state: SatState | null) => void;
}

interface SatEntry {
  id: number;
  name: string;
  color: string;
  satrec: SatRec;
  marker: Marker;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markerEl(html: string, className: string): HTMLElement {
  const el = document.createElement('div');
  el.className = className;
  el.innerHTML = html;
  return el;
}

function setSourceData(map: MlMap, id: string, data: unknown) {
  (map.getSource(id) as GeoJSONSource | undefined)?.setData(data as never);
}

export function SatelliteMap({
  satellites,
  stations,
  passes,
  onState,
}: SatelliteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(false);
  const satsRef = useRef<SatEntry[]>([]);
  const sunMarkerRef = useRef<Marker | null>(null);
  const stationMarkersRef = useRef<Marker[]>([]);
  const passMarkersRef = useRef<Marker[]>([]);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  // Re-run the build effect only when the *set* of satellites changes
  // (ids or TLEs), not on every parent re-render with a fresh array.
  const satKey = useMemo(
    () => satellites.map((s) => `${s.id}:${s.tle_1 ?? ''}`).join('|'),
    [satellites],
  );
  const satellitesRef = useRef(satellites);
  satellitesRef.current = satellites;

  /* ---- init map once ---- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new MlMap({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [0, 10],
      zoom: 1.4,
      attributionControl: { compact: true },
      maxZoom: 7,
      renderWorldCopies: true,
    });
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('night', { type: 'geojson', data: EMPTY_FC as never });
      map.addLayer({
        id: 'night',
        type: 'fill',
        source: 'night',
        paint: { 'fill-color': '#0b1020', 'fill-opacity': 0.45 },
      });

      map.addSource('footprint', { type: 'geojson', data: EMPTY_FC as never });
      map.addLayer({
        id: 'footprint-fill',
        type: 'fill',
        source: 'footprint',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.12,
        },
      });
      map.addLayer({
        id: 'footprint-line',
        type: 'line',
        source: 'footprint',
        paint: {
          'line-color': ['get', 'color'],
          'line-opacity': 0.5,
          'line-width': 1,
        },
      });

      map.addSource('track', { type: 'geojson', data: EMPTY_FC as never });
      map.addLayer({
        id: 'track',
        type: 'line',
        source: 'track',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': 2 },
      });

      setReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  /* ---- (re)build everything for the selected satellites ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // Drop markers from the previous selection.
    satsRef.current.forEach((s) => s.marker.remove());
    satsRef.current = [];

    const entries: SatEntry[] = [];
    satellitesRef.current.forEach((sat, i) => {
      if (!sat.tle_1 || !sat.tle_2) return;
      let satrec: SatRec;
      try {
        satrec = parseTle(sat.tle_1, sat.tle_2);
      } catch {
        return;
      }
      const color = satelliteColor(entries.length);
      const marker = new Marker({
        element: markerEl(
          `<span class="orbit-sat-emoji">🛰️</span><span class="orbit-sat-label" style="color:${color}">${escapeHtml(sat.name)}</span>`,
          'orbit-sat-marker',
        ),
      });
      entries.push({ id: sat.id, name: sat.name, color, satrec, marker });
    });
    satsRef.current = entries;

    if (!sunMarkerRef.current) {
      sunMarkerRef.current = new Marker({
        element: markerEl('☀️', 'orbit-sun-marker'),
      });
    }

    if (entries.length === 0) {
      onStateRef.current?.(null);
      setSourceData(map, 'track', EMPTY_FC);
      setSourceData(map, 'footprint', EMPTY_FC);
      return;
    }

    const redrawTracks = (now: Date) => {
      setSourceData(map, 'track', {
        type: 'FeatureCollection',
        features: entries.flatMap((e) =>
          splitAntimeridian(groundTrack(e.satrec, now)).map((seg) => ({
            type: 'Feature',
            properties: { color: e.color },
            geometry: { type: 'LineString', coordinates: seg },
          })),
        ),
      });
    };

    const redrawNight = (now: Date) => {
      setSourceData(map, 'night', {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [nightPolygon(now)] },
      });
      const sun = subsolarPoint(now);
      sunMarkerRef.current?.setLngLat([sun.lon, sun.lat]).addTo(map);
    };

    let tick = 0;
    const update = () => {
      const now = new Date();
      const footprints: unknown[] = [];
      let primaryState: SatState | null = null;

      entries.forEach((e, idx) => {
        const state = propagateAt(e.satrec, now);
        if (idx === 0) primaryState = state;
        if (!state) return;
        e.marker.setLngLat([state.lon, state.lat]).addTo(map);
        const ring: LngLat[] = geodesicCircle(
          state.lat,
          state.lon,
          footprintRadiusKm(state.altitudeKm),
        );
        footprints.push({
          type: 'Feature',
          properties: { color: e.color },
          geometry: { type: 'Polygon', coordinates: [ring] },
        });
      });

      onStateRef.current?.(primaryState);
      setSourceData(map, 'footprint', {
        type: 'FeatureCollection',
        features: footprints,
      });

      if (tick % 15 === 0) redrawTracks(now);
      if (tick % 60 === 0) redrawNight(now);
      tick++;
    };

    const now = new Date();
    const initial = propagateAt(entries[0].satrec, now);
    if (initial) map.jumpTo({ center: [initial.lon, initial.lat], zoom: 1.6 });
    redrawTracks(now);
    redrawNight(now);
    update();

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [ready, satKey]);

  /* ---- station markers ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    stationMarkersRef.current.forEach((m) => m.remove());
    stationMarkersRef.current = stations.map((s) =>
      new Marker({
        element: markerEl(
          `<span class="orbit-station-dot"></span><span class="orbit-station-label">${escapeHtml(s.callsign)}</span>`,
          'orbit-station-marker',
        ),
      })
        .setLngLat([s.longitude, s.latitude])
        .addTo(map),
    );
    return () => {
      stationMarkersRef.current.forEach((m) => m.remove());
      stationMarkersRef.current = [];
    };
  }, [ready, stations]);

  /* ---- rise/set markers for the primary satellite's next pass ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    passMarkersRef.current.forEach((m) => m.remove());
    passMarkersRef.current = [];
    const satrec = satsRef.current[0]?.satrec;
    if (satrec && passes?.length) {
      const next = passes[0];
      const points = [
        { time: next.rise, label: 'Subida', kind: 'rise' },
        { time: next.set, label: 'Descida', kind: 'set' },
      ];
      for (const p of points) {
        const state = propagateAt(satrec, new Date(p.time));
        if (!state) continue;
        passMarkersRef.current.push(
          new Marker({
            element: markerEl(
              `<span class="orbit-pass-dot orbit-pass-${p.kind}"></span><span class="orbit-pass-label">${p.label}</span>`,
              'orbit-pass-marker',
            ),
          })
            .setLngLat([state.lon, state.lat])
            .addTo(map),
        );
      }
    }
    return () => {
      passMarkersRef.current.forEach((m) => m.remove());
      passMarkersRef.current = [];
    };
  }, [ready, passes, satKey]);

  return <div ref={containerRef} className="h-full w-full" />;
}
