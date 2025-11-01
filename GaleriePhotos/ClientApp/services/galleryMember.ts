/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class GalleryMemberController {
	constructor(private client: helpers.ApiClient) {}

    addUserToGallery = (userId: string, galleryId: number, viewModel: views.GalleryMemberPatch) => {
        return this.client.fetchJson<views.GalleryMember>(`api/galleries/${galleryId}/members/${userId}`, "POST", JSON.stringify(viewModel));
    }

    getGalleryMembers = (galleryId: number) => {
        return this.client.fetchJson<views.GalleryMember[]>(`api/galleries/${galleryId}/members`, "GET", undefined);
    }

    removeUserFromGallery = (userId: string, galleryId: number) => {
        return this.client.fetch(`api/galleries/${galleryId}/members/${userId}`, "DELETE", undefined);
    }

    updateUserGalleryMembership = (userId: string, galleryId: number, viewModel: views.GalleryMemberPatch) => {
        return this.client.fetchJson<views.GalleryMember>(`api/galleries/${galleryId}/members/${userId}`, "PATCH", JSON.stringify(viewModel));
    }
}

