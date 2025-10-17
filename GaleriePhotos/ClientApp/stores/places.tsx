import { computed, makeObservable } from "mobx";
import {
  Month,
  MonthFull,
  Photo,
  Place,
  PlaceFull,
  Year,
  YearFull,
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
        year?: number | null,
        month?: number | null,
        sortOrder?: string,
        offset?: number,
        count?: number
      ]
    >,
    private placeYearsLoader: MapLoader<Year[], [number]>,
    private placeMonthsLoader: MapLoader<Month[], [number, number]>,
    private placePhotoCountLoader: MapLoader<
      number,
      [placeId: number, year?: number | null, month?: number | null]
    >,
    public placeController: PlaceController,
    private placeYearLoader: MapLoader<YearFull, [number, number]>,
    private placeMonthLoader: MapLoader<MonthFull, [number, number, number]>
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

  getPlaceYear(placeId: number, year: number) {
    return this.placeYearLoader.getValue(placeId, year);
  }

  getPlaceMonth(placeId: number, year: number, month: number) {
    return this.placeMonthLoader.getValue(placeId, year, month);
  }

  getCitiesByCountry(countryId: number) {
    return this.citiesLoader.getValue(this.galleryId, countryId);
  }

  /**
   * Récupère les photos d'un lieu, éventuellement filtrées par année, mois avec pagination offset-based.
   */
  getPlacePhotos(
    placeId: number,
    year?: number | null,
    month?: number | null,
    sortOrder?: string,
    offset?: number,
    count?: number
  ): Photo[] | null {
    return this.placePhotosLoader.getValue(
      placeId,
      year,
      month,
      sortOrder,
      offset,
      count
    );
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
    const placeYearsLoader = new MapLoader(placeController.getPlaceYears);
    const placeMonthsLoader = new MapLoader(placeController.getPlaceMonths);
    const placeYearLoader = new MapLoader(placeController.getPlaceYear);
    const placeMonthLoader = new MapLoader(placeController.getPlaceMonth);
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
      placePhotoCountLoader,
      placeController,
      placeYearLoader,
      placeMonthLoader
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
