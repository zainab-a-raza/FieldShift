
"use client";

import React, { useEffect, useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { fetchReport } from "@/lib/api";
import {
  Printer,
  MapPin,
  Sprout,
  Droplets,
  Thermometer,
  Leaf,
  FileText,
  ShieldCheck,
  RefreshCw,
  Info,
} from "lucide-react";

export default function ReportsPage() {
  const { selectedFarm } = useFarm();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadReport = async () => {
      if (!selectedFarm) {
        setReport(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        setReport(null);

        const result = await fetchReport(selectedFarm.id);

        if (!cancelled) {
          setReport(result);
        }
      } catch (err) {
        console.error("Failed to generate farm report:", err);

        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [selectedFarm]);

  const handlePrint = () => {
    window.print();
  };

  const formatLabel = (value: string | undefined | null) => {
    if (!value) return "Not available";

    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Loading State
  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#39734C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#617367]">
          Preparing your farm report...
        </p>
      </div>
    );
  }

  // No Farm Selected
  if (!selectedFarm) {
    return (
      <div className="bg-white border border-[#E8E2D2] rounded-2xl p-10 text-center">
        <FileText className="w-10 h-10 text-[#A5B2A5] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#183D2C]">
          No farm selected
        </h3>
        <p className="text-sm text-[#617367] mt-2">
          Select a farm to generate its agricultural report.
        </p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white border border-[#E8E2D2] rounded-2xl p-10 text-center">
        <Info className="w-10 h-10 text-[#A36B43] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#183D2C]">
          Couldn't generate your report
        </h3>
        <p className="text-sm text-[#617367] mt-2 mb-5">
          Something went wrong while retrieving your farm information.
          Please try again.
        </p>
        <button
          onClick={() => {
            setError(false);
            setLoading(true);
            fetchReport(selectedFarm.id)
              .then((result) => {
                setReport(result);
              })
              .catch((err) => {
                console.error(err);
                setError(true);
              })
              .finally(() => setLoading(false));
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#39734C] text-white text-sm font-semibold hover:bg-[#285C3A] transition"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  if (!report) return null;

  const farm = report.farm_profile;
  const environment = report.environmental_diagnostics;
  const recommendations = report.rotation_recommendations;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {report.report_status !== "live" && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>{report.report_status === "demo" ? "Sample data" : "Mixed data"}:</strong> {report.data_messages?.join(" ") || "Some values are not live observations."}</div>}

      {/* Page Header - Hidden in Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-[#EAF4ED] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#39734C]" />
            </div>
            <span className="text-sm font-semibold text-[#39734C]">
              FieldShift Reports
            </span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#183D2C] font-serif">
            Your Farm Report
          </h2>

          <p className="text-sm text-[#617367] mt-1">
            A summary of your farm conditions and recommended crop rotations.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 bg-[#39734C] hover:bg-[#285C3A] text-white px-5 py-3 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-2xl border border-[#E8E2D2] shadow-sm p-5 sm:p-8 lg:p-10 space-y-8 print:border-none print:shadow-none print:p-0 print:space-y-6">

        {/* Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-[#E8E2D2]">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#EAF4ED] text-[#39734C] px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Sprout className="w-3.5 h-3.5" />
              FieldShift Farm Report
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183D2C] font-serif">
              {farm?.name || "Farm Report"}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-[#617367]">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{farm?.location || "Location unavailable"}</span>
            </div>

            {farm?.coordinates && (
              <p className="text-xs text-[#849085] mt-1">
                Coordinates: {farm.coordinates}
              </p>
            )}
          </div>

          <div className="sm:text-right text-xs text-[#849085] space-y-1">
            <p className="font-semibold text-[#183D2C]">
              Report ID: {report.report_id}
            </p>
            <p>Generated: {report.generated_at}</p>
          </div>
        </div>

        {/* Section 1: Farm Overview */}
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-[#183D2C] font-serif">
              Your Farm at a Glance
            </h3>
            <p className="text-sm text-[#617367] mt-1">
              Basic information about your farm and its current management.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#F8F8F3] border border-[#E8E2D2]">
              <p className="text-xs text-[#849085] mb-2">Farm Area</p>
              <p className="text-xl font-bold text-[#183D2C]">
                {farm?.area_hectares ?? "—"}
              </p>
              <p className="text-xs text-[#617367] mt-1">Hectares</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F8F3] border border-[#E8E2D2]">
              <p className="text-xs text-[#849085] mb-2">Current Crop</p>
              <p className="text-base font-bold text-[#183D2C] capitalize">
                {farm?.current_crop || "—"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F8F3] border border-[#E8E2D2]">
              <p className="text-xs text-[#849085] mb-2">Irrigation</p>
              <p className="text-base font-bold text-[#183D2C]">
                {formatLabel(farm?.irrigation_regime)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F8F3] border border-[#E8E2D2]">
              <p className="text-xs text-[#849085] mb-2">Main Goal</p>
              <p className="text-base font-bold text-[#183D2C]">
                {formatLabel(farm?.primary_management_goal)}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Environmental Conditions */}
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-[#183D2C] font-serif">
              Farm Conditions
            </h3>
            <p className="text-sm text-[#617367] mt-1">
              Environmental and soil information associated with your farm.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Rainfall */}
            <div className="p-4 rounded-xl border border-[#E8E2D2] flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF2F8] flex items-center justify-center shrink-0">
                <Droplets className="w-5 h-5 text-[#5485A5]" />
              </div>

              <div>
                <p className="text-xs text-[#849085]">Annual Rainfall</p>
                <p className="text-xl font-bold text-[#183D2C] mt-1">
                  {environment?.annual_rainfall_mm ?? "—"}
                  <span className="text-sm font-medium text-[#617367] ml-1">
                    mm
                  </span>
                </p>
                <p className="text-xs text-[#849085] mt-1">
                  NASA POWER
                </p>
              </div>
            </div>

            {/* Heat */}
            <div className="p-4 rounded-xl border border-[#E8E2D2] flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F9EEE5] flex items-center justify-center shrink-0">
                <Thermometer className="w-5 h-5 text-[#B87848]" />
              </div>

              <div>
                <p className="text-xs text-[#849085]">Hot Days</p>
                <p className="text-xl font-bold text-[#183D2C] mt-1">
                  {environment?.hot_days_gt_35c ?? "—"}
                  <span className="text-sm font-medium text-[#617367] ml-1">
                    days
                  </span>
                </p>
                <p className="text-xs text-[#849085] mt-1">
                  Days with temperatures above 35°C · MERRA-2
                </p>
              </div>
            </div>

            {/* Soil Moisture */}
            <div className="p-4 rounded-xl border border-[#E8E2D2] flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF2F8] flex items-center justify-center shrink-0">
                <Droplets className="w-5 h-5 text-[#5485A5]" />
              </div>

              <div>
                <p className="text-xs text-[#849085]">Surface Soil Moisture</p>
                <p className="text-xl font-bold text-[#183D2C] mt-1">
                  {environment?.surface_soil_moisture ?? "—"}
                </p>
                <p className="text-xs text-[#849085] mt-1">
                  NASA SMAP · 9 km resolution
                </p>
              </div>
            </div>

            {/* Soil Properties */}
            <div className="p-4 rounded-xl border border-[#E8E2D2] flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF4ED] flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5 text-[#39734C]" />
              </div>

              <div>
                <p className="text-xs text-[#849085]">Soil Properties</p>
                <p className="text-lg font-bold text-[#183D2C] mt-1">
                  {environment?.soil_ph ?? "—"} pH
                </p>
                <p className="text-xs text-[#617367] mt-1">
                  Organic Carbon:{" "}
                  {environment?.soil_organic_carbon_g_kg ?? "—"} g/kg
                </p>
                <p className="text-xs text-[#849085] mt-1">
                  SoilGrids 2.0
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Section 3: Recommended Rotation */}
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-[#183D2C] font-serif">
              Recommended Crop Rotation
            </h3>
            <p className="text-sm text-[#617367] mt-1">
              The rotation currently ranked highest for your farm.
            </p>
          </div>

          <div className="bg-[#EAF4ED] border border-[#C8DDCC] rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#39734C] mb-2">
                  TOP RECOMMENDATION
                </p>

                <h4 className="text-xl font-bold text-[#183D2C] font-serif">
                  {recommendations?.recommended_strategy_title || "No recommendation available"}
                </h4>
              </div>

              <div className="bg-white border border-[#C8DDCC] rounded-xl px-4 py-3 sm:text-center">
                <p className="text-xs text-[#617367]">Suitability Score</p>
                <p className="text-2xl font-extrabold text-[#39734C]">
                  {recommendations?.recommended_score ?? "—"}
                  <span className="text-sm font-medium">/100</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Compare Rotations */}
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-[#183D2C] font-serif">
              Compare Your Options
            </h3>
            <p className="text-sm text-[#617367] mt-1">
              See how the available crop rotation strategies compare.
            </p>
          </div>

          <div className="space-y-3">
            {recommendations?.strategies_overview?.length > 0 ? (
              recommendations.strategies_overview.map(
                (strategy: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-[#E8E2D2] bg-[#F8F8F3]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white border border-[#E8E2D2] flex items-center justify-center text-xs font-bold text-[#39734C] shrink-0">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#183D2C]">
                            {strategy.title}
                          </h4>

                          <p className="text-xs text-[#617367] mt-1 leading-relaxed">
                            {strategy.crop_sequence?.join(" → ") || "Crop sequence unavailable"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-[#183D2C]">
                          {strategy.overall_score ?? "—"}
                        </p>
                        <p className="text-[10px] text-[#849085]">
                          Score
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )
            ) : (
              <p className="text-sm text-[#617367]">
                No rotation comparisons are available.
              </p>
            )}
          </div>
        </section>

        {/* Section 5: Sources and Methodology */}
        <section className="pt-5 border-t border-[#E8E2D2] space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#39734C]" />
            <h3 className="text-base font-bold text-[#183D2C]">
              Data Sources & References
            </h3>
          </div>

          <p className="text-xs text-[#617367] leading-relaxed">
            The environmental information in this report is based on the
            datasets and references listed below.
          </p>

          <div className="space-y-2">
            {report.scientific_provenance_citations?.length > 0 ? (
              report.scientific_provenance_citations.map(
                (citation: string, index: number) => (
                  <p
                    key={index}
                    className="text-xs text-[#526156] leading-relaxed"
                  >
                    <span className="font-semibold text-[#39734C]">
                      [{index + 1}]
                    </span>{" "}
                    {citation}
                  </p>
                )
              )
            ) : (
              <p className="text-xs text-[#849085]">
                No references are available for this report.
              </p>
            )}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="bg-[#F5F3E9] rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#8A774D] shrink-0 mt-0.5" />

          <div>
            <p className="text-sm font-bold text-[#51472F]">
              Important Note
            </p>
            <p className="text-xs text-[#6D634A] leading-relaxed mt-1">
              This report provides data-informed guidance to support
              agricultural decisions. Satellite observations and environmental
              estimates may not reflect every condition within an individual
              field. Recommendations should be considered alongside local
              knowledge, soil testing, and advice from agricultural experts.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E8E2D2] flex flex-col sm:flex-row justify-between gap-2 text-[11px] text-[#849085]">
          <p>Generated by FieldShift · NASA Space Apps Challenge 2026</p>
          <p>Supporting smarter, more resilient farming decisions.</p>
        </div>

      </div>
    </div>
  );
}
