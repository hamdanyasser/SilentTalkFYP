# SilentTalk Architecture

## System Overview

SilentTalk is a microservices-based platform designed to facilitate communication between deaf/hard-of-hearing individuals and the hearing community through sign language recognition and real-time video communication.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 18 + TypeScript + Vite                             │  │
│  │  - Redux Toolkit for state management                     │  │
│  │  - Radix UI for accessible components                     │  │
│  │  - WebRTC for video communication                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌───────────────────┐          ┌──────────────────────────┐   │
│  │  ASP.NET Core 8   │          │  FastAPI ML Service      │   │
│  │  - REST API       │◄────────►│  - MediaPipe             │   │
│  │  - SignalR        │          │  - ONNX Runtime          │   │
│  │  - JWT Auth       │          │  - OpenCV                │   │
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
│  │ - Resources  │  │              │  │                      │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  MinIO   │  │  Coturn  │  │   ELK    │  │   Docker     │  │
│  │  (S3)    │  │  TURN/   │  │  Stack   │  │   Compose    │  │
│  │  Storage │  │  STUN    │  │  Logging │  │              │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture Patterns

### Backend (ASP.NET Core)

The server follows **Clean Architecture** principles:

```
┌─────────────────────────────────────────────────┐
│                API Layer                         │
│  - Controllers                                   │
│  - SignalR Hubs                                  │
│  - Middleware                                    │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│            Application Layer                     │
│  - Use Cases / Services                          │
│  - DTOs                                          │
│  - Validators (FluentValidation)                │
│  - CQRS Commands/Queries                        │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              Domain Layer                        │
│  - Entities                                      │
│  - Value Objects                                 │
│  - Domain Events                                 │
│  - Interfaces                                    │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│          Infrastructure Layer                    │
│  - DbContext (EF Core)                          │
│  - Repositories                                  │
│  - External Service Clients                     │
│  - File Storage                                  │
└─────────────────────────────────────────────────┘
```

**Key Patterns:**
- **Repository Pattern**: Abstraction over data access
- **Unit of Work**: Transaction management
- **CQRS**: Separation of read and write operations
- **Dependency Injection**: Built-in .NET DI container

### Frontend (React)

The client follows **Feature-based Architecture**:

```
src/
├── features/           # Feature modules
│   ├── auth/
│   ├── video-call/
│   ├── messaging/
│   └── recognition/
├── components/         # Shared components
├── store/              # Redux store
│   ├── slices/
│   └── index.ts
├── services/           # API services
├── hooks/              # Custom React hooks
└── utils/              # Utilities
```

**Key Patterns:**
- **Flux Architecture**: Redux Toolkit for state management
- **Component Composition**: Reusable UI components
- **Custom Hooks**: Business logic separation
- **Service Layer**: API abstraction

### ML Service (FastAPI)

The ML service follows **Layered Architecture**:

```
app/
├── api/                # API endpoints
│   ├── recognition.py
│   └── translation.py
├── services/           # Business logic
│   ├── mediapipe_service.py
│   └── onnx_service.py
├── models/             # Data models
├── utils/              # Utilities
└── main.py             # FastAPI app
```

## Data Flow

### User Authentication Flow

```
Client → POST /api/auth/register → Server
                                      ├── Validate input
                                      ├── Hash password
                                      ├── Save to PostgreSQL
                                      └── Return JWT token
                                           │
                                           ▼
                                     Store in Redux
                                           │
                                           ▼
                                 Include in Authorization header
```

### Video Call Flow

```
Client A                    Server                    Client B
   │                           │                          │
   │─────Create Call──────────►│                          │
   │                           │                          │
   │                           │───────Notify─────────────►│
   │                           │                          │
   │◄──────WebRTC Offer────────┤◄────Join Call───────────│
   │                           │                          │
   │─────WebRTC Answer────────►│──────Forward────────────►│
   │                           │                          │
   │◄─────ICE Candidates──────►│◄──ICE Candidates────────►│
   │                           │                          │
   │◄──────Peer Connection via Coturn (TURN/STUN)───────►│
```

### Sign Language Recognition Flow

```
Client → Camera Feed → MediaPipe (Hand Landmarks)
                            │
                            ▼
                     ONNX Model (Classification)
                            │
                            ▼
                   Recognized Sign/Gesture
                            │
                            ▼
                   Display to User / Store
```

## Technology Decisions

### Why PostgreSQL?
- ACID compliance for critical data (users, contacts)
- Rich querying capabilities
- Excellent .NET integration via EF Core
- Mature and well-supported

### Why MongoDB?
- Flexible schema for messages and logs
- High write throughput for real-time messaging
- Easy horizontal scaling
- Document-based storage fits message structure

### Why Redis?
- In-memory performance for sessions
- Pub/Sub for SignalR backplane
- Caching frequently accessed data
- Simple key-value operations

### Why MinIO?
- S3-compatible API (easy migration to AWS)
- Self-hosted for data privacy
- Perfect for video/image storage
- Open-source and cost-effective

### Why ELK Stack?
- Centralized logging from all services
- Powerful search and analytics
- Kibana for visualization
- Industry standard

### Why Coturn?
- Open-source TURN/STUN server
- Essential for WebRTC NAT traversal
- Reliable and battle-tested
- Easy to deploy with Docker

## Security Architecture

### Authentication & Authorization

```
┌──────────────────────────────────────────────────────┐
│                   Client Request                      │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│           JWT Token in Authorization Header           │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│            JWT Validation Middleware                  │
│  - Verify signature                                   │
│  - Check expiration                                   │
│  - Extract claims                                     │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│           Authorization Policy Check                  │
│  - Role-based access                                  │
│  - Resource ownership                                 │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│                Execute Controller Action              │
└──────────────────────────────────────────────────────┘
```

### Data Protection

- **Passwords**: Hashed with bcrypt (via ASP.NET Core Identity)
- **Tokens**: JWT with HS256 algorithm
- **Transport**: HTTPS/TLS in production
- **Storage**: Encrypted at rest (database/MinIO configuration)

## Scalability Considerations

### Horizontal Scaling

- **Server**: Stateless design allows multiple instances behind load balancer
- **Client**: Static files served via CDN
- **ML Service**: Independent scaling based on inference load
- **Redis**: Can be clustered for high availability
- **MongoDB**: Sharding for horizontal scaling
- **PostgreSQL**: Read replicas for read-heavy workloads

### Vertical Scaling

- **ML Service**: More CPU/GPU for faster inference
- **Database**: More RAM for larger cache
- **Redis**: More RAM for larger dataset

### Caching Strategy

```
Request → Check Redis Cache
              │
              ├─ Hit → Return cached data
              │
              └─ Miss → Query Database
                          │
                          ▼
                     Store in Redis (TTL)
                          │
                          ▼
                    Return data
```

## Performance Optimization

### API Response Times
- Target: < 200ms (p95)
- Caching: Redis for frequent queries
- Database: Proper indexing
- N+1 Queries: Eager loading with EF Core

### ML Inference
- Target: < 100ms per frame
- ONNX Runtime for optimized inference
- Batch processing where applicable
- GPU acceleration (production)

### Frontend Performance
- Code splitting: Lazy loading routes
- Asset optimization: Minification, compression
- CDN: Static asset delivery
- Service Worker: Offline support

## Monitoring & Observability

### Metrics
- Application metrics (response times, error rates)
- Infrastructure metrics (CPU, memory, disk)
- Business metrics (active users, calls)

### Logging
- Structured logging (JSON format)
- Log levels: Debug, Info, Warning, Error, Fatal
- Centralized via ELK Stack
- Correlation IDs for request tracing

### Tracing
- Distributed tracing (future: OpenTelemetry)
- Request flow across services
- Performance bottleneck identification

## Deployment Architecture

### Development
```
Docker Compose
├── All services on single host
├── Hot reload enabled
└── Debug logging
```

### Production (Future)
```
Kubernetes Cluster
├── Service mesh (Istio)
├── Auto-scaling
├── Load balancing
├── Health checks
└── Rolling updates
```

## References

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Microservices Patterns](https://microservices.io/)
- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [React Documentation](https://react.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
