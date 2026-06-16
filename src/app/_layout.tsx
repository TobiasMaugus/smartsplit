import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { AppProvider, useAppContext } from "../context/AppContext";
import "../global.css";

import LogoSvg from "../assets/Group2.svg";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { profiles, isHydrated } = useAppContext();
  const segments = useSegments();
  const router = useRouter();

  // 🌟 O coração da nossa nova animação do Infinito
  const infinityAnim = useRef(new Animated.Value(0)).current;

  // useEffect(() => {
  //   SplashScreen.hideAsync();
  // }, []);

  useEffect(() => {
    if (!isHydrated) {
      // Cria um loop contínuo que vai de 0 a 1 em 1.5 segundos
      Animated.loop(
        Animated.timing(infinityAnim, {
          toValue: 1,
          duration: 900, // Tempo de uma volta completa no infinito (1.5s)
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    }
  }, [isHydrated]);

  // ====================================================================
  // 📐 MATEMÁTICA DA ANIMAÇÃO DO INFINITO (Curva de Figura 8)
  // Mapeamos 9 pontos exatos para desenhar o símbolo (∞) suavemente
  // ====================================================================
  const inputRange = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

  // 🟣 ESFERA ROXA (Inicia do centro indo para a direita)
  const translateX1 = infinityAnim.interpolate({
    inputRange,
    outputRange: [0, 20, 30, 20, 0, -20, -30, -20, 0],
  });
  const translateY1 = infinityAnim.interpolate({
    inputRange,
    outputRange: [0, -10, 0, 10, 0, -10, 0, 10, 0],
  });
  const scale1 = infinityAnim.interpolate({
    inputRange,
    outputRange: [1, 1.2, 1, 0.8, 1, 1.2, 1, 0.8, 1], // Efeito 3D de profundidade
  });

  // 🟠 ESFERA LARANJA (Defasada: Inicia do centro indo para a esquerda)
  const translateX2 = infinityAnim.interpolate({
    inputRange,
    outputRange: [0, -20, -30, -20, 0, 20, 30, 20, 0],
  });
  const translateY2 = infinityAnim.interpolate({
    inputRange,
    outputRange: [0, -10, 0, 10, 0, -10, 0, 10, 0],
  });
  const scale2 = infinityAnim.interpolate({
    inputRange,
    outputRange: [1, 0.8, 1, 1.2, 1, 0.8, 1, 1.2, 1], // Inverso para não "baterem"
  });

  useEffect(() => {
    if (!isHydrated) return;

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

        // 1. Cenário: Usuário novo -> Força ir para o Setup
        if (storedCount < 2 && !currentIsSetup) {
          await router.replace("/setup");
          // Oculta a splash screen LOGO APÓS trocar para a tela correta nos bastidores
          await SplashScreen.hideAsync();
          return;
        }

        // 2. Cenário: Já tem perfis e abriu o app do zero -> Manda para a Index
        if (storedCount >= 2 && isAtRoot) {
          await router.replace("/(tabs)");
          // Oculta a splash screen LOGO APÓS trocar para a tela correta nos bastidores
          await SplashScreen.hideAsync();
          return;
        }

        // 3. Caso o app já tenha carregado e esteja apenas navegando normalmente
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error("Error deciding initial route", e);
        // Garante que o app não vai travar na splash caso dê algum erro na leitura
        await SplashScreen.hideAsync();
      }
    };

    decideRoute();
  }, [profiles, isHydrated, segments]);

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
        {/* Logo estática sem animação */}
        <View style={{ marginBottom: 40 }}>
          <LogoSvg width={360} height={360} />
        </View>

        {/* 🌟 NOVO LOADING: ORBITAL DO INFINITO */}
        <View
          style={{
            width: 60,
            height: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Bolinha Roxa */}
          <Animated.View
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: "#6C63FF",
              transform: [
                { translateX: translateX1 },
                { translateY: translateY1 },
                { scale: scale1 },
              ],
            }}
          />

          {/* Bolinha Laranja */}
          <Animated.View
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: "#FF9500",
              transform: [
                { translateX: translateX2 },
                { translateY: translateY2 },
                { scale: scale2 },
              ],
            }}
          />
        </View>
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
