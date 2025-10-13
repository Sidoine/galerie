/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class PhotoController {
	constructor(private client: helpers.ApiClient) {}

    get = (id: number) => {
        return this.client.fetchJson<views.PhotoFull>(`api/photos/${id}`, "GET", undefined);
    }

    getImage = (publicId: string) => {
        return this.client.fetch(`api/photos/${publicId}/image`, "GET", undefined);
    }

    getThumbnail = (publicId: string) => {
        return this.client.fetch(`api/photos/${publicId}/thumbnail`, "GET", undefined);
    }

    patch = (id: number, viewModel: views.PhotoPatch) => {
        return this.client.fetch(`api/photos/${id}`, "PATCH", JSON.stringify(viewModel));
    }

    rotate = (id: number, viewModel: views.PhotoRotate) => {
        return this.client.fetch(`api/photos/${id}/rotate`, "PATCH", JSON.stringify(viewModel));
    }

    setAccess = (id: number, viewModel: views.PhotoAccess) => {
        return this.client.fetch(`api/photos/${id}/access`, "PATCH", JSON.stringify(viewModel));
    }
}

