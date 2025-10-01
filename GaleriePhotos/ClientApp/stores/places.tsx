import { action, makeObservable, observable } from "mobx";
import { Place, PlacePhotos } from "../services/views";
import { PlaceController } from "../services/place";
import { createContext, useContext, useMemo } from "react";
import { useApiClient } from "folke-service-helpers";

class PlacesStore {
  countries: { [galleryId: number]: Place[] } = {};
  cities: { [countryId: number]: Place[] } = {};
  placePhotos: { [placeId: number]: PlacePhotos } = {};
  loading = false;

  constructor(private placeService: PlaceController) {
    makeObservable(this, {
      countries: observable,
      cities: observable,
      placePhotos: observable,
      loading: observable,
      setCountries: action,
      setCities: action,
      setPlacePhotos: action,
      setLoading: action,
    });
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  async loadCountriesByGallery(galleryId: number) {
    if (this.loading || this.countries[galleryId]) return;
    this.setLoading(true);
    try {
      const result = await this.placeService.getCountriesByGallery(galleryId);
      if (result.ok) {
        this.setCountries(galleryId, result.value);
      } else {
        this.setCountries(galleryId, []);
      }
    } catch (error) {
      console.error("PlacesStore: Error loading countries for gallery:", error);
      this.setCountries(galleryId, []);
    } finally {
      this.setLoading(false);
    }
  }

  async loadCitiesByCountry(galleryId: number, countryId: number) {
    if (this.loading || this.cities[countryId]) return;
    this.setLoading(true);
    try {
      const result = await this.placeService.getCitiesByCountry(galleryId, countryId);
      if (result.ok) {
        this.setCities(countryId, result.value);
      } else {
        this.setCities(countryId, []);
      }
    } catch (error) {
      console.error("PlacesStore: Error loading cities for country:", error);
      this.setCities(countryId, []);
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

  setCountries(galleryId: number, countries: Place[]) {
    this.countries[galleryId] = countries;
  }

  setCities(countryId: number, cities: Place[]) {
    this.cities[countryId] = cities;
  }

  setPlacePhotos(placeId: number, placePhotos: PlacePhotos) {
    this.placePhotos[placeId] = placePhotos;
  }

  getCountriesByGallery(galleryId: number): Place[] {
    return this.countries[galleryId] || [];
  }

  getCitiesByCountry(countryId: number): Place[] {
    return this.cities[countryId] || [];
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
    () => new PlacesStore(new PlaceController(apiClient)),
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