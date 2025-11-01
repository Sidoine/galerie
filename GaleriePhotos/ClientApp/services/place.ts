/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class PlaceController {
	constructor(private client: helpers.ApiClient) {}

    assignPhotoToPlace = (placeId: number, photoId: number) => {
        return this.client.fetch(`api/places/${placeId}/photos/${photoId}`, "POST", undefined);
    }

    getCitiesByCountry = (galleryId: number, countryId: number) => {
        return this.client.fetchJson<views.Place[]>(`api/places/gallery/${galleryId}/countries/${countryId}/cities`, "GET", undefined);
    }

    getCountriesByGallery = (galleryId: number) => {
        return this.client.fetchJson<views.Place[]>(`api/places/gallery/${galleryId}/countries`, "GET", undefined);
    }

    getPlaceById = (id: number) => {
        return this.client.fetchJson<views.PlaceFull>(`api/places/${id}`, "GET", undefined);
    }

    getPlacePhotoCount = (id: number) => {
        return this.client.fetchJson<number>(`api/places/${id}/photos/count`, "GET", undefined);
    }

    getPlacePhotos = (id: number, sortOrder?: string, offset?: number, count?: number, startDate?: string | null) => {
        return this.client.fetchJson<views.Photo[]>(`api/places/${id}/photos` + helpers.getQueryString({ sortOrder: sortOrder, offset: offset, count: count, startDate: startDate }), "GET", undefined);
    }

    getPlacesByGallery = (galleryId: number) => {
        return this.client.fetchJson<views.Place[]>(`api/places/gallery/${galleryId}`, "GET", undefined);
    }

    mergeDuplicatePlaces = (galleryId: number) => {
        return this.client.fetchJson<number>(`api/places/gallery/${galleryId}/merge-duplicates`, "GET", undefined);
    }

    setPlaceCover = (placeId: number, photoId: number) => {
        return this.client.fetch(`api/places/${placeId}/cover/${photoId}`, "POST", undefined);
    }
}

