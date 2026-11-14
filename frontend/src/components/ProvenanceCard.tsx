"use client";

import React, { useState } from "react";
import { ProvenanceRecord } from "@/types";
import { Info, Satellite, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from "lucide-react";

interface ProvenanceCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  provenance: ProvenanceRecord;
  badge?: string;
  badgeColor?: string;
  trendText?: string;
  isPositiveTrend?: boolean;
}

export function ProvenanceCard({
  title,
  value,
  unit,
  subtitle,
  provenance,
  badge,
  badgeColor = "bg-[#39734C] text-white",
  trendText,
  isPositiveTrend,
}: ProvenanceCardProps) {
  const [showProvenance, setShowProvenance] = useState(false);

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E8E2D2] shadow-xs hover:border-[#DDD6C3] transition flex flex-col justify-between">
      <div>
        {/* Header with Title and Optional Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-[#617367] uppercase tracking-wider">
            {title}
          </span>
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>

        {/* Primary Metric Value & Unit */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-3xl font-extrabold text-[#183D2C] tracking-tight font-serif">
            {value}
          </span>
          {unit && <span className="text-sm font-semibold text-[#617367]">{unit}</span>}
        </div>

        {/* Subtitle / context description */}
        {subtitle && (
          <p className="text-xs text-[#26352C] leading-relaxed mb-3">
            {subtitle}
          </p>
        )}

        {/* Trend Indicator */}
        {trendText && (
          <div className="flex items-center gap-1.5 text-xs font-medium mb-3">
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                isPositiveTrend
                  ? "bg-[#EAF4ED] text-[#2E6A44]"
                  : "bg-[#FDF2F0] text-[#B83E38]"
              }`}
            >
              {trendText}
            </span>
          </div>
        )}
      </div>

      {/* Provenance Accordion Toggle */}
      <div className="pt-3 border-t border-[#F0EDE4] mt-2">
        <button
          onClick={() => setShowProvenance(!showProvenance)}
          className="w-full flex items-center justify-between text-[11px] font-semibold text-[#39734C] hover:text-[#183D2C] transition"
        >
          <span className="flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-[#9DBB78]" />
            <span>Source: {provenance.source_name}</span>
          </span>
          {showProvenance ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#617367]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#617367]" />
          )}
        </button>

        {showProvenance && (
          <div className="mt-2.5 p-3 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3] text-[11px] text-[#26352C] space-y-1.5 animate-fadeIn">
            <div className="flex justify-between">
              <span className="text-[#617367]">Product:</span>
              <span className="font-medium text-right">{provenance.product_version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#617367]">Spatial Footprint:</span>
              <span className="font-mono font-medium">{provenance.spatial_resolution}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#617367]">Sensor Cadence:</span>
              <span>{provenance.temporal_resolution}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#617367]">Quality Flag:</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E8E2D2] text-[#183D2C]">
                {provenance.quality_flag}
              </span>
            </div>
            {provenance.notes && (
              <p className="text-[10px] text-[#617367] pt-1 border-t border-[#DDD6C3] italic">
                {provenance.notes}
              </p>
            )}
            {provenance.scientific_citation && (
              <p className="text-[9px] text-[#86958B] pt-0.5">
                Citation: {provenance.scientific_citation}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
