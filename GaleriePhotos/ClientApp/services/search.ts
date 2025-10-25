/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class SearchController {
	constructor(private client: helpers.ApiClient) {}

    addRecentSearch = (galleryId: number, request: views.RecentSearchCreate) => {
        return this.client.fetchJson<views.RecentSearch[]>(`api/gallery/${galleryId}/search/recent`, "POST", JSON.stringify(request));
    }

    getPhotos = (galleryId: number, query?: string, sortOrder?: string, offset?: number, count?: number, startDate?: string | null) => {
        return this.client.fetchJson<views.Photo[]>(`api/gallery/${galleryId}/search/photos` + helpers.getQueryString({ query: query, sortOrder: sortOrder, offset: offset, count: count, startDate: startDate }), "GET", undefined);
    }

    getRecentSearches = (galleryId: number) => {
        return this.client.fetchJson<views.RecentSearch[]>(`api/gallery/${galleryId}/search/recent`, "GET", undefined);
    }

    getSummary = (galleryId: number, query?: string) => {
        return this.client.fetchJson<views.SearchResultFull>(`api/gallery/${galleryId}/search/summary` + helpers.getQueryString({ query: query }), "GET", undefined);
    }
}

