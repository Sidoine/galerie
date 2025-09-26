import { Stack } from "expo-router";
import React from "react";
import { GalleriesStoreProvider } from "../../../stores/galleries";

export default function RootLayout() {
  return (
    <GalleriesStoreProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Choix de la galerie" }} />
        <Stack.Screen name="[galleryId]" options={{ headerShown: false }} />
      </Stack>
    </GalleriesStoreProvider>
  );
}
