import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Tabs>
        <Tabs.Screen
          name="gallery"
          options={{ headerShown: false, title: "Gallerie" }}
        />
        <Tabs.Screen
          name="settings"
          options={{ headerShown: false, title: "Paramètres globaux" }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
