# VehicleLookup

An Angular application with an ASP.NET Core API for finding vehicle models by make and model year. An optional vehicle-type filter narrows the results. Vehicle data is retrieved from NHTSA vPIC; there is no database.

## Stack

- Angular 22 and TypeScript
- ASP.NET Core 9
- NHTSA vPIC JSON APIs
- Docker multi-stage build: Node builds Angular, the .NET SDK publishes the API, and the ASP.NET runtime serves both

## Start locally with Docker (recommended)

Prerequisites: Git and Docker Desktop with its Linux engine running, or Docker Engine with the Compose plugin on Linux. Internet access is required to download dependencies and retrieve vehicle data. Local Node and .NET installations are not needed for this option.

1. Clone the repository. For a private repository, sign in with an account granted access.

   ```powershell
   git clone https://github.com/Alawneh97/VehicleLookup.git
   cd VehicleLookup
   ```

2. Build and start:

   ```powershell
   docker compose up --build -d
   ```

3. Open http://localhost:8080. Select a make, enter a model year, optionally select a type, and choose **Search models**.
4. Check container status and logs:

   ```powershell
   docker compose ps
   docker compose logs --tail=100
   ```

5. Stop and remove the project's container when finished:

   ```powershell
   docker compose down
   ```

The first build takes longer because it downloads images and packages. If port 8080 is occupied, change the left side of `8080:8080` in `compose.yaml`, for example to `8081:8080`, and use http://localhost:8081.

You can also run without Compose:

```powershell
docker build -t vehiclelookup:local .
docker run --rm -p 8080:8080 vehiclelookup:local
```

Do not run both options on the same host port at once.

## Develop locally without Docker

Prerequisites: .NET 9 SDK/runtime, Node.js 24.15.0 or newer in the 24.x line, and npm. The project target is .NET 9, so installing only a .NET 10 runtime is insufficient to run it outside Docker.

### Visual Studio and IIS Express

1. Open the solution and start `VehicleLookup.Api` with the **IIS Express** profile.
2. The committed IIS Express HTTP address is http://localhost:63787.
3. In another terminal:

   ```powershell
   cd vehicle-lookup-client
   npm ci
   npm start
   ```

4. Open http://localhost:4200. Keep both processes running.

`proxy.conf.json` forwards Angular requests under `/api/` to http://localhost:63787. This proxy is used only by `ng serve`.

### Command-line backend instead of IIS Express

From the repository root:

```powershell
dotnet run --project VehicleLookup.Api --launch-profile http
```

This uses http://localhost:5035. Change the target in `vehicle-lookup-client/proxy.conf.json` to `http://localhost:5035`, then restart `npm start`. Use either this backend or IIS Express as the proxy target.

## Build and test

From the repository root:

```powershell
dotnet build VehicleLookup.Api -c Release
cd vehicle-lookup-client
npm ci
npm run build
npm test -- --watch=false
```

The Angular tests use mocked HTTP responses to check input validation, criteria forwarding, cancellation of obsolete searches, error/empty-result handling, and searchable make selection. They do not verify NHTSA availability.

### Manual checks in Docker

- http://localhost:8080 displays the Angular interface, not a backend 404.
- http://localhost:8080/healthz returns `{"status":"ok"}`. This checks the application process, not NHTSA connectivity.
- http://localhost:8080/api/vehicles/makes returns an array of makes.
- http://localhost:8080/api/vehicles/makes/474/types returns types for that make.
- http://localhost:8080/api/vehicles/models?makeId=474&year=2015 returns matching models.
- http://localhost:8080/api/vehicles/models?makeId=474&year=2015&vehicleType=truck applies the type filter.
- `/api/vehicles/models?makeId=0&year=1990` returns HTTP 400.
- `/api/not-a-route` returns HTTP 404, not the Angular page.
- Selecting another make clears the previous type and model results.
- Empty model results display a message. Upstream failures display a retry action.

## API endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/vehicles/makes` | All makes, sorted by name |
| `GET /api/vehicles/makes/{makeId}/types` | Vehicle types for the selected make |
| `GET /api/vehicles/models?makeId=474&year=2015` | Models for a make and model year |
| Same models endpoint with `vehicleType=truck` | Optional type filter |
| `GET /healthz` | Application liveness |

Successful lookup responses contain objects with `id` and `name`. Invalid input returns 400, upstream request/JSON failures return 502, and upstream timeouts return 504. Requests to NHTSA time out after 30 seconds.

## Assumptions and scope

- Year means **model year**, matching NHTSA's API.
- The vehicle-type endpoint filters by make only. Its options are not claimed to be available in the selected year.
- Vehicle type is optional; leaving it blank searches all models for the make/year.
- Year validation accepts integers from 1996 to 9999. The upper limit validates four digits, not actual data coverage. Valid input may have no results.
- The makes endpoint includes makes beyond passenger cars, including trailers and motorcycles. Its data is not silently restricted.
- Changing search criteria cancels pending requests and clears old results.

## Container behavior

ASP.NET Core serves Angular from `wwwroot` and handles `/api/` on the same origin, so the production build does not use the development proxy or require CORS configuration. Unknown non-file frontend routes fall back to Angular; unknown `/api/` routes remain 404.

The final image runs as the built-in non-root .NET container user on port 8080. It contains the compiled frontend and published backend, not Node, the .NET SDK, or local dependencies.

The container uses HTTP internally. `HttpsRedirection__Enabled=false` disables application-level redirects because the container has no HTTPS certificate/port. For HTTPS hosting, terminate TLS at a configured reverse proxy or load balancer. Outside Docker, the existing production redirect default is retained. Never assume this Docker setup creates an HTTPS endpoint by itself.

## Deployment

AWS deployment is pending. The application can run as a single Docker container. Confirm the account's free-tier eligibility before creating resources, and add the live URL here once deployment is complete.

## References

- NHTSA API documentation: https://vpic.nhtsa.dot.gov/api/
- ASP.NET Core Docker documentation: https://learn.microsoft.com/aspnet/core/host-and-deploy/docker/building-net-docker-images
- AWS Free Tier eligibility: https://aws.amazon.com/free/
