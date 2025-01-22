/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class PhotoController {
	constructor(private client: helpers.ApiClient) {}

    get = (directoryId: number, id: number) => {
        return this.client.fetchJson<views.PhotoFull>(`api/directory/${directoryId}/photos/${id}`, "GET", undefined);
    }

    getImage = (directoryId: number, id: number) => {
        return this.client.fetch(`api/directory/${directoryId}/photos/${id}/image`, "GET", undefined);
    }

    getThumbnail = (directoryId: number, id: number) => {
        return this.client.fetch(`api/directory/${directoryId}/photos/${id}/thumbnail`, "GET", undefined);
    }

    patch = (directoryId: number, id: number, viewModel: views.PhotoPatch) => {
        return this.client.fetch(`api/directory/${directoryId}/photos/${id}`, "PATCH", JSON.stringify(viewModel));
    }
}

