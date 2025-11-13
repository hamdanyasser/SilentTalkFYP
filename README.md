# SilentTalk

> Sign Language Communication Platform - Final Year Project

A comprehensive web platform that bridges communication gaps between deaf/hard-of-hearing individuals and the hearing community through real-time sign language recognition, video communication, and educational resources.

## 🏗️ Architecture

This is a **monorepo** containing three main services:

- **`server/`** - ASP.NET Core 8 backend API with SignalR
- **`client/`** - React 18 + TypeScript frontend with Vite
- **`ml-service/`** - FastAPI ML service with MediaPipe for sign language recognition
- **`infrastructure/`** - Docker Compose configurations and deployment files
- **`docs/`** - Architecture documentation and specifications

## 🚀 Quick Start

### Prerequisites

- **Docker** 24.0+ and **Docker Compose** 2.20+
- **Node.js** 20+ and **npm** 9+ (for local development)
- **.NET SDK** 8.0+ (for server development)
- **Python** 3.11+ (for ML service development)
- **Make** (optional, but recommended)

### Start Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd silents-talk

# Install root dependencies (Husky, lint-staged)
npm install

# Start all services with Docker Compose
make dev-up

# Or without Make:
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

The following services will be available:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React application |
| **Backend API** | http://localhost:5000 | ASP.NET Core API |
| **ML Service** | http://localhost:8000 | FastAPI ML service |
| **API Docs** | http://localhost:5000/swagger | Swagger UI |
| **ML Docs** | http://localhost:8000/docs | FastAPI docs |
| **Kibana** | http://localhost:5601 | Log visualization |
| **MinIO Console** | http://localhost:9001 | Object storage UI |
| **PostgreSQL** | localhost:5432 | Database |
| **MongoDB** | localhost:27017 | NoSQL database |
| **Redis** | localhost:6379 | Cache |

### Default Credentials

**PostgreSQL:**
- Host: localhost:5432
- Database: silentstalk_db
- Username: silentstalk
- Password: silentstalk_dev_password

**MongoDB:**
- Host: localhost:27017
- Database: silentstalk
- Username: admin
- Password: admin_dev_password

**Redis:**
- Host: localhost:6379
- Password: redis_dev_password

**MinIO:**
- Console: http://localhost:9001
- Username: minioadmin
- Password: minioadmin123

## 📋 Available Commands

### Using Make (Recommended)

```bash
# Start all services
make dev-up

# Stop all services
make dev-down

# View logs
make logs

# Check service health
make health

# Seed databases with sample data
make seed

# Run linting across all services
make lint

# Format code across all services
make format

# Run tests across all services
make test

# Clean up containers and volumes
make clean

# Complete cleanup (including volumes)
make clean-all
```

### Using npm Scripts

```bash
# Lint all services
npm run lint

# Format all code
npm run format

# Run all tests
npm run test

# Type check TypeScript
npm run typecheck
```

### Service-Specific Commands

**Server (ASP.NET Core):**
```bash
cd server
dotnet restore
dotnet build
dotnet run --project src/SilentTalk.Api
dotnet test
```

**Client (React):**
```bash
cd client
npm install
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run ESLint
npm run format    # Format with Prettier
npm test          # Run tests
```

**ML Service (FastAPI):**
```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload  # Start dev server
black .                         # Format code
flake8 .                        # Lint code
pytest                          # Run tests
```

## 🏛️ Project Structure

```
silents-talk/
├── server/                 # ASP.NET Core 8 Backend
│   ├── src/
│   │   ├── SilentTalk.Api/          # API layer (controllers, endpoints)
│   │   ├── SilentTalk.Application/  # Business logic
│   │   ├── SilentTalk.Domain/       # Domain entities
│   │   └── SilentTalk.Infrastructure/ # Data access, external services
│   ├── config/             # Database initialization scripts
│   ├── tests/
│   └── Dockerfile
├── client/                 # React 18 Frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── store/          # Redux store
│   │   ├── services/       # API services
│   │   └── styles/         # Global styles
│   ├── tests/
│   └── Dockerfile
├── ml-service/             # FastAPI ML Service
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── services/       # ML services (MediaPipe, ONNX)
│   │   ├── models/         # ML model definitions
│   │   └── utils/          # Utilities
│   ├── tests/
│   └── Dockerfile
├── infrastructure/         # Infrastructure & DevOps
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── config/         # Service configurations
│   └── github/
│       └── workflows/      # CI/CD pipelines
├── docs/                   # Documentation
│   ├── architecture/       # Architecture diagrams
│   ├── adr/                # Architecture Decision Records
│   ├── api/                # API specifications
│   └── testing/            # Testing strategy
├── .husky/                 # Git hooks
├── Makefile                # Development commands
├── package.json            # Root package.json (workspace)
└── README.md               # This file
```

## 🧪 Testing

### Run All Tests

```bash
make test
```

### Service-Specific Tests

```bash
# Server (C# / xUnit)
cd server && dotnet test

# Client (TypeScript / Vitest)
cd client && npm test

# ML Service (Python / pytest)
cd ml-service && pytest
```

## 🎨 Code Quality

### Pre-commit Hooks

Pre-commit hooks are automatically installed via Husky. They will:
- Format code (Prettier, Black, dotnet format)
- Lint code (ESLint, Flake8, StyleCop)
- Type check TypeScript

### Manual Formatting

```bash
# Format all code
make format

# Or per service:
cd client && npm run format
cd server && dotnet format
cd ml-service && black .
```

### Linting

```bash
# Lint all code
make lint

# Or per service:
cd client && npm run lint
cd server && dotnet format --verify-no-changes
cd ml-service && flake8 .
```

## 🗄️ Database Migrations

### PostgreSQL (Entity Framework Core)

```bash
cd server

# Create new migration
dotnet ef migrations add MigrationName --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api

# Apply migrations
dotnet ef database update --project src/SilentTalk.Infrastructure --startup-project src/SilentTalk.Api
```

### Seed Data

```bash
make seed
```

## 📊 Monitoring & Logging

### ELK Stack

Logs from all services are automatically sent to Elasticsearch via Logstash and can be viewed in Kibana:

- **Kibana**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200

### Health Checks

```bash
# Check all services
make health

# Or manually:
curl http://localhost:5000/health  # Server
curl http://localhost:8000/health  # ML Service
curl http://localhost:3000/health  # Client (nginx)
```

## 🔐 Security

### Development Credentials

⚠️ **Warning**: The credentials in this repository are for **development only**. Never use these in production.

### Production Deployment

For production:
1. Use strong, randomly generated passwords
2. Store credentials in environment variables or secrets management (e.g., Azure Key Vault, AWS Secrets Manager)
3. Enable HTTPS/TLS for all services
4. Configure CORS properly
5. Enable authentication and authorization
6. Review and harden all security settings

## 🚢 Deployment

### Docker Compose (Development)

```bash
make dev-up
```

### Production Build

```bash
# Build all services
docker compose -f infrastructure/docker/docker-compose.yml build --target production

# Push to registry (configure your registry)
docker compose -f infrastructure/docker/docker-compose.yml push
```

## 📚 Documentation

- **[Architecture Overview](docs/architecture/README.md)** - System architecture and design
- **[API Documentation](docs/api/openapi.yaml)** - OpenAPI/Swagger specification
- **[Testing Strategy](docs/testing/strategy.md)** - Testing approach and guidelines
- **[ADRs](docs/adr/)** - Architecture Decision Records
- **[Accessibility](docs/accessibility/checklist.md)** - WCAG 2.1 AA compliance checklist

## 🛠️ Technology Stack

### Backend (server/)
- **Framework**: ASP.NET Core 8.0
- **Language**: C# 12
- **ORM**: Entity Framework Core 8.0
- **Database**: PostgreSQL 16
- **Real-time**: SignalR
- **Authentication**: ASP.NET Core Identity + JWT

### Frontend (client/)
- **Framework**: React 18.2
- **Language**: TypeScript 5.3
- **Build Tool**: Vite 5.0
- **State Management**: Redux Toolkit 2.0
- **Routing**: React Router 6
- **UI Components**: Radix UI
- **Styling**: Sass/SCSS

### ML Service (ml-service/)
- **Framework**: FastAPI 0.109
- **Language**: Python 3.11
- **ML Library**: MediaPipe 0.10
- **CV Library**: OpenCV 4.9
- **Runtime**: ONNX Runtime 1.16

### Infrastructure
- **Databases**: PostgreSQL 16, MongoDB 7.0
- **Cache**: Redis 7.2
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Storage**: MinIO (S3-compatible)
- **WebRTC**: Coturn (TURN/STUN server)
- **Containerization**: Docker, Docker Compose

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

SilentTalk Team - Final Year Project 2024

## 📞 Support

For issues and questions:
- Create an issue in this repository
- Contact the development team

---

**Built with ❤️ for the deaf and hard-of-hearing community**
