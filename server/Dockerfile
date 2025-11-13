# ============================================
# Multi-stage Dockerfile for ASP.NET Core 8
# ============================================

# ============================================
# Stage 1: Development (with hot reload)
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS development

WORKDIR /app

# Install necessary tools
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY . .

# Restore dependencies
RUN dotnet restore

# Expose ports
EXPOSE 5000

# Set development environment
ENV ASPNETCORE_ENVIRONMENT=Development
ENV ASPNETCORE_URLS=http://+:5000

# Run with hot reload
CMD ["dotnet", "watch", "run", "--project", "src/SilentTalk.Api/SilentTalk.Api.csproj", "--no-launch-profile"]

# ============================================
# Stage 2: Build (compile application)
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy solution and project files
COPY *.sln ./
COPY src/SilentTalk.Api/SilentTalk.Api.csproj src/SilentTalk.Api/
COPY src/SilentTalk.Application/SilentTalk.Application.csproj src/SilentTalk.Application/
COPY src/SilentTalk.Domain/SilentTalk.Domain.csproj src/SilentTalk.Domain/
COPY src/SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj src/SilentTalk.Infrastructure/

# Restore dependencies
RUN dotnet restore

# Copy all source code
COPY . .

# Build the application
WORKDIR /src/src/SilentTalk.Api
RUN dotnet build SilentTalk.Api.csproj -c Release -o /app/build

# ============================================
# Stage 3: Publish (prepare for production)
# ============================================
FROM build AS publish

RUN dotnet publish SilentTalk.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# ============================================
# Stage 4: Production (minimal runtime image)
# ============================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS production

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published application
COPY --from=publish /app/publish .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 5000

# Set production environment
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run the application
ENTRYPOINT ["dotnet", "SilentTalk.Api.dll"]
