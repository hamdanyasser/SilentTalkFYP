# Database Persistence Fix Documentation

## Problem Statement

The SilentTalk application was experiencing data loss on container restarts. User registrations and profile updates were not persisting because Entity Framework Core was configured to use `EnsureCreated()` instead of proper migrations.

## Root Cause

In `server/src/SilentTalk.Api/Program.cs` (line 319), the application was using:

```csharp
dbContext.Database.EnsureCreated();
```

**Issue**: `EnsureCreated()` is designed for testing and temporary databases. It:
- Creates the database schema without using migrations
- Does not track schema changes properly
- Can cause conflicts with existing PostgreSQL databases
- May result in data not being properly committed or structured

## Solution

### 1. Changed Database Initialization Method

**File**: `server/src/SilentTalk.Api/Program.cs`

**Before**:
```csharp
Log.Information("Ensuring database is created...");
dbContext.Database.EnsureCreated();
Log.Information("Database created successfully");
```

**After**:
```csharp
Log.Information("Applying database migrations...");
await dbContext.Database.MigrateAsync();
Log.Information("Database migrations applied successfully");
```

**Why**: `MigrateAsync()` properly applies Entity Framework migrations to the database, ensuring:
- Proper schema management
- Data integrity
- Compatibility with PostgreSQL
- Persistent data storage

### 2. Migration Infrastructure

The application already has migration infrastructure in place:

**File**: `server/entrypoint.sh`

The entrypoint script:
1. Checks if migrations exist (line 16)
2. Creates initial migration if none exist (lines 22-33)
3. Applies all pending migrations (lines 49-53)
4. Starts the application

**File**: `server/Dockerfile`

The Dockerfile:
1. Installs `dotnet-ef` tools globally (line 18)
2. Adds tools to PATH (line 21)
3. Uses entrypoint script to run migrations before app start (line 44)

### 3. Database Configuration

**Verified Configurations**:

- **PostgreSQL Connection String** (`appsettings.json`):
  ```json
  "DefaultConnection": "Host=postgres;Port=5432;Database=silentstalk_db;Username=silentstalk;Password=silentstalk_dev_password"
  ```

- **Docker Compose Volume** (`infrastructure/docker/docker-compose.yml`):
  ```yaml
  volumes:
    - postgres-data:/var/lib/postgresql/data
  ```

- **DbContext Configuration** (`Program.cs`):
  ```csharp
  builder.Services.AddDbContext<ApplicationDbContext>(options =>
      options.UseNpgsql(
          builder.Configuration.GetConnectionString("DefaultConnection"),
          b => b.MigrationsAssembly("SilentTalk.Infrastructure")));
  ```

## Testing Database Persistence

A test script has been created to verify data persistence across container restarts.

**File**: `server/test-persistence.sh`

**Usage**:
```bash
cd server
./test-persistence.sh
```

**What it does**:
1. Registers a new test user
2. Verifies the user can login
3. Prompts you to restart the Docker containers
4. Waits for server to be ready
5. Verifies the user still exists after restart
6. Reports success or failure

**Manual Testing Steps**:

1. Start the application:
   ```bash
   cd infrastructure/docker
   docker-compose up -d
   ```

2. Register a user via API:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPass123!",
       "firstName": "Test",
       "lastName": "User"
     }'
   ```

3. Restart the server container:
   ```bash
   docker-compose restart server
   ```

4. Try logging in with the same user:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPass123!"
     }'
   ```

5. **Expected Result**: Login should succeed, proving data persisted.

## Migration Workflow

### How Migrations Work Now:

1. **Container Start**:
   - `entrypoint.sh` checks for migrations directory
   - If no migrations exist, creates `InitialCreate` migration
   - Runs `dotnet ef database update` to apply all pending migrations
   - Application starts

2. **Application Start**:
   - `Program.cs` calls `MigrateAsync()` as a safety net
   - Ensures any pending migrations are applied
   - Seeds default roles (USER, ADMIN, INTERPRETER)

3. **Data Operations**:
   - All data operations use proper EF Core DbContext
   - Changes are tracked and committed to PostgreSQL
   - Data persists in the `postgres-data` Docker volume

### Creating New Migrations:

When you modify entity models, create a new migration:

```bash
# From within the server container
docker exec -it silents-talk-server bash
cd /app
dotnet ef migrations add YourMigrationName \
  --project src/SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj \
  --startup-project src/SilentTalk.Api/SilentTalk.Api.csproj \
  --output-dir Migrations
```

Or from your host machine (if .NET SDK installed):

```bash
cd server
dotnet ef migrations add YourMigrationName \
  --project src/SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj \
  --startup-project src/SilentTalk.Api/SilentTalk.Api.csproj \
  --output-dir Migrations
```

## Verification

### Check Migrations Status:

```bash
docker exec -it silents-talk-server dotnet ef migrations list \
  --project /app/src/SilentTalk.Infrastructure/SilentTalk.Infrastructure.csproj \
  --startup-project /app/src/SilentTalk.Api/SilentTalk.Api.csproj
```

### Check Database Tables:

```bash
docker exec -it silents-talk-postgres psql -U silentstalk -d silentstalk_db -c "\dt"
```

### Check Migration History:

```bash
docker exec -it silents-talk-postgres psql -U silentstalk -d silentstalk_db -c "SELECT * FROM \"__EFMigrationsHistory\";"
```

## Changes Summary

| File | Change | Purpose |
|------|--------|---------|
| `Program.cs` | Changed `EnsureCreated()` to `MigrateAsync()` | Enable proper migration-based schema management |
| `test-persistence.sh` | New file | Automated testing of data persistence |
| `DATABASE_PERSISTENCE_FIX.md` | New file | Documentation of changes and testing procedures |

## Benefits

1. **Data Persistence**: User data now survives container restarts
2. **Schema Versioning**: Database schema changes are tracked via migrations
3. **Production Ready**: Proper migration strategy for deployment
4. **Rollback Capability**: Can revert schema changes if needed
5. **Team Collaboration**: Migration files in source control ensure consistency

## Troubleshooting

### If data still doesn't persist:

1. **Check PostgreSQL volume**:
   ```bash
   docker volume ls | grep postgres
   docker volume inspect infrastructure_postgres-data
   ```

2. **Check migration logs**:
   ```bash
   docker logs silents-talk-server | grep -i migration
   ```

3. **Verify connection string**:
   ```bash
   docker exec silents-talk-server env | grep ConnectionStrings
   ```

4. **Reset database** (⚠️ WARNING: Deletes all data):
   ```bash
   cd infrastructure/docker
   docker-compose down -v
   docker-compose up -d
   ```

## References

- [EF Core Migrations Overview](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)
- [EnsureCreated vs Migrate](https://learn.microsoft.com/en-us/ef/core/managing-schemas/ensure-created)
- [PostgreSQL with EF Core](https://www.npgsql.org/efcore/)
