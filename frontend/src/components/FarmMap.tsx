"use client";

import React, { useState } from "react";
import { Farm } from "@/types";
import { Layers, Eye, Map as MapIcon, Compass, Maximize2 } from "lucide-react";

interface FarmMapProps {
  farm: Farm;
  ndvi?: number;
  soilMoisturePercentile?: number;
}

export function FarmMap({ farm, ndvi = 0.52, soilMoisturePercentile = 34 }: FarmMapProps) {
  const [activeLayer, setActiveLayer] = useState<"satellite" | "ndvi" | "moisture">("satellite");

  const lat = farm.latitude;
  const lon = farm.longitude;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#DDD6C3] bg-[#E8E2D2] shadow-xs h-[320px] flex flex-col justify-between">
      {/* Visual Canvas Representation with Synthetic Satellite Tiles */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{
          backgroundImage:
            activeLayer === "satellite"
              ? "radial-gradient(ellipse at center, rgba(38, 83, 58, 0.75), rgba(24, 61, 44, 0.95)), repeating-linear-gradient(45deg, #2a5538 0, #2a5538 20px, #244b31 20px, #244b31 40px)"
              : activeLayer === "ndvi"
              ? "radial-gradient(circle at 60% 40%, rgba(157, 187, 120, 0.9), rgba(57, 115, 76, 0.85), rgba(24, 61, 44, 0.95))"
              : "radial-gradient(circle at 40% 60%, rgba(93, 148, 187, 0.85), rgba(46, 85, 115, 0.9), rgba(24, 61, 44, 0.95))",
        }}
      >
        {/* Synthetic Cadastral Field Boundary SVG Overlay */}
        <svg className="w-full h-full opacity-80" viewBox="0 0 500 300" preserveAspectRatio="none">
          <defs>
            <pattern id="cropGrid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(248, 248, 243, 0.15)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cropGrid)" />
          
          {/* Farm boundary polygon */}
          <polygon
            points="120,60 380,50 420,240 160,260"
            fill={
              activeLayer === "ndvi"
                ? "rgba(157, 187, 120, 0.35)"
                : activeLayer === "moisture"
                ? "rgba(100, 180, 220, 0.35)"
                : "rgba(57, 115, 76, 0.35)"
            }
            stroke="#9DBB78"
            strokeWidth="2.5"
            strokeDasharray="6,4"
          />
          {/* Sub-field plots */}
          <line x1="250" y1="55" x2="290" y2="250" stroke="#E8E2D2" strokeWidth="1.5" strokeDasharray="3,3" />
          <line x1="140" y1="160" x2="400" y2="145" stroke="#E8E2D2" strokeWidth="1.5" strokeDasharray="3,3" />
        </svg>
      </div>

      {/* Top Map Badges */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-[#183D2C]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#9DBB78]/30 text-white text-xs shadow-sm">
          <Compass className="w-4 h-4 text-[#9DBB78]" />
          <span className="font-semibold">{farm.location_name}</span>
          <span className="text-[#C5BFA9] font-mono text-[11px]">
            [{lat.toFixed(4)}°, {lon.toFixed(4)}°]
          </span>
        </div>

        {/* Layer Switcher Controls */}
        <div className="flex items-center gap-1 bg-[#FFFFFF]/90 backdrop-blur-md p-1 rounded-xl border border-[#DDD6C3] shadow-xs text-xs">
          <button
            onClick={() => setActiveLayer("satellite")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              activeLayer === "satellite"
                ? "bg-[#183D2C] text-white"
                : "text-[#26352C] hover:bg-[#F8F8F3]"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setActiveLayer("ndvi")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              activeLayer === "ndvi"
                ? "bg-[#39734C] text-white"
                : "text-[#26352C] hover:bg-[#F8F8F3]"
            }`}
          >
            NDVI (10m)
          </button>
          <button
            onClick={() => setActiveLayer("moisture")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              activeLayer === "moisture"
                ? "bg-[#2A5978] text-white"
                : "text-[#26352C] hover:bg-[#F8F8F3]"
            }`}
          >
            SMAP (9km)
          </button>
        </div>
      </div>

      {/* Bottom Map Info Footer */}
      <div className="relative z-10 p-4 bg-gradient-to-t from-[#183D2C] via-[#183D2C]/80 to-transparent flex items-end justify-between text-white text-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9DBB78]"></span>
            <span className="font-semibold text-sm">{farm.name}</span>
            <span className="text-[11px] bg-[#39734C] px-2 py-0.5 rounded text-[#F8F8F3]">
              {farm.area_hectares} Hectares
            </span>
          </div>
          <p className="text-[11px] text-[#D2CEBE]">
            Cadastral boundary with Sentinel-2 Level-2A surface reflectance overlay.
          </p>
        </div>

        <div className="bg-[#112F21]/90 border border-[#9DBB78]/30 px-3 py-1.5 rounded-xl text-right">
          <div className="text-[10px] uppercase font-mono text-[#9DBB78]">Current Metrics</div>
          <div className="text-xs font-semibold text-white">
            NDVI: <span className="text-[#9DBB78]">{ndvi.toFixed(2)}</span> • Moisture:{" "}
            <span className="text-[#64B4DC]">{soilMoisturePercentile}th percentile</span>
          </div>
        </div>
      </div>
    </div>
  );
}
