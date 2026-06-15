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
  loadMockData: () => void;
  isHydrated: boolean; // Controla se a leitura inicial terminou
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const HISTORY_KEY = "@app:history";
const PROFILES_KEY = "@app:profiles";

export function AppProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [allocs, setAllocs] = useState<Allocations>({});
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  // 1. Estado que avisa o restante do app (telas e rotas) que os dados já foram carregados
  const [isHydrated, setIsHydrated] = useState(false);

  // Trava interna síncrona para impedir os useEffects de salvamento na inicialização
  const isLoaded = useRef(false);

  // 1. CARREGA OS DADOS DO DISPOSITIVO AO INICIAR
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [storedHistory, storedProfiles] = await Promise.all([
          AsyncStorage.getItem(HISTORY_KEY),
          AsyncStorage.getItem(PROFILES_KEY),
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
        // Coloca no fim da fila de execução do JS.
        // Garante que o React renderizou tudo e os estados estão consolidados.
        setTimeout(() => {
          isLoaded.current = true;
          setIsHydrated(true); // Libera as rotas de navegação com segurança
        }, 50);
      }
    };

    loadAllData();
  }, []);

  // 2. SALVA O HISTÓRICO APENAS APÓS O CARREGAMENTO INICIAL
  useEffect(() => {
    if (!isLoaded.current) return; // 🛑 Bloqueado se ainda estiver iniciando

    const saveHistory = async () => {
      try {
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(historyEntries));
      } catch (e) {
        console.error("Erro ao salvar histórico", e);
      }
    };
    saveHistory();
  }, [historyEntries]);

  // 3. SALVA OS PERFIS APENAS APÓS O CARREGAMENTO INICIAL
  useEffect(() => {
    if (!isLoaded.current) return; // 🛑 Bloqueado se ainda estiver iniciando

    const saveProfiles = async () => {
      try {
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
        loadMockData,
        isHydrated, // Enviado para o Contexto
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
