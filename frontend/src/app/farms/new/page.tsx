"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFarm } from "@/context/FarmContext";
import { createFarm } from "@/lib/api";
import { Sprout, Layers, CheckCircle2, ArrowLeft, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { FarmLocationPicker } from "@/components/FarmLocationPicker";

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
    boundaries_geojson: null as {
      type: "Polygon";
      coordinates: number[][][];
    } | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { title: "Farm identity", description: "Name and region" },
    { title: "Field location", description: "Map and area" },
    { title: "Farm practice", description: "Crops and irrigation" },
    { title: "Your priority", description: "Planning goal" },
  ];

  const handleNext = () => {
    setErrorMsg("");
    if (currentStep === 1 && (!formData.name.trim() || !formData.location_name.trim())) {
      setErrorMsg("Add your holding name and geographic location to continue.");
      return;
    }
    if (currentStep === 2 && !formData.boundaries_geojson) {
      setErrorMsg("Click the map to select your field location before continuing.");
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, steps.length));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== steps.length) {
      handleNext();
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (!formData.boundaries_geojson) {
        setErrorMsg("Please click the map to select your field location before saving.");
        setIsSubmitting(false);
        return;
      }

      const prevSeq = formData.previous_crop_sequence
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const lat = Number(formData.latitude);
      const lon = Number(formData.longitude);

      const payload = {
        name: formData.name,
        location_name: formData.location_name,
        latitude: lat,
        longitude: lon,
        area_hectares: Number(formData.area_hectares),
        boundaries_geojson: formData.boundaries_geojson,
        current_crop: formData.current_crop.toLowerCase(),
        previous_crop_sequence: prevSeq,
        irrigation_type: formData.irrigation_type,
        primary_priority: formData.primary_priority,
      };

      const newFarm = await createFarm(payload);
      await refreshFarms();
      setSelectedFarm(newFarm);
      router.push("/dashboard");
    } catch (err) {
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

      <div className="rounded-2xl border border-[#E8E2D2] bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#39734C]">
              Step {currentStep} of {steps.length}
            </p>
            <p className="mt-1 text-sm font-bold text-[#183D2C]">{steps[currentStep - 1].title}</p>
          </div>
          <p className="text-right text-[11px] text-[#617367]">{steps[currentStep - 1].description}</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => (
            <div key={step.title}>
              <div className={`h-1.5 rounded-full ${index < currentStep ? "bg-[#39734C]" : "bg-[#E8EDE6]"}`} />
              <p className={`mt-2 hidden text-[10px] font-semibold sm:block ${index + 1 === currentStep ? "text-[#39734C]" : "text-[#9AA69D]"}`}>
                {index + 1}. {step.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Farm Registration Form */}
      <form onSubmit={handleSubmit} className="bg-[#FFFFFF] rounded-2xl p-6 lg:p-8 border border-[#E8E2D2] shadow-xs space-y-6">
        {/* Section 1: Farm Identification */}
        {currentStep === 1 && <div className="space-y-4">
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
        </div>}

        {/* Section 2: Field location & area */}
        {currentStep === 2 && <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#39734C] flex items-center gap-2">
            <Globe className="w-4 h-4" />
            2. Select your field on the map
          </h3>
          <FarmLocationPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            areaHectares={formData.area_hectares}
            onChange={(selection) => setFormData({ ...formData, latitude: selection.latitude, longitude: selection.longitude, area_hectares: selection.areaHectares, boundaries_geojson: selection.boundariesGeojson })}
          />
          <p className="text-[11px] text-[#617367]">
            Your map selection sets the farm center, area, and GeoJSON boundary automatically. Weather and soil models will use the selected location.
          </p>
        </div>}

        {/* Section 3: Cropping & Management History */}
        {currentStep === 3 && <div className="space-y-4">
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
        </div>}

        {/* Section 4: Farming Priority */}
        {currentStep === 4 && <div className="space-y-4">
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
        </div>}

        {/* Submit Actions */}
        <div className="pt-6 border-t border-[#F0EDE4] flex items-center justify-between gap-3">
          <Link
            href={currentStep === 1 ? "/farms" : "#"}
            onClick={(event) => {
              if (currentStep > 1) {
                event.preventDefault();
                setCurrentStep((step) => step - 1);
                setErrorMsg("");
              }
            }}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-[#617367] hover:text-[#26352C] transition"
          >
            <ChevronLeft className="h-4 w-4" />
            {currentStep === 1 ? "Cancel" : "Back"}
          </Link>
          {currentStep < steps.length ? (
            <button type="button" onClick={handleNext} className="inline-flex items-center gap-2 bg-[#39734C] hover:bg-[#183D2C] text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition">
              <span>Next step</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
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
          )}
        </div>
      </form>
    </div>
  );
}
