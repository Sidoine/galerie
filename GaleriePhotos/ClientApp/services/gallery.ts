/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class GalleryController {
	constructor(private client: helpers.ApiClient) {}

    create = (model: views.GalleryCreate) => {
        return this.client.fetchJson<views.GallerySettings>("api/galleries/", "POST", JSON.stringify(model));
    }

    getAllSettings = () => {
        return this.client.fetchJson<views.GallerySettings[]>("api/galleries/", "GET", undefined);
    }

    getById = (id: number) => {
        return this.client.fetchJson<views.GalleryFull>(`api/galleries/${id}`, "GET", undefined);
    }

    getPhotos = (id: number, sortOrder?: string, offset?: number, count?: number) => {
        return this.client.fetchJson<views.Photo[]>(`api/galleries/${id}/photos` + helpers.getQueryString({ sortOrder: sortOrder, offset: offset, count: count }), "GET", undefined);
    }

    getSeafileApiKey = (id: number, request: views.SeafileApiKeyRequest) => {
        return this.client.fetchJson<views.SeafileApiKeyResponse>(`api/galleries/${id}/seafile/apikey`, "POST", JSON.stringify(request));
    }

    getSeafileRepositories = (request: views.SeafileRepositoriesRequest) => {
        return this.client.fetchJson<views.SeafileRepositoriesResponse>("api/galleries/seafile/repositories", "POST", JSON.stringify(request));
    }

    getSettingsById = (id: number) => {
        return this.client.fetchJson<views.GallerySettings>(`api/galleries/${id}/settings`, "GET", undefined);
    }

    update = (id: number, model: views.GalleryPatch) => {
        return this.client.fetchJson<views.GallerySettings>(`api/galleries/${id}`, "PATCH", JSON.stringify(model));
    }
}

