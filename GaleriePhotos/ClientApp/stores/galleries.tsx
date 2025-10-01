import { action, makeObservable, observable } from "mobx";
import { GalleryMember } from "../services/views";
import { MeController } from "../services/me";
import { createContext, useContext, useMemo } from "react";
import { useApiClient } from "folke-service-helpers";

class GalleriesStore {
  memberships: GalleryMember[] | null = null;
  loading = false;
  constructor(private meService: MeController) {
    makeObservable(this, {
      memberships: observable.ref,
      loading: observable,
      setResult: action,
      load: action,
      setLoading: action,
    });
  }

  get(id: number) {
    return this.memberships?.find((m) => m.galleryId === id) || null;
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  async load() {
    if (this.loading || this.memberships) return;
    this.setLoading(true);
    try {
      const result = await this.meService.getMyGalleries();
      if (result.ok) this.setResult(result.value);
      else this.setResult([]);
    } catch (error) {
      console.error("GalleriesStore: Error loading galleries:", error);
      this.setResult([]);
    } finally {
      this.setLoading(false);
    }
  }

  setResult(memberships: GalleryMember[]) {
    this.memberships = memberships;
  }
}

const GalleriesStoreContext = createContext<GalleriesStore | null>(null);

export function GalleriesStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiClient = useApiClient();
  const store = useMemo(
    () => new GalleriesStore(new MeController(apiClient)),
    [apiClient]
  );
  return (
    <GalleriesStoreContext.Provider value={store}>
      {children}
    </GalleriesStoreContext.Provider>
  );
}

export function useGalleriesStore() {
  const store = useContext(GalleriesStoreContext);
  if (!store) throw new Error("No GalleriesStoreContext provided");

  return store;
}
