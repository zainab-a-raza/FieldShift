"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Farm, SystemHealth } from "@/types";
import { fetchFarms, fetchHealth } from "@/lib/api";

interface FarmContextType {
  farms: Farm[];
  selectedFarm: Farm | null;
  setSelectedFarm: (farm: Farm) => void;
  isLoading: boolean;
  refreshFarms: () => Promise<void>;
  refreshSystemStatus: () => Promise<void>;
  isDemoMode: boolean;
  health: SystemHealth | null;
  error: string | null;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    const status = await fetchHealth();
    setHealth(status);
    setIsDemoMode(status.demo_mode);
  };

  const loadFarms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data] = await Promise.all([fetchFarms(), loadHealth()]);
      setFarms(data);
      if (data.length > 0) {
        // Retain current selection if already in list, else default to first
        setSelectedFarm((prev) => {
          if (prev && data.find((f) => f.id === prev.id)) {
            return prev;
          }
          return data[0];
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load FieldShift data.";
      setError(message);
      setFarms([]);
      setSelectedFarm(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  return (
    <FarmContext.Provider
      value={{
        farms,
        selectedFarm,
        setSelectedFarm,
        isLoading,
        refreshFarms: loadFarms,
        refreshSystemStatus: loadHealth,
        isDemoMode,
        health,
        error,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error("useFarm must be used within a FarmProvider");
  }
  return context;
}
