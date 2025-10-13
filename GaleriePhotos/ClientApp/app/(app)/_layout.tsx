import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Tabs } from "expo-router";
import { MeStoreProvider, useMeStore } from "@/stores/me";
import { observer } from "mobx-react-lite";
import Icon from "@/components/Icon";

const AppLayoutContent = observer(function RootLayoutContent() {
  const meStore = useMeStore();
  return (
    <Tabs>
      <Tabs.Screen
        name="gallery"
        options={{
          headerShown: false,
          title: "Gallerie",
          tabBarIcon: ({ color }) => (
            <Icon set="mi" name="image" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Protected guard={meStore.administrator}>
        <Tabs.Screen
          name="dashboard"
          options={{
            headerShown: false,
            title: "Tableau de bord",
            tabBarIcon: ({ color }) => (
              <Icon set="mi" name="dashboard" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            headerShown: false,
            title: "Paramètres globaux",
            tabBarIcon: ({ color }) => (
              <Icon set="mi" name="settings" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs.Protected>
      <Tabs.Screen
        name="account"
        options={{
          headerShown: false,
          title: "Compte",
          tabBarIcon: ({ color }) => (
            <Icon set="mi" name="person" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
});

export default function AppLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <MeStoreProvider>
        <AppLayoutContent />
        <StatusBar style="auto" />
      </MeStoreProvider>
    </ThemeProvider>
  );
}
