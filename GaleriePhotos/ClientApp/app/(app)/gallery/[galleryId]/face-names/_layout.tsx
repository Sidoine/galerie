import { FaceNamesStoreProvider } from "@/stores/face-names";
import { Stack, useGlobalSearchParams } from "expo-router";
import React from "react";

export default function RootLayout() {
  const { galleryId } = useGlobalSearchParams<{ galleryId: string }>();
  return (
    <FaceNamesStoreProvider galleryId={Number(galleryId)}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ title: "Visages", headerShown: false }}
        />
        <Stack.Screen name="[faceNameId]" options={{ headerShown: false }} />
      </Stack>
    </FaceNamesStoreProvider>
  );
}
