/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class DirectoryController {
	constructor(private client: helpers.ApiClient) {}

    createDirectory = (galleryId: number, model: views.DirectoryCreate) => {
        return this.client.fetchJson<views.Directory>(`api/galleries/${galleryId}/directories`, "POST", JSON.stringify(model));
    }

    get = (id: number) => {
        return this.client.fetchJson<views.DirectoryFull>(`api/directories/${id}`, "GET", undefined);
    }

    getPhotos = (id: number, sortOrder?: string, offset?: number, count?: number) => {
        return this.client.fetchJson<views.Photo[]>(`api/directories/${id}/photos` + helpers.getQueryString({ sortOrder: sortOrder, offset: offset, count: count }), "GET", undefined);
    }

    getSubdirectories = (id: number) => {
        return this.client.fetchJson<views.Directory[]>(`api/directories/${id}/subdirectories`, "GET", undefined);
    }

    patch = (id: number, viewModel: views.DirectoryPatch) => {
        return this.client.fetch(`api/directories/${id}`, "PATCH", JSON.stringify(viewModel));
    }

    renameDirectory = (id: number, model: views.DirectoryRename) => {
        return this.client.fetch(`api/directories/${id}/rename`, "PATCH", JSON.stringify(model));
    }

    setParentCover = (id: number) => {
        return this.client.fetch(`api/directories/${id}/set-parent-cover`, "POST", undefined);
    }
}

