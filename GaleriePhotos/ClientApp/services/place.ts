/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class PlaceController {
	constructor(private client: helpers.ApiClient) {}

    assignPhotoToPlace = (placeId: number, photoId: number) => {
        return this.client.fetch(`api/places/${placeId}/photos/${photoId}`, "POST", undefined);
    }

    getPlacePhotos = (id: number) => {
        return this.client.fetchJson<views.PlacePhotos>(`api/places/${id}/photos`, "GET", undefined);
    }

    getPlacesByGallery = (galleryId: number) => {
        return this.client.fetchJson<views.Place[]>(`api/places/gallery/${galleryId}`, "GET", undefined);
    }
}

