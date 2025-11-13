# SilentTalk Developer Guide

> Comprehensive development guide for the SilentTalk sign language communication platform

**Version:** 1.0
**Last Updated:** 2025-11-13
**Target Audience:** Software Developers, DevOps Engineers

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Development Environment Setup](#development-environment-setup)
4. [Architecture Overview](#architecture-overview)
5. [Technology Stack](#technology-stack)
6. [Development Workflow](#development-workflow)
7. [Code Organization](#code-organization)
8. [API Development](#api-development)
9. [Frontend Development](#frontend-development)
10. [ML Service Development](#ml-service-development)
11. [Database Management](#database-management)
12. [Testing Strategy](#testing-strategy)
13. [Code Quality](#code-quality)
14. [Debugging](#debugging)
15. [Troubleshooting](#troubleshooting)
16. [Performance Optimization](#performance-optimization)
17. [Security Best Practices](#security-best-practices)
18. [Contributing Guidelines](#contributing-guidelines)
19. [References](#references)

---

## Introduction

SilentTalk is a comprehensive web platform that bridges communication gaps between deaf/hard-of-hearing individuals and the hearing community through real-time sign language recognition, video communication, and educational resources.

### Key Features

- **Real-time Sign Language Recognition**: MediaPipe-powered hand landmark detection with ONNX model inference
- **Multi-party Video Calls**: WebRTC-based video conferencing with SignalR signaling
- **Live Captions**: Real-time transcription with Text-to-Speech (TTS) support
- **Community Forum**: Discussion platform with content moderation
- **Educational Resources**: Sign language tutorials and glossary
- **Accessibility**: WCAG 2.1 AA compliant interface

### Architecture at a Glance

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│  ASP.NET    │────▶│  FastAPI    │
│  Frontend   │     │  Core API   │     │ ML Service  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼───┐   ┌───▼────┐  ┌───▼────┐
         │ Postgre│   │ MongoDB│  │  Redis │
         │  SQL   │   │        │  │        │
         └────────┘   └────────┘  └────────┘
```

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| **Docker** | 24.0+ | Container runtime |
| **Docker Compose** | 2.20+ | Multi-container orchestration |
| **Node.js** | 20+ | JavaScript runtime |
| **npm** | 9+ | Package manager |
| **.NET SDK** | 8.0+ | Backend development |
| **Python** | 3.11+ | ML service development |
| **Git** | 2.0+ | Version control |
| **Make** | (optional) | Build automation |

### Verify Installation

```bash
# Check Docker
docker --version
docker compose version

# Check Node.js and npm
node --version
npm --version

# Check .NET SDK
dotnet --version

# Check Python
python3 --version
```

### Clone Repository

```bash
git clone https://github.com/your-org/SilentTalkFYP.git
cd SilentTalkFYP
```

### Quick Start

```bash
# Install root dependencies (Husky, lint-staged)
npm install

# Start all services with Docker Compose
make dev-up

# Or without Make:
docker compose -f infrastructure/docker/docker-compose.yml up -d

# Check service health
make health
```

### Access Services

Once started, the following services will be available:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | N/A |
| **Backend API** | http://localhost:5000 | N/A |
| **Swagger UI** | http://localhost:5000/swagger | N/A |
| **ML Service** | http://localhost:8000 | N/A |
| **ML Docs** | http://localhost:8000/docs | N/A |
| **Kibana** | http://localhost:5601 | N/A |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin123 |
| **PostgreSQL** | localhost:5432 | silentstalk / silentstalk_dev_password |
| **MongoDB** | localhost:27017 | admin / admin_dev_password |
| **Redis** | localhost:6379 | redis_dev_password |

---

## Development Environment Setup

### Option 1: Docker Compose (Recommended)

Docker Compose provides a consistent development environment across all platforms.

```bash
# Start all services
make dev-up

# View logs
make dev-logs

# Stop services
make dev-down

# Clean up (removes containers but keeps volumes)
make clean

# Complete cleanup (WARNING: deletes all data)
make clean-all
```

**Advantages:**
- Consistent environment across team members
- No need to install dependencies locally
- Easy to reset and start fresh
- Matches production environment

**Disadvantages:**
- Slower hot reload compared to native
- Higher resource usage
- More complex debugging

### Option 2: Local Development

For faster iteration, you can run services locally:

#### Backend (ASP.NET Core)

```bash
cd server

# Restore dependencies
dotnet restore

# Run migrations
dotnet ef database update --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api

# Start development server
dotnet run --project src/SilentTalk.Api

# Server will start at http://localhost:5000
```

#### Frontend (React)

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend will start at http://localhost:3000
```

#### ML Service (FastAPI)

```bash
cd ml-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload

# ML service will start at http://localhost:8000
```

### IDE Setup

#### Visual Studio Code (Recommended)

**Recommended Extensions:**

```json
{
  "recommendations": [
    "ms-dotnettools.csharp",
    "ms-dotnettools.csdevkit",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "bradlc.vscode-tailwindcss",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "ms-azuretools.vscode-docker",
    "eamodio.gitlens"
  ]
}
```

**Settings:**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[csharp]": {
    "editor.defaultFormatter": "ms-dotnettools.csharp"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.workingDirectories": ["./client"]
}
```

#### Visual Studio 2022

1. Open `server/SilentTalk.sln`
2. Set `SilentTalk.Api` as startup project
3. Configure launchSettings.json for HTTPS development

#### JetBrains Rider

1. Open `server/SilentTalk.sln`
2. Configure Docker support
3. Enable EditorConfig support

---

## Architecture Overview

### System Architecture

SilentTalk follows a **microservices architecture** with three main services:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 18 + TypeScript + Vite                             │  │
│  │  - Redux Toolkit (state management)                       │  │
│  │  - Radix UI (accessible components)                       │  │
│  │  - WebRTC (video communication)                           │  │
│  │  - SignalR Client (real-time signaling)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket/SignalR
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌───────────────────┐          ┌──────────────────────────┐   │
│  │  ASP.NET Core 8   │          │  FastAPI ML Service      │   │
│  │  - REST API       │◄────────►│  - MediaPipe             │   │
│  │  - SignalR Hubs   │   HTTP   │  - ONNX Runtime          │   │
│  │  - JWT Auth       │          │  - OpenCV                │   │
│  │  - Entity FW Core │          │  - WebSocket             │   │
│  └───────────────────┘          └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ PostgreSQL   │  │   MongoDB    │  │     Redis            │ │
│  │ - Users      │  │ - Messages   │  │ - Sessions           │ │
│  │ - Contacts   │  │ - Logs       │  │ - Cache              │ │
│  │ - Resources  │  │ - Forum      │  │ - SignalR backplane  │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Architecture (Clean Architecture)

```
┌─────────────────────────────────────────────────┐
│                API Layer                         │
│  SilentTalk.Api/                                 │
│  - Controllers (REST endpoints)                  │
│  - SignalR Hubs (real-time communication)        │
│  - Middleware (auth, error handling, logging)    │
│  - Program.cs (startup configuration)            │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│            Application Layer                     │
│  SilentTalk.Application/                         │
│  - Services (business logic)                     │
│  - DTOs (data transfer objects)                  │
│  - Validators (FluentValidation)                 │
│  - Interfaces                                    │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              Domain Layer                        │
│  SilentTalk.Domain/                              │
│  - Entities (domain models)                      │
│  - Value Objects                                 │
│  - Domain Events                                 │
│  - Enums                                         │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│          Infrastructure Layer                    │
│  SilentTalk.Infrastructure/                      │
│  - DbContext (Entity Framework)                  │
│  - Repositories (data access)                    │
│  - External Service Clients                      │
│  - File Storage (MinIO)                          │
└─────────────────────────────────────────────────┘
```

**Key Patterns:**
- **Repository Pattern**: Abstraction over data access
- **Unit of Work**: Transaction management
- **Dependency Injection**: Built-in .NET DI container
- **CQRS**: Separation of reads and writes (future enhancement)

### Frontend Architecture (Feature-based)

```
client/src/
├── pages/              # Page components (routes)
│   ├── HomePage.tsx
│   ├── VideoCallPage.tsx
│   ├── ForumPage/
│   ├── contacts/
│   └── auth/
├── components/         # Reusable UI components
│   ├── captions/       # Caption overlay, history, settings
│   ├── accessibility/  # A11y panel, skip links
│   ├── ForumThreadList/
│   ├── ForumThreadView/
│   ├── CallControls/
│   └── Privacy/
├── services/           # API and business logic
│   ├── authService.ts
│   ├── webrtc/PeerConnectionManager.ts
│   ├── signalr/CallSignalingClient.ts
│   ├── ml/SignRecognitionService.ts
│   ├── tts/TTSService.ts
│   ├── forumService.ts
│   └── contactsService.ts
├── hooks/              # Custom React hooks
│   ├── useCaptions.ts
│   └── useWebRTC.ts
├── store/              # Redux store (future)
├── types/              # TypeScript type definitions
├── contexts/           # React contexts
└── utils/              # Utility functions
```

### ML Service Architecture (Layered)

```
ml-service/app/
├── main.py             # FastAPI application
├── api/                # API endpoints
│   ├── streaming.py    # WebSocket streaming
│   └── recognition.py  # REST endpoints
├── services/           # Business logic
│   ├── streaming_recognition.py
│   ├── mediapipe_extractor.py
│   └── onnx_inference.py
├── models/             # Data models (Pydantic)
├── utils/              # Utilities
└── config.py           # Configuration
```

---

## Technology Stack

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **ASP.NET Core** | 8.0 | Web framework |
| **C#** | 12 | Programming language |
| **Entity Framework Core** | 8.0 | ORM for PostgreSQL |
| **SignalR** | 8.0 | Real-time communication |
| **ASP.NET Core Identity** | 8.0 | Authentication |
| **JWT Bearer** | 8.0 | Token-based auth |
| **Serilog** | 3.1 | Structured logging |
| **Swashbuckle** | 6.5 | OpenAPI/Swagger |
| **FluentValidation** | 11.9 | Input validation |

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2 | UI framework |
| **TypeScript** | 5.3 | Type safety |
| **Vite** | 5.0 | Build tool |
| **Redux Toolkit** | 2.0 | State management (future) |
| **React Router** | 6.20 | Routing |
| **Radix UI** | 1.0 | Accessible components |
| **simple-peer** | 9.11 | WebRTC abstraction |
| **@microsoft/signalr** | 8.0 | SignalR client |
| **Sass** | 1.69 | Styling |
| **Vitest** | 1.0 | Testing |

### ML Service Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.109 | Web framework |
| **Python** | 3.11 | Programming language |
| **MediaPipe** | 0.10 | Hand landmark detection |
| **OpenCV** | 4.9 | Computer vision |
| **ONNX Runtime** | 1.16 | Model inference |
| **NumPy** | 1.26 | Numerical computing |
| **Pydantic** | 2.5 | Data validation |
| **uvicorn** | 0.26 | ASGI server |

### Infrastructure Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 16 | Relational database |
| **MongoDB** | 7.0 | Document database |
| **Redis** | 7.2 | Cache and sessions |
| **MinIO** | RELEASE.2024 | Object storage (S3-compatible) |
| **Elasticsearch** | 8.11 | Log storage |
| **Logstash** | 8.11 | Log processing |
| **Kibana** | 8.11 | Log visualization |
| **Coturn** | 4.6 | TURN/STUN server |
| **Docker** | 24.0 | Containerization |
| **Docker Compose** | 2.20 | Multi-container orchestration |

---

## Development Workflow

### Branching Strategy

We follow **Git Flow**:

```
main (production)
  │
  ├── develop (integration)
  │     │
  │     ├── feature/user-auth
  │     ├── feature/video-call
  │     ├── bugfix/caption-sync
  │     └── hotfix/security-patch
```

**Branch Types:**

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Emergency production fixes
- `release/*`: Release preparation

### Feature Development Workflow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push to remote
git push -u origin feature/my-new-feature

# 4. Create Pull Request on GitHub

# 5. After approval, merge to develop
git checkout develop
git merge feature/my-new-feature

# 6. Delete feature branch
git branch -d feature/my-new-feature
git push origin --delete feature/my-new-feature
```

### Commit Message Convention

We follow **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Build process or tooling changes

**Examples:**

```bash
feat(auth): add two-factor authentication

Implements 2FA using TOTP algorithm. Users can enable 2FA in settings.

Closes #123

---

fix(captions): resolve caption sync issue

Fixed race condition causing captions to appear out of order.

Fixes #456

---

docs(api): update authentication endpoints

Added examples for JWT token refresh.
```

### Pre-commit Hooks

Pre-commit hooks are automatically installed via Husky:

```bash
# Hooks run on every commit:
# 1. ESLint (client)
# 2. Prettier (client)
# 3. dotnet format (server)
# 4. Black (ml-service)
# 5. Flake8 (ml-service)
```

To bypass hooks (not recommended):

```bash
git commit --no-verify -m "commit message"
```

---

## Code Organization

### Backend Code Organization

```
server/src/
├── SilentTalk.Api/                 # API Layer
│   ├── Controllers/
│   │   ├── AuthController.cs       # Authentication endpoints
│   │   ├── CallController.cs       # Video call management
│   │   ├── ContactsController.cs   # Contact management
│   │   └── PrivacyController.cs    # GDPR compliance
│   ├── Hubs/
│   │   └── CallHub.cs              # SignalR real-time hub
│   ├── Middleware/
│   │   ├── ErrorHandlingMiddleware.cs
│   │   └── LoggingMiddleware.cs
│   ├── Program.cs                  # Application startup
│   ├── appsettings.json
│   └── appsettings.Development.json
├── SilentTalk.Application/         # Application Layer
│   ├── Services/
│   │   ├── AuthService.cs
│   │   ├── CallService.cs
│   │   └── PrivacyService.cs
│   ├── DTOs/
│   │   ├── Auth/
│   │   └── Call/
│   ├── Validators/
│   │   └── RegisterRequestValidator.cs
│   └── Interfaces/
│       └── IAuthService.cs
├── SilentTalk.Domain/              # Domain Layer
│   ├── Entities/
│   │   ├── User.cs
│   │   ├── Contact.cs
│   │   └── Call.cs
│   ├── Enums/
│   │   └── CallStatus.cs
│   └── Interfaces/
│       └── IRepository.cs
└── SilentTalk.Infrastructure/      # Infrastructure Layer
    ├── Data/
    │   ├── ApplicationDbContext.cs
    │   └── Migrations/
    ├── Repositories/
    │   ├── Repository.cs
    │   └── UserRepository.cs
    └── Services/
        └── MinIOStorageService.cs
```

### Frontend Code Organization

```
client/src/
├── pages/                          # Page Components
│   ├── HomePage.tsx
│   ├── VideoCallPage.tsx
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── ForumPage/
│   │   └── ForumPage.tsx
│   ├── contacts/
│   │   └── ContactsPage.tsx
│   └── PrivacySettings.tsx
├── components/                     # Reusable Components
│   ├── captions/
│   │   ├── CaptionOverlay.tsx
│   │   ├── CaptionHistoryPanel.tsx
│   │   └── CaptionSettings.tsx
│   ├── Privacy/
│   │   └── CookieConsent.tsx
│   ├── CallControls/
│   │   └── CallControls.tsx
│   └── ForumThreadList/
│       └── ForumThreadList.tsx
├── services/                       # Service Layer
│   ├── authService.ts
│   ├── webrtc/
│   │   └── PeerConnectionManager.ts
│   ├── signalr/
│   │   └── CallSignalingClient.ts
│   ├── ml/
│   │   └── SignRecognitionService.ts
│   └── forumService.ts
├── hooks/                          # Custom Hooks
│   ├── useCaptions.ts
│   └── useWebRTC.ts
├── types/                          # TypeScript Types
│   ├── auth.ts
│   ├── call.ts
│   ├── forum.ts
│   └── captions.ts
├── contexts/                       # React Contexts
│   ├── AccessibilityContext.tsx
│   └── ContactsContext.tsx
├── utils/                          # Utilities
│   ├── api.ts
│   └── contentFilter.ts
└── styles/                         # Global Styles
    ├── globals.scss
    └── variables.scss
```

---

## API Development

### Creating a New Controller

**1. Define Entity (Domain Layer)**

```csharp
// server/src/SilentTalk.Domain/Entities/Tutorial.cs
namespace SilentTalk.Domain.Entities;

public class Tutorial
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**2. Create Repository Interface (Domain Layer)**

```csharp
// server/src/SilentTalk.Domain/Interfaces/ITutorialRepository.cs
namespace SilentTalk.Domain.Interfaces;

public interface ITutorialRepository
{
    Task<IEnumerable<Tutorial>> GetAllAsync();
    Task<Tutorial?> GetByIdAsync(Guid id);
    Task<Tutorial> CreateAsync(Tutorial tutorial);
    Task<Tutorial> UpdateAsync(Tutorial tutorial);
    Task DeleteAsync(Guid id);
}
```

**3. Implement Repository (Infrastructure Layer)**

```csharp
// server/src/SilentTalk.Infrastructure/Repositories/TutorialRepository.cs
namespace SilentTalk.Infrastructure.Repositories;

public class TutorialRepository : ITutorialRepository
{
    private readonly ApplicationDbContext _context;

    public TutorialRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Tutorial>> GetAllAsync()
    {
        return await _context.Tutorials.ToListAsync();
    }

    public async Task<Tutorial?> GetByIdAsync(Guid id)
    {
        return await _context.Tutorials.FindAsync(id);
    }

    public async Task<Tutorial> CreateAsync(Tutorial tutorial)
    {
        _context.Tutorials.Add(tutorial);
        await _context.SaveChangesAsync();
        return tutorial;
    }

    public async Task<Tutorial> UpdateAsync(Tutorial tutorial)
    {
        _context.Tutorials.Update(tutorial);
        await _context.SaveChangesAsync();
        return tutorial;
    }

    public async Task DeleteAsync(Guid id)
    {
        var tutorial = await _context.Tutorials.FindAsync(id);
        if (tutorial != null)
        {
            _context.Tutorials.Remove(tutorial);
            await _context.SaveChangesAsync();
        }
    }
}
```

**4. Create DTOs (Application Layer)**

```csharp
// server/src/SilentTalk.Application/DTOs/Tutorial/TutorialDto.cs
namespace SilentTalk.Application.DTOs.Tutorial;

public record TutorialDto(
    Guid Id,
    string Title,
    string Description,
    string VideoUrl,
    DateTime CreatedAt
);

public record CreateTutorialRequest(
    string Title,
    string Description,
    string VideoUrl
);
```

**5. Create Service (Application Layer)**

```csharp
// server/src/SilentTalk.Application/Services/TutorialService.cs
namespace SilentTalk.Application.Services;

public class TutorialService : ITutorialService
{
    private readonly ITutorialRepository _repository;

    public TutorialService(ITutorialRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<TutorialDto>> GetAllTutorialsAsync()
    {
        var tutorials = await _repository.GetAllAsync();
        return tutorials.Select(t => new TutorialDto(
            t.Id,
            t.Title,
            t.Description,
            t.VideoUrl,
            t.CreatedAt
        ));
    }

    public async Task<TutorialDto?> GetTutorialByIdAsync(Guid id)
    {
        var tutorial = await _repository.GetByIdAsync(id);
        if (tutorial == null) return null;

        return new TutorialDto(
            tutorial.Id,
            tutorial.Title,
            tutorial.Description,
            tutorial.VideoUrl,
            tutorial.CreatedAt
        );
    }

    public async Task<TutorialDto> CreateTutorialAsync(CreateTutorialRequest request)
    {
        var tutorial = new Tutorial
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            VideoUrl = request.VideoUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(tutorial);
        return new TutorialDto(
            created.Id,
            created.Title,
            created.Description,
            created.VideoUrl,
            created.CreatedAt
        );
    }
}
```

**6. Create Controller (API Layer)**

```csharp
// server/src/SilentTalk.Api/Controllers/TutorialController.cs
namespace SilentTalk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TutorialController : ControllerBase
{
    private readonly ITutorialService _tutorialService;
    private readonly ILogger<TutorialController> _logger;

    public TutorialController(
        ITutorialService tutorialService,
        ILogger<TutorialController> logger)
    {
        _tutorialService = tutorialService;
        _logger = logger;
    }

    /// <summary>
    /// Get all tutorials
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TutorialDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TutorialDto>>> GetAll()
    {
        var tutorials = await _tutorialService.GetAllTutorialsAsync();
        return Ok(tutorials);
    }

    /// <summary>
    /// Get tutorial by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(TutorialDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TutorialDto>> GetById(Guid id)
    {
        var tutorial = await _tutorialService.GetTutorialByIdAsync(id);
        if (tutorial == null)
        {
            return NotFound();
        }
        return Ok(tutorial);
    }

    /// <summary>
    /// Create new tutorial
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(TutorialDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TutorialDto>> Create(CreateTutorialRequest request)
    {
        var tutorial = await _tutorialService.CreateTutorialAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = tutorial.Id }, tutorial);
    }
}
```

**7. Register Services (Program.cs)**

```csharp
// server/src/SilentTalk.Api/Program.cs
builder.Services.AddScoped<ITutorialRepository, TutorialRepository>();
builder.Services.AddScoped<ITutorialService, TutorialService>();
```

### SignalR Hub Development

**Creating a SignalR Hub:**

```csharp
// server/src/SilentTalk.Api/Hubs/NotificationHub.cs
namespace SilentTalk.Api.Hubs;

public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        _logger.LogInformation("User {UserId} connected to NotificationHub", userId);

        // Add to user-specific group
        if (userId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        _logger.LogInformation("User {UserId} disconnected from NotificationHub", userId);

        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendNotification(string userId, string message)
    {
        await Clients.Group($"user-{userId}").SendAsync("ReceiveNotification", message);
    }
}
```

**Register Hub in Program.cs:**

```csharp
app.MapHub<NotificationHub>("/hubs/notification");
```

---

## Frontend Development

### Creating a New Page Component

**1. Create Page Component**

```typescript
// client/src/pages/TutorialPage.tsx
import React, { useEffect, useState } from 'react';
import { tutorialService } from '../services/tutorialService';
import type { Tutorial } from '../types/tutorial';
import './TutorialPage.scss';

export const TutorialPage: React.FC = () => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const data = await tutorialService.getAll();
        setTutorials(data);
      } catch (err) {
        setError('Failed to load tutorials');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="tutorial-page">
      <h1>Sign Language Tutorials</h1>
      <div className="tutorial-grid">
        {tutorials.map((tutorial) => (
          <TutorialCard key={tutorial.id} tutorial={tutorial} />
        ))}
      </div>
    </div>
  );
};
```

**2. Create Service**

```typescript
// client/src/services/tutorialService.ts
import { api } from '../utils/api';
import type { Tutorial, CreateTutorialRequest } from '../types/tutorial';

export const tutorialService = {
  async getAll(): Promise<Tutorial[]> {
    const response = await api.get<Tutorial[]>('/api/tutorial');
    return response.data;
  },

  async getById(id: string): Promise<Tutorial> {
    const response = await api.get<Tutorial>(`/api/tutorial/${id}`);
    return response.data;
  },

  async create(request: CreateTutorialRequest): Promise<Tutorial> {
    const response = await api.post<Tutorial>('/api/tutorial', request);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/tutorial/${id}`);
  },
};
```

**3. Create Types**

```typescript
// client/src/types/tutorial.ts
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  createdAt: string;
}

export interface CreateTutorialRequest {
  title: string;
  description: string;
  videoUrl: string;
}
```

**4. Add Route**

```typescript
// client/src/App.tsx
import { TutorialPage } from './pages/TutorialPage';

// In your routes:
<Route path="/tutorials" element={<TutorialPage />} />
```

### Custom Hook Pattern

```typescript
// client/src/hooks/useTutorials.ts
import { useState, useEffect } from 'react';
import { tutorialService } from '../services/tutorialService';
import type { Tutorial } from '../types/tutorial';

export function useTutorials() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTutorials();
  }, []);

  const loadTutorials = async () => {
    try {
      setLoading(true);
      const data = await tutorialService.getAll();
      setTutorials(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tutorials');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createTutorial = async (request: CreateTutorialRequest) => {
    try {
      const newTutorial = await tutorialService.create(request);
      setTutorials([...tutorials, newTutorial]);
      return newTutorial;
    } catch (err) {
      setError('Failed to create tutorial');
      throw err;
    }
  };

  const deleteTutorial = async (id: string) => {
    try {
      await tutorialService.delete(id);
      setTutorials(tutorials.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete tutorial');
      throw err;
    }
  };

  return {
    tutorials,
    loading,
    error,
    loadTutorials,
    createTutorial,
    deleteTutorial,
  };
}

// Usage in component:
const { tutorials, loading, error } = useTutorials();
```

### SignalR Client Integration

```typescript
// client/src/services/signalr/NotificationClient.ts
import * as signalR from '@microsoft/signalr';

export class NotificationClient {
  private connection: signalR.HubConnection;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5000/hubs/notification', {
        accessTokenFactory: () => {
          return localStorage.getItem('authToken') || '';
        },
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.connection.on('ReceiveNotification', (message: string) => {
      this.emit('notification', message);
    });

    this.connection.onreconnecting(() => {
      console.log('Reconnecting to NotificationHub...');
    });

    this.connection.onreconnected(() => {
      console.log('Reconnected to NotificationHub');
    });
  }

  async start(): Promise<void> {
    try {
      await this.connection.start();
      console.log('Connected to NotificationHub');
    } catch (err) {
      console.error('Failed to connect to NotificationHub:', err);
      setTimeout(() => this.start(), 5000);
    }
  }

  async stop(): Promise<void> {
    await this.connection.stop();
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(callback => callback(...args));
  }
}

// Usage:
const notificationClient = new NotificationClient();
await notificationClient.start();
notificationClient.on('notification', (message) => {
  console.log('Notification:', message);
});
```

---

## ML Service Development

### Adding a New Recognition Model

**1. Define Model Interface**

```python
# ml-service/app/models/recognition.py
from pydantic import BaseModel
from typing import List, Optional

class LandmarkPoint(BaseModel):
    x: float
    y: float
    z: float

class HandLandmarks(BaseModel):
    landmarks: List[LandmarkPoint]
    handedness: str  # "Left" or "Right"

class RecognitionResult(BaseModel):
    sign: str
    confidence: float
    timestamp: float
    landmarks: Optional[HandLandmarks] = None
```

**2. Create Model Service**

```python
# ml-service/app/services/gesture_recognition.py
import numpy as np
from typing import List, Tuple
from app.models.recognition import RecognitionResult, HandLandmarks

class GestureRecognitionService:
    def __init__(self, model_path: str):
        self.model = self.load_model(model_path)
        self.labels = self.load_labels()

    def load_model(self, model_path: str):
        # Load ONNX model
        import onnxruntime as ort
        return ort.InferenceSession(model_path)

    def load_labels(self) -> List[str]:
        # Load sign language labels
        return ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
                "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

    def preprocess_landmarks(self, landmarks: HandLandmarks) -> np.ndarray:
        # Convert landmarks to model input format
        points = np.array([[lm.x, lm.y, lm.z] for lm in landmarks.landmarks])
        # Normalize
        points = points - points.mean(axis=0)
        points = points / points.std()
        return points.flatten().astype(np.float32)

    def predict(self, landmarks: HandLandmarks) -> RecognitionResult:
        # Preprocess
        input_data = self.preprocess_landmarks(landmarks)
        input_data = input_data.reshape(1, -1)

        # Run inference
        ort_inputs = {self.model.get_inputs()[0].name: input_data}
        ort_outputs = self.model.run(None, ort_inputs)
        predictions = ort_outputs[0][0]

        # Get top prediction
        top_idx = np.argmax(predictions)
        confidence = float(predictions[top_idx])
        sign = self.labels[top_idx]

        return RecognitionResult(
            sign=sign,
            confidence=confidence,
            timestamp=time.time(),
            landmarks=landmarks
        )
```

**3. Create API Endpoint**

```python
# ml-service/app/api/recognition.py
from fastapi import APIRouter, HTTPException
from app.models.recognition import HandLandmarks, RecognitionResult
from app.services.gesture_recognition import GestureRecognitionService

router = APIRouter(prefix="/recognition", tags=["Recognition"])

# Initialize service
gesture_service = GestureRecognitionService("models/gesture_model.onnx")

@router.post("/predict", response_model=RecognitionResult)
async def predict_sign(landmarks: HandLandmarks):
    """
    Predict sign language gesture from hand landmarks.
    """
    try:
        result = gesture_service.predict(landmarks)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/labels")
async def get_labels():
    """
    Get list of recognized sign language labels.
    """
    return {"labels": gesture_service.labels}
```

**4. Register Router**

```python
# ml-service/app/main.py
from app.api import recognition

app.include_router(recognition.router)
```

### WebSocket Streaming

```python
# ml-service/app/api/streaming.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.streaming_recognition import StreamingRecognitionService

router = APIRouter(prefix="/streaming", tags=["Streaming"])

@router.websocket("/ws/recognize")
async def websocket_recognize(websocket: WebSocket):
    await websocket.accept()

    service = StreamingRecognitionService()

    try:
        while True:
            # Receive frame data
            data = await websocket.receive_bytes()

            # Process frame
            result = await service.process_frame(data)

            # Send result
            if result:
                await websocket.send_json(result.dict())

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close(code=1011, reason=str(e))
```

---

## Database Management

### Creating Migrations

**Entity Framework Core (PostgreSQL):**

```bash
cd server

# Create new migration
dotnet ef migrations add AddTutorialTable \
  --project src/SilentTalk.Infrastructure \
  --startup-project src/SilentTalk.Api \
  --context ApplicationDbContext

# Apply migration
dotnet ef database update \
  --project src/SilentTalk.Infrastructure \
  --startup-project src/SilentTalk.Api

# Rollback migration
dotnet ef database update PreviousMigrationName \
  --project src/SilentTalk.Infrastructure \
  --startup-project src/SilentTalk.Api

# Remove last migration (if not applied)
dotnet ef migrations remove \
  --project src/SilentTalk.Infrastructure \
  --startup-project src/SilentTalk.Api

# Generate SQL script
dotnet ef migrations script \
  --project src/SilentTalk.Infrastructure \
  --startup-project src/SilentTalk.Api \
  --output migrations.sql
```

### Seeding Data

```csharp
// server/src/SilentTalk.Infrastructure/Data/SeedData.cs
public static class SeedData
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Seed tutorials
        if (!await context.Tutorials.AnyAsync())
        {
            var tutorials = new List<Tutorial>
            {
                new Tutorial
                {
                    Id = Guid.NewGuid(),
                    Title = "ASL Alphabet",
                    Description = "Learn the American Sign Language alphabet",
                    VideoUrl = "https://example.com/asl-alphabet.mp4",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                // More seed data...
            };

            context.Tutorials.AddRange(tutorials);
            await context.SaveChangesAsync();
        }
    }
}

// Call in Program.cs:
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await SeedData.SeedAsync(context);
}
```

### Database Connection String Management

**Development (appsettings.Development.json):**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=silentstalk_db;Username=silentstalk;Password=silentstalk_dev_password"
  }
}
```

**Production (Environment Variables):**

```bash
export ConnectionStrings__DefaultConnection="Host=prod-db;Port=5432;Database=silentstalk_db;Username=prod_user;Password=<secure-password>"
```

---

## Testing Strategy

### Backend Testing (xUnit)

**Unit Test Example:**

```csharp
// server/tests/SilentTalk.Application.Tests/Services/TutorialServiceTests.cs
using Xunit;
using Moq;

public class TutorialServiceTests
{
    private readonly Mock<ITutorialRepository> _mockRepository;
    private readonly TutorialService _service;

    public TutorialServiceTests()
    {
        _mockRepository = new Mock<ITutorialRepository>();
        _service = new TutorialService(_mockRepository.Object);
    }

    [Fact]
    public async Task GetAllTutorialsAsync_ShouldReturnAllTutorials()
    {
        // Arrange
        var tutorials = new List<Tutorial>
        {
            new Tutorial { Id = Guid.NewGuid(), Title = "Test 1" },
            new Tutorial { Id = Guid.NewGuid(), Title = "Test 2" }
        };
        _mockRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(tutorials);

        // Act
        var result = await _service.GetAllTutorialsAsync();

        // Assert
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task CreateTutorialAsync_ShouldCreateTutorial()
    {
        // Arrange
        var request = new CreateTutorialRequest(
            "New Tutorial",
            "Description",
            "http://example.com/video.mp4"
        );
        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<Tutorial>()))
            .ReturnsAsync((Tutorial t) => t);

        // Act
        var result = await _service.CreateTutorialAsync(request);

        // Assert
        Assert.Equal(request.Title, result.Title);
        _mockRepository.Verify(r => r.CreateAsync(It.IsAny<Tutorial>()), Times.Once);
    }
}
```

**Integration Test Example:**

```csharp
// server/tests/SilentTalk.Api.Tests/Controllers/TutorialControllerTests.cs
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

public class TutorialControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public TutorialControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAllTutorials_ReturnsSuccessStatusCode()
    {
        // Act
        var response = await _client.GetAsync("/api/tutorial");

        // Assert
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task CreateTutorial_WithValidData_ReturnsCreatedStatusCode()
    {
        // Arrange
        var request = new
        {
            Title = "Test Tutorial",
            Description = "Test Description",
            VideoUrl = "http://example.com/video.mp4"
        };
        var content = new StringContent(
            JsonSerializer.Serialize(request),
            Encoding.UTF8,
            "application/json"
        );

        // Act
        var response = await _client.PostAsync("/api/tutorial", content);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
```

### Frontend Testing (Vitest)

**Component Test Example:**

```typescript
// client/src/components/__tests__/TutorialCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TutorialCard } from '../TutorialCard';

describe('TutorialCard', () => {
  const mockTutorial = {
    id: '1',
    title: 'Test Tutorial',
    description: 'Test Description',
    videoUrl: 'http://example.com/video.mp4',
    createdAt: '2024-01-01T00:00:00Z',
  };

  it('renders tutorial title', () => {
    render(<TutorialCard tutorial={mockTutorial} />);
    expect(screen.getByText('Test Tutorial')).toBeInTheDocument();
  });

  it('renders tutorial description', () => {
    render(<TutorialCard tutorial={mockTutorial} />);
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
});
```

**Service Test Example:**

```typescript
// client/src/services/__tests__/tutorialService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tutorialService } from '../tutorialService';
import { api } from '../../utils/api';

vi.mock('../../utils/api');

describe('tutorialService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll should fetch all tutorials', async () => {
    const mockTutorials = [
      { id: '1', title: 'Tutorial 1' },
      { id: '2', title: 'Tutorial 2' },
    ];
    vi.mocked(api.get).mockResolvedValue({ data: mockTutorials });

    const result = await tutorialService.getAll();

    expect(api.get).toHaveBeenCalledWith('/api/tutorial');
    expect(result).toEqual(mockTutorials);
  });
});
```

### ML Service Testing (pytest)

**Service Test Example:**

```python
# ml-service/tests/test_gesture_recognition.py
import pytest
import numpy as np
from app.services.gesture_recognition import GestureRecognitionService
from app.models.recognition import HandLandmarks, LandmarkPoint

@pytest.fixture
def gesture_service():
    return GestureRecognitionService("models/gesture_model.onnx")

@pytest.fixture
def sample_landmarks():
    points = [LandmarkPoint(x=float(i), y=float(i), z=float(i)) for i in range(21)]
    return HandLandmarks(landmarks=points, handedness="Right")

def test_predict_returns_result(gesture_service, sample_landmarks):
    result = gesture_service.predict(sample_landmarks)

    assert result.sign is not None
    assert 0 <= result.confidence <= 1
    assert result.timestamp > 0

def test_preprocess_normalizes_landmarks(gesture_service, sample_landmarks):
    processed = gesture_service.preprocess_landmarks(sample_landmarks)

    assert processed.shape == (63,)  # 21 landmarks * 3 coordinates
    assert processed.dtype == np.float32
```

**API Test Example:**

```python
# ml-service/tests/test_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_predict_endpoint():
    landmarks = {
        "landmarks": [{"x": 0.5, "y": 0.5, "z": 0.0} for _ in range(21)],
        "handedness": "Right"
    }

    response = client.post("/recognition/predict", json=landmarks)
    assert response.status_code == 200

    result = response.json()
    assert "sign" in result
    assert "confidence" in result
```

### Running Tests

```bash
# Run all tests (root)
npm run test

# Backend tests
cd server
dotnet test

# Frontend tests
cd client
npm test

# ML service tests
cd ml-service
pytest

# With coverage
cd server && dotnet test /p:CollectCoverage=true
cd client && npm run test:coverage
cd ml-service && pytest --cov=app --cov-report=html
```

---

## Code Quality

### Linting

**Backend (C#):**

```bash
cd server

# Check formatting
dotnet format --verify-no-changes

# Apply formatting
dotnet format
```

**Frontend (TypeScript):**

```bash
cd client

# Check linting
npm run lint

# Fix linting errors
npm run lint -- --fix

# Format with Prettier
npm run format
```

**ML Service (Python):**

```bash
cd ml-service

# Format with Black
black .

# Lint with Flake8
flake8 .

# Type check with mypy
mypy app
```

### Code Analysis

**Backend (SonarQube, ReSharper):**

```bash
# Install dotnet-sonarscanner
dotnet tool install --global dotnet-sonarscanner

# Run analysis
dotnet sonarscanner begin /k:"SilentTalk"
dotnet build
dotnet sonarscanner end
```

**Frontend (ESLint, TypeScript):**

```bash
# Type check
cd client
npm run typecheck

# Find unused exports
npx ts-prune
```

### Pre-commit Hooks

Pre-commit hooks automatically run on every commit via Husky:

```json
// package.json
{
  "lint-staged": {
    "client/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "server/**/*.cs": [
      "dotnet format --include"
    ],
    "ml-service/**/*.py": [
      "black",
      "flake8"
    ]
  }
}
```

---

## Debugging

### Backend Debugging

**Visual Studio 2022:**

1. Open `server/SilentTalk.sln`
2. Set breakpoints in code
3. Press F5 to start debugging
4. Debug toolbar: Step Over (F10), Step Into (F11), Continue (F5)

**Visual Studio Code:**

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": ".NET Core Launch (web)",
      "type": "coreclr",
      "request": "launch",
      "preLaunchTask": "build",
      "program": "${workspaceFolder}/server/src/SilentTalk.Api/bin/Debug/net8.0/SilentTalk.Api.dll",
      "args": [],
      "cwd": "${workspaceFolder}/server/src/SilentTalk.Api",
      "stopAtEntry": false,
      "serverReadyAction": {
        "action": "openExternally",
        "pattern": "\\bNow listening on:\\s+(https?://\\S+)"
      },
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  ]
}
```

**Rider:**

1. Open `server/SilentTalk.sln`
2. Set breakpoints
3. Click Debug button
4. Use Watch window to inspect variables

### Frontend Debugging

**Browser DevTools:**

1. Open Chrome DevTools (F12)
2. Go to Sources tab
3. Set breakpoints in TypeScript files
4. Refresh page

**VS Code:**

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/client/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    }
  ]
}
```

**React DevTools:**

Install React DevTools extension for Chrome/Firefox to inspect component hierarchy and props.

### ML Service Debugging

**VS Code:**

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "app.main:app",
        "--reload"
      ],
      "jinja": true,
      "justMyCode": true
    }
  ]
}
```

**PyCharm:**

1. Create Run Configuration
2. Set module: `uvicorn`
3. Set parameters: `app.main:app --reload`
4. Set working directory: `ml-service/`

### Debugging Docker Containers

```bash
# View container logs
docker compose -f infrastructure/docker/docker-compose.yml logs -f [service-name]

# Execute command in container
docker compose exec server bash
docker compose exec client sh
docker compose exec ml-service bash

# Inspect container
docker inspect [container-id]

# View container resource usage
docker stats
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Port Already in Use

**Symptom:** `Error: bind: address already in use`

**Solution:**

```bash
# Find process using port
lsof -i :5000  # On macOS/Linux
netstat -ano | findstr :5000  # On Windows

# Kill process
kill -9 <PID>  # On macOS/Linux
taskkill /PID <PID> /F  # On Windows

# Or use different port
docker compose -f infrastructure/docker/docker-compose.yml up -d --force-recreate
```

#### Issue: Database Connection Failed

**Symptom:** `Npgsql.NpgsqlException: Connection refused`

**Solution:**

```bash
# Check if PostgreSQL container is running
docker compose ps

# Check PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres

# Verify connection
docker compose exec postgres psql -U silentstalk -d silentstalk_db
```

#### Issue: Migration Failed

**Symptom:** `A migration with the name 'XXX' already exists`

**Solution:**

```bash
# Remove last migration
cd server
dotnet ef migrations remove --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api

# Revert database
dotnet ef database update PreviousMigration --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api

# Recreate migration
dotnet ef migrations add MigrationName --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api
```

#### Issue: npm install Fails

**Symptom:** `ERESOLVE unable to resolve dependency tree`

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Or use legacy peer deps
npm install --legacy-peer-deps
```

#### Issue: CORS Error

**Symptom:** `Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution:**

```csharp
// server/src/SilentTalk.Api/Program.cs
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("http://localhost:3000")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});

app.UseCors();
```

#### Issue: SignalR Connection Failed

**Symptom:** `Failed to start the connection: Error: WebSocket failed to connect`

**Solution:**

```typescript
// client/src/services/signalr/CallSignalingClient.ts
const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5000/hubs/call', {
    skipNegotiation: true,
    transport: signalR.HttpTransportType.WebSockets,
  })
  .withAutomaticReconnect()
  .build();
```

#### Issue: ML Service Model Not Found

**Symptom:** `FileNotFoundError: [Errno 2] No such file or directory: 'models/gesture_model.onnx'`

**Solution:**

```bash
# Ensure models directory exists
cd ml-service
mkdir -p models

# Download or copy model file
cp /path/to/gesture_model.onnx models/

# Or update model path in config
export MODEL_PATH="/absolute/path/to/model.onnx"
```

#### Issue: WebRTC Connection Fails

**Symptom:** `ICE connection failed`

**Solution:**

1. **Check STUN/TURN Server Configuration:**

```json
// server/src/SilentTalk.Api/appsettings.Development.json
{
  "WebRTC": {
    "StunServers": ["stun:stun.l.google.com:19302"],
    "IceTransportPolicy": "all",
    "Coturn": {
      "Url": "turn:localhost:3478",
      "Username": "user",
      "Credential": "password"
    }
  }
}
```

2. **Verify Coturn Container:**

```bash
docker compose ps coturn
docker compose logs coturn
```

3. **Test STUN Server:**

```bash
# Use stun-client tool
stun stun.l.google.com 19302
```

#### Issue: Hot Reload Not Working

**Frontend:**

```bash
# Clear Vite cache
rm -rf client/node_modules/.vite

# Restart dev server
cd client
npm run dev
```

**Backend:**

```bash
# Enable hot reload in launchSettings.json
{
  "profiles": {
    "SilentTalk.Api": {
      "hotReloadEnabled": true
    }
  }
}
```

**ML Service:**

```bash
# Use --reload flag
cd ml-service
uvicorn app.main:app --reload
```

#### Issue: Memory Leak

**Symptom:** Container memory usage keeps growing

**Solution:**

```bash
# Monitor memory usage
docker stats

# Increase memory limit
docker compose -f infrastructure/docker/docker-compose.yml up -d --scale ml-service=1 --memory=4g

# Investigate memory leaks
# Backend: dotnet-dump, dotnet-trace
# Frontend: Chrome DevTools Memory Profiler
# ML Service: memory_profiler
```

---

## Performance Optimization

### Backend Performance

**Database Query Optimization:**

```csharp
// Use AsNoTracking for read-only queries
var tutorials = await _context.Tutorials
    .AsNoTracking()
    .ToListAsync();

// Avoid N+1 queries with Include
var users = await _context.Users
    .Include(u => u.Contacts)
    .Include(u => u.Calls)
    .ToListAsync();

// Use projection to reduce data transfer
var userDtos = await _context.Users
    .Select(u => new UserDto { Id = u.Id, Username = u.Username })
    .ToListAsync();
```

**Caching:**

```csharp
// Add response caching
builder.Services.AddResponseCaching();
app.UseResponseCaching();

// Use distributed cache (Redis)
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = "localhost:6379";
});

// Usage
public class TutorialService
{
    private readonly IDistributedCache _cache;

    public async Task<List<Tutorial>> GetAllAsync()
    {
        var cacheKey = "tutorials:all";
        var cached = await _cache.GetStringAsync(cacheKey);

        if (cached != null)
        {
            return JsonSerializer.Deserialize<List<Tutorial>>(cached);
        }

        var tutorials = await _repository.GetAllAsync();

        await _cache.SetStringAsync(
            cacheKey,
            JsonSerializer.Serialize(tutorials),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
            }
        );

        return tutorials;
    }
}
```

**Async/Await Best Practices:**

```csharp
// Don't block async calls
var result = await GetDataAsync();  // ✓ Good
var result = GetDataAsync().Result;  // ✗ Bad (can cause deadlocks)

// Use ConfigureAwait(false) for library code
var data = await GetDataAsync().ConfigureAwait(false);

// Use Task.WhenAll for parallel operations
var task1 = GetUsersAsync();
var task2 = GetContactsAsync();
await Task.WhenAll(task1, task2);
```

### Frontend Performance

**Code Splitting:**

```typescript
// Use React.lazy for route-based code splitting
import { lazy, Suspense } from 'react';

const TutorialPage = lazy(() => import('./pages/TutorialPage'));
const ForumPage = lazy(() => import('./pages/ForumPage'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/tutorials" element={<TutorialPage />} />
        <Route path="/forum" element={<ForumPage />} />
      </Routes>
    </Suspense>
  );
}
```

**Memoization:**

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize component
const TutorialCard = memo(({ tutorial }: { tutorial: Tutorial }) => {
  return <div>{tutorial.title}</div>;
});

// Memoize expensive computation
function TutorialList({ tutorials }: { tutorials: Tutorial[] }) {
  const sortedTutorials = useMemo(() => {
    return tutorials.sort((a, b) => a.title.localeCompare(b.title));
  }, [tutorials]);

  return <div>{/* render sorted tutorials */}</div>;
}

// Memoize callback
function TutorialPage() {
  const handleDelete = useCallback((id: string) => {
    // delete logic
  }, []);

  return <TutorialList onDelete={handleDelete} />;
}
```

**Virtual Scrolling:**

```typescript
import { FixedSizeList } from 'react-window';

function TutorialList({ tutorials }: { tutorials: Tutorial[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={tutorials.length}
      itemSize={100}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <TutorialCard tutorial={tutorials[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### ML Service Performance

**Batch Processing:**

```python
# Process multiple frames in batch
def predict_batch(self, frames: List[np.ndarray]) -> List[RecognitionResult]:
    # Stack frames
    batch = np.stack(frames)

    # Run batch inference
    ort_inputs = {self.model.get_inputs()[0].name: batch}
    ort_outputs = self.model.run(None, ort_inputs)

    # Parse results
    results = []
    for i, predictions in enumerate(ort_outputs[0]):
        top_idx = np.argmax(predictions)
        results.append(RecognitionResult(
            sign=self.labels[top_idx],
            confidence=float(predictions[top_idx]),
            timestamp=time.time()
        ))

    return results
```

**GPU Acceleration:**

```python
# Use GPU for ONNX inference
import onnxruntime as ort

providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
session = ort.InferenceSession(model_path, providers=providers)
```

---

## Security Best Practices

### Input Validation

**Backend:**

```csharp
// Use FluentValidation
public class CreateTutorialRequestValidator : AbstractValidator<CreateTutorialRequest>
{
    public CreateTutorialRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.VideoUrl)
            .NotEmpty().WithMessage("Video URL is required")
            .Must(BeAValidUrl).WithMessage("Invalid URL format");
    }

    private bool BeAValidUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out _);
    }
}
```

**Frontend:**

```typescript
// Sanitize user input
import DOMPurify from 'dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}

// Validate before submission
function validateTutorialForm(data: CreateTutorialRequest): string[] {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (data.title.length > 200) {
    errors.push('Title must not exceed 200 characters');
  }

  if (!isValidUrl(data.videoUrl)) {
    errors.push('Invalid video URL');
  }

  return errors;
}
```

### Authentication & Authorization

**JWT Token Management:**

```typescript
// Store JWT in memory (not localStorage for XSS protection)
let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Refresh token stored in httpOnly cookie (set by server)
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Send httpOnly cookie
    });

    if (response.ok) {
      const { accessToken } = await response.json();
      setAccessToken(accessToken);
      return accessToken;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  return null;
}

// Axios interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);
```

### SQL Injection Prevention

**Use Parameterized Queries:**

```csharp
// ✓ Good: Parameterized query
var tutorials = await _context.Tutorials
    .Where(t => t.Title.Contains(searchTerm))
    .ToListAsync();

// ✗ Bad: String concatenation
var query = $"SELECT * FROM Tutorials WHERE Title LIKE '%{searchTerm}%'";
```

### XSS Prevention

**Encode Output:**

```typescript
// React automatically escapes content
<div>{tutorial.title}</div>  // ✓ Safe

// For dangerouslySetInnerHTML, use DOMPurify
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```

### CSRF Protection

```csharp
// Enable CSRF protection in ASP.NET Core
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
});

// Add to requests
[ValidateAntiForgeryToken]
public async Task<IActionResult> Create(CreateTutorialRequest request)
{
    // ...
}
```

### HTTPS Enforcement

```csharp
// Enforce HTTPS
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
app.UseHttpsRedirection();
```

---

## Contributing Guidelines

### Code Review Checklist

- [ ] Code follows project conventions and style guide
- [ ] All tests pass
- [ ] Code coverage maintained or improved
- [ ] No lint warnings or errors
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow convention
- [ ] No sensitive data (passwords, API keys) committed
- [ ] Performance impact considered
- [ ] Security vulnerabilities addressed
- [ ] Accessibility considerations (WCAG 2.1 AA)

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues

Closes #123

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
```

---

## References

### Official Documentation

- [ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [MediaPipe](https://google.github.io/mediapipe/)

### Architecture & Design

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Microservices Patterns](https://microservices.io/)
- [Domain-Driven Design](https://domainlanguage.com/ddd/)

### Best Practices

- [C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Python PEP 8](https://peps.python.org/pep-0008/)

### Tools

- [Docker Documentation](https://docs.docker.com/)
- [Swagger/OpenAPI](https://swagger.io/docs/)
- [Postman](https://learning.postman.com/)

---

## Support

For development questions or issues:

1. Check this guide first
2. Search existing GitHub issues
3. Ask in team Slack channel
4. Create new GitHub issue with detailed description

---

**Happy Coding! 🚀**

*Last Updated: 2025-11-13*
