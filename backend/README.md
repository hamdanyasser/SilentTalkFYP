# SilentTalk Backend - ASP.NET Core 8 API

## Overview
This is the backend API for the SilentTalk sign language communication platform, built with ASP.NET Core 8 following Clean Architecture principles.

## Architecture

### Project Structure
```
backend/
├── src/
│   ├── SilentTalk.Api/              # Web API layer (Controllers, Program.cs)
│   ├── SilentTalk.Application/      # Application layer (CQRS, Services)
│   ├── SilentTalk.Domain/           # Domain entities and interfaces
│   ├── SilentTalk.Infrastructure/   # Data access and external services
│   └── SilentTalk.Shared/           # DTOs and common models
└── tests/
    ├── SilentTalk.UnitTests/        # Unit tests
    └── SilentTalk.IntegrationTests/ # Integration tests
```

### Layers

#### Domain Layer (`SilentTalk.Domain`)
- **Entities**: Core business entities (User, Call, Participant, Contact, ForumPost, Resource)
- **Interfaces**: Repository interfaces following Repository Pattern
- **No Dependencies**: Pure domain logic with no external dependencies

#### Infrastructure Layer (`SilentTalk.Infrastructure`)
- **Data Access**: Entity Framework Core DbContext
- **Repositories**: Concrete implementations of repository interfaces
- **External Services**: Integrations with external systems
- **Dependencies**: EF Core, Identity, MongoDB, Redis

#### Application Layer (`SilentTalk.Application`)
- **CQRS**: Commands and Queries (to be implemented with MediatR)
- **Business Logic**: Application services
- **Validators**: FluentValidation
- **Dependencies**: Domain, MediatR, FluentValidation

#### API Layer (`SilentTalk.Api`)
- **Controllers**: REST API endpoints
- **Services**: Authentication, JWT token management
- **Middleware**: Rate limiting, logging, error handling
- **SignalR Hubs**: Real-time communication
- **Dependencies**: All other layers

## Technology Stack

- **.NET**: 8.0
- **Language**: C# 12
- **Database**: SQL Server / PostgreSQL (configurable)
- **ORM**: Entity Framework Core 8.0
- **Authentication**: ASP.NET Core Identity + JWT
- **Real-time**: SignalR
- **Caching**: Redis (StackExchange.Redis)
- **Logging**: Serilog
- **Validation**: FluentValidation
- **Rate Limiting**: AspNetCoreRateLimit
- **API Documentation**: Swagger/OpenAPI

## Features Implemented

### FR-001: User Authentication & Authorization ✅
- User registration with password validation
- Email/password login
- JWT token generation
- Refresh token support (partial)
- Account lockout after 5 failed attempts
- Password reset functionality (partial)
- Email confirmation (partial)

### Database Schema ✅
- User entity with Identity integration
- Call and Participant entities for video conferencing
- Contact entity for contact management
- ForumPost entity for community discussions
- Resource entity for educational content

### Repository Pattern ✅
- Generic repository with common CRUD operations
- Specialized repositories for each entity
- Unit of Work pattern for transaction management

## Getting Started

### Prerequisites
- .NET 8.0 SDK
- SQL Server 2019+ or PostgreSQL 13+
- Redis (optional, for caching and refresh tokens)
- Visual Studio 2022 or VS Code with C# extension

### Configuration

1. **Database Connection**
   Edit `appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Database=SilentTalkDb;Trusted_Connection=True;",
     "Redis": "localhost:6379"
   },
   "UsePostgreSQL": false
   ```

2. **JWT Settings**
   Update the JWT secret key (must be at least 32 characters):
   ```json
   "JwtSettings": {
     "SecretKey": "YourSuperSecretKeyHere",
     "Issuer": "SilentTalkAPI",
     "Audience": "SilentTalkClient",
     "ExpirationMinutes": 60
   }
   ```

3. **CORS Origins**
   ```json
   "CorsOrigins": ["http://localhost:5173", "http://localhost:3000"]
   ```

### Running the Application

1. **Restore packages**
   ```bash
   cd backend
   dotnet restore
   ```

2. **Update database**
   ```bash
   cd src/SilentTalk.Api
   dotnet ef database update
   ```

3. **Run the API**
   ```bash
   dotnet run
   ```

4. **Access Swagger UI**
   Navigate to `https://localhost:5001/swagger`

### Running Tests

```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true /p:CoverageReportsFormat=opencover

# Run specific test project
dotnet test tests/SilentTalk.UnitTests
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout (requires auth)
- `GET /api/auth/confirm-email` - Confirm email address
- `POST /api/auth/forgot-password` - Request password reset

### Users (`/api/users`) - To be implemented
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile
- `GET /api/users/{id}/contacts` - Get user contacts

### Calls (`/api/calls`) - To be implemented
- `POST /api/calls` - Initiate video call
- `GET /api/calls/{id}` - Get call details
- `POST /api/calls/{id}/participants` - Add participant
- `POST /api/calls/{id}/end` - End call

## Security

### Implemented
- ✅ JWT Bearer authentication
- ✅ Password hashing with Identity
- ✅ Rate limiting (100 requests/minute, 1000 requests/hour)
- ✅ CORS policy
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ HTTPS redirection
- ✅ Account lockout
- ✅ Password complexity requirements

### To Be Implemented
- ⏳ 2FA (Two-Factor Authentication)
- ⏳ OAuth2 integration (Google, Microsoft)
- ⏳ Input sanitization middleware
- ⏳ SQL injection prevention (handled by EF Core)
- ⏳ XSS protection

## Performance Targets (NFR-001)
- API response time: < 200ms (p95)
- Database query time: < 50ms (p90)
- Concurrent users: 10,000+

## Logging

Logs are written to:
- Console (all environments)
- File: `logs/silenttalk-{date}.log` (rolling daily, 7-day retention)
- Elasticsearch (production, to be configured)

Log levels:
- Development: Debug
- Production: Information

## Database Migrations

```bash
# Create new migration
dotnet ef migrations add MigrationName --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api

# Update database
dotnet ef database update --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api

# Remove last migration
dotnet ef migrations remove --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api
```

## Development Guidelines

1. **Code Style**: Follow C# coding conventions
2. **Testing**: Maintain 80%+ code coverage
3. **Logging**: Use structured logging with Serilog
4. **Error Handling**: Use try-catch with proper logging
5. **Async/Await**: Use async methods for I/O operations
6. **Repository Pattern**: Always access data through repositories
7. **Dependency Injection**: Register services in Program.cs

## Next Steps

1. Implement remaining controllers (Users, Calls, Contacts, Forum, Resources)
2. Add CQRS with MediatR
3. Implement SignalR hubs for real-time communication
4. Add MongoDB integration for messages
5. Implement comprehensive unit and integration tests
6. Add API versioning
7. Implement 2FA and OAuth2
8. Add background jobs with Hangfire/Quartz
9. Implement email service
10. Add comprehensive API documentation

## License
(To be determined)
