'use client';

import { useEffect, useRef, useState } from 'react';
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
  satellite: Satellite;
  stations: Station[];
  passes?: Pass[];
  /** Reports the live propagated state once per second (for the side panel). */
  onState?: (state: SatState | null) => void;
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
  satellite,
  stations,
  passes,
  onState,
}: SatelliteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(false);
  const satRef = useRef<SatRec | null>(null);
  const satMarkerRef = useRef<Marker | null>(null);
  const sunMarkerRef = useRef<Marker | null>(null);
  const stationMarkersRef = useRef<Marker[]>([]);
  const passMarkersRef = useRef<Marker[]>([]);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

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
        paint: { 'fill-color': '#38bdf8', 'fill-opacity': 0.12 },
      });
      map.addLayer({
        id: 'footprint-line',
        type: 'line',
        source: 'footprint',
        paint: { 'line-color': '#38bdf8', 'line-opacity': 0.5, 'line-width': 1 },
      });

      map.addSource('track', { type: 'geojson', data: EMPTY_FC as never });
      map.addLayer({
        id: 'track',
        type: 'line',
        source: 'track',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#facc15', 'line-width': 2 },
      });

      setReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  /* ---- (re)build everything for the selected satellite ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (!satellite.tle_1 || !satellite.tle_2) {
      onStateRef.current?.(null);
      return;
    }

    try {
      satRef.current = parseTle(satellite.tle_1, satellite.tle_2);
    } catch {
      satRef.current = null;
      onStateRef.current?.(null);
      return;
    }
    const satrec = satRef.current;

    if (!satMarkerRef.current) {
      satMarkerRef.current = new Marker({
        element: markerEl('🛰️', 'orbit-sat-marker'),
      });
    }
    if (!sunMarkerRef.current) {
      sunMarkerRef.current = new Marker({
        element: markerEl('☀️', 'orbit-sun-marker'),
      });
    }

    const redrawTrack = (now: Date) => {
      const segments = splitAntimeridian(groundTrack(satrec, now));
      setSourceData(map, 'track', {
        type: 'FeatureCollection',
        features: segments.map((seg) => ({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: seg },
        })),
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
      const state = propagateAt(satrec, now);
      onStateRef.current?.(state);
      if (!state) return;

      satMarkerRef.current?.setLngLat([state.lon, state.lat]).addTo(map);

      const ring: LngLat[] = geodesicCircle(
        state.lat,
        state.lon,
        footprintRadiusKm(state.altitudeKm),
      );
      setSourceData(map, 'footprint', {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [ring] },
      });

      if (tick % 15 === 0) redrawTrack(now);
      if (tick % 60 === 0) redrawNight(now);
      tick++;
    };

    const now = new Date();
    const initial = propagateAt(satrec, now);
    if (initial) map.jumpTo({ center: [initial.lon, initial.lat], zoom: 1.6 });
    redrawTrack(now);
    redrawNight(now);
    update();

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [ready, satellite.id, satellite.tle_1, satellite.tle_2]);

  /* ---- station markers ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    stationMarkersRef.current.forEach((m) => m.remove());
    stationMarkersRef.current = stations.map((s) =>
      new Marker({
        element: markerEl(
          `<span class="orbit-station-dot"></span><span class="orbit-station-label">${s.callsign}</span>`,
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

  /* ---- rise/set markers for the next pass ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    passMarkersRef.current.forEach((m) => m.remove());
    passMarkersRef.current = [];
    const satrec = satRef.current;
    if (satrec && passes?.length) {
      const next = passes[0];
      const points = [
        { time: next.rise, label: 'AOS', kind: 'rise' },
        { time: next.set, label: 'LOS', kind: 'set' },
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
  }, [ready, passes, satellite.id]);

  return <div ref={containerRef} className="h-full w-full" />;
}
