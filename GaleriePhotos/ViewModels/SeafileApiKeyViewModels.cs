using System.ComponentModel.DataAnnotations;

namespace GaleriePhotos.ViewModels;

public class SeafileApiKeyRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class SeafileApiKeyResponse
{
    public string ApiKey { get; set; } = string.Empty;
}
