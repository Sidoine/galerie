import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Tabs } from "expo-router";
import { MeStoreProvider, useMeStore } from "@/stores/me";
import { observer } from "mobx-react-lite";

const RootLayoutContent = observer(function RootLayoutContent() {
  const meStore = useMeStore();
  return (
    <Tabs>
      <Tabs.Screen
        name="gallery"
        options={{ headerShown: false, title: "Gallerie" }}
      />
      <Tabs.Protected guard={meStore.administrator}>
        <Tabs.Screen
          name="settings"
          options={{ headerShown: false, title: "Paramètres globaux" }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs.Protected>
    </Tabs>
  );
});

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <MeStoreProvider>
        <RootLayoutContent />
        <StatusBar style="auto" />
      </MeStoreProvider>
    </ThemeProvider>
  );
}
