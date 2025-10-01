import { Stack } from "expo-router";
import { PlacesStoreProvider } from "@/stores/places";

export default function PlacesLayout() {
  return (
    <PlacesStoreProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Places Map",
            headerStyle: {
              backgroundColor: "#f4f4f5",
            },
            headerTintColor: "#000",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
        <Stack.Screen
          name="[placeId]"
          options={{
            title: "Place Photos",
            headerStyle: {
              backgroundColor: "#f4f4f5",
            },
            headerTintColor: "#000",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
      </Stack>
    </PlacesStoreProvider>
  );
}