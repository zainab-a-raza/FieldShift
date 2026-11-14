
"use client";

import React, { useEffect, useState } from "react";
import { fetchDataSources } from "@/lib/api";
import { DataSource } from "@/types";
import {
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Database,
  RefreshCw,
  Info,
} from "lucide-react";

interface DataSourcesResponse {
  sources: DataSource[];
  transparency_principles: string[];
}

export default function DataSourcesPage() {
  const [data, setData] = useState<DataSourcesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(false);

      const result = await fetchDataSources();
      setData(result);
    } catch (err) {
      console.error("Failed to load data sources:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#39734C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#617367]">
          Loading data sources...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-[#E8E2D2] rounded-2xl p-10 text-center">
        <Info className="w-10 h-10 text-[#A36B43] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#183D2C] mb-2">
          Couldn't load data sources
        </h3>
        <p className="text-sm text-[#617367] mb-5">
          Something went wrong while retrieving the data source information.
          Please try again.
        </p>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#39734C] text-white text-sm font-semibold hover:bg-[#285C3A] transition"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAF4ED] flex items-center justify-center">
            <Database className="w-5 h-5 text-[#39734C]" />
          </div>
          <span className="text-sm font-semibold text-[#39734C]">
            FieldShift Data
          </span>
        </div>

        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#183D2C] tracking-tight font-serif">
          Where Our Data Comes From
        </h2>

        <p className="text-sm text-[#617367] mt-2 max-w-2xl leading-relaxed">
          FieldShift uses satellite observations and environmental datasets
          to understand changing farm conditions and help compare crop
          rotation options.
        </p>
      </div>

      {/* Transparency Principles */}
      {data.transparency_principles?.length > 0 && (
        <section className="bg-white rounded-2xl border border-[#E8E2D2] p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#EAF4ED] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#39734C]" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#183D2C]">
                Our commitment to reliable data
              </h3>
              <p className="text-xs text-[#617367] mt-0.5">
                How we approach data transparency
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.transparency_principles.map((principle, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8F8F3] border border-[#EEEBDD]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#39734C] shrink-0 mt-0.5" />
                <p className="text-sm text-[#39483D] leading-relaxed">
                  {principle}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Data Sources Heading */}
      <section>
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#183D2C] font-serif">
              Our Data Sources
            </h3>
            <p className="text-sm text-[#617367] mt-1">
              Explore the datasets that help power FieldShift.
            </p>
          </div>

          <span className="text-xs font-semibold text-[#39734C] bg-[#EAF4ED] px-3 py-1.5 rounded-full whitespace-nowrap">
            {data.sources?.length || 0} Sources
          </span>
        </div>

        {/* Empty State */}
        {!data.sources?.length ? (
          <div className="bg-white border border-[#E8E2D2] rounded-2xl p-10 text-center">
            <Database className="w-9 h-9 text-[#A5B2A5] mx-auto mb-3" />
            <h4 className="font-bold text-[#183D2C]">
              No data sources available
            </h4>
            <p className="text-sm text-[#617367] mt-1">
              Data source information will appear here when available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {data.sources.map((src) => (
              <div
                key={src.id}
                className="bg-white rounded-2xl border border-[#E8E2D2] p-5 flex flex-col hover:border-[#B8CEB9] hover:shadow-sm transition-all"
              >
                {/* Agency and Status */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2.5 py-1 rounded-full">
                    {src.agency}
                  </span>

                  <span className="text-[10px] font-semibold text-[#617367] bg-[#F5F5EF] border border-[#E8E2D2] px-2 py-1 rounded-full">
                    {src.status}
                  </span>
                </div>

                {/* Dataset Information */}
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-[#183D2C] font-serif leading-snug">
                    {src.name}
                  </h4>

                  <p className="text-xs text-[#7A887C] mt-1 mb-3">
                    {src.product_name}
                  </p>

                  <p className="text-sm text-[#526156] leading-relaxed">
                    {src.description}
                  </p>
                </div>

                {/* Technical Details */}
                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-[#F0EDE4]">
                  <div>
                    <p className="text-[11px] text-[#849085] mb-1">
                      Resolution
                    </p>
                    <p className="text-xs font-semibold text-[#183D2C]">
                      {src.resolution}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-[#849085] mb-1">
                      Update frequency
                    </p>
                    <p className="text-xs font-semibold text-[#183D2C]">
                      {src.cadence}
                    </p>
                  </div>
                </div>

                {/* Documentation Link */}
                <div className="mt-4 pt-3 border-t border-[#F0EDE4]">
                  {src.documentation_url ? (
                    <a
                      href={src.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#39734C] hover:text-[#183D2C] transition"
                    >
                      Explore data source
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-[#849085]">
                      Documentation link unavailable
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Data Limitations Note */}
      <div className="bg-[#F5F3E9] border border-[#E8E2D2] rounded-2xl p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#8A774D] shrink-0 mt-0.5" />

        <div>
          <h4 className="text-sm font-bold text-[#51472F]">
            Understanding the data
          </h4>
          <p className="text-sm text-[#6D634A] leading-relaxed mt-1">
            Satellite observations and environmental datasets have
            limitations. They may not capture every condition within an
            individual field. FieldShift uses this information as supporting
            evidence for comparing crop rotations, not as a substitute for
            on-the-ground measurements or local agricultural expertise.
          </p>
        </div>
      </div>

    </div>
  );
}
