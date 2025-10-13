namespace GaleriePhotos.ViewModels
{
    public class AddressGeocodeRequest
    {
        public required string Address { get; set; }
    }
    
    public class AddressGeocodeResponse
    {
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? FormattedAddress { get; set; }
        public bool Success { get; set; }
        public string? Error { get; set; }
        
        public AddressGeocodeResponse(double latitude, double longitude, string formattedAddress)
        {
            Latitude = latitude;
            Longitude = longitude;
            FormattedAddress = formattedAddress;
            Success = true;
        }
        
        public AddressGeocodeResponse(string error)
        {
            Error = error;
            Success = false;
        }
    }
}