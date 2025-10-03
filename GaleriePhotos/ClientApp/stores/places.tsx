import { computed, makeObservable } from "mobx";
import { Month, Photo, Place, Year } from "../services/views";
import { PlaceController } from "../services/place";
import { createContext, useContext, useMemo } from "react";
import { MapLoader, useApiClient, ValueLoader } from "folke-service-helpers";

class PlacesStore {
  constructor(
    public galleryId: number,
    private countriesLoader: ValueLoader<Place[], [number]>,
    private placeLoader: MapLoader<Place, [number]>,
    private citiesLoader: MapLoader<Place[], [number, number]>,
    private placePhotosLoader: MapLoader<
      Photo[],
      [placeId: number, year?: number | null, month?: number | null]
    >,
    private placeYearsLoader: MapLoader<Year[], [number]>,
    private placeMonthsLoader: MapLoader<Month[], [number, number]>,
    private placePhotoCountLoader: MapLoader<
      number,
      [placeId: number, year?: number | null, month?: number | null]
    >
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

  getPlacePhotos(
    placeId: number,
    year?: number | null,
    month?: number | null
  ): Photo[] | null {
    return this.placePhotosLoader.getValue(placeId, year, month);
  }

  getPlacePhotoCount(
    placeId: number,
    year?: number | null,
    month?: number | null
  ): number | null {
    return this.placePhotoCountLoader.getValue(placeId, year, month);
  }

  getPlaceYears(placeId: number): Year[] | null {
    return this.placeYearsLoader.getValue(placeId);
  }

  getPlaceMonths(placeId: number, year: number): Month[] | null {
    return this.placeMonthsLoader.getValue(placeId, year);
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
    const placeYearsLoader = new MapLoader(placeController.getPlaceYears);
    const placeMonthsLoader = new MapLoader(placeController.getPlaceMonths);
    const placePhotoCountLoader = new MapLoader(
      placeController.getPlacePhotoCount
    );
    return new PlacesStore(
      galleryId,
      countriesLoader,
      placeLoader,
      citiesLoader,
      placePhotosLoader,
      placeYearsLoader,
      placeMonthsLoader,
      placePhotoCountLoader
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
