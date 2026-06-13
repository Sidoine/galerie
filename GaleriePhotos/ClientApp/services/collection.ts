/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class CollectionController {
	constructor(private client: helpers.ApiClient) {}

    addPhotosToCollection = (galleryId: number, collectionId: number, viewModel: views.PhotoCollectionAddPhotos) => {
        return this.client.fetchJson<number>(`api/galleries/${galleryId}/collections/${collectionId}/photos`, "POST", JSON.stringify(viewModel));
    }

    createCollection = (galleryId: number, viewModel: views.PhotoCollectionCreate) => {
        return this.client.fetchJson<views.PhotoCollection>(`api/galleries/${galleryId}/collections`, "POST", JSON.stringify(viewModel));
    }

    getCollectionPhotos = (galleryId: number, collectionId: number, sortOrder?: string, offset?: number, count?: number, startDate?: string | null) => {
        return this.client.fetchJson<views.Photo[]>(`api/galleries/${galleryId}/collections/${collectionId}/photos` + helpers.getQueryString({ sortOrder: sortOrder, offset: offset, count: count, startDate: startDate }), "GET", undefined);
    }

    getCollections = (galleryId: number) => {
        return this.client.fetchJson<views.PhotoCollection[]>(`api/galleries/${galleryId}/collections`, "GET", undefined);
    }

    removePhotosFromCollection = (galleryId: number, collectionId: number, viewModel: views.PhotoCollectionRemovePhotos) => {
        return this.client.fetchJson<number>(`api/galleries/${galleryId}/collections/${collectionId}/photos/remove`, "POST", JSON.stringify(viewModel));
    }
}

