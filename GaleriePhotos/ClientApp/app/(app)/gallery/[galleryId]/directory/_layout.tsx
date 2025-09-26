import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="[directoryId]" options={{ headerShown: false }} />
    </Stack>
  );
}
