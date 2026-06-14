import { Tabs } from "expo-router";
import { User, ShoppingBag, History } from "lucide-react-native";
import { useAppContext } from "../../context/AppContext";
import { Redirect } from "expo-router";
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
        tabBarStyle: {
          height: 64,
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          backgroundColor: "#FFFFFF",
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "bold",
          marginBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="profiles"
        options={{
          title: "Perfis",
          tabBarIcon: ({ color, focused }) => (
            <User size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Adicionar",
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag
              size={20}
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
            <History size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
