/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class GalleryController {
	constructor(private client: helpers.ApiClient) {}

    create = (model: views.GalleryCreate) => {
        return this.client.fetchJson<views.Gallery>("api/galleries/", "POST", JSON.stringify(model));
    }

    getAll = () => {
        return this.client.fetchJson<views.Gallery[]>("api/galleries/", "GET", undefined);
    }
}

