import BreadCrumbs from "@/components/bread-crumbs";
import { FaceNameStoreProvider } from "@/stores/face-name";
import { Stack, useGlobalSearchParams } from "expo-router";
import React from "react";

export default function FaceNamesPhotosLayout() {
  const { faceNameId } = useGlobalSearchParams<{ faceNameId?: string }>();
  return (
    <FaceNameStoreProvider faceNameId={faceNameId ? Number(faceNameId) : undefined}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Photo du visage",
            headerTitle: () => <BreadCrumbs />,
          }}
        />
        <Stack.Screen
          name="photos"
          options={{ title: "Photos du visage", headerShown: false }}
        />
      </Stack>
    </FaceNameStoreProvider>
  );
}
