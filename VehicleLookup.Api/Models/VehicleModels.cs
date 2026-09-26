using System.Text.Json.Serialization;

namespace VehicleLookup.Api.Models;

public class NhtsaResponse<T>
{
    public List<T>? Results { get; set; }
}

public class VehicleMake
{
    [JsonPropertyName("Make_ID")]
    public int Id { get; set; }

    [JsonPropertyName("Make_Name")]
    public string Name { get; set; } = string.Empty;
}

public class VehicleType
{
    [JsonPropertyName("VehicleTypeId")]
    public int Id { get; set; }

    [JsonPropertyName("VehicleTypeName")]
    public string Name { get; set; } = string.Empty;
}

public class VehicleModel
{
    [JsonPropertyName("Model_ID")]
    public int Id { get; set; }

    [JsonPropertyName("Model_Name")]
    public string Name { get; set; } = string.Empty;
}
