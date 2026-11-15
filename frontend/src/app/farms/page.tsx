"use client";

import React from "react";
import { useFarm } from "@/context/FarmContext";
import Link from "next/link";
import { MapPin, Plus, Wheat, Droplets, CheckCircle, ArrowRight, Layers, Shield } from "lucide-react";

export default function FarmsListPage() {
  const { farms, selectedFarm, setSelectedFarm, isLoading, error } = useFarm();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#183D2C] tracking-tight font-serif">
            Farm Holdings Portfolio
          </h2>
          <p className="text-xs text-[#617367] mt-1">
            Manage cadastral boundaries, historical cropping sequences, and active decision contexts.
          </p>
        </div>

        <Link
          href="/farms/new"
          className="flex items-center gap-2 bg-[#39734C] hover:bg-[#183D2C] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Holding</span>
        </Link>
      </div>

      {error && <div className="p-4 rounded-xl bg-[#FDF2F0] border border-[#E7B8B4] text-sm text-[#8B2F2A]">{error}</div>}

      {/* Farms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map((farm) => {
          const isSelected = selectedFarm?.id === farm.id;
          return (
            <div
              key={farm.id}
              className={`bg-[#FFFFFF] rounded-2xl p-6 border transition flex flex-col justify-between shadow-xs ${
                isSelected
                  ? "border-[#39734C] ring-2 ring-[#39734C]/20"
                  : "border-[#E8E2D2] hover:border-[#DDD6C3]"
              }`}
            >
              <div>
                {/* Header Strip with Select Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2 py-0.5 rounded-full">
                    {farm.area_hectares} Hectares
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#39734C] bg-[#F8F8F3] px-2 py-0.5 rounded-full border border-[#DDD6C3]">
                      <CheckCircle className="w-3.5 h-3.5 text-[#39734C]" />
                      Active Context
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-[#183D2C] font-serif mb-1">
                  {farm.name}
                </h3>
                <p className="text-xs text-[#617367] flex items-center gap-1 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-[#39734C]" />
                  {farm.location_name}
                </p>

                {/* Attributes Grid */}
                <div className="space-y-2 py-3 border-y border-[#F0EDE4] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#617367]">Current Crop:</span>
                    <span className="font-semibold text-[#183D2C] capitalize flex items-center gap-1">
                      <Wheat className="w-3.5 h-3.5 text-[#9DBB78]" />
                      {farm.current_crop}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#617367]">Irrigation:</span>
                    <span className="font-medium text-[#26352C] capitalize">
                      {farm.irrigation_type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#617367]">Priority Focus:</span>
                    <span className="font-medium text-[#26352C] capitalize">
                      {farm.primary_priority.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#617367]">Coordinates:</span>
                    <span className="font-mono text-[11px] text-[#617367]">
                      {farm.latitude.toFixed(3)}°, {farm.longitude.toFixed(3)}°
                    </span>
                  </div>
                </div>

                {/* Historical sequence preview */}
                <div className="mt-3">
                  <span className="text-[10px] text-[#617367] uppercase font-semibold block mb-1.5">
                    Historical Sequence:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {farm.previous_crop_sequence.map((crop, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-[#F8F8F3] text-[#26352C] px-2 py-0.5 rounded border border-[#E8E2D2] capitalize"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-4 border-t border-[#F0EDE4] flex items-center justify-between">
                <button
                  onClick={() => setSelectedFarm(farm)}
                  disabled={isSelected}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
                    isSelected
                      ? "text-[#617367] bg-[#F8F8F3] cursor-default"
                      : "text-white bg-[#39734C] hover:bg-[#183D2C]"
                  }`}
                >
                  {isSelected ? "Currently Selected" : "Set as Active"}
                </button>

                <Link
                  href="/dashboard"
                  onClick={() => setSelectedFarm(farm)}
                  className="text-xs font-semibold text-[#39734C] hover:text-[#183D2C] flex items-center gap-1"
                >
                  <span>Analyze</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
