import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AppProvider, useAppContext } from "../context/AppContext";
import "../global.css";

function RootLayoutNav() {
  const { profiles, isHydrated } = useAppContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 🛑 Aguarda a leitura do AsyncStorage terminar
    if (!isHydrated) return;

    const isInSetup = segments[0] === "setup";

    // 3. Regra para ir para o SETUP
    if (profiles.length < 2 && !isInSetup) {
      router.replace("/setup");
    }

    // 4. Regra para ir para a HOME (Tabs)
    if (profiles.length >= 2 && isInSetup) {
      router.replace("/(tabs)");
    }
  }, [profiles, isHydrated, segments]);

  // ⌛ Tela de carregamento enquanto o banco é lido
  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="setup" options={{ presentation: "modal" }} />
      <Stack.Screen name="processing" />
      <Stack.Screen name="summary" />
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
