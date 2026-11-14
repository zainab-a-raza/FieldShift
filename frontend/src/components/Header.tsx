"use client";

import React from "react";
import { useFarm } from "@/context/FarmContext";
import { MapPin, Droplets, Wheat, Sparkles, ChevronDown } from "lucide-react";
import Link from "next/link";

export function Header() {
  const { farms, selectedFarm, setSelectedFarm, isDemoMode } = useFarm();

  return (
    <header className="h-[72px] bg-white border-b border-[#E1E6DF] px-5 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Farm Switcher & Active Location */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#718078]">
              Current farm
            </span>
            <div className="relative inline-block text-left">
              <select
                aria-label="Select active farm holding"
                value={selectedFarm?.id || ""}
                onChange={(e) => {
                  const found = farms.find((f) => f.id === e.target.value);
                  if (found) setSelectedFarm(found);
                }}
                className="appearance-none bg-white hover:bg-[#F4F7F2] text-[#19382A] font-semibold text-sm rounded-lg py-1.5 pl-0 pr-8 focus:outline-none focus:ring-2 focus:ring-[#377C52] transition cursor-pointer"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.location_name.split(",")[0]})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#617367] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {selectedFarm && (
          <div className="hidden lg:flex items-center gap-3 text-xs text-[#718078] pl-4 border-l border-[#E1E6DF]">
            <span className="flex items-center gap-1 font-medium text-[#26352C]">
              <MapPin className="w-3.5 h-3.5 text-[#377C52]" />
              {selectedFarm.area_hectares} ha
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Wheat className="w-3.5 h-3.5 text-[#7EA760]" />
              Current: <strong className="text-[#26352C] capitalize">{selectedFarm.current_crop}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-[#377C52]" />
              <span className="capitalize">{selectedFarm.irrigation_type.replace("_", " ")}</span>
            </span>
          </div>
        )}
      </div>

      {/* Demo / Live Status & Quick Action */}
      <div className="flex items-center gap-3">
        {/* Transparent Provenance & Demo Mode Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-[#F3F7F1] px-3 py-1.5 rounded-full border border-[#DDE8DB] text-xs">
          <span className="w-2 h-2 rounded-full bg-[#62A05F]"></span>
          <span className="font-medium text-[#376046]">
            {isDemoMode ? "Preview data" : "Live data"}
          </span>
        </div>

        <Link
          href="/climate-simulator"
          className="flex items-center gap-1.5 bg-[#377C52] hover:bg-[#286342] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#9DBB78]" />
          <span>Simulate Stress</span>
        </Link>
      </div>
    </header>
  );
}
