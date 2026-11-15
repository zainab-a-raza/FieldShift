"use client";

import React from "react";
import { useFarm } from "@/context/FarmContext";
import { MapPin, Droplets, Wheat, ShieldCheck, AlertCircle, Sparkles, ChevronDown } from "lucide-react";
import Link from "next/link";

export function Header() {
  const { farms, selectedFarm, setSelectedFarm, isDemoMode, health, error } = useFarm();

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#E8E2D2] px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Farm Switcher & Active Location */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#617367] uppercase tracking-wider">
              Active Holding:
            </span>
            <div className="relative inline-block text-left">
              <select
                aria-label="Select active farm holding"
                value={selectedFarm?.id || ""}
                onChange={(e) => {
                  const found = farms.find((f) => f.id === e.target.value);
                  if (found) setSelectedFarm(found);
                }}
                className="appearance-none bg-[#F8F8F3] hover:bg-[#EFECE1] border border-[#DDD6C3] text-[#26352C] font-semibold text-sm rounded-xl py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-[#39734C] transition cursor-pointer"
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
          <div className="hidden lg:flex items-center gap-3 text-xs text-[#617367] pl-4 border-l border-[#E8E2D2]">
            <span className="flex items-center gap-1 font-medium text-[#26352C]">
              <MapPin className="w-3.5 h-3.5 text-[#39734C]" />
              {selectedFarm.area_hectares} ha
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Wheat className="w-3.5 h-3.5 text-[#9DBB78]" />
              Current: <strong className="text-[#26352C] capitalize">{selectedFarm.current_crop}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-[#39734C]" />
              <span className="capitalize">{selectedFarm.irrigation_type.replace("_", " ")}</span>
            </span>
          </div>
        )}
      </div>

      {/* Demo / Live Status & Quick Action */}
      <div className="flex items-center gap-3">
        {/* Transparent Provenance & Demo Mode Badge */}
        <div className="flex items-center gap-2 bg-[#F8F8F3] px-3 py-1.5 rounded-full border border-[#DDD6C3] text-xs">
          <span className={`w-2 h-2 rounded-full ${error ? "bg-[#B83E38]" : isDemoMode ? "bg-[#D97706]" : "bg-[#39734C]"}`}></span>
          <span className="font-medium text-[#26352C]">
            {error ? "Backend unavailable" : isDemoMode ? "Demo mode" : "Live mode with explicit fallbacks"}
          </span>
          <span className="text-[10px] bg-[#E8E2D2] text-[#26352C] px-1.5 py-0.5 rounded font-mono font-medium">
            {health?.data_mode || "status unknown"}
          </span>
        </div>

        <Link
          href="/climate-simulator"
          className="flex items-center gap-1.5 bg-[#183D2C] hover:bg-[#204936] text-[#F8F8F3] px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#9DBB78]" />
          <span>Simulate Stress</span>
        </Link>
      </div>
    </header>
  );
}
