using System.Text.Json.Serialization;

namespace GaleriePhotos.Services.Seafile;

public class SeafileDirItem
{
    [JsonPropertyName("modifier_email")]
    public string? ModifierEmail { get; set; }

    [JsonPropertyName("size")]
    public int Size { get; set; }

    [JsonPropertyName("is_locked")]
    public bool IsLocked { get; set; }

    [JsonPropertyName("lock_owner")]
    public string? LockOwner { get; set; }

    [JsonPropertyName("lock_time")]
    public int LockTime { get; set; }

    [JsonPropertyName("locked_by_me")]
    public string? LockedByMe { get; set; }

    [JsonPropertyName("type")]
    public required string Type { get; set; }

    [JsonPropertyName("name")]
    public required string Name { get; set; }

    [JsonPropertyName("mtime")]
    public int Mtime { get; set; }

    [JsonPropertyName("id")]
    public required string Id { get; set; }

    [JsonPropertyName("permission")]
    public required string Permission { get; set; }

    [JsonPropertyName("modifier_contact_email")]
    public string? ModifierContactEmail { get; set; }

    [JsonPropertyName("modifier_name")]
    public string? ModifierName { get; set; }

    [JsonPropertyName("starred")]
    public bool Starred { get; set; }
}
