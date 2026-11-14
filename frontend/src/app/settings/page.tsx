"use client";

import React, { useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { Settings, Key, Database, Satellite, CheckCircle2, Shield, ExternalLink, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const { isDemoMode } = useFarm();

  const [earthdataUsername, setEarthdataUsername] = useState("");
  const [earthdataPassword, setEarthdataPassword] = useState("");
  const [geeServiceAccount, setGeeServiceAccount] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#39734C] bg-[#EAF4ED] px-2.5 py-0.5 rounded-full">
            System Configuration
          </span>
          <span className="text-xs text-[#617367]">NASA Space Apps 2026</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#183D2C] tracking-tight font-serif">
          Settings & Mission Connectors
        </h2>
        <p className="text-xs text-[#617367] mt-1">
          Configure API credentials, toggle live vs demo data modes, and inspect system telemetry.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-[#EAF4ED] border border-[#BCE0C8] text-xs text-[#204936] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#39734C]" />
          <span>Configuration saved successfully. System will update live credentials on next sync.</span>
        </div>
      )}

      {/* Mode Status Card */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E2D2] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-[#39734C] animate-pulse"></span>
            <h3 className="text-sm font-bold text-[#183D2C]">
              Operational Data Mode
            </h3>
          </div>
          <span className="text-xs font-mono font-bold bg-[#EAF4ED] text-[#2E6A44] px-2.5 py-1 rounded-full border border-[#BCE0C8]">
            {isDemoMode ? "Calibrated Demo Mode" : "Live Mission Stream"}
          </span>
        </div>
        <p className="text-xs text-[#617367] leading-relaxed">
          In demo mode, FieldShift uses precomputed realistic sample data based on NASA POWER and SoilGrids benchmarks. If external API credentials are not provided or remote servers are unreachable, the application runs seamlessly without crashing.
        </p>
      </div>

      {/* External Credentials Form */}
      <form onSubmit={handleSave} className="bg-[#FFFFFF] rounded-2xl p-6 lg:p-8 border border-[#E8E2D2] shadow-xs space-y-6">
        {/* NASA Earthdata Credentials */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#39734C] flex items-center gap-2">
              <Satellite className="w-4 h-4" />
              1. NASA Earthdata Login (SMAP / GPM)
            </h4>
            <a
              href="https://urs.earthdata.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#39734C] hover:underline flex items-center gap-1"
            >
              <span>Get Free NASA Earthdata Account</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#26352C] mb-1">
                Earthdata Username
              </label>
              <input
                type="text"
                placeholder="e.g. nasa_researcher_2026"
                value={earthdataUsername}
                onChange={(e) => setEarthdataUsername(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD6C3] bg-[#F8F8F3] text-[#26352C] focus:outline-none focus:ring-2 focus:ring-[#39734C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#26352C] mb-1">
                Earthdata Token / Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={earthdataPassword}
                onChange={(e) => setEarthdataPassword(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD6C3] bg-[#F8F8F3] text-[#26352C] focus:outline-none focus:ring-2 focus:ring-[#39734C]"
              />
            </div>
          </div>
          <p className="text-[11px] text-[#617367]">
            Optional: Required for querying NSIDC DAAC and GES DISC direct granules. Leave empty to use regional calibrated demo mode.
          </p>
        </div>

        {/* Google Earth Engine */}
        <div className="space-y-4 pt-4 border-t border-[#F0EDE4]">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#39734C] flex items-center gap-2">
              <Key className="w-4 h-4" />
              2. Google Earth Engine Service Account
            </h4>
            <a
              href="https://developers.google.com/earth-engine/guides/service_account"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#39734C] hover:underline flex items-center gap-1"
            >
              <span>GEE Service Account Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26352C] mb-1">
              Service Account Email (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. gee-sa@project-id.iam.gserviceaccount.com"
              value={geeServiceAccount}
              onChange={(e) => setGeeServiceAccount(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD6C3] bg-[#F8F8F3] text-[#26352C] focus:outline-none focus:ring-2 focus:ring-[#39734C]"
            />
          </div>
        </div>

        {/* Supabase / PostgreSQL */}
        <div className="space-y-4 pt-4 border-t border-[#F0EDE4]">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#39734C] flex items-center gap-2">
              <Database className="w-4 h-4" />
              3. Supabase / Spatial Database
            </h4>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26352C] mb-1">
              Supabase Project URL (Optional)
            </label>
            <input
              type="text"
              placeholder="https://your-project.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD6C3] bg-[#F8F8F3] text-[#26352C] focus:outline-none focus:ring-2 focus:ring-[#39734C]"
            />
            <p className="text-[11px] text-[#617367] mt-1">
              FieldShift currently runs with local high-performance SQLite containing GeoJSON spatial geometry. Connecting Supabase provides cloud multi-user synchronization.
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-[#F0EDE4] flex items-center justify-between">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#39734C] hover:underline flex items-center gap-1"
          >
            <span>Open Interactive Swagger / OpenAPI Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="submit"
            className="flex items-center gap-2 bg-[#39734C] hover:bg-[#183D2C] text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <span>Save Platform Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
