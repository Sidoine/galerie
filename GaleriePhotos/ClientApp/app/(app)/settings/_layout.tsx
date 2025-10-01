import { UsersStoreProvider } from "@/stores/users";
import Drawer from "expo-router/drawer";
import React from "react";

export default function RootLayout() {
  return (
    <UsersStoreProvider>
      <Drawer>
        <Drawer.Screen name="index" options={{ title: "Utilisateurs" }} />
        <Drawer.Screen name="galleries" options={{ title: "Galeries" }} />
      </Drawer>
    </UsersStoreProvider>
  );
}
