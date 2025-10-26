/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class DashboardController {
	constructor(private client: helpers.ApiClient) {}

    getStatistics = (galleryId: number, limit?: number) => {
        return this.client.fetchJson<views.DashboardStatistics>(`api/galleries/${galleryId}/dashboard/statistics` + helpers.getQueryString({ limit: limit }), "GET", undefined);
    }
}

