/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class FaceController {
	constructor(private client: helpers.ApiClient) {}

    assignName = (faceId: number, model: views.FaceAssignName) => {
        return this.client.fetch(`api/faces/${faceId}/name`, "POST", JSON.stringify(model));
    }

    getDistinctNames = () => {
        return this.client.fetchJson<string[]>("api/faces/names", "GET", undefined);
    }

    getFacesByPhoto = (photoId: number) => {
        return this.client.fetchJson<views.Face[]>(`api/faces/photo/${photoId}`, "GET", undefined);
    }

    getSimilarFaces = (model: views.SimilarFacesRequest) => {
        return this.client.fetchJson<views.Face[]>("api/faces/similar", "POST", JSON.stringify(model));
    }

    getUnnamedFacesSample = (model: views.UnnamedFacesSampleRequest) => {
        return this.client.fetchJson<views.Face[]>("api/faces/unnamed-sample", "POST", JSON.stringify(model));
    }
}

