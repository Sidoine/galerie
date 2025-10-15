import { action, makeObservable, observable } from "mobx";
import { Gallery, GalleryFull } from "../services/views";
import { MeController } from "../services/me";
import { createContext, useContext, useMemo } from "react";
import { MapLoader, useApiClient } from "folke-service-helpers";
import { GalleryController } from "@/services/gallery";

class GalleriesStore {
  memberships: Gallery[] | null = null;
  loading = false;
  constructor(
    private meService: MeController,
    private galleryLoader: MapLoader<GalleryFull, [number]>,
    private galleryService: GalleryController
  ) {
    makeObservable(this, {
      memberships: observable.ref,
      loading: observable,
      setResult: action,
      load: action,
      setLoading: action,
    });
  }

  get(id: number) {
    return this.galleryLoader.getValue(id);
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

  setResult(memberships: Gallery[]) {
    this.memberships = memberships;
  }

  loadPhotos(
    galleryId: number,
    startDate?: string | null,
    endDate?: string | null
  ) {
    return this.galleryService.getPhotos(galleryId, startDate, endDate);
  }
}

const GalleriesStoreContext = createContext<GalleriesStore | null>(null);

export function GalleriesStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiClient = useApiClient();
  const store = useMemo(() => {
    const meController = new MeController(apiClient);
    const galleryController = new GalleryController(apiClient);
    const galleryLoader = new MapLoader<GalleryFull, [number]>(
      galleryController.getById
    );
    return new GalleriesStore(meController, galleryLoader, galleryController);
  }, [apiClient]);
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
