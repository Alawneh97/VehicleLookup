using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using VehicleLookup.Api.Services;

namespace VehicleLookup.Api.Controllers;

[ApiController]
[Route("api/vehicles")]
public class VehiclesController : ControllerBase
{
    private readonly NhtsaClient _client;
    private readonly ILogger<VehiclesController> _logger;

    public VehiclesController(NhtsaClient client, ILogger<VehiclesController> logger)
    {
        _client = client;
        _logger = logger;
    }

    [HttpGet("makes")]
    public Task<IActionResult> GetMakes(CancellationToken cancellationToken)
    {
        return ExecuteAsync(async () =>
        {
            var makes = await _client.GetMakesAsync(cancellationToken);
            return makes.Select(x => new { x.Id, x.Name });
        }, cancellationToken);
    }

    [HttpGet("makes/{makeId:int}/types")]
    public Task<IActionResult> GetVehicleTypes(
        [Range(1, int.MaxValue)] int makeId, CancellationToken cancellationToken)
    {
        return ExecuteAsync(async () =>
        {
            var types = await _client.GetVehicleTypesAsync(makeId, cancellationToken);
            return types.Select(x => new { x.Id, x.Name });
        }, cancellationToken);
    }

    [HttpGet("models")]
    public Task<IActionResult> GetModels(
        [FromQuery, Range(1, int.MaxValue)] int makeId,
        [FromQuery, Range(1996, 9999)] int year,
        [FromQuery, StringLength(100)] string? vehicleType,
        CancellationToken cancellationToken)
    {
        return ExecuteAsync(async () =>
        {
            var models = await _client.GetModelsAsync(makeId, year, vehicleType, cancellationToken);
            return models.Select(x => new { x.Id, x.Name });
        }, cancellationToken);
    }

    private async Task<IActionResult> ExecuteAsync<T>(Func<Task<T>> action, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await action());
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return Problem(statusCode: StatusCodes.Status504GatewayTimeout,
                title: "The vehicle data service took too long to respond. Please try again.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "NHTSA request failed.");
            return Problem(statusCode: StatusCodes.Status502BadGateway,
                title: "The vehicle data service is unavailable. Please try again.");
        }
        catch (JsonException exception)
        {
            _logger.LogError(exception, "Invalid NHTSA response.");
            return Problem(statusCode: StatusCodes.Status502BadGateway,
                title: "The vehicle data service returned an invalid response.");
        }
    }
}
