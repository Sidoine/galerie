/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class SearchController {
	constructor(private client: helpers.ApiClient) {}

    getPhotos = (galleryId: number, query?: string, minDate?: string | null, maxDate?: string | null) => {
        return this.client.fetchJson<views.Photo[]>(`api/gallery/${galleryId}/search/photos` + helpers.getQueryString({ query: query, minDate: minDate, maxDate: maxDate }), "GET", undefined);
    }

    getSummary = (galleryId: number, query?: string) => {
        return this.client.fetchJson<views.SearchResultFull>(`api/gallery/${galleryId}/search/summary` + helpers.getQueryString({ query: query }), "GET", undefined);
    }
}

