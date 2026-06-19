import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
// Importamos o ActivityIndicator nativo do React Native
import * as NavigationBar from "expo-navigation-bar";
import { ActivityIndicator, Platform, View } from "react-native";

import LogoSvgLight from "../assets/Group2.svg";
import LogoSvgDark from "../assets/Group2d.svg";
import { AppProvider, useAppContext } from "../context/AppContext";
import { ThemeContextProvider, useThemeContext } from "../context/ThemeContext";
import "../global.css";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { profiles, isHydrated } = useAppContext();
  const { isDark, colors } = useThemeContext();
  const segments = useSegments();
  const router = useRouter();

  const [minTimeDone, setMinTimeDone] = useState(false);

  // Dynamically update the system navigation bar based on the active theme
  useEffect(() => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      NavigationBar.setBackgroundColorAsync(colors.navigationBar);
      NavigationBar.setButtonStyleAsync(colors.navigationBarButtons);
    }
  }, [colors]);

  useEffect(() => {
    SplashScreen.hideAsync();
    const timer = setTimeout(() => {
      setMinTimeDone(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isHydrated || !minTimeDone) return;

    const decideRoute = async () => {
      try {
        const stored = await AsyncStorage.getItem("@app:profiles");
        let parsed: any = stored;
        try {
          parsed = stored ? JSON.parse(stored) : stored;
        } catch (e) {}

        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {}
        }

        let storedCount = 0;
        if (Array.isArray(parsed)) storedCount = parsed.length;
        else if (parsed && Array.isArray(parsed.profiles))
          storedCount = parsed.profiles.length;
        else if (parsed && typeof parsed === "object")
          storedCount = Object.keys(parsed).length;

        const safeSegments = segments as string[];
        const currentIsSetup =
          safeSegments.includes("setup") || safeSegments[0] === "setup";
        const isAtRoot = safeSegments.length === 0;

        if (storedCount < 1 && !currentIsSetup) {
          await router.replace("/setup");
          return;
        }

        if (storedCount >= 1 && isAtRoot) {
          await router.replace("/(tabs)");
          return;
        }
      } catch (e) {
        console.error("Error deciding initial route", e);
      }
    };

    decideRoute();
  }, [profiles, isHydrated, segments, minTimeDone]);

  const LogoSvg = isDark ? LogoSvgDark : LogoSvgLight;

  // 🔥 TELA DE LOADING SIMPLIFICADA APENAS COM O ACTIVITYINDICATOR NATIVO
  if (!isHydrated || !minTimeDone) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <View style={{ marginBottom: 40 }}>
          <LogoSvg width={360} height={360} />
        </View>

        {/* Seu novo indicador nativo, limpo e performático */}
        <ActivityIndicator
          size="large"
          color="#FF9500"
          style={{ transform: [{ scale: 2.0 }] }}
        />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="setup" options={{ presentation: "modal" }} />
      <Stack.Screen name="processing" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="history-details/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeContextProvider>
      <AppProvider>
        <ThemedStatusBar />
        <RootLayoutNav />
      </AppProvider>
    </ThemeContextProvider>
  );
}

/** Separate component so it can use useThemeContext inside the provider tree */
function ThemedStatusBar() {
  const { isDark } = useThemeContext();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}
