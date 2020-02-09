/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";

export class PhotoController {
	constructor(private client: helpers.ApiClient) {}

    getImage(path?: string) {
        return this.client.fetch("api/Photo/image" + helpers.getQueryString({ path: path }), "GET", undefined);
    }
}

