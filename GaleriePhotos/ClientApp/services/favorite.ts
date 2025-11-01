/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class FavoriteController {
	constructor(private client: helpers.ApiClient) {}

    getFavoritePhotos = (galleryId: number, sortOrder?: string, offset?: number, count?: number, startDate?: string | null) => {
        return this.client.fetchJson<views.Photo[]>(`api/galleries/${galleryId}/favorites/photos` + helpers.getQueryString({ sortOrder: sortOrder, offset: offset, count: count, startDate: startDate }), "GET", undefined);
    }
}

