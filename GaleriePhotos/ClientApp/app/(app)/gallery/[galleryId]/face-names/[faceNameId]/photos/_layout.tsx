import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="[photoId]" options={{ headerShown: false }} />
    </Stack>
  );
}
