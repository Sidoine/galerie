import { SingletonLoader, useApiClient } from "folke-service-helpers";
import { action, computed, makeObservable, observable } from "mobx";
import { User } from "../services/views";
import { createContext, useContext, useMemo } from "react";
import { MeController } from "../services/me";
import { AuthenticationProps, useAuthenticationStore } from "./authentication";

export class MeStore {
  public user: User | null = null;
  public loading = false;

  constructor(
    private authentication: AuthenticationProps,
    private meService: MeController
  ) {
    makeObservable(this, {
      me: computed,
      administrator: computed,
      user: observable,
      loading: observable,
      loadMe: action,
      setUser: action,
    });
    this.loadMe();
  }

  async loadMe() {
    this.loading = true;
    const result = await this.meService.getMe();
    if (result.ok) {
      this.setUser(result.value);
    } else {
      this.authentication.clearCredentials();
      this.setUser(null);
    }
  }

  setUser(user: User | null) {
    this.user = user;
    this.loading = false;
  }

  get me() {
    return this.user;
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
    return new MeStore(authentication, meService);
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
