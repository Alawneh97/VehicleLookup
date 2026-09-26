# VehicleLookup

This is a small vehicle lookup project I built using Angular and ASP.NET Core.

The app gets vehicle data from the NHTSA API. You can choose a car make, enter the model year, and optionally choose a vehicle type to get the matching models.

## Technologies

- Angular
- TypeScript
- ASP.NET Core
- NHTSA API
- Docker
- AWS EC2

## Run with Docker

Clone the project:

```bash
git clone https://github.com/Alawneh97/VehicleLookup.git
cd VehicleLookup
```

Then run:

```bash
docker compose up --build -d
```

Open:

```text
http://localhost:8080
```

To stop it:

```bash
docker compose down
```

## Run locally without Docker

For the backend:

```bash
dotnet run --project VehicleLookup.Api --launch-profile http
```

For the Angular app:

```bash
cd vehicle-lookup-client
npm install
npm start
```

Then open:

```text
http://localhost:4200
```

## Main API endpoints

```text
GET /api/vehicles/makes
GET /api/vehicles/makes/{makeId}/types
GET /api/vehicles/models?makeId=474&year=2015
```

## Testing

Backend build:

```bash
dotnet build VehicleLookup.Api -c Release
```

Frontend build and tests:

```bash
cd vehicle-lookup-client
npm install
npm run build
npm test -- --watch=false
```

## AWS Deployment

I deployed the project on AWS EC2 using Docker.

Live URL:

```text
http://13.62.99.251
```

The Docker container runs the Angular frontend and ASP.NET Core API together.

## Notes

- Vehicle data comes directly from NHTSA, so there is no database.
- Vehicle type is optional.
- The year field is used as the model year.
