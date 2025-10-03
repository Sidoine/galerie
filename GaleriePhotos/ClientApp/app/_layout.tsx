import { Stack } from "expo-router";

import {
  AuthenticationStoreProvider,
  useAuthenticationStore,
} from "@/stores/authentication";
import { MyApiClientProvider } from "@/stores/api-client";
import { Platform } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-require-imports
if (Platform.OS === "web") require("@/stores/leaflet");

function RootLayoutContent() {
  const authenticationStore = useAuthenticationStore();
  const { authenticated, loading } = authenticationStore;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!authenticated && loading}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={authenticated || loading}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!authenticated && !loading}>
        <Stack.Screen
          name="(auth)"
          options={{ presentation: "modal", gestureEnabled: false }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthenticationStoreProvider>
      <MyApiClientProvider>
        <RootLayoutContent />
      </MyApiClientProvider>
    </AuthenticationStoreProvider>
  );
}
