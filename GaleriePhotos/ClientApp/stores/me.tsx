import { SingletonLoader, useApiClient } from "folke-service-helpers";
import { computed, makeObservable } from "mobx";
import { User } from "../services/views";
import { createContext, useContext, useMemo } from "react";
import { MeController } from "../services/me";

export class MeStore {
  constructor(private meLoader: SingletonLoader<User>) {
    makeObservable(this, {
      me: computed,
      administrator: computed,
    });
  }

  get me() {
    return this.meLoader.getValue();
  }

  get administrator() {
    return this.me?.administrator || false;
  }
}

const MeStoreContext = createContext<MeStore | null>(null);

export function MeStoreProvider({ children }: { children: React.ReactNode }) {
  const apiClient = useApiClient();
  const store = useMemo(() => {
    const meService = new MeController(apiClient);
    return new MeStore(new SingletonLoader(() => meService.getMe()));
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
