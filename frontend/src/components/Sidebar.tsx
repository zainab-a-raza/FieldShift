"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  PlusCircle,
  CloudSun,
  Layers,
  Scale,
  ThermometerSnowflake,
  Database,
  FileText,
  Settings,
  Sprout,
  Satellite,
  Compass,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Overview Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Farm Portfolio", href: "/farms", icon: MapPin },
  { name: "Register New Field", href: "/farms/new", icon: PlusCircle },
  { name: "Environmental Insights", href: "/environmental-insights", icon: CloudSun, badge: "NASA" },
  { name: "Rotation Planner", href: "/rotation-planner", icon: Layers },
  { name: "Rotation Comparison", href: "/rotation-comparison", icon: Scale, badge: "MCDA" },
  { name: "Climate Simulator", href: "/climate-simulator", icon: ThermometerSnowflake },
  { name: "Data Sources & Lineage", href: "/data-sources", icon: Database },
  { name: "Analytical Reports", href: "/reports", icon: FileText },
  { name: "Platform Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-68 bg-[#183D2C] text-white flex flex-col shrink-0 border-r border-[#26533D] min-h-screen">
      {/* Brand & Mission Banner */}
      <div className="p-5 border-b border-[#234F3A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#39734C] flex items-center justify-center text-[#F8F8F3] shadow-md border border-[#9DBB78]/30">
            <Sprout className="w-6 h-6 text-[#9DBB78]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#FFFFFF] font-serif flex items-center gap-1.5">
              FieldShift
            </h1>
            <p className="text-[11px] text-[#9DBB78] font-medium tracking-wide">
              NASA Space Apps 2026
            </p>
          </div>
        </div>
        <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-[#112F21] border border-[#2B5E43] flex items-center justify-between">
          <span className="text-[11px] text-[#E8E2D2] flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-[#9DBB78]" />
            NASA Earth Data
          </span>
          <span className="text-[10px] font-semibold text-[#9DBB78] bg-[#183D2C] px-1.5 py-0.5 rounded border border-[#9DBB78]/40">
            CONNECTED
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9DBB78]/80">
          Core Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href) && item.href !== "/farms");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#39734C] text-white shadow-sm font-semibold border border-[#9DBB78]/40"
                  : "text-[#E8E2D2] hover:bg-[#204936] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-[#9DBB78]" : "text-[#9DBB78]/70"}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-[#183D2C] text-[#9DBB78]"
                      : "bg-[#2A5940] text-[#E8E2D2]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Challenge Theme & Provenance Footer */}
      <div className="p-4 border-t border-[#234F3A] bg-[#133324] text-[11px] text-[#C5BFA9]">
        <div className="flex items-center gap-2 mb-1.5">
          <Compass className="w-3.5 h-3.5 text-[#9DBB78]" />
          <span className="font-semibold text-white">Challenge Focus:</span>
        </div>
        <p className="text-[10px] leading-relaxed text-[#D2CEBE]">
          Adapting Farms with NASA Earth Observations & Explainable Decision Analysis.
        </p>
        <div className="mt-2.5 pt-2 border-t border-[#1E4733] flex items-center justify-between text-[10px] text-[#9DBB78]">
          <span>POWER • SMAP • GPM</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
