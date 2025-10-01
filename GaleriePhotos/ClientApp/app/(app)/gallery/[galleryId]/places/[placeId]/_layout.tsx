import { Stack } from "expo-router";

export default function PlacePhotosLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
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
  );
}