"use client";

import { useState } from "react";
import { Farm } from "@/types";
import { Compass, Info } from "lucide-react";

interface FarmMapProps {
  farm: Farm;
  ndvi?: number | null;
  soilMoisturePercentile?: number | null;
}

export function FarmMap({ farm, ndvi, soilMoisturePercentile }: FarmMapProps) {
  const [context, setContext] = useState<"boundary" | "ndvi" | "moisture">("boundary");
  const ring = farm.boundaries_geojson?.coordinates?.[0] || [];
  const xs = ring.map((coordinate) => coordinate[0]);
  const ys = ring.map((coordinate) => coordinate[1]);
  const minX = xs.length ? Math.min(...xs) : farm.longitude - 0.01;
  const maxX = xs.length ? Math.max(...xs) : farm.longitude + 0.01;
  const minY = ys.length ? Math.min(...ys) : farm.latitude - 0.01;
  const maxY = ys.length ? Math.max(...ys) : farm.latitude + 0.01;
  const polygonPoints = ring.length
    ? ring.map(([x, y]) => {
        const px = 80 + ((x - minX) / Math.max(maxX - minX, 0.000001)) * 340;
        const py = 260 - ((y - minY) / Math.max(maxY - minY, 0.000001)) * 210;
        return `${px},${py}`;
      }).join(" ")
    : "120,60 380,50 420,240 160,260";

  const fill = context === "ndvi"
    ? "rgba(157, 187, 120, 0.55)"
    : context === "moisture"
      ? "rgba(100, 180, 220, 0.45)"
      : "rgba(57, 115, 76, 0.35)";

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#DDD6C3] bg-[#183D2C] shadow-xs h-[320px]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:25px_25px]" />
      <svg className="absolute inset-0 w-full h-full opacity-90" viewBox="0 0 500 300" preserveAspectRatio="none" aria-label="Schematic farm boundary">
        <polygon points={polygonPoints} fill={fill} stroke="#9DBB78" strokeWidth="3" strokeDasharray="7,4" />
      </svg>

      <div className="relative z-10 p-4 flex items-start justify-between gap-3">
        <div className="bg-[#112F21]/90 px-3 py-2 rounded-xl border border-[#9DBB78]/30 text-white text-xs">
          <div className="flex items-center gap-2 font-semibold"><Compass className="w-4 h-4 text-[#9DBB78]" />{farm.location_name}</div>
          <div className="font-mono text-[10px] text-[#D2CEBE] mt-1">[{farm.latitude.toFixed(4)}°, {farm.longitude.toFixed(4)}°]</div>
        </div>
        <div className="flex gap-1 bg-white/95 p-1 rounded-xl text-[11px]">
          {(["boundary", "ndvi", "moisture"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setContext(item)} className={`px-2.5 py-1 rounded-lg capitalize ${context === item ? "bg-[#183D2C] text-white" : "text-[#26352C]"}`}>
              {item === "boundary" ? "Boundary" : `${item} context`}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute z-10 bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#112F21] to-transparent text-white flex items-end justify-between gap-4">
        <div>
          <p className="font-semibold">{farm.name} · {farm.area_hectares} ha</p>
          <p className="text-[10px] text-[#D2CEBE] flex items-center gap-1 mt-1"><Info className="w-3 h-3" />Schematic context only; no satellite or sensor raster tiles are displayed.</p>
        </div>
        <div className="text-right text-xs bg-[#112F21]/85 px-3 py-2 rounded-xl border border-[#9DBB78]/30">
          <p>NDVI: <strong>{ndvi == null ? "Unavailable" : ndvi.toFixed(2)}</strong></p>
          <p>Moisture percentile: <strong>{soilMoisturePercentile == null ? "Unavailable" : `${soilMoisturePercentile}th`}</strong></p>
        </div>
      </div>
    </div>
  );
}
