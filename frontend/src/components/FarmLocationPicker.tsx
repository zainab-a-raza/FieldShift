"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, MapPin } from "lucide-react";

interface FarmLocationPickerProps {
  latitude: number;
  longitude: number;
  areaHectares: number;
  onChange: (value: {
    latitude: number;
    longitude: number;
    areaHectares: number;
    boundariesGeojson: {
      type: "Polygon";
      coordinates: number[][][];
    };
  }) => void;
}

function createBoundary(latitude: number, longitude: number, areaHectares: number) {
  const radiusMeters = Math.sqrt((areaHectares * 10000) / Math.PI);
  const latitudeDelta = radiusMeters / 111_320;
  const longitudeDelta = radiusMeters / (111_320 * Math.cos((latitude * Math.PI) / 180));

  return {
    type: "Polygon" as const,
    coordinates: [[
      [longitude - longitudeDelta, latitude - latitudeDelta],
      [longitude + longitudeDelta, latitude - latitudeDelta],
      [longitude + longitudeDelta, latitude + latitudeDelta],
      [longitude - longitudeDelta, latitude + latitudeDelta],
      [longitude - longitudeDelta, latitude - latitudeDelta],
    ]],
  };
}

export function FarmLocationPicker({
  latitude,
  longitude,
  areaHectares,
  onChange,
}: FarmLocationPickerProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);
  const initialCenterRef = useRef<[number, number]>([latitude, longitude]);
  const areaRef = useRef(areaHectares);
  const onChangeRef = useRef(onChange);
  areaRef.current = areaHectares;
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const map = L.map(mapElement.current, {
      center: initialCenterRef.current,
      zoom: 6,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("click", (event) => {
      const nextLatitude = Number(event.latlng.lat.toFixed(6));
      const nextLongitude = Number(event.latlng.lng.toFixed(6));
      onChangeRef.current({
        latitude: nextLatitude,
        longitude: nextLongitude,
        areaHectares: areaRef.current,
        boundariesGeojson: createBoundary(nextLatitude, nextLongitude, areaRef.current),
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    overlayRef.current?.remove();
    const group = L.layerGroup().addTo(map);
    overlayRef.current = group;
    const boundary = createBoundary(latitude, longitude, areaHectares);

    const marker = L.marker([latitude, longitude], {
      draggable: true,
      icon: L.divIcon({
        className: "",
        html: '<div style="width:16px;height:16px;border:3px solid white;border-radius:50%;background:#377C52;box-shadow:0 1px 5px rgba(0,0,0,.35)"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    }).bindTooltip("Drag this marker to move your field");
    marker.on("dragend", () => {
      const position = marker.getLatLng();
      const nextLatitude = Number(position.lat.toFixed(6));
      const nextLongitude = Number(position.lng.toFixed(6));
      onChangeRef.current({
        latitude: nextLatitude,
        longitude: nextLongitude,
        areaHectares,
        boundariesGeojson: createBoundary(nextLatitude, nextLongitude, areaHectares),
      });
    });
    marker.addTo(group);

    L.circle([latitude, longitude], {
      radius: Math.sqrt((areaHectares * 10000) / Math.PI),
      color: "#D88932",
      weight: 2,
      dashArray: "6 5",
      fillColor: "#F2B84B",
      fillOpacity: 0.18,
    }).bindTooltip(`${areaHectares.toFixed(1)} hectares selected`).addTo(group);

    L.polygon(
      boundary.coordinates[0].map(([lon, lat]) => [lat, lon] as [number, number]),
      {
        color: "#377C52",
        weight: 2,
        fillColor: "#8DBA72",
        fillOpacity: 0.14,
      },
    ).addTo(group);

    return () => {
      group.remove();
    };
  }, [latitude, longitude, areaHectares]);

  const setArea = (nextArea: number) => {
    onChange({
      latitude,
      longitude,
      areaHectares: nextArea,
      boundariesGeojson: createBoundary(latitude, longitude, nextArea),
    });
  };

  const centerMap = () => {
    mapRef.current?.setView([latitude, longitude], 14, { animate: true });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#DDE5DC]">
      <div className="relative">
        <div ref={mapElement} className="h-[360px] w-full" />
        <div className="absolute left-3 top-3 z-[400] max-w-[260px] rounded-xl border border-white/80 bg-white/95 p-3 shadow-md backdrop-blur">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#377C52]" />
            <p className="text-xs font-bold text-[#19382A]">Choose your field on the map</p>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-[#718078]">
            Click the map or drag the green marker to your field. Use the slider below to resize the amber area.
          </p>
          <button type="button" onClick={centerMap} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#377C52]">
            <LocateFixed className="h-3.5 w-3.5" />
            Center selection
          </button>
        </div>
      </div>
      <div className="bg-white p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <label htmlFor="field-area" className="text-xs font-bold text-[#19382A]">Selected field area</label>
            <p className="mt-1 text-2xl font-bold text-[#19382A]">{areaHectares.toFixed(1)} ha</p>
          </div>
          <p className="text-right text-[11px] text-[#718078]">Drag to match your field size</p>
        </div>
        <input
          id="field-area"
          type="range"
          min="0.5"
          max="1000"
          step="0.5"
          value={areaHectares}
          onChange={(event) => setArea(Number(event.target.value))}
          className="mt-3 w-full accent-[#D88932]"
        />
        <div className="mt-1 flex justify-between text-[10px] text-[#9AA69D]">
          <span>0.5 ha</span>
          <span>1,000 ha</span>
        </div>
      </div>
    </div>
  );
}
