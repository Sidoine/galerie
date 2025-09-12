/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class MeController {
	constructor(private client: helpers.ApiClient) {}

    getMyGalleries = () => {
        return this.client.fetchJson<views.GalleryMember[]>("api/me/galleries", "GET", undefined);
    }
}

