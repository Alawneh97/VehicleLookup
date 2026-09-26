FROM node:24-bookworm-slim AS frontend
WORKDIR /src/frontend
COPY vehicle-lookup-client/package.json vehicle-lookup-client/package-lock.json ./
RUN npm ci
COPY vehicle-lookup-client/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend
WORKDIR /src
COPY VehicleLookup.Api/VehicleLookup.Api.csproj VehicleLookup.Api/
RUN dotnet restore VehicleLookup.Api/VehicleLookup.Api.csproj
COPY VehicleLookup.Api/ VehicleLookup.Api/
RUN dotnet publish VehicleLookup.Api/VehicleLookup.Api.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV HttpsRedirection__Enabled=false
COPY --from=backend /app/publish/ ./
COPY --from=frontend /src/frontend/dist/vehicle-lookup-client/browser/ ./wwwroot/
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "VehicleLookup.Api.dll"]
