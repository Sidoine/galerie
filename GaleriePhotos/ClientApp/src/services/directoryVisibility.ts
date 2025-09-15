/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class DirectoryVisibilityController {
	constructor(private client: helpers.ApiClient) {}

    delete = (galleryId: number, id: number) => {
        return this.client.fetch(`api/galleries/${galleryId}/directory-visibilities/${id}`, "DELETE", undefined);
    }

    getAll = (galleryId: number) => {
        return this.client.fetchJson<views.GalleryDirectoryVisibility[]>(`api/galleries/${galleryId}/directory-visibilities/`, "GET", undefined);
    }

    getById = (galleryId: number, id: number) => {
        return this.client.fetchJson<views.GalleryDirectoryVisibility>(`api/galleries/${galleryId}/directory-visibilities/${id}`, "GET", undefined);
    }

    post = (galleryId: number, model: views.GalleryDirectoryVisibilityCreate) => {
        return this.client.fetchJson<views.GalleryDirectoryVisibility>(`api/galleries/${galleryId}/directory-visibilities/`, "POST", JSON.stringify(model));
    }

    update = (galleryId: number, id: number, model: views.GalleryDirectoryVisibilityPatch) => {
        return this.client.fetchJson<views.GalleryDirectoryVisibility>(`api/galleries/${galleryId}/directory-visibilities/${id}`, "PATCH", JSON.stringify(model));
    }
}

