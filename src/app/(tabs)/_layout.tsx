import { Tabs } from "expo-router";
import { History, ShoppingBag, User } from "lucide-react-native";
import { useThemeContext } from "../../context/ThemeContext";
import "../../global.css";

export default function TabLayout() {
  const { colors } = useThemeContext();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        // 1. IMPORTANTE: Remova ou comente a altura fixa se os textos sumirem,
        // pois as abas nativas calculam o padding de forma estrita.
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          backgroundColor: colors.backgroundElevated,
        },
        // 2. Ajuste o objeto de estilo para o formato que a aba nativa espera
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
        },
        // 3. Força o Android a sempre renderizar as labels (baseado na sua tipagem)
        // @ts-ignore - caso o expo-router repasse diretamente para o driver nativo
        labelVisibilityMode: "labeled",
      }}
    >
      <Tabs.Screen
        name="profiles"
        options={{
          title: "Perfis",
          tabBarIcon: ({ color, focused }) => (
            <User size={28} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
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
      <Tabs.Screen
        name="history"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color, focused }) => (
            <History size={25} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
