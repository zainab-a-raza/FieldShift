"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  CloudSun,
  Layers,
  Scale,
  ThermometerSnowflake,
  FileText,
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

const primaryNavItems: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My farm", href: "/farms", icon: MapPin },
  { name: "Environmental insights", href: "/environmental-insights", icon: CloudSun },
  { name: "Rotation planner", href: "/rotation-planner", icon: Layers },
];

const toolNavItems: NavItem[] = [
  { name: "Compare strategies", href: "/rotation-comparison", icon: Scale, badge: "MCDA" },
  { name: "Climate simulator", href: "/climate-simulator", icon: ThermometerSnowflake },
  { name: "Saved reports", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#143D2B] text-white flex flex-col shrink-0 border-r border-[#285640] min-h-screen">
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
            <p className="text-[10px] text-[#A7C77D] font-medium tracking-[0.12em] uppercase">
              Earth intelligence
            </p>
          </div>
        </div>
        <div className="mt-4 px-2.5 py-2 rounded-lg bg-[#103321] border border-[#285640] flex items-center justify-between">
          <span className="text-[11px] text-[#E8E2D2] flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-[#9DBB78]" />
            Data services
          </span>
          <span className="text-[10px] font-semibold text-[#9DBB78] bg-[#183D2C] px-1.5 py-0.5 rounded border border-[#9DBB78]/40">
            OPERATIONAL
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#A7C77D]/80">
          Workspace
        </div>
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href) && item.href !== "/farms");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#377C52] text-white shadow-sm font-semibold border border-[#A7C77D]/50"
                  : "text-[#E8E2D2] hover:bg-[#204936] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-[#A7C77D]" : "text-[#A7C77D]/70"}`} />
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
        <details className="group mt-5">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#E8EEE7] hover:bg-[#204D38]">
            <span className="flex items-center gap-3">
              <Compass className="w-4 h-4 text-[#A7C77D]/80" />
              More tools
            </span>
            <span className="text-lg leading-none text-[#A7C77D] transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-1 space-y-1 border-l border-[#377C52] pl-2">
            {toolNavItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive ? "bg-[#377C52] text-white font-semibold" : "text-[#E8EEE7] hover:bg-[#204D38]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-3.5 h-3.5 text-[#A7C77D]/80" />
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#2A6044] text-[#E8EEE7]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </details>
      </nav>

      {/* Challenge Theme & Provenance Footer */}
      <div className="p-4 border-t border-[#285640] bg-[#103321] text-[11px] text-[#C5CFC6]">
        <div className="flex items-center gap-2 mb-1.5">
          <Compass className="w-3.5 h-3.5 text-[#A7C77D]" />
          <span className="font-semibold text-white">FieldShift</span>
        </div>
        <p className="text-[10px] leading-relaxed text-[#D2CEBE]">
          Field intelligence, simplified.
        </p>
        <div className="mt-2.5 pt-2 border-t border-[#1E4733] flex items-center justify-between text-[10px] text-[#9DBB78]">
          <span>NASA EARTH DATA</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
