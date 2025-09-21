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

    getById = (id: number) => {
        return this.client.fetchJson<views.Gallery>(`api/galleries/${id}`, "GET", undefined);
    }

    getSeafileApiKey = (id: number, request: views.SeafileApiKeyRequest) => {
        return this.client.fetchJson<views.SeafileApiKeyResponse>(`api/galleries/${id}/seafile/apikey`, "POST", JSON.stringify(request));
    }

    getSeafileRepositories = (request: views.SeafileRepositoriesRequest) => {
        return this.client.fetchJson<views.SeafileRepositoriesResponse>("api/galleries/seafile/repositories", "POST", JSON.stringify(request));
    }

    update = (id: number, model: views.GalleryPatch) => {
        return this.client.fetchJson<views.Gallery>(`api/galleries/${id}`, "PATCH", JSON.stringify(model));
    }
}

