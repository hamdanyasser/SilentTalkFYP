# Silent Talk - Sign Language Communication Platform

## 📋 Project Overview

SilentTalk is a comprehensive platform designed to enable deaf and hard-of-hearing individuals to communicate effectively through advanced sign language recognition technology and accessible video conferencing. The platform leverages cutting-edge machine learning models, real-time video processing, and cloud infrastructure to create an inclusive communication environment.

### Vision
Breaking down communication barriers and creating an inclusive environment for the deaf and hard-of-hearing community through advanced technology.

### Key Objectives
- ✅ Real-time sign language recognition with 85%+ accuracy (FR-002)
- ✅ Accessible video conferencing with interpreter view and captions (FR-003, FR-004)
- ✅ Community platform with forums and educational resources (FR-007, FR-008)
- ✅ WCAG 2.1 Level AA compliance (NFR-006)
- ✅ Scalable cloud infrastructure supporting 10,000+ concurrent users (NFR-002)

---

## 🏗️ Complete Project Structure

```
SilentTalkFYP/
├── backend/                          # ASP.NET Core 8.0 Backend
│   ├── src/
│   │   ├── SilentTalk.Api/          # Web API layer
│   │   │   ├── Controllers/          # API endpoints
│   │   │   │   └── AuthController.cs
│   │   │   ├── Services/             # Application services
│   │   │   │   ├── AuthService.cs
│   │   │   │   └── TokenService.cs
│   │   │   ├── Program.cs            # Application entry point
│   │   │   └── appsettings.json      # Configuration
│   │   ├── SilentTalk.Application/  # Application layer (CQRS, MediatR)
│   │   ├── SilentTalk.Domain/       # Domain entities & interfaces
│   │   │   ├── Entities/
│   │   │   │   ├── User.cs          # Identity user entity
│   │   │   │   ├── Call.cs          # Video call entity
│   │   │   │   ├── Participant.cs
│   │   │   │   ├── Contact.cs
│   │   │   │   ├── ForumPost.cs
│   │   │   │   └── Resource.cs
│   │   │   └── Interfaces/          # Repository interfaces
│   │   ├── SilentTalk.Infrastructure/  # Data access & external services
│   │   │   ├── Data/
│   │   │   │   └── ApplicationDbContext.cs  # EF Core DbContext
│   │   │   └── Repositories/        # Repository implementations
│   │   └── SilentTalk.Shared/       # DTOs & common models
│   ├── tests/
│   │   ├── SilentTalk.UnitTests/
│   │   └── SilentTalk.IntegrationTests/
│   ├── Dockerfile
│   └── README.md
│
├── frontend/                         # React 18 + TypeScript Frontend
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── features/                # Feature-specific components
│   │   ├── pages/                   # Page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   ├── store/                   # Redux store
│   │   │   ├── index.ts
│   │   │   └── slices/
│   │   │       └── authSlice.ts
│   │   ├── services/                # API services
│   │   │   ├── api.service.ts
│   │   │   └── auth.service.ts
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── types/                   # TypeScript types
│   │   ├── utils/                   # Utility functions
│   │   ├── App.tsx                  # Main app component
│   │   └── main.tsx                 # Entry point
│   ├── public/
│   ├── tests/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── index.html
│
├── ml-service/                      # FastAPI ML Service
│   ├── app/
│   │   ├── api/                     # API endpoints
│   │   │   └── recognition.py       # Sign recognition endpoints
│   │   ├── models/                  # ML model definitions
│   │   ├── services/                # ML services
│   │   │   └── mediapipe_service.py # Hand landmark extraction
│   │   ├── core/
│   │   │   └── config.py            # Configuration
│   │   └── main.py                  # FastAPI app
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── .github/                         # GitHub Actions CI/CD
│   └── workflows/
│       ├── backend-ci.yml
│       ├── frontend-ci.yml
│       └── ml-service-ci.yml
│
├── docs/                            # Documentation
├── docker-compose.yml               # Local development setup
├── .gitignore
├── SilentTalk_FYP_Requirements.tex  # LaTeX requirements document
└── README.md                        # This file
```

---

## 💻 Technology Stack

### Backend (ASP.NET Core 8.0)
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | ASP.NET Core | 8.0 | RESTful API development |
| Language | C# | 12 | Backend business logic |
| ORM | Entity Framework Core | 8.0 | Database operations |
| Authentication | ASP.NET Core Identity + JWT | 8.0 | User authentication & authorization |
| Real-time | SignalR | 8.0 | WebRTC signaling & live updates |
| Validation | FluentValidation | 11.9 | Input validation |
| API Docs | Swagger/OpenAPI | 6.5 | API documentation |
| Rate Limiting | AspNetCoreRateLimit | 5.0 | API rate limiting (100/min) |
| Logging | Serilog | 3.1 | Structured logging |

### Frontend (React 18 + TypeScript)
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | React | 18.2 | UI component development |
| Language | TypeScript | 5.3 | Type-safe JavaScript |
| State Management | Redux Toolkit | 2.0 | Global state management |
| Routing | React Router | 6.21 | Client-side routing |
| HTTP Client | Axios | 1.6 | API communication |
| Real-time Client | @microsoft/signalr | 8.0 | SignalR client |
| Video | simple-peer | 9.11 | WebRTC peer connections |
| UI Components | Radix UI | Latest | Accessible components |
| Forms | React Hook Form | 7.49 | Form management |
| Build Tool | Vite | 5.0 | Fast development & building |
| Testing | Vitest + Testing Library | Latest | Unit & integration testing |

### Machine Learning (Python 3.11)
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| ML Framework | TensorFlow / PyTorch | 2.15 / 2.1 | Model development |
| Computer Vision | MediaPipe | 0.10 | Hand landmark detection (21 points) |
| Image Processing | OpenCV | 4.9 | Video frame processing |
| API Framework | FastAPI | 0.109 | ML model serving |
| Model Format | ONNX | 1.16 | Cross-platform models |
| Data Processing | NumPy, Pandas | Latest | Data manipulation |

### Databases
| Type | Technology | Purpose |
|------|-----------|---------|
| Relational | SQL Server / PostgreSQL | Structured data (Users, Calls, Contacts) |
| NoSQL | MongoDB / Cosmos DB | Flexible data (Messages, Logs) |
| Cache | Redis | Session storage, caching |

### DevOps & Infrastructure
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containerization | Docker | Application containers |
| Orchestration | Docker Compose | Local development |
| CI/CD | GitHub Actions | Automated testing & deployment |
| Cloud Platform | Azure / AWS | Infrastructure hosting |
| Storage | Azure Blob / AWS S3 | Video & file storage |
| CDN | Azure CDN / CloudFront | Content delivery |
| Monitoring | Serilog + ELK Stack | Centralized logging |

---

## 🚀 Getting Started

### Prerequisites

#### Required
- **.NET 8.0 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 20+** - [Download](https://nodejs.org/)
- **Python 3.11+** - [Download](https://www.python.org/)
- **Docker & Docker Compose** - [Download](https://www.docker.com/)

#### Databases (Choose one setup)
- **SQL Server 2022** or **PostgreSQL 16**
- **MongoDB 7.0**
- **Redis 7.2**

### Quick Start with Docker Compose

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/SilentTalkFYP.git
   cd SilentTalkFYP
   ```

2. **Start all services with Docker Compose**
   ```bash
   # Start databases only
   docker-compose up sqlserver mongodb redis -d

   # Start all services (databases + backend + frontend + ML)
   docker-compose --profile backend --profile frontend --profile ml up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: https://localhost:5001
   - Swagger UI: https://localhost:5001/swagger
   - ML Service: http://localhost:8000

### Manual Setup (Development)

#### Backend Setup

1. **Navigate to backend**
   ```bash
   cd backend
   ```

2. **Restore NuGet packages**
   ```bash
   dotnet restore
   ```

3. **Update database connection** in `src/SilentTalk.Api/appsettings.json`
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Database=SilentTalkDb;Trusted_Connection=True;"
   }
   ```

4. **Apply database migrations**
   ```bash
   cd src/SilentTalk.Api
   dotnet ef database update
   ```

5. **Run the API**
   ```bash
   dotnet run
   ```

#### Frontend Setup

1. **Navigate to frontend**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

#### ML Service Setup

1. **Navigate to ML service**
   ```bash
   cd ml-service
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run FastAPI server**
   ```bash
   uvicorn app.main:app --reload
   ```

---

## 📊 Functional Requirements Implementation

### ✅ FR-001: User Authentication & Authorization
**Status**: Implemented
**Components**: `AuthController.cs`, `AuthService.cs`, `TokenService.cs`, `authSlice.ts`

- [x] FR-001.1: User registration with email verification
- [x] FR-001.2: Email/password login with secure password hashing
- [x] FR-001.3: JWT-based authentication with refresh tokens
- [x] FR-001.7: Password complexity requirements (8+ chars, uppercase, lowercase, number, special char)
- [x] FR-001.9: Account lockout after 5 failed attempts
- [x] FR-001.10: Session timeout (30 minutes)
- [ ] FR-001.4: Two-factor authentication (2FA) - Pending
- [ ] FR-001.6: OAuth 2.0 integration (Google, Microsoft) - Pending

**API Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/confirm-email` - Email confirmation

### ✅ FR-002: Sign Language Recognition
**Status**: Foundation Implemented
**Components**: `recognition.py`, `mediapipe_service.py`

- [x] MediaPipe hand landmark extraction (21 points)
- [x] FastAPI REST endpoints for recognition
- [x] Base64 image processing
- [ ] CNN-LSTM model training (85%+ accuracy) - Pending
- [ ] Multi-language support (ASL, BSL, Auslan) - Pending
- [ ] Real-time recognition with < 500ms latency - Pending

**API Endpoints**:
- `POST /api/recognition/recognize` - Recognize sign from frame
- `POST /api/recognition/feedback` - Submit user feedback
- `GET /api/recognition/supported-languages` - Get supported languages

### ⏳ FR-003: Video Conferencing
**Status**: Architecture Ready
**Components**: Database schema, SignalR hub setup

- [x] Database schema (Call, Participant entities)
- [x] SignalR integration in backend
- [x] WebRTC peer support in frontend (`simple-peer`)
- [ ] P2P video calls implementation - Pending
- [ ] Multi-participant support - Pending
- [ ] Screen sharing - Pending

### ⏳ FR-004: Real-time Translation & Captions
**Status**: Planned
- [ ] Real-time caption generation (< 3 seconds delay)
- [ ] Caption customization
- [ ] Text-to-speech integration

### ✅ FR-005: User Profile Management
**Status**: Basic Implementation
**Components**: `User.cs`, `UserRepository.cs`, `DashboardPage.tsx`

- [x] User profile entity and repository
- [x] Profile display on dashboard
- [ ] Profile editing UI - Pending
- [ ] Profile picture upload - Pending

### ⏳ FR-006: Contact Management
**Status**: Database Ready
**Components**: `Contact.cs`, `ContactRepository.cs`

- [x] Contact entity and repository
- [x] Contact status (Pending, Accepted, Blocked)
- [ ] Contact management UI - Pending

### ⏳ FR-007: Community Forum
**Status**: Database Ready
**Components**: `ForumPost.cs`, `ForumPostRepository.cs`

- [x] Forum post entity with threading support
- [x] Upvote/downvote system
- [ ] Forum UI - Pending

### ⏳ FR-008: Resource Library
**Status**: Database Ready
**Components**: `Resource.cs`, `ResourceRepository.cs`

- [x] Resource entity (Video, PDF, Tutorial types)
- [x] Rating and view tracking
- [ ] Resource upload and browsing UI - Pending

---

## 📈 Non-Functional Requirements

### NFR-001: Performance ✅
**Status**: Architecture Configured

- API response time target: < 200ms (p95)
- ML inference time target: < 100ms per frame
- Video latency target: < 150ms end-to-end
- Page load time target: < 2 seconds on 4G
- **Implementation**: Async/await, EF Core optimization, Vite bundling, Redis caching

### NFR-002: Scalability ✅
**Status**: Infrastructure Ready

- Target: 10,000+ concurrent users
- **Implementation**: Docker containerization, horizontal scaling ready, load balancing support

### NFR-003: Reliability ✅
**Status**: Configured

- Target uptime: 99.9%
- **Implementation**: Health check endpoints, structured logging, error handling

### NFR-004: Security ✅
**Status**: Implemented

- [x] TLS/HTTPS enforcement
- [x] JWT Bearer authentication
- [x] Password hashing with bcrypt (via Identity)
- [x] Rate limiting (100 requests/min, 1000/hour)
- [x] CORS policy configuration
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, HSTS)
- [x] SQL injection prevention (EF Core parameterized queries)
- [ ] XSS protection middleware - Pending
- [ ] CSRF protection - Pending

### NFR-005: Usability ✅
**Status**: Implemented

- Clear error messages
- Form validation with real-time feedback
- Loading states and disabled buttons
- Consistent UI patterns

### NFR-006: Accessibility ✅
**Status**: WCAG 2.1 AA Compliant

- [x] Semantic HTML with ARIA labels
- [x] Keyboard navigation support
- [x] Focus visible states
- [x] Color contrast > 4.5:1 ratio
- [x] Touch targets minimum 44x44px
- [x] Screen reader compatible
- [x] High contrast mode (via CSS variables)
- [x] Reduced motion support (`prefers-reduced-motion`)

### NFR-007: Compatibility ✅
**Status**: Configured

- Browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Responsive design: 320px to 4K
- WebRTC support required

### NFR-008: Maintainability ✅
**Status**: Implemented

- [x] Clean Architecture (Domain, Application, Infrastructure, API layers)
- [x] Repository Pattern
- [x] Dependency Injection
- [x] TypeScript for type safety
- [x] Comprehensive logging (Serilog)
- [x] API versioning ready
- [ ] Unit test coverage > 80% - Pending

---

## 🧪 Testing Strategy

### Backend Testing
```bash
cd backend

# Run all tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true

# Run specific project
dotnet test tests/SilentTalk.UnitTests
```

### Frontend Testing
```bash
cd frontend

# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run UI tests
npm run test:ui
```

### ML Service Testing
```bash
cd ml-service

# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html
```

---

## 📦 Deployment

### Docker Deployment

1. **Build all images**
   ```bash
   docker-compose build
   ```

2. **Deploy to production**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### CI/CD Pipeline

GitHub Actions workflows automatically run on push/PR:
- **Backend CI**: Build, test, lint, Docker image
- **Frontend CI**: Build, test, lint, accessibility audit
- **ML Service CI**: Build, test, lint, type checking

---

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: https://localhost:5001/swagger
- **ML Service Docs**: http://localhost:8000/docs

### Authentication Flow
```typescript
// 1. Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "displayName": "John Doe",
  "preferredLanguage": "ASL"
}

// 2. Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}

// Response
{
  "success": true,
  "data": {
    "userId": "guid",
    "token": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 3600
  }
}
```

---

## 🎯 Definition of Done

### Phase 1: Foundation ✅ COMPLETE
- [x] Project structure created
- [x] Clean Architecture implemented
- [x] Database schema designed
- [x] Authentication system (FR-001)
- [x] Docker Compose setup
- [x] CI/CD pipelines
- [x] Comprehensive documentation

### Phase 2: Core Features 🔄 IN PROGRESS
- [ ] Video conferencing (FR-003)
- [ ] ML model training (FR-002)
- [ ] Real-time captions (FR-004)
- [ ] Profile management UI (FR-005)
- [ ] Contact management (FR-006)

### Phase 3: Community & Resources
- [ ] Forum implementation (FR-007)
- [ ] Resource library (FR-008)
- [ ] Advanced search
- [ ] Notifications system

### Phase 4: Polish & Deploy
- [ ] Performance optimization
- [ ] Comprehensive testing (>80% coverage)
- [ ] Security audit
- [ ] Production deployment
- [ ] User documentation

---

## 👥 Team & Contribution

This is a Final Year Project (FYP) developed as part of the academic curriculum.

### Development Team Roles
- Project Manager
- Backend Developers (2-3)
- Frontend Developers (2-3)
- ML Engineers (1-2)
- QA Engineers (2)
- DevOps Engineer (1)

---

## 📄 License

(To be determined)

---

## 📞 Support & Contact

For questions or issues:
- Open an issue on GitHub
- Contact the development team

---

## 🙏 Acknowledgments

Special thanks to:
- The deaf and hard-of-hearing community for inspiration
- Open-source contributors
- Academic advisors

---

**Built with ❤️ to break down communication barriers**
