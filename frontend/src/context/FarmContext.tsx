"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Farm } from "@/types";
import { fetchFarms } from "@/lib/api";

interface FarmContextType {
  farms: Farm[];
  selectedFarm: Farm | null;
  setSelectedFarm: (farm: Farm) => void;
  isLoading: boolean;
  refreshFarms: () => Promise<void>;
  isDemoMode: boolean;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  const loadFarms = async () => {
    setIsLoading(true);
    try {
      const data = await fetchFarms();
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
      console.error("Failed to load farms", e);
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
        isDemoMode,
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
