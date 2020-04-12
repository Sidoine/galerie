/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class UserController {
	constructor(private client: helpers.ApiClient) {}

    getAll() {
        return this.client.fetchJson<views.User[]>("api/users/", "GET", undefined);
    }

    isAdministrator() {
        return this.client.fetchJson<boolean>("api/users/administrator", "GET", undefined);
    }

    patch(id: string, viewModel: views.UserPatch) {
        return this.client.fetch(`api/users/${id}`, "PATCH", JSON.stringify(viewModel));
    }
}

