using System.Text.Json;
using VehicleLookup.Api.Models;

namespace VehicleLookup.Api.Services;

public class NhtsaClient
{
    private readonly HttpClient _httpClient;

    public NhtsaClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<VehicleMake>> GetMakesAsync(CancellationToken cancellationToken)
    {
        var results = await GetResultsAsync<VehicleMake>("GetAllMakes?format=json", cancellationToken);
        return results.OrderBy(x => x.Name).ToList();
    }

    public async Task<List<VehicleType>> GetVehicleTypesAsync(int makeId, CancellationToken cancellationToken)
    {
        var results = await GetResultsAsync<VehicleType>(
            $"GetVehicleTypesForMakeId/{makeId}?format=json", cancellationToken);
        return results.OrderBy(x => x.Name).ToList();
    }

    public async Task<List<VehicleModel>> GetModelsAsync(
        int makeId, int year, string? vehicleType, CancellationToken cancellationToken)
    {
        var path = $"GetModelsForMakeIdYear/makeId/{makeId}/modelyear/{year}";

        if (!string.IsNullOrWhiteSpace(vehicleType))
        {
            path += $"/vehicletype/{Uri.EscapeDataString(vehicleType.Trim())}";
        }

        var results = await GetResultsAsync<VehicleModel>($"{path}?format=json", cancellationToken);
        return results.OrderBy(x => x.Name).ToList();
    }

    private async Task<List<T>> GetResultsAsync<T>(string path, CancellationToken cancellationToken)
    {
        var response = await _httpClient.GetFromJsonAsync<NhtsaResponse<T>>(path, cancellationToken);
        return response?.Results ?? throw new JsonException("NHTSA returned an invalid response.");
    }
}
