import { computed, makeObservable } from "mobx";
import {
  Photo,
  Place,
  PlaceFull,
} from "../services/views";
import { PlaceController } from "../services/place";
import { createContext, useContext, useMemo } from "react";
import { MapLoader, useApiClient, ValueLoader } from "folke-service-helpers";

class PlacesStore {
  constructor(
    public galleryId: number,
    private countriesLoader: ValueLoader<Place[], [number]>,
    private placeLoader: MapLoader<PlaceFull, [number]>,
    private citiesLoader: MapLoader<Place[], [number, number]>,
    private placePhotosLoader: MapLoader<
      Photo[],
      [
        placeId: number,
        sortOrder?: string,
        offset?: number,
        count?: number,
        startDate?: string | null
      ]
    >,
    private placePhotoCountLoader: MapLoader<number, [placeId: number]>,
    public placeController: PlaceController
  ) {
    makeObservable(this, {
      countries: computed,
    });
  }

  get countries() {
    return this.countriesLoader.getValue(this.galleryId);
  }

  getPlace(id: number) {
    return this.placeLoader.getValue(id);
  }

  getCitiesByCountry(countryId: number) {
    return this.citiesLoader.getValue(this.galleryId, countryId);
  }

  /**
   * Récupère les photos d'un lieu avec pagination offset-based.
   */
  getPlacePhotos(
    placeId: number,
    sortOrder?: string,
    offset?: number,
    count?: number
  ): Photo[] | null {
    return this.placePhotosLoader.getValue(
      placeId,
      sortOrder,
      offset,
      count
    );
  }

  getPlacePhotoCount(placeId: number): number | null {
    return this.placePhotoCountLoader.getValue(placeId);
  }

  async setCover(placeId: number, photoId: number) {
    const result = await this.placeController.setPlaceCover(placeId, photoId);
    this.placeLoader.cache.clear();
    return result;
  }
}

const PlacesStoreContext = createContext<PlacesStore | null>(null);

export function PlacesStoreProvider({
  children,
  galleryId,
}: {
  children: React.ReactNode;
  galleryId: number;
}) {
  const apiClient = useApiClient();
  const placesStore = useMemo(() => {
    const placeController = new PlaceController(apiClient);
    const countriesLoader = new ValueLoader(
      placeController.getCountriesByGallery
    );
    const placeLoader = new MapLoader(placeController.getPlaceById);
    const citiesLoader = new MapLoader(placeController.getCitiesByCountry);
    const placePhotosLoader = new MapLoader(placeController.getPlacePhotos);
    const placePhotoCountLoader = new MapLoader(
      placeController.getPlacePhotoCount
    );
    return new PlacesStore(
      galleryId,
      countriesLoader,
      placeLoader,
      citiesLoader,
      placePhotosLoader,
      placePhotoCountLoader,
      placeController
    );
  }, [apiClient, galleryId]);

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
