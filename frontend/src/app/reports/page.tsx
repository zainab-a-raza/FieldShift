"use client";

import React, { useEffect, useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { fetchReport } from "@/lib/api";
import { FileText, Printer, Download, CheckCircle2, ShieldCheck, MapPin, Wheat, Droplets } from "lucide-react";

export default function ReportsPage() {
  const { selectedFarm } = useFarm();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedFarm) return;
    setLoading(true);
    fetchReport(selectedFarm.id)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [selectedFarm]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !report || !selectedFarm) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#39734C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-[#617367]">
          Assembling Agricultural Decision Report...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Action Header (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-extrabold text-[#183D2C] tracking-tight font-serif">
            Agricultural Decision Report
          </h2>
          <p className="text-xs text-[#617367]">
            Official exportable decision brief for farm advisors, agronomists, and agricultural credit assessments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#39734C] hover:bg-[#183D2C] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-[#FFFFFF] rounded-2xl p-8 lg:p-10 border border-[#E8E2D2] shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Report Official Banner */}
        <div className="flex items-start justify-between border-b-2 border-[#183D2C] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2.5 py-0.5 rounded-full">
                FieldShift Decision Support Brief
              </span>
              <span className="text-xs text-[#617367] font-mono">
                NASA Space Apps Challenge 2026
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#183D2C] font-serif">
              {report.farm_profile.name}
            </h1>
            <p className="text-xs text-[#617367] mt-1">
              Location: {report.farm_profile.location} • Centroid: {report.farm_profile.coordinates}
            </p>
          </div>

          <div className="text-right text-xs text-[#617367] space-y-1">
            <span className="font-mono font-bold text-[#183D2C] block">
              {report.report_id}
            </span>
            <span>Generated: {report.generated_at}</span>
          </div>
        </div>

        {/* Section 1: Farm Characteristics */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#39734C] border-b border-[#F0EDE4] pb-1">
            1. Holding Operational Profile
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3]">
              <span className="text-[#617367] block text-[11px]">Area:</span>
              <strong className="text-sm text-[#183D2C]">{report.farm_profile.area_hectares} ha</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3]">
              <span className="text-[#617367] block text-[11px]">Current Crop:</span>
              <strong className="text-sm text-[#183D2C] capitalize">{report.farm_profile.current_crop}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3]">
              <span className="text-[#617367] block text-[11px]">Irrigation Regime:</span>
              <strong className="text-sm text-[#183D2C] capitalize">
                {report.farm_profile.irrigation_regime.replace("_", " ")}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3]">
              <span className="text-[#617367] block text-[11px]">Management Focus:</span>
              <strong className="text-sm text-[#183D2C] capitalize">
                {report.farm_profile.primary_management_goal.replace("_", " ")}
              </strong>
            </div>
          </div>
        </div>

        {/* Section 2: Environmental Stress Diagnostics */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#39734C] border-b border-[#F0EDE4] pb-1">
            2. Satellite & Soil Diagnostics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3]">
              <span className="text-[#617367] block text-[11px]">Annual Precipitation:</span>
              <strong className="text-sm text-[#183D2C]">{report.environmental_diagnostics.annual_rainfall_mm} mm</strong>
              <span className="text-[10px] text-[#617367] block">NASA POWER</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3]">
              <span className="text-[#617367] block text-[11px]">Heat Stress Exposure:</span>
              <strong className="text-sm text-[#183D2C]">{report.environmental_diagnostics.hot_days_gt_35c} days (≥35°C)</strong>
              <span className="text-[10px] text-[#617367] block">MERRA-2 Model</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3]">
              <span className="text-[#617367] block text-[11px]">Soil Moisture:</span>
              <strong className="text-sm text-[#183D2C]">{report.environmental_diagnostics.surface_soil_moisture}</strong>
              <span className="text-[10px] text-[#617367] block">NASA SMAP (9km)</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3]">
              <span className="text-[#617367] block text-[11px]">Topsoil pH / SOC:</span>
              <strong className="text-sm text-[#183D2C]">
                {report.environmental_diagnostics.soil_ph} pH • {report.environmental_diagnostics.soil_organic_carbon_g_kg} g/kg
              </strong>
              <span className="text-[10px] text-[#617367] block">SoilGrids 2.0</span>
            </div>
          </div>
        </div>

        {/* Section 3: Recommended Rotation Strategy */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#39734C] border-b border-[#F0EDE4] pb-1">
            3. Recommended Adaptive Rotation Strategy
          </h3>
          <div className="p-5 rounded-2xl bg-[#EAF4ED] border border-[#BCE0C8] space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-[#183D2C] font-serif">
                {report.rotation_recommendations.recommended_strategy_title}
              </h4>
              <span className="text-sm font-bold text-[#2E6A44] font-serif bg-white px-3 py-1 rounded-full border border-[#BCE0C8]">
                Suitability: {report.rotation_recommendations.recommended_score}/100
              </span>
            </div>
            <p className="text-xs text-[#204936] leading-relaxed">
              This strategy introduces drought-tolerant pulses and deep rooting systems to address root-zone moisture deficits observed in NASA SMAP data while reversing soil organic carbon depletion.
            </p>
          </div>
        </div>

        {/* Section 4: All 3 Strategies Comparative Overview */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#39734C] border-b border-[#F0EDE4] pb-1">
            4. Comparative Strategy Overview
          </h3>
          <div className="space-y-2 text-xs">
            {report.rotation_recommendations.strategies_overview.map((strat: any, i: number) => (
              <div key={i} className="p-3.5 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3] flex items-center justify-between">
                <div>
                  <strong className="text-sm text-[#183D2C] block">{strat.title}</strong>
                  <span className="text-[#617367]">{strat.crop_sequence.join(" → ")}</span>
                </div>
                <div className="text-right">
                  <span className="font-serif font-bold text-base text-[#183D2C]">{strat.overall_score}</span>
                  <span className="text-[10px] text-[#617367] block">Score</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Scientific Provenance Citations */}
        <div className="pt-4 border-t border-[#F0EDE4] text-xs text-[#617367] space-y-1.5">
          <span className="font-bold text-[#26352C] block text-[11px] uppercase tracking-wider">
            Scientific Provenance & Citations:
          </span>
          {report.scientific_provenance_citations.map((cite: string, i: number) => (
            <p key={i} className="text-[11px] leading-relaxed">
              [{i + 1}] {cite}
            </p>
          ))}
          <p className="text-[10px] italic pt-2 text-[#86958B]">
            FieldShift is designed to support farmer judgment rather than replace local agricultural expertise.
          </p>
        </div>
      </div>
    </div>
  );
}
