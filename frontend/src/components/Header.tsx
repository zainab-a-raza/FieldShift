"use client";

import React, { useEffect, useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { MapPin, Droplets, Wheat, ChevronDown, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/types";
import { fetchCurrentUser, signOut } from "@/lib/api";

export function Header() {
  const { farms, selectedFarm, setSelectedFarm } = useFarm();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    fetchCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setProfileOpen(false);
    router.push("/signin");
  };

  return (
    <header className="h-[72px] bg-white border-b border-[#E1E6DF] px-5 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Farm Switcher & Active Location */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#718078]">
              Current farm
            </span>
            <div className="relative inline-block text-left">
              <select
                aria-label="Select active farm holding"
                value={selectedFarm?.id || ""}
                onChange={(e) => {
                  const found = farms.find((f) => f.id === e.target.value);
                  if (found) setSelectedFarm(found);
                }}
                className="appearance-none bg-white hover:bg-[#F4F7F2] text-[#19382A] font-semibold text-sm rounded-lg py-1.5 pl-0 pr-8 focus:outline-none focus:ring-2 focus:ring-[#377C52] transition cursor-pointer"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.location_name.split(",")[0]})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#617367] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {selectedFarm && (
          <div className="hidden lg:flex items-center gap-3 text-xs text-[#718078] pl-4 border-l border-[#E1E6DF]">
            <span className="flex items-center gap-1 font-medium text-[#26352C]">
              <MapPin className="w-3.5 h-3.5 text-[#377C52]" />
              {selectedFarm.area_hectares} ha
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Wheat className="w-3.5 h-3.5 text-[#7EA760]" />
              Current: <strong className="text-[#26352C] capitalize">{selectedFarm.current_crop}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-[#377C52]" />
              <span className="capitalize">{selectedFarm.irrigation_type.replace("_", " ")}</span>
            </span>
          </div>
        )}
      </div>

      {/* Farmer profile */}
      <div className="relative">
        <button
          type="button"
          aria-expanded={profileOpen}
          onClick={() => setProfileOpen((open) => !open)}
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-[#F3F7F1]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#143D2B] text-white">
            <UserRound className="h-4 w-4" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold text-[#19382A]">{user?.full_name || "Farmer profile"}</p>
            <p className="text-[10px] text-[#718078]">{user ? "Signed in" : "Sign in to save work"}</p>
          </div>
          <ChevronDown className={`hidden h-4 w-4 text-[#718078] transition sm:block ${profileOpen ? "rotate-180" : ""}`} />
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[#E1E6DF] bg-white p-2 shadow-lg">
            {user ? (
              <>
                <div className="border-b border-[#EDF0EB] px-3 py-2">
                  <p className="text-xs font-semibold text-[#19382A]">{user.full_name}</p>
                  <p className="mt-1 truncate text-[11px] text-[#718078]">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#C76559] hover:bg-[#FDECEA]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/signin" className="block rounded-lg px-3 py-2 text-xs font-semibold text-[#377C52] hover:bg-[#F1F7EE]">
                Sign in or create account
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
