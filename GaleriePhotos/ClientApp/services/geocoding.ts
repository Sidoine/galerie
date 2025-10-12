/* This is a generated file. Do not modify or all the changes will be lost. */
import * as helpers from "folke-service-helpers";
import * as views from "./views";

export class GeocodingController {
	constructor(private client: helpers.ApiClient) {}

    geocodeAddress = (request: views.AddressGeocodeRequest) => {
        return this.client.fetchJson<views.AddressGeocodeResponse>("api/geocoding/address", "POST", JSON.stringify(request));
    }
}

