/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class DashboardController {
	constructor(private client: helpers.ApiClient) {}

    getGpsBackfillProgress = (galleryId: number) => {
        return this.client.fetchJson<views.GpsBackfillProgress>(`api/galleries/${galleryId}/dashboard/gps-backfill-progress`, "GET", undefined);
    }

    getStatistics = (galleryId: number, limit?: number) => {
        return this.client.fetchJson<views.DashboardStatistics>(`api/galleries/${galleryId}/dashboard/statistics` + helpers.getQueryString({ limit: limit }), "GET", undefined);
    }
}

