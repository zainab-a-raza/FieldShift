"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFarm } from "@/context/FarmContext";
import { createFarm } from "@/lib/api";
import { MapPin, Sprout, Droplets, Layers, CheckCircle2, ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";

export default function NewFarmPage() {
  const router = useRouter();
  const { refreshFarms, setSelectedFarm } = useFarm();

  const [formData, setFormData] = useState({
    name: "",
    location_name: "",
    latitude: 39.0,
    longitude: -98.0,
    area_hectares: 50.0,
    current_crop: "wheat",
    previous_crop_sequence: "wheat, fallow, wheat",
    irrigation_type: "rainfed",
    primary_priority: "balanced",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const prevSeq = formData.previous_crop_sequence
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      // Construct a valid GeoJSON Polygon around the coordinate centroid
      const lat = Number(formData.latitude);
      const lon = Number(formData.longitude);
      const delta = 0.005; // ~500m box
      const geojson = {
        type: "Polygon",
        coordinates: [
          [
            [lon - delta, lat - delta],
            [lon + delta, lat - delta],
            [lon + delta, lat + delta],
            [lon - delta, lat + delta],
            [lon - delta, lat - delta],
          ],
        ],
      };

      const payload = {
        name: formData.name,
        location_name: formData.location_name,
        latitude: lat,
        longitude: lon,
        area_hectares: Number(formData.area_hectares),
        boundaries_geojson: geojson,
        current_crop: formData.current_crop.toLowerCase(),
        previous_crop_sequence: prevSeq,
        irrigation_type: formData.irrigation_type,
        primary_priority: formData.primary_priority,
      };

      const newFarm = await createFarm(payload);
      await refreshFarms();
      setSelectedFarm(newFarm);
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to register holding. Please verify inputs or ensure backend server is accessible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Link
          href="/farms"
          className="p-2 rounded-xl bg-[#FFFFFF] border border-[#E8E2D2] text-[#617367] hover:text-[#183D2C] transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-[#183D2C] tracking-tight font-serif">
            Register New Holding
          </h2>
          <p className="text-xs text-[#617367]">
            Connect your field boundary to NASA agroclimatic grids and digital soil models.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#FDF2F0] border border-[#E8A5A1] text-xs text-[#932C28]">
          {errorMsg}
        </div>
      )}

      {/* Farm Registration Form */}
      <form onSubmit={handleSubmit} className="bg-[#FFFFFF] rounded-2xl p-6 lg:p-8 border border-[#E8E2D2] shadow-xs space-y-6">
        {/* Section 1: Farm Identification */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#39734C] flex items-center gap-2">
            <Globe className="w-4 h-4" />
            1. Holding Identity & Region
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#26352C] mb-1">
                Holding / Farm Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. North Ridge Agro Field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD6C3] bg-[#F8F8F3] text-[#26352C] focus:outline-none focus:ring-2 focus:ring-[#39734C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#26352C] mb-1">
                Geographic Location *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lincoln County, Nebraska, USA"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD6C3] bg-[#F8F8F3] text-[#26352C] focus:outline-none focus:ring-2 focus:ring-[#39734C]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Spatial Coordinates & Area */}
        <div className="space-y-4 pt-4 border-t border-[#F0EDE4]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#39734C] flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            2. Coordinates & Cadastral Area
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#26352C] mb-1">
                Latitude (°N) *
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD6C3] bg-[#F8F8F3] text-[#26352C] focus:outline-none focus:ring-2 focus:ring-[#39734C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#26352C] mb-1">
                Longitude (°E) *
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD6C3] bg-[#F8F8F3] text-[#26352C] focus:outline-none focus:ring-2 focus:ring-[#39734C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#26352C] mb-1">
                Area (Hectares) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                required
                value={formData.area_hectares}
                onChange={(e) => setFormData({ ...formData, area_hectares: Number(e.target.value) })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD6C3] bg-[#F8F8F3] text-[#26352C] focus:outline-none focus:ring-2 focus:ring-[#39734C]"
              />
            </div>
          </div>
          <p className="text-[11px] text-[#617367]">
            * Coordinates will be bound to NASA POWER 0.5° weather grids and ISRIC 250m soil grids. Field boundary will be stored as a GeoJSON polygon.
          </p>
        </div>

        {/* Section 3: Cropping & Management History */}
        <div className="space-y-4 pt-4 border-t border-[#F0EDE4]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#39734C] flex items-center gap-2">
            <Sprout className="w-4 h-4" />
            3. Cropping History & Irrigation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#26352C] mb-1">
                Currently Planted Crop *
              </label>
              <select
                value={formData.current_crop}
                onChange={(e) => setFormData({ ...formData, current_crop: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD6C3] bg-[#F8F8F3] text-[#26352C] focus:outline-none focus:ring-2 focus:ring-[#39734C]"
              >
                <option value="wheat">Wheat (Cereal)</option>
                <option value="maize">Maize / Corn</option>
                <option value="rice">Paddy Rice</option>
                <option value="soybean">Soybean (Legume)</option>
                <option value="chickpea">Chickpea (Legume)</option>
                <option value="sorghum">Sorghum (Drought Hardy)</option>
                <option value="millet">Pearl Millet</option>
                <option value="mustard">Mustard / Rapeseed</option>
                <option value="alfalfa">Alfalfa / Lucerne</option>
                <option value="mung_bean">Mung Bean (Catch Crop)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#26352C] mb-1">
                Irrigation Infrastructure *
              </label>
              <select
                value={formData.irrigation_type}
                onChange={(e) => setFormData({ ...formData, irrigation_type: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD6C3] bg-[#F8F8F3] text-[#26352C] focus:outline-none focus:ring-2 focus:ring-[#39734C]"
              >
                <option value="rainfed">Purely Rainfed (No Supplemental Irrigation)</option>
                <option value="drip">Precision Drip Irrigation</option>
                <option value="sprinkler">Center Pivot / Sprinkler</option>
                <option value="groundwater_well">Deep Groundwater Tube-well</option>
                <option value="flood">Canal / Surface Flood</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26352C] mb-1">
              Historical Crop Sequence (Comma-Separated, Oldest to Recent)
            </label>
            <input
              type="text"
              value={formData.previous_crop_sequence}
              onChange={(e) => setFormData({ ...formData, previous_crop_sequence: e.target.value })}
              placeholder="e.g. wheat, fallow, wheat, soybean"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD6C3] bg-[#F8F8F3] text-[#26352C] focus:outline-none focus:ring-2 focus:ring-[#39734C]"
            />
          </div>
        </div>

        {/* Section 4: Farming Priority */}
        <div className="space-y-4 pt-4 border-t border-[#F0EDE4]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#39734C] flex items-center gap-2">
            <Layers className="w-4 h-4" />
            4. Strategic Management Goal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "water_resilience",
                title: "Water Resilience",
                desc: "Minimizes drought exposure and lowers groundwater draw.",
              },
              {
                id: "soil_restoration",
                title: "Soil Restoration",
                desc: "Maximizes biological nitrogen fixation and organic carbon.",
              },
              {
                id: "balanced",
                title: "Balanced Agronomic",
                desc: "Balances crop diversity, market liquidity, and environmental health.",
              },
            ].map((prio) => (
              <label
                key={prio.id}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  formData.primary_priority === prio.id
                    ? "bg-[#EAF4ED] border-[#39734C] ring-2 ring-[#39734C]/20"
                    : "bg-[#F8F8F3] border-[#DDD6C3] hover:bg-[#EFECE1]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#183D2C]">{prio.title}</span>
                    <input
                      type="radio"
                      name="priority"
                      value={prio.id}
                      checked={formData.primary_priority === prio.id}
                      onChange={() => setFormData({ ...formData, primary_priority: prio.id })}
                      className="text-[#39734C] focus:ring-[#39734C]"
                    />
                  </div>
                  <p className="text-[11px] text-[#617367] leading-relaxed">{prio.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-[#F0EDE4] flex items-center justify-end gap-3">
          <Link
            href="/farms"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#617367] hover:text-[#26352C] transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#39734C] hover:bg-[#183D2C] text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            {isSubmitting ? (
              <span>Connecting NASA Feeds...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Holding & Launch Diagnostics</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
