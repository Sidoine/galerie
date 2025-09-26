import { Stack } from "expo-router";

import {
  AuthenticationStoreProvider,
  useAuthenticationStore,
} from "@/stores/authentication";
import { MyApiClientProvider } from "@/stores/api-client";

function RootLayoutContent() {
  const authenticationStore = useAuthenticationStore();
  const isAuthenticated = !!authenticationStore.token;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
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
