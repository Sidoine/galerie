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
        return this.client.fetchJson<views.Place>(`api/places/${id}`, "GET", undefined);
    }

    getPlaceMonths = (id: number, year: number) => {
        return this.client.fetchJson<views.Month[]>(`api/places/${id}/years/${year}/monthes`, "GET", undefined);
    }

    getPlacePhotoCount = (id: number, year?: number | null, month?: number | null) => {
        return this.client.fetchJson<number>(`api/places/${id}/photos/count` + helpers.getQueryString({ year: year, month: month }), "GET", undefined);
    }

    getPlacePhotos = (id: number, year?: number | null, month?: number | null) => {
        return this.client.fetchJson<views.Photo[]>(`api/places/${id}/photos` + helpers.getQueryString({ year: year, month: month }), "GET", undefined);
    }

    getPlacesByGallery = (galleryId: number) => {
        return this.client.fetchJson<views.Place[]>(`api/places/gallery/${galleryId}`, "GET", undefined);
    }

    getPlaceYears = (id: number) => {
        return this.client.fetchJson<views.Year[]>(`api/places/${id}/years`, "GET", undefined);
    }

    setPlaceCover = (placeId: number, photoId: number) => {
        return this.client.fetch(`api/places/${placeId}/cover/${photoId}`, "POST", undefined);
    }
}

