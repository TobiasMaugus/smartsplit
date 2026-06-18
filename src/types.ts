export interface Profile {
  id: string;
  name: string;
  color: string;
  pixKey: string;
  pixName: string;
  pixCity: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  totalUnits: number;
  unitPrice: number;
}

export type Allocations = Record<string, Record<string, number>>;

export type Tab = "profiles" | "main" | "history";
export type SubScreen = "none" | "processing" | "summary";

export interface ProfileForm extends Profile {
  showPix: boolean;
}

export interface HistoryEntry {
  id: string;
  date: string;
  total: number;
  payer: Profile;
  desc: string;
  marketName?: string;
  dateCompra?: string;
  horarioCompra?: string;
  horario?: string;
}

export const COLORS = [
  "#6C63FF",
  "#FF4757",
  "#00C853",
  "#FF9500",
  "#00BCD4",
  "#E91E63",
  "#1976D2",
  "#F4511E",
  "#FFD166",
];

export const COLLECTIVE = "__collective__";
