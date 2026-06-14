import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
const HISTORY_KEY = "@app:history";

export function AppProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [allocs, setAllocs] = useState<Allocations>({});
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  // Carrega histórico ao iniciar
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(HISTORY_KEY);
        if (stored) {
          setHistoryEntries(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };
    loadHistory();
  }, []);

  // Salva histórico sempre que for atualizado
  useEffect(() => {
    const saveHistory = async () => {
      try {
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(historyEntries));
      } catch (e) {
        console.error("Failed to save history", e);
      }
    };
    saveHistory();
  }, [historyEntries]);

  const loadMockData = () => {
    import("../mockData").then((mock) => {
      setProfiles(mock.MOCK_PROFILES);
      setItems(mock.MOCK_ITEMS);
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
