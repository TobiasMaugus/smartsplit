import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { ThemeProvider as SCThemeProvider } from "styled-components/native";
import { Colors, ThemeColors } from "../constants/theme";

// ---------- Types ----------

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  /** The user's stored preference ('system' | 'light' | 'dark') */
  themePreference: ThemePreference;
  /** Set the preference and persist it */
  setThemePreference: (pref: ThemePreference) => void;
  /** The resolved theme after applying system preference */
  theme: ResolvedTheme;
  /** Convenience boolean */
  isDark: boolean;
  /** The full color palette for the current theme */
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@app:theme";

// ---------- Provider ----------

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (
          stored === "light" ||
          stored === "dark" ||
          stored === "system"
        ) {
          setThemePreferenceState(stored);
        }
      })
      .catch((e) => console.error("Error loading theme preference", e))
      .finally(() => setIsLoaded(true));
  }, []);

  // Persist preference when it changes
  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePreferenceState(pref);
    AsyncStorage.setItem(THEME_STORAGE_KEY, pref).catch((e) =>
      console.error("Error saving theme preference", e),
    );
  }, []);

  // Resolve the effective theme
  const theme: ResolvedTheme = useMemo(() => {
    if (themePreference === "system") {
      return systemScheme === "dark" ? "dark" : "light";
    }
    return themePreference;
  }, [themePreference, systemScheme]);

  const isDark = theme === "dark";
  const colors = Colors[theme];

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      themePreference,
      setThemePreference,
      theme,
      isDark,
      colors,
    }),
    [themePreference, setThemePreference, theme, isDark, colors],
  );

  // Don't render children until the stored preference is loaded to avoid flash
  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={contextValue}>
      <SCThemeProvider theme={colors}>{children}</SCThemeProvider>
    </ThemeContext.Provider>
  );
}

// ---------- Hook ----------

export function useThemeContext(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("useThemeContext must be used within a ThemeContextProvider");
  }
  return ctx;
}
