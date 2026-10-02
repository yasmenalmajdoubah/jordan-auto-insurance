# Build Angular
FROM node:20-alpine AS frontend
WORKDIR /src/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npx ng build --configuration=production

# Build .NET API
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/*.csproj ./backend/
RUN dotnet restore ./backend/JordanAutoInsurance.Api.csproj
COPY backend/ ./backend/
WORKDIR /src/backend
RUN dotnet publish JordanAutoInsurance.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=frontend /src/frontend/dist/frontend/browser ./wwwroot
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "JordanAutoInsurance.Api.dll"]
