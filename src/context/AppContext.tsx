import React, { createContext, useContext, useState, ReactNode } from "react";
import { Profile, GroceryItem, Allocations, HistoryEntry } from "../types";

interface AppContextType {
  profiles: Profile[];
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  items: GroceryItem[];
  setItems: React.Dispatch<React.SetStateAction<GroceryItem[]>>;
  allocs: Allocations;
  setAllocs: React.Dispatch<React.SetStateAction<Allocations>>;
  historyEntries: HistoryEntry[];
  setHistoryEntries: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  loadMockData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [allocs, setAllocs] = useState<Allocations>({});
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  const loadMockData = () => {
    import("../mockData").then((mock) => {
      setProfiles(mock.MOCK_PROFILES);
      setItems(mock.MOCK_ITEMS);
      setHistoryEntries(mock.MOCK_HISTORY);
    });
  };

  return (
    <AppContext.Provider
      value={{
        profiles,
        setProfiles,
        items,
        setItems,
        allocs,
        setAllocs,
        historyEntries,
        setHistoryEntries,
        loadMockData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
