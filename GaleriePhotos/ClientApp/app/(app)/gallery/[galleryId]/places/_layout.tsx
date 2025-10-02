import { Stack, useGlobalSearchParams } from "expo-router";
import { PlacesStoreProvider } from "@/stores/places";

export default function PlacesLayout() {
  const { galleryId } = useGlobalSearchParams<{
    galleryId?: string;
  }>();
  if (!galleryId) {
    return <></>;
  }
  return (
    <PlacesStoreProvider galleryId={Number(galleryId)}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="[placeId]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </PlacesStoreProvider>
  );
}
