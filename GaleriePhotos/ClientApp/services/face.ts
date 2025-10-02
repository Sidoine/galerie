/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class FaceController {
	constructor(private client: helpers.ApiClient) {}

    assignName = (galleryId: number, faceId: number, model: views.FaceAssignName) => {
        return this.client.fetch(`api/gallery/${galleryId}/faces/${faceId}/name`, "POST", JSON.stringify(model));
    }

    getFacesByPhoto = (galleryId: number, photoId: number) => {
        return this.client.fetchJson<views.Face[]>(`api/gallery/${galleryId}/photos/${photoId}/faces`, "GET", undefined);
    }

    getName = (galleryId: number, id: number) => {
        return this.client.fetchJson<views.FaceName>(`api/gallery/${galleryId}/faces/names/${id}`, "GET", undefined);
    }

    getNames = (galleryId: number) => {
        return this.client.fetchJson<views.FaceName[]>(`api/gallery/${galleryId}/faces/names`, "GET", undefined);
    }

    getPhotosByFaceName = (galleryId: number, id: number) => {
        return this.client.fetchJson<views.Photo[]>(`api/gallery/${galleryId}/face-names/${id}/photos`, "GET", undefined);
    }

    getSimilarFaces = (galleryId: number, model: views.SimilarFacesRequest) => {
        return this.client.fetchJson<views.Face[]>(`api/gallery/${galleryId}/faces/similar`, "POST", JSON.stringify(model));
    }

    getUnnamedFacesSample = (galleryId: number, model: views.UnnamedFacesSampleRequest) => {
        return this.client.fetchJson<views.Face[]>(`api/gallery/${galleryId}/faces/unnamed-sample`, "POST", JSON.stringify(model));
    }

    suggestName = (galleryId: number, faceId: number, model: views.FaceNameSuggestionRequest) => {
        return this.client.fetchJson<views.FaceNameSuggestionResponse>(`api/gallery/${galleryId}/faces/${faceId}/suggest-name`, "POST", JSON.stringify(model));
    }
}

