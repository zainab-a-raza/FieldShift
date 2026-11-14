"use client";

import React from "react";
import { useFarm } from "@/context/FarmContext";
import { MapPin, Droplets, Wheat, ChevronDown, UserRound } from "lucide-react";

export function Header() {
  const { farms, selectedFarm, setSelectedFarm } = useFarm();

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

      {/* Farmer profile */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#143D2B] text-white">
          <UserRound className="h-4 w-4" />
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-xs font-semibold text-[#19382A]">Farmer profile</p>
          <p className="text-[10px] text-[#718078]">Farm manager</p>
        </div>
        <ChevronDown className="hidden h-4 w-4 text-[#718078] sm:block" />
      </div>
    </header>
  );
}
