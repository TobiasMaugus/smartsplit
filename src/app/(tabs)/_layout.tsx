import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { withLayoutContext } from "expo-router";
import { History, ShoppingBag, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import "../../global.css";

// 1. Cria o navegador de arrastar compatível com o Expo Router
const { Navigator } = createMaterialTopTabNavigator();
const SwipeableTabs = withLayoutContext(Navigator);

export default function TabLayout() {
  const { colors } = useThemeContext();

  // Para garantir que a aba não fique escondida atrás da barrinha do iPhone
  const insets = useSafeAreaInsets();

  return (
    <SwipeableTabs
      initialRouteName="index" // Começa na aba do meio (Adicionar)
      tabBarPosition="bottom" // 💡 Joga a barra lá para o rodapé
      screenOptions={{
        swipeEnabled: true,
        tabBarShowIcon: true,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        animationEnabled: false,

        // 💡 2. Só carrega a tela quando o usuário realmente for para ela (melhora muito a performance)
        lazy: true,
        lazyPreloadDistance: 1,

        tabBarIndicatorStyle: {
          backgroundColor: colors.tabBarActive,
          height: 1, // 💡 Diminuído de 3 para 2 (ou coloque 1 se quiser bem fininha)
          top: 0,
        },

        tabBarStyle: {
          backgroundColor: colors.backgroundElevated,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom, // 💡 Diminuído de 60 para 52 para reduzir a altura do menu
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
          textTransform: "none",
          marginTop: 0,
        },
      }}
    >
      <SwipeableTabs.Screen
        name="profiles"
        options={{
          title: "Perfis",
          tabBarIcon: ({ color, focused }) => (
            <User size={28} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      <SwipeableTabs.Screen
        name="index"
        options={{
          title: "Adicionar",
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag
              size={25}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      <SwipeableTabs.Screen
        name="history"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color, focused }) => (
            <History size={25} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </SwipeableTabs>
  );
}
