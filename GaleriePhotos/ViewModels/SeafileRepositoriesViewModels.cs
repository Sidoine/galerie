using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GaleriePhotos.ViewModels;

public class SeafileRepositoriesRequest
{
    [Required]
    public string ApiKey { get; set; } = string.Empty;

    [Required]
    public string ServerUrl { get; set; } = string.Empty;
}

public class SeafileRepositoryViewModel
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public long Size { get; set; }
    public string Permission { get; set; } = string.Empty;
    public bool Encrypted { get; set; }
    public string Owner { get; set; } = string.Empty;
}

public class SeafileRepositoriesResponse
{
    public List<SeafileRepositoryViewModel> Repositories { get; set; } = new();
}