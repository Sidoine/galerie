import { action, makeObservable, observable } from "mobx";
import { Place, PlacePhotos } from "../services/views";
import { PlaceController } from "../services/place";
import { createContext, useContext, useMemo } from "react";
import { useApiClient } from "folke-service-helpers";

class PlacesStore {
  places: { [galleryId: number]: Place[] } = {};
  placePhotos: { [placeId: number]: PlacePhotos } = {};
  loading = false;

  constructor(private placeService: PlaceController) {
    makeObservable(this, {
      places: observable,
      placePhotos: observable,
      loading: observable,
      setPlaces: action,
      setPlacePhotos: action,
      setLoading: action,
    });
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  async loadPlacesByGallery(galleryId: number) {
    if (this.loading || this.places[galleryId]) return;
    this.setLoading(true);
    try {
      const result = await this.placeService.getPlacesByGallery(galleryId);
      if (result.ok) {
        this.setPlaces(galleryId, result.value);
      } else {
        this.setPlaces(galleryId, []);
      }
    } catch (error) {
      console.error("PlacesStore: Error loading places for gallery:", error);
      this.setPlaces(galleryId, []);
    } finally {
      this.setLoading(false);
    }
  }

  async loadPlacePhotos(placeId: number) {
    if (this.loading || this.placePhotos[placeId]) return;
    this.setLoading(true);
    try {
      const result = await this.placeService.getPlacePhotos(placeId);
      if (result.ok) {
        this.setPlacePhotos(placeId, result.value);
      }
    } catch (error) {
      console.error("PlacesStore: Error loading place photos:", error);
    } finally {
      this.setLoading(false);
    }
  }

  setPlaces(galleryId: number, places: Place[]) {
    this.places[galleryId] = places;
  }

  setPlacePhotos(placeId: number, placePhotos: PlacePhotos) {
    this.placePhotos[placeId] = placePhotos;
  }

  getPlacesByGallery(galleryId: number): Place[] {
    return this.places[galleryId] || [];
  }

  getPlacePhotos(placeId: number): PlacePhotos | null {
    return this.placePhotos[placeId] || null;
  }
}

const PlacesStoreContext = createContext<PlacesStore | null>(null);

export function PlacesStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiClient = useApiClient();
  const placesStore = useMemo(
    () => new PlacesStore(new PlaceController(apiClient.client)),
    [apiClient]
  );

  return (
    <PlacesStoreContext.Provider value={placesStore}>
      {children}
    </PlacesStoreContext.Provider>
  );
}

export function usePlacesStore(): PlacesStore {
  const store = useContext(PlacesStoreContext);
  if (!store) {
    throw new Error("usePlacesStore must be used within a PlacesStoreProvider");
  }
  return store;
}