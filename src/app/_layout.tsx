import { Stack } from "expo-router";
import { AppProvider } from "../context/AppContext";
import "../global.css"; // Importa o arquivo que criamos no passo anterior

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="setup" options={{ presentation: "modal" }} />
        <Stack.Screen name="processing" />
        <Stack.Screen name="summary" />
      </Stack>
    </AppProvider>
  );
}
