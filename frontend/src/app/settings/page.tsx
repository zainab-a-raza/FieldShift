"use client";

import { useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { API_BASE_URL } from "@/lib/api";
import { CheckCircle2, ExternalLink, RefreshCw, Shield, XCircle } from "lucide-react";

export default function SettingsPage() {
  const { health, error, refreshSystemStatus } = useFarm();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refreshSystemStatus();
    } catch {
      // FarmContext exposes the backend error in the status panel.
    } finally {
      setRefreshing(false);
    }
  };

  const connectorLabels: Record<string, string> = {
    nasa_power: "NASA POWER",
    usda_soil_data: "USDA Soil Data Access",
    soilgrids: "ISRIC SoilGrids",
    nasa_earthdata: "NASA Earthdata (SMAP/GPM/SRTM)",
    google_earth_engine: "Google Earth Engine (Landsat/MODIS/VIIRS)",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2.5 py-0.5 rounded-full">
          Read-only system configuration
        </span>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#183D2C] tracking-tight font-serif mt-2">
          Mission Connector Status
        </h2>
        <p className="text-xs text-[#617367] mt-1">
          Secrets are read only by the backend from <code>backend/.env</code>. They are never entered into or stored by this browser.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#FDF2F0] border border-[#E7B8B4] text-sm text-[#8B2F2A]">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-[#E8E2D2] shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#183D2C]">Backend-reported mode</h3>
            <p className="text-xs text-[#617367] mt-1">{health?.configuration_note || "Status has not been retrieved."}</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-[#183D2C] text-white px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh status
          </button>
        </div>
        <div className="text-sm font-bold">
          Mode: <span className={health?.demo_mode ? "text-[#D97706]" : "text-[#39734C]"}>{health?.data_mode || "unknown"}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(health?.connectors || {}).map(([key, status]) => {
            const enabled = status.startsWith("enabled");
            return (
              <div key={key} className="p-3 rounded-xl bg-[#F8F8F3] border border-[#DDD6C3] flex gap-2 items-start">
                {enabled ? <CheckCircle2 className="w-4 h-4 text-[#39734C] mt-0.5" /> : <XCircle className="w-4 h-4 text-[#D97706] mt-0.5" />}
                <div>
                  <p className="text-xs font-semibold text-[#26352C]">{connectorLabels[key] || key}</p>
                  <p className="text-[11px] text-[#617367]">{status.replaceAll("_", " ")}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[#E8E2D2] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#183D2C] flex items-center gap-2"><Shield className="w-4 h-4" />Enable live connectors safely</h3>
        <ol className="list-decimal pl-5 text-xs text-[#26352C] space-y-2">
          <li>Copy <code>backend/.env.example</code> to <code>backend/.env</code>.</li>
          <li>Set <code>DEMO_MODE=false</code>.</li>
          <li>Set <code>NASA_EARTHDATA_TOKEN</code> for SMAP, GPM, and SRTM.</li>
          <li>Set <code>GEE_SERVICE_ACCOUNT</code> and <code>GEE_PRIVATE_KEY_FILE</code> for Landsat, MODIS, and VIIRS.</li>
          <li>Restart the backend, then refresh this status page.</li>
        </ol>
        <p className="text-[11px] text-[#617367]">NASA POWER, USDA Soil Data Access, and SoilGrids do not require credentials.</p>
        <a href={`${API_BASE_URL}/docs`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#39734C] hover:underline">
          Open backend API documentation <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
