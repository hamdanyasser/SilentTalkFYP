FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["src/SilentTalk.Api/SilentTalk.Api.csproj", "src/SilentTalk.Api/"]
COPY ["src/SilentTalk.Application/SilentTalk.Application.csproj", "src/SilentTalk.Application/"]
COPY ["src/SilentTalk.Domain/SilentTalk.Domain.csproj", "src/SilentTalk.Domain/"]
COPY ["src/SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj", "src/SilentTalk.Infrastructure/"]
COPY ["src/SilentTalk.Shared/SilentTalk.Shared.csproj", "src/SilentTalk.Shared/"]

RUN dotnet restore "src/SilentTalk.Api/SilentTalk.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/src/SilentTalk.Api"
RUN dotnet build "SilentTalk.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SilentTalk.Api.csproj" -c Release -o /app/publish

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SilentTalk.Api.dll"]
