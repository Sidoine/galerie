/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class UserController {
	constructor(private client: helpers.ApiClient) {}

    addUserToGallery = (userId: string, galleryId: number, viewModel: views.GalleryMemberPatch) => {
        return this.client.fetchJson<views.GalleryMember>(`api/users/${userId}/galleries/${galleryId}`, "POST", JSON.stringify(viewModel));
    }

    getAll = () => {
        return this.client.fetchJson<views.User[]>("api/users/", "GET", undefined);
    }

    getUserGalleries = (userId: string) => {
        return this.client.fetchJson<views.GalleryMember[]>(`api/users/${userId}/galleries`, "GET", undefined);
    }

    isAdministrator = () => {
        return this.client.fetchJson<boolean>("api/users/administrator", "GET", undefined);
    }

    patch = (id: string, viewModel: views.UserPatch) => {
        return this.client.fetch(`api/users/${id}`, "PATCH", JSON.stringify(viewModel));
    }

    removeUserFromGallery = (userId: string, galleryId: number) => {
        return this.client.fetch(`api/users/${userId}/galleries/${galleryId}`, "DELETE", undefined);
    }

    updateUserGalleryMembership = (userId: string, galleryId: number, viewModel: views.GalleryMemberPatch) => {
        return this.client.fetchJson<views.GalleryMember>(`api/users/${userId}/galleries/${galleryId}`, "PATCH", JSON.stringify(viewModel));
    }
}

