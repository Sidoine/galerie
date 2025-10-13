using GaleriePhotos.ViewModels;
using Microsoft.Extensions.Logging;
using System;
using System.Globalization;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace GaleriePhotos.Services
{
    public class GeocodingService
    {
        private readonly HttpClient httpClient;
        private readonly ILogger<GeocodingService> logger;

        public GeocodingService(HttpClient httpClient, ILogger<GeocodingService> logger)
        {
            this.httpClient = httpClient;
            this.logger = logger;
        }

        public async Task<AddressGeocodeResponse> GeocodeAddressAsync(string address)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(address))
                {
                    return new AddressGeocodeResponse("L'adresse ne peut pas être vide");
                }

                var url = $"https://nominatim.openstreetmap.org/search?format=json&q={Uri.EscapeDataString(address)}&limit=1&addressdetails=1";
                
                httpClient.DefaultRequestHeaders.Clear();
                httpClient.DefaultRequestHeaders.Add("User-Agent", "GaleriePhotos/1.0 (https://github.com/Sidoine/galerie)");

                var response = await httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                var json = JsonDocument.Parse(jsonString);

                if (json.RootElement.ValueKind == JsonValueKind.Array && json.RootElement.GetArrayLength() > 0)
                {
                    var result = json.RootElement[0];

                    if (result.TryGetProperty("lat", out var latElement) &&
                        result.TryGetProperty("lon", out var lonElement) &&
                        result.TryGetProperty("display_name", out var displayNameElement))
                    {
                        if (double.TryParse(latElement.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var lat) &&
                            double.TryParse(lonElement.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var lon))
                        {
                            var formattedAddress = displayNameElement.GetString() ?? address;
                            return new AddressGeocodeResponse(lat, lon, formattedAddress);
                        }
                    }
                }

                return new AddressGeocodeResponse("Impossible de trouver les coordonnées pour cette adresse");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Erreur lors du géocodage de l'adresse: {Address}", address);
                return new AddressGeocodeResponse("Erreur lors de la géolocalisation de l'adresse");
            }
        }
    }
}