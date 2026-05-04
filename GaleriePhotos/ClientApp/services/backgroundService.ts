/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class BackgroundServiceController {
	constructor(private client: helpers.ApiClient) {}

    getStates = () => {
        return this.client.fetchJson<views.BackgroundServicesState>("api/background-services/states", "GET", undefined);
    }

    resetGalleryScan = (galleryId: number) => {
        return this.client.fetch(`api/background-services/gallery-scan/${galleryId}/reset`, "POST", undefined);
    }
}

