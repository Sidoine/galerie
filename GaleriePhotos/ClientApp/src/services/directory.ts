/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class DirectoryController {
	constructor(private client: helpers.ApiClient) {}

    delete(id: number) {
        return this.client.fetch(`api/Directory/${id}`, "DELETE", undefined);
    }

    get(baseDirectory: string | null) {
        return this.client.fetchJson<views.Directory[]>("api/Directory/" + helpers.getQueryString({ baseDirectory: baseDirectory }), "GET", undefined);
    }

    getById(id: number) {
        return this.client.fetchJson<string>(`api/Directory/${id}`, "GET", undefined);
    }

    getContent(baseDirectory: string | null) {
        return this.client.fetchJson<views.Photo[]>("api/Directory/file-names" + helpers.getQueryString({ baseDirectory: baseDirectory }), "GET", undefined);
    }

    put(id: number, value: string) {
        return this.client.fetch(`api/Directory/${id}`, "PUT", JSON.stringify(value));
    }
}

