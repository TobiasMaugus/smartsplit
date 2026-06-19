import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Allocations, GroceryItem, HistoryEntry, Profile } from "../types";

interface AppContextType {
  profiles: Profile[];
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  items: GroceryItem[];
  setItems: React.Dispatch<React.SetStateAction<GroceryItem[]>>;
  allocs: Allocations;
  setAllocs: React.Dispatch<React.SetStateAction<Allocations>>;
  historyEntries: HistoryEntry[];
  setHistoryEntries: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  // Edição / restauração de histórico
  editingEntry: HistoryEntry | null;
  setEditingEntry: React.Dispatch<React.SetStateAction<HistoryEntry | null>>;
  deleteHistoryEntry: (id: string) => void;
  restoreHistoryEntry: (entry: HistoryEntry) => void;
  updateHistoryEntry: (entry: HistoryEntry) => void;
  loadMockData: () => void;
  isHydrated: boolean;
  scrapedMarket: string;
  setScrapedMarket: React.Dispatch<React.SetStateAction<string>>;
  scrapedDate: string;
  setScrapedDate: React.Dispatch<React.SetStateAction<string>>;
  scrapedTime: string;
  setScrapedTime: React.Dispatch<React.SetStateAction<string>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const HISTORY_KEY = "@app:history";
const PROFILES_KEY = "@app:profiles";

export function AppProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [allocs, setAllocs] = useState<Allocations>({});
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  // 🔥 CORREÇÃO: Os estados agora estão no lugar certo (dentro do AppProvider)
  const [scrapedMarket, setScrapedMarket] = useState("");
  const [scrapedDate, setScrapedDate] = useState("");
  const [scrapedTime, setScrapedTime] = useState("");

  // Histórico em edição (quando o usuário 'refaz' um rateio)
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);

  // Controla se a leitura inicial terminou
  const [isHydrated, setIsHydrated] = useState(false);

  // Trava interna síncrona para impedir os useEffects de salvamento na inicialização
  const isLoaded = useRef(false);

  // Funções para manipular histórico (delete / restore / update)
  const deleteHistoryEntry = (id: string) => {
    setHistoryEntries((prev) => prev.filter((h) => h.id !== id));
  };

  const restoreHistoryEntry = (entry: HistoryEntry) => {
    // Injetamos o estado completo no contexto para reabrir o fluxo de processamento
    setItems(entry.items ?? []);
    // Ao refazer o rateio, queremos iniciar o processamento do ZERO —
    // limpamos as alocações salvas para que a tela de Processing comece do início.
    setAllocs({});
    setScrapedMarket(entry.marketName ?? "");
    setScrapedDate(entry.dateCompra ?? "");
    setScrapedTime(entry.horarioCompra ?? "");
    setEditingEntry(entry);
  };

  const updateHistoryEntry = (entry: HistoryEntry) => {
    setHistoryEntries((prev) =>
      prev.map((h) => (h.id === entry.id ? entry : h)),
    );
  };

  // 1. CARREGA OS DADOS DO DISPOSITIVO AO INICIAR
  useEffect(() => {
    const loadAllData = async () => {
      console.log("AppProvider: start loadAllData");
      try {
        const [storedHistory, storedProfiles] = await Promise.all([
          AsyncStorage.getItem(HISTORY_KEY),
          AsyncStorage.getItem(PROFILES_KEY),
          new Promise((resolve) => setTimeout(resolve, 600)), // Mínimo de 0.6s garantido
        ]);

        if (storedHistory) {
          setHistoryEntries(JSON.parse(storedHistory));
        }
        if (storedProfiles) {
          setProfiles(JSON.parse(storedProfiles));
        }
      } catch (e) {
        console.error("Erro ao carregar dados do AsyncStorage", e);
      } finally {
        setTimeout(() => {
          isLoaded.current = true;
          setIsHydrated(true);
        }, 50);
      }
    };

    loadAllData();
  }, []);

  // 2. SALVA O HISTÓRICO APENAS APÓS O CARREGAMENTO INICIAL
  useEffect(() => {
    if (!isLoaded.current) return;

    const saveHistory = async () => {
      try {
        console.log(
          "AppProvider: saving history, count=",
          historyEntries.length,
        );
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(historyEntries));
      } catch (e) {
        console.error("Erro ao salvar histórico", e);
      }
    };
    saveHistory();
  }, [historyEntries]);

  // 3. SALVA OS PERFIS APENAS APÓS O CARREGAMENTO INICIAL
  useEffect(() => {
    if (!isLoaded.current) return;

    const saveProfiles = async () => {
      try {
        console.log("AppProvider: saving profiles, count=", profiles.length);
        await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      } catch (e) {
        console.error("Erro ao salvar perfis", e);
      }
    };
    saveProfiles();
  }, [profiles]);

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
        editingEntry,
        setEditingEntry,
        deleteHistoryEntry,
        restoreHistoryEntry,
        updateHistoryEntry,
        loadMockData,
        isHydrated,
        scrapedMarket,
        setScrapedMarket,
        scrapedDate,
        setScrapedDate,
        scrapedTime,
        setScrapedTime,
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
