import { Redirect, Tabs } from "expo-router";
import { History, ShoppingBag, User } from "lucide-react-native";
import { useAppContext } from "../../context/AppContext";
import "../../global.css";

export default function TabLayout() {
  const { profiles } = useAppContext();

  // Redirect to setup if not enough profiles
  if (profiles.length < 2) {
    return <Redirect href="/setup" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#00C853",
        tabBarInactiveTintColor: "#D1D5DB",
        // 1. IMPORTANTE: Remova ou comente a altura fixa se os textos sumirem,
        // pois as abas nativas calculam o padding de forma estrita.
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          backgroundColor: "#FFFFFF",
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
