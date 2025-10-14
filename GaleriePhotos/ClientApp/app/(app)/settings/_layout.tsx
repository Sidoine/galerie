import { UsersStoreProvider } from "@/stores/users";
import Drawer from "expo-router/drawer";
import React from "react";
import Icon from "@/components/Icon";

export default function SettingsLayout() {
  return (
    <UsersStoreProvider>
      <Drawer>
        <Drawer.Screen
          name="index"
          options={{
            title: "Utilisateurs",
            drawerIcon: ({ color, size }) => (
              <Icon
                set="mci"
                name="account-multiple"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="galleries"
          options={{
            title: "Galeries",
            drawerIcon: ({ color, size }) => (
              <Icon set="mci" name="image-multiple" color={color} size={size} />
            ),
          }}
        />
      </Drawer>
    </UsersStoreProvider>
  );
}
