import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
// Importamos o ActivityIndicator nativo do React Native
import { ActivityIndicator, View } from "react-native";

import LogoSvg from "../assets/Group2.svg";
import { AppProvider, useAppContext } from "../context/AppContext";
import "../global.css";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { profiles, isHydrated } = useAppContext();
  const segments = useSegments();
  const router = useRouter();

  const [minTimeDone, setMinTimeDone] = useState(false);

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

        if (storedCount < 2 && !currentIsSetup) {
          await router.replace("/setup");
          return;
        }

        if (storedCount >= 2 && isAtRoot) {
          await router.replace("/(tabs)");
          return;
        }
      } catch (e) {
        console.error("Error deciding initial route", e);
      }
    };

    decideRoute();
  }, [profiles, isHydrated, segments, minTimeDone]);

  // 🔥 TELA DE LOADING SIMPLIFICADA APENAS COM O ACTIVITYINDICATOR NATIVO
  if (!isHydrated || !minTimeDone) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
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
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}
