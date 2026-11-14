"use client";

import React, { useEffect, useState } from "react";
import { fetchDataSources } from "@/lib/api";
import { DataSource } from "@/types";
import { Database, ExternalLink, ShieldCheck, CheckCircle2, Satellite, Sparkles, Info } from "lucide-react";

export default function DataSourcesPage() {
  const [data, setData] = useState<{ sources: DataSource[]; transparency_principles: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataSources()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#39734C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-[#617367]">
          Loading Data Lineage Registry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2.5 py-0.5 rounded-full">
            Scientific Provenance & Auditability
          </span>
          <span className="text-xs text-[#617367]">NASA Space Apps 2026</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#183D2C] tracking-tight font-serif">
          Data Sources, Missions & Provenance
        </h2>
        <p className="text-xs text-[#617367] mt-1 max-w-3xl">
          Complete transparent disclosure of Earth observation instruments, mission versions,
          spatial resolutions, and algorithmic modeling principles utilized in FieldShift.
        </p>
      </div>

      {/* Core Principles Alert */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#183D2C] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#39734C]" />
          FieldShift Scientific Transparency Guarantees
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#26352C]">
          {data.transparency_principles.map((p, i) => (
            <div key={i} className="p-3 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#39734C] shrink-0 mt-0.5" />
              <p className="leading-relaxed">{p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.sources.map((src) => (
          <div
            key={src.id}
            className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs flex flex-col justify-between hover:border-[#DDD6C3] transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2 py-0.5 rounded-full">
                  {src.agency}
                </span>
                <span className="text-[10px] font-mono text-[#2E6A44] font-semibold bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#BCE0C8]">
                  {src.status}
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#183D2C] font-serif mb-1">
                {src.name}
              </h3>
              <p className="text-xs font-mono text-[#617367] mb-3">
                {src.product_name}
              </p>

              <p className="text-xs text-[#26352C] leading-relaxed mb-4">
                {src.description}
              </p>

              <div className="space-y-1.5 py-3 border-t border-[#F0EDE4] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#617367]">Spatial Footprint:</span>
                  <span className="font-mono font-semibold text-[#183D2C]">{src.resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#617367]">Temporal Frequency:</span>
                  <span className="font-medium text-[#26352C]">{src.cadence}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0EDE4] mt-3">
              <a
                href={src.documentation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-xs font-semibold text-[#39734C] hover:text-[#183D2C] transition"
              >
                <span>Read Official Mission Documentation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
