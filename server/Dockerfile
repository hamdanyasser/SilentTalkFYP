# ============================================
# Multi-stage Dockerfile for ASP.NET Core 8
# ============================================

# ============================================
# Stage 1: Development (with hot reload)
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS development

WORKDIR /app

# Install necessary tools including dotnet-ef
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Entity Framework Core tools globally
RUN dotnet tool install --global dotnet-ef --version 8.0.0

# Add dotnet tools to PATH
ENV PATH="${PATH}:/root/.dotnet/tools"

# Copy project files
COPY . .

# Set permissions for entrypoint script
RUN chmod +x /app/entrypoint.sh

# Restore dependencies
RUN dotnet restore

# Build the Infrastructure project to ensure migrations are compiled
RUN dotnet build src/SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj -c Debug

# Expose ports
EXPOSE 5000

# Set development environment
ENV ASPNETCORE_ENVIRONMENT=Development
ENV ASPNETCORE_URLS=http://+:5000

# Use entrypoint script to run migrations before starting app
ENTRYPOINT ["/app/entrypoint.sh"]

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
