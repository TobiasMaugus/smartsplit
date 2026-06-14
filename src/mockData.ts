import { Profile, GroceryItem, HistoryEntry, COLORS } from "./types";

export const MOCK_PROFILES: Profile[] = [
  { id: "p1", name: "Ana Vitória", color: COLORS[0], pixKey: "11999887766", pixName: "Ana Vitória", pixCity: "São Paulo" },
  { id: "p2", name: "João Marcos", color: COLORS[1], pixKey: "", pixName: "", pixCity: "" },
];

export const MOCK_ITEMS: GroceryItem[] = [
  { id: "1", name: "COCA-COLA 2L",        totalUnits: 2, unitPrice: 10.99 },
  { id: "2", name: "ARROZ TIPO 1 5KG",    totalUnits: 1, unitPrice: 28.50 },
  { id: "3", name: "FEIJÃO CARIOCA 1KG",  totalUnits: 2, unitPrice: 7.90  },
  { id: "4", name: "LEITE INTEGRAL 1L",   totalUnits: 4, unitPrice: 5.49  },
  { id: "5", name: "PÃO DE FORMA",        totalUnits: 1, unitPrice: 9.80  },
  { id: "6", name: "FRANGO INTEIRO KG",   totalUnits: 1, unitPrice: 18.90 },
  { id: "7", name: "IOGURTE GREGO",       totalUnits: 3, unitPrice: 4.29  },
  { id: "8", name: "MACARRÃO ESPAGUETE",  totalUnits: 2, unitPrice: 3.99  },
];

export const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: "h1",
    date: "12/05/2026",
    total: 137.79,
    payer: MOCK_PROFILES[0],
    desc: `${MOCK_PROFILES[1].name.split(" ")[0]} deve R$ 58,40`,
  },
  {
    id: "h2",
    date: "28/04/2026",
    total: 89.50,
    payer: MOCK_PROFILES[1],
    desc: `${MOCK_PROFILES[0].name.split(" ")[0]} deve R$ 42,20`,
  },
  {
    id: "h3",
    date: "14/04/2026",
    total: 210.20,
    payer: MOCK_PROFILES[0],
    desc: `${MOCK_PROFILES[1].name.split(" ")[0]} deve R$ 98,15`,
  },
];
