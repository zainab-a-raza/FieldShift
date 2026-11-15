"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { EnvironmentalSummary, Farm } from "@/types";
import { LocateFixed, MapPin, Ruler } from "lucide-react";

interface EnvironmentalMapProps {
  farm: Farm;
  env: EnvironmentalSummary;
}

export function EnvironmentalMap({ farm, env }: EnvironmentalMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const farmLayerRef = useRef<L.LayerGroup | null>(null);
  const [selectedArea, setSelectedArea] = useState(farm.area_hectares);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const map = L.map(mapElement.current, {
      center: [farm.latitude, farm.longitude],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [farm.latitude, farm.longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    farmLayerRef.current?.remove();
    const farmLayer = L.layerGroup().addTo(map);
    farmLayerRef.current = farmLayer;

    const farmPoint = L.circleMarker([farm.latitude, farm.longitude], {
      radius: 9,
      color: "#FFFFFF",
      weight: 3,
      fillColor: "#377C52",
      fillOpacity: 1,
    }).bindPopup(
      `<strong>${farm.name}</strong><br />${farm.location_name}<br /><small>${farm.area_hectares} hectares</small>`,
    );
    farmPoint.addTo(farmLayer);

    if (farm.boundaries_geojson?.coordinates?.[0]) {
      const coordinates = farm.boundaries_geojson.coordinates[0].map(
        ([longitude, latitude]) => [latitude, longitude] as [number, number],
      );
      const boundary = L.polygon(coordinates, {
        color: "#377C52",
        weight: 3,
        fillColor: "#8DBA72",
        fillOpacity: 0.2,
      }).bindTooltip(`${farm.name} · field boundary`);
      boundary.addTo(farmLayer);
      map.fitBounds(boundary.getBounds(), { padding: [24, 24] });
    } else {
      map.setView([farm.latitude, farm.longitude], 13);
    }

    L.circle([farm.latitude, farm.longitude], {
      radius: Math.max(100, Math.sqrt(selectedArea / farm.area_hectares) * 650),
      color: "#D88932",
      weight: 2,
      dashArray: "6 5",
      fillColor: "#F2B84B",
      fillOpacity: 0.12,
    })
      .bindTooltip(`Selected working area: ${selectedArea.toFixed(1)} hectares`)
      .addTo(farmLayer);

    return () => {
      farmLayer.remove();
    };
  }, [env, farm, selectedArea]);

  const focusFarm = () => {
    mapRef.current?.setView([farm.latitude, farm.longitude], 14, { animate: true });
  };

  const rainfallVolume = Math.round(env.rainfall.annual_precipitation_mm * selectedArea * 10);
  const metrics = [
    {
      label: "Temperature",
      value: `${env.temperature.avg_temp_c}°C`,
      detail: `${env.temperature.hot_days_gt_35c} hot days`,
      tone: "text-[#B66A1D] bg-[#FFF3DF]",
    },
    {
      label: "Rainfall",
      value: `${Math.round(env.rainfall.annual_precipitation_mm)} mm`,
      detail: `${rainfallVolume.toLocaleString()} m³ over selected area`,
      tone: "text-[#397A91] bg-[#EAF5F7]",
    },
    {
      label: "Soil moisture",
      value: `${env.soil_moisture.soil_moisture_percentile}th percentile`,
      detail: env.soil_moisture.anomaly_status,
      tone: "text-[#4C8A58] bg-[#EAF5EC]",
    },
    {
      label: "Elevation",
      value: `${env.terrain.mean_elevation_m} m`,
      detail: `${env.terrain.slope_degrees}° slope`,
      tone: "text-[#806A51] bg-[#F3EEE8]",
    },
    {
      label: "Vegetation health",
      value: `NDVI ${env.vegetation.current_ndvi.toFixed(2)}`,
      detail: env.vegetation.ndvi_anomaly >= 0 ? "At or above usual level" : "Below usual level",
      tone: "text-[#56843E] bg-[#EEF5E9]",
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E1E6DF] bg-white">
      <div className="grid items-stretch lg:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="relative min-h-[420px] border-b border-[#E1E6DF] lg:min-h-[560px] lg:border-b-0 lg:border-r">
          <div ref={mapElement} className="h-[420px] w-full lg:h-[560px]" />
          <div className="absolute left-3 top-3 z-[400] max-w-[255px] rounded-xl border border-white/80 bg-white/95 p-3 shadow-md backdrop-blur">
            <p className="text-xs font-bold text-[#19382A]">Select a working area</p>
            <p className="mt-1 text-[11px] leading-4 text-[#718078]">
              The green outline is your farm. The amber circle shows the area currently selected for planning.
            </p>
            <button
              type="button"
              onClick={focusFarm}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#377C52]"
            >
              <LocateFixed className="h-3.5 w-3.5" />
              Center on farm
            </button>
          </div>
        </div>
        <aside className="p-5">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#377C52]" />
            <h3 className="text-base font-semibold text-[#19382A]">{farm.name}</h3>
          </div>
          <p className="mt-1 text-[11px] text-[#718078]">{farm.location_name}</p>

          <div className="mt-5 rounded-xl border border-[#E8EEDF] bg-[#F7FAF5] p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#718078]">Selected area</p>
                <p className="mt-1 text-2xl font-bold text-[#19382A]">{selectedArea.toFixed(1)} ha</p>
              </div>
              <p className="text-right text-[10px] text-[#718078]">of {farm.area_hectares} ha</p>
            </div>
            <input
              aria-label="Select field area in hectares"
              type="range"
              min={Math.max(1, Math.round(farm.area_hectares * 0.1))}
              max={Math.max(1, Math.round(farm.area_hectares))}
              step="0.5"
              value={selectedArea}
              onChange={(event) => setSelectedArea(Number(event.target.value))}
              className="mt-4 w-full accent-[#D88932]"
            />
            <div className="mt-2 flex justify-between text-[10px] text-[#9AA69D]">
              <span>Small area</span>
              <span>Whole farm</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-[#EDF0EB] p-2.5">
                <p className="text-[10px] font-medium text-[#718078]">{metric.label}</p>
                <p className={`mt-1 w-fit rounded-md px-1.5 py-0.5 text-xs font-bold ${metric.tone}`}>{metric.value}</p>
                <p className="mt-1 text-[10px] leading-4 text-[#9AA69D]">{metric.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1 text-[10px] leading-4 text-[#9AA69D]">
            <Ruler className="h-3 w-3 shrink-0" />
            Rainfall volume updates with the selected area. Other indicators are currently farm-level summaries.
          </p>
        </aside>
      </div>
      <div className="border-t border-[#E1E6DF] bg-[#FBFCFA] px-4 py-3 text-[11px] text-[#718078]">
        Map data © OpenStreetMap contributors. NASA indicators are regional or farm-level summaries, not field-resolution raster imagery.
      </div>
    </div>
  );
}
