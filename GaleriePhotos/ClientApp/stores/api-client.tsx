import {
  SimpleApiClient,
  UserStore,
  ApiClientContext,
  Data,
} from "folke-service-helpers";
import { useMemo } from "react";
import { useAuthenticationStore } from "./authentication";
import { getBackendUrl } from "./config";

class MyApiClient extends SimpleApiClient {
  constructor(userStore: UserStore) {
    super(userStore, undefined);
  }

  override fetch(url: string, method: string, data: Data | undefined) {
    if (!url.startsWith("/")) url = `/${url}`;
    const uri = getBackendUrl();
    return super.fetch(`${uri}${url}`, method, data);
  }
}

export function MyApiClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticationStore = useAuthenticationStore();
  const apiClient = useMemo(
    () => new MyApiClient(authenticationStore),
    [authenticationStore]
  );
  return (
    <ApiClientContext.Provider value={apiClient}>
      {children}
    </ApiClientContext.Provider>
  );
}
