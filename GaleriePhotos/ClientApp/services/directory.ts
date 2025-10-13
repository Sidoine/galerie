/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class DirectoryController {
	constructor(private client: helpers.ApiClient) {}

    bulkUpdateDate = (id: number, viewModel: views.DirectoryBulkUpdateDate) => {
        return this.client.fetch(`api/directories/${id}/bulk-update-date`, "POST", JSON.stringify(viewModel));
    }

    bulkUpdateLocation = (id: number, viewModel: views.DirectoryBulkUpdateLocation) => {
        return this.client.fetch(`api/directories/${id}/bulk-update-location`, "POST", JSON.stringify(viewModel));
    }

    get = (id: number) => {
        return this.client.fetchJson<views.DirectoryFull>(`api/directories/${id}`, "GET", undefined);
    }

    getGalleryRoot = (galleryId: number) => {
        return this.client.fetchJson<views.DirectoryFull>(`api/directories/root/${galleryId}`, "GET", undefined);
    }

    getPhotos = (id: number) => {
        return this.client.fetchJson<views.Photo[]>(`api/directories/${id}/photos`, "GET", undefined);
    }

    getSubdirectories = (id: number) => {
        return this.client.fetchJson<views.Directory[]>(`api/directories/${id}/directories`, "GET", undefined);
    }

    patch = (id: number, viewModel: views.DirectoryPatch) => {
        return this.client.fetch(`api/directories/${id}`, "PATCH", JSON.stringify(viewModel));
    }

    setParentCover = (id: number) => {
        return this.client.fetch(`api/directories/${id}/set-parent-cover`, "POST", undefined);
    }
}

