import { SingletonLoader, useApiClient } from "folke-service-helpers";
import { computed, makeObservable } from "mobx";
import { User } from "../services/views";
import { createContext, useContext, useMemo } from "react";
import { MeController } from "../services/me";
import { AuthenticationProps, useAuthenticationStore } from "./authentication";

export class MeStore {
  constructor(
    private authentication: AuthenticationProps,
    private meLoader: SingletonLoader<User>
  ) {
    makeObservable(this, {
      me: computed,
      administrator: computed,
    });
  }

  get me() {
    if (this.authentication.loading) return null;
    const value = this.meLoader.getValue();
    if (value === null && !this.meLoader.isLoading) {
      this.authentication.clearCredentials();
    }
    return value;
  }

  get administrator() {
    return this.me?.administrator || false;
  }
}

const MeStoreContext = createContext<MeStore | null>(null);

export function MeStoreProvider({ children }: { children: React.ReactNode }) {
  const apiClient = useApiClient();
  const authentication = useAuthenticationStore();
  const store = useMemo(() => {
    const meService = new MeController(apiClient);
    const meLoader = new SingletonLoader(meService.getMe);
    return new MeStore(authentication, meLoader);
  }, [apiClient, authentication]);
  return (
    <MeStoreContext.Provider value={store}>{children}</MeStoreContext.Provider>
  );
}

export function useMeStore() {
  const store = useContext(MeStoreContext);
  if (!store) throw new Error("No MeStoreContext provided");
  return store;
}
