import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Visages", headerShown: false }}
      />
      <Stack.Screen name="[faceNameId]" options={{ headerShown: false }} />
    </Stack>
  );
}
