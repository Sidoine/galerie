import { Stack } from "expo-router";

import {
  AuthenticationStoreProvider,
  useAuthenticationStore,
} from "@/stores/authentication";
import { MyApiClientProvider } from "@/stores/api-client";

function RootLayoutContent() {
  const authenticationStore = useAuthenticationStore();
  const isAuthenticated = authenticationStore.authenticated;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
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
