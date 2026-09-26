# VehicleLookup frontend

Angular interface for selecting a make, model year, and optional vehicle type.

## Development

Run the API first, then run these commands from this folder:

```bash
npm ci
npm start
```

Open http://localhost:4200. API requests use the target in `proxy.conf.json`:

- IIS Express: `http://localhost:63787`
- Backend HTTP launch profile: `http://localhost:5035`

Restart the development server after changing the proxy target.

## Build and test

```bash
npm run build
npm test -- --watch=false
```

The production output is in `dist/vehicle-lookup-client/browser`.
Tests cover validation, API parameters, request cancellation, error handling, and make selection.

See the [project README](../README.md) for Docker and backend setup.
