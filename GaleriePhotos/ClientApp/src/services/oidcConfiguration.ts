/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";

export class OidcConfigurationController {
	constructor(private client: helpers.ApiClient) {}

    getClientRequestParameters = (clientId: string) => {
        return this.client.fetch(`todo/_configuration/${clientId}`, "GET", undefined);
    }
}

