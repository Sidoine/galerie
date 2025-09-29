import { SingletonLoader, useApiClient } from "folke-service-helpers";
import { action, computed, makeObservable, observable } from "mobx";
import { User } from "../services/views";
import { createContext, useContext, useMemo } from "react";
import { MeController } from "../services/me";
import { AuthenticationProps, useAuthenticationStore } from "./authentication";

export class MeStore {
  constructor(
    private meController: MeController,
    private authentication: AuthenticationProps
  ) {
    makeObservable(this, {
      me: observable,
      administrator: computed,
    });
    this.loadMe();
  }

  private async loadMe() {
    const result = await this.meController.getMe();
    if (result.ok) {
      action(() => (this.me = result.value));
    } else {
      this.authentication.clearCredentials();
    }
  }

  me: User | null = null;

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
    return new MeStore(meService, authentication);
  }, [apiClient]);
  return (
    <MeStoreContext.Provider value={store}>{children}</MeStoreContext.Provider>
  );
}

export function useMeStore() {
  const store = useContext(MeStoreContext);
  if (!store) throw new Error("No MeStoreContext provided");
  return store;
}
