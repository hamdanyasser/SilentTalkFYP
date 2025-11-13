# CI/CD Pipeline Documentation

This document describes the comprehensive CI/CD infrastructure for the SilentTalk FYP project, implementing NFR-008 (maintainability) and NFR-009 (portability).

## Overview

The CI/CD pipeline consists of 7 GitHub Actions workflows that automate building, testing, deployment, and documentation:

1. **CI Pipeline** - Build, test, and lint all applications
2. **Container Build** - Build and push Docker images to registry
3. **E2E Tests** - Run end-to-end tests on ephemeral environments
4. **Accessibility & Performance** - Run axe, Lighthouse, and performance tests
5. **Smoke Tests** - Run k6 smoke tests on hourly schedule
6. **Release** - Semantic versioning and release automation
7. **Documentation** - Generate OpenAPI and TypeDoc documentation

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Jobs:**
- `client-build-test`: Lint, type-check, test, and build React client
- `server-build-test`: Lint, type-check, test, and build Node.js server
- `code-quality`: Run ESLint, SonarCloud, and Prettier checks
- `dependency-audit`: Audit npm dependencies for vulnerabilities

**Services:**
- PostgreSQL 15 (for server tests)
- Redis 7 (for caching tests)

**Outputs:**
- Test coverage reports (uploaded to Codecov)
- SonarCloud quality metrics
- Dependency audit results

**Environment Variables Required:**
- `SONAR_TOKEN` (secret) - SonarCloud authentication
- `CODECOV_TOKEN` (secret) - Codecov upload token

### 2. Container Build (`.github/workflows/container-build.yml`)

**Triggers:**
- Push to any branch
- Pull requests
- Manual workflow dispatch

**Jobs:**
- `build-and-push`: Build multi-platform Docker images for client and server
- `scan-images`: Security scanning with Trivy
- `sign-images`: Sign images with Cosign
- `generate-sbom`: Generate Software Bill of Materials

**Registry:**
- GitHub Container Registry (`ghcr.io`)
- Images: `ghcr.io/<owner>/<repo>/client` and `ghcr.io/<owner>/<repo>/server`

**Image Tags:**
- `main` - Latest from main branch
- `develop` - Latest from develop branch
- `pr-<number>` - Pull request builds
- `<branch>` - Branch name
- `<sha>` - Git commit SHA
- `<version>` - Semantic version (on release)

**Security Features:**
- Multi-stage builds for minimal attack surface
- Non-root user (UID 1001)
- Trivy vulnerability scanning (fail on HIGH/CRITICAL)
- Cosign image signing
- SBOM generation with Anchore

**Environment Variables Required:**
- `GITHUB_TOKEN` (automatic) - Registry authentication

### 3. E2E Tests (`.github/workflows/e2e-tests.yml`)

**Triggers:**
- Pull requests
- Push to `main` or `develop`
- Manual workflow dispatch

**Jobs:**
- `setup-ephemeral-env`: Create temporary test environment
- `run-playwright-tests`: Run Playwright E2E tests
- `run-cypress-tests`: Run Cypress E2E tests
- `cleanup-env`: Destroy ephemeral environment

**Environment:**
- Unique environment ID: `e2e-<run-id>-<attempt>`
- PostgreSQL and Redis services
- Client on port 3000
- Server on port 5000

**Artifacts:**
- Test screenshots
- Test videos
- Test reports
- Playwright traces

**Environment Variables Required:**
- None (uses Docker Compose for local services)

### 4. Accessibility & Performance (`.github/workflows/accessibility-performance.yml`)

**Triggers:**
- Pull requests
- Push to `main` or `develop`
- Manual workflow dispatch

**Jobs:**
- `lighthouse-ci`: Run Lighthouse performance audits
- `axe-accessibility`: Run axe WCAG 2.1 AA compliance tests
- `pa11y-tests`: Run Pa11y accessibility tests
- `bundle-size`: Check bundle size against budget
- `webpagetest`: Run WebPageTest analysis (main branch only)

**Performance Budgets:**
- Bundle size: 500KB (gzipped)
- Lighthouse Performance: 90+
- Lighthouse Accessibility: 90+
- Lighthouse Best Practices: 90+
- Lighthouse SEO: 90+

**Pages Tested:**
- Home: `/`
- Login: `/login`
- Dashboard: `/dashboard`
- Profile: `/profile`

**Environment Variables Required:**
- `WEBPAGETEST_API_KEY` (secret, optional) - WebPageTest API access

### 5. Smoke Tests (`.github/workflows/smoke-tests.yml`)

**Triggers:**
- Hourly cron schedule (`0 * * * *`)
- Manual workflow dispatch

**Jobs:**
- `k6-smoke-tests`: Run k6 performance smoke tests
- `health-checks`: Verify all health endpoints
- `frontend-smoke`: Basic frontend load test
- `database-migrations`: Test database migrations

**K6 Performance Thresholds:**
- HTTP request duration p95 < 500ms
- HTTP request failure rate < 1%
- Checks success rate > 95%

**Environment Variables Required:**
- `API_URL` (default: `http://localhost:5000`)
- `WS_URL` (default: `ws://localhost:5000`)

### 6. Release (`.github/workflows/release.yml`)

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch (with release type selection)

**Jobs:**
- `semantic-release`: Analyze commits and create release
- `build-release`: Build release artifacts (tarballs)
- `tag-containers`: Tag container images with semantic versions
- `create-github-release`: Create GitHub Release with artifacts
- `notify`: Send Slack notification (optional)

**Versioning:**
- Follows [Conventional Commits](https://www.conventionalcommits.org/)
- `feat:` → Minor version bump
- `fix:` → Patch version bump
- `BREAKING CHANGE:` → Major version bump

**Release Artifacts:**
- `client-<version>.tar.gz` - Client build
- `server-<version>.tar.gz` - Server build
- `checksums.txt` - SHA256 checksums
- CHANGELOG.md - Auto-generated changelog

**Container Image Tags:**
- `<version>` - Semantic version (e.g., `1.2.3`)
- `v<version>` - Prefixed version (e.g., `v1.2.3`)
- `<major>.<minor>` - Major.minor version (e.g., `1.2`)

**Environment Variables Required:**
- `GITHUB_TOKEN` (automatic) - Repository and registry access
- `SLACK_WEBHOOK_URL` (secret, optional) - Slack notifications

### 7. Documentation (`.github/workflows/docs.yml`)

**Triggers:**
- Push to `main` or `develop` (if docs/server files changed)
- Pull requests to `main`
- Manual workflow dispatch

**Jobs:**
- `openapi-docs`: Generate OpenAPI spec from JSDoc comments
- `redoc-docs`: Generate Redoc HTML documentation
- `typedoc`: Generate TypeDoc for client and server
- `build-docs-site`: Build documentation portal
- `deploy-pages`: Deploy to GitHub Pages (main branch only)
- `generate-badges`: Update README badges

**Documentation Output:**
- OpenAPI spec: `docs/openapi.json`, `docs/openapi.yaml`
- TypeScript types: `docs/api-types.ts`
- Redoc HTML: `docs/api-documentation.html`
- TypeDoc: `docs/typedoc/client/` and `docs/typedoc/server/`
- Documentation portal: GitHub Pages

**GitHub Pages URL:**
- `https://<owner>.github.io/<repo>/`

**Environment Variables Required:**
- `GITHUB_TOKEN` (automatic) - Pages deployment

## Docker Setup

### Development Environment

**Start all services:**
```bash
docker-compose up -d
```

**Access:**
- Client: http://localhost:3000
- Server: http://localhost:5000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

**Hot Reload:**
- Client and server have volume mounts for hot reload
- Changes to `src/` directories will trigger automatic rebuilds

**Database:**
- User: `silenttalk`
- Password: `silenttalk_dev_password`
- Database: `silenttalk_dev`
- Init script: `server/database/init.sql`

### Production Deployment

**Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with production values
```

**Required environment variables:**
- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password
- `POSTGRES_DB` - PostgreSQL database name
- `DATABASE_URL` - Full PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `REDIS_PASSWORD` - Redis password
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - Allowed CORS origins
- `API_URL` - API base URL for client
- `WS_URL` - WebSocket URL for client
- `VERSION` - Docker image version tag (default: latest)
- `LOG_LEVEL` - Logging level (default: info)

**Deploy:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Resource Limits:**
- PostgreSQL: 2 CPU, 2GB RAM (1 CPU, 1GB reserved)
- Redis: 1 CPU, 512MB RAM (0.5 CPU, 256MB reserved)
- Server: 2 CPU, 2GB RAM per replica (1 CPU, 1GB reserved)
- Client: 1 CPU, 512MB RAM per replica (0.5 CPU, 256MB reserved)
- Nginx: 1 CPU, 256MB RAM

**Scaling:**
- Server: 3 replicas
- Client: 3 replicas
- Rolling updates with rollback on failure

**SSL Termination (Optional):**
The nginx service provides SSL termination if configured:
```bash
# Place SSL certificates
mkdir -p nginx/ssl
cp your-cert.pem nginx/ssl/
cp your-key.pem nginx/ssl/

# Generate dhparam
openssl dhparam -out nginx/dhparam.pem 2048

# Update nginx/nginx.conf with SSL configuration
```

## Container Images

### Client Dockerfile

**Multi-stage build:**
1. **Builder stage**: Install dependencies and build React app
2. **Production stage**: Serve with Nginx

**Features:**
- Node 18 Alpine for build
- Nginx 1.25 Alpine for serving
- Non-root user (`appuser:1001`)
- Security headers (CSP, HSTS, X-Frame-Options)
- Static asset caching (1 year)
- Health check endpoint (`/health`)
- React Router support

**Build:**
```bash
docker build -t silenttalk-client:latest ./client
```

### Server Dockerfile

**Multi-stage build:**
1. **Builder stage**: Compile TypeScript
2. **Deps stage**: Install production dependencies
3. **Production stage**: Run with minimal footprint

**Features:**
- Node 18 Alpine base
- TypeScript compilation
- Production-only dependencies
- Non-root user (`appuser:1001`)
- Dumb-init for signal handling
- Health check endpoint
- OCI labels for metadata

**Build:**
```bash
docker build -t silenttalk-server:latest ./server
```

## Semantic Versioning

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature (minor version bump)
- `fix`: Bug fix (patch version bump)
- `perf`: Performance improvement (patch version bump)
- `docs`: Documentation changes (patch version bump)
- `style`: Code style changes (patch version bump)
- `refactor`: Code refactoring (patch version bump)
- `test`: Test additions or changes (patch version bump)
- `build`: Build system changes (patch version bump)
- `ci`: CI/CD changes (patch version bump)
- `chore`: Other changes (patch version bump)

**Breaking Changes:**
Add `BREAKING CHANGE:` in the footer or `!` after type for major version bump:
```
feat!: drop support for Node 14

BREAKING CHANGE: Node 14 is no longer supported. Minimum version is Node 18.
```

**Examples:**
```bash
# Feature (1.0.0 → 1.1.0)
git commit -m "feat: add user authentication"

# Bug fix (1.1.0 → 1.1.1)
git commit -m "fix: resolve login redirect issue"

# Breaking change (1.1.1 → 2.0.0)
git commit -m "feat!: redesign API endpoints"
```

### Manual Release

Trigger a release manually via GitHub Actions:
1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Select release type: `patch`, `minor`, or `major`
4. Click "Run workflow"

## Security

### Container Security

**Best Practices Implemented:**
- Non-root users in all containers
- Minimal base images (Alpine Linux)
- Multi-stage builds to reduce attack surface
- Security headers in Nginx
- Regular security scanning with Trivy
- Image signing with Cosign
- SBOM generation for dependency tracking

**Vulnerability Scanning:**
- Automatic scanning on every container build
- Fails on HIGH or CRITICAL vulnerabilities
- Results uploaded to GitHub Security tab

### Dependency Security

**Automated Checks:**
- `npm audit` in CI pipeline
- Dependabot alerts enabled
- Weekly dependency updates

**Manual Audit:**
```bash
# Client
cd client && npm audit

# Server
cd server && npm audit

# Fix vulnerabilities
npm audit fix
```

## Troubleshooting

### CI Pipeline Failures

**Test failures:**
- Check test logs in Actions → CI Pipeline → Job details
- Run tests locally: `npm test`
- Ensure PostgreSQL and Redis are running for server tests

**Build failures:**
- Check for TypeScript errors: `npm run type-check`
- Check for lint errors: `npm run lint`
- Ensure all dependencies are installed: `npm ci`

**Coverage failures:**
- Ensure test coverage meets thresholds
- Add tests for uncovered code
- Check coverage report in Actions artifacts

### Container Build Failures

**Docker build errors:**
- Check Dockerfile syntax
- Ensure all dependencies are available
- Test build locally: `docker build -t test ./client`

**Registry push failures:**
- Ensure `GITHUB_TOKEN` has `packages: write` permission
- Check GitHub Container Registry settings
- Verify authentication: `docker login ghcr.io`

**Security scan failures:**
- Review Trivy scan results
- Update vulnerable dependencies
- Consider pinning to specific versions

### E2E Test Failures

**Environment setup failures:**
- Check Docker Compose logs
- Ensure ports are not in use
- Verify service health checks pass

**Test execution failures:**
- Check test screenshots/videos in artifacts
- Run tests locally: `npm run test:e2e`
- Verify application is accessible at test URLs

### Release Failures

**Semantic release failures:**
- Ensure commit messages follow Conventional Commits
- Check that `main` branch is protected
- Verify `GITHUB_TOKEN` has required permissions

**Artifact upload failures:**
- Check build outputs exist
- Verify GitHub Release creation succeeded
- Ensure file paths in workflow are correct

## Monitoring

### Health Checks

**Endpoints:**
- Client: `http://localhost:3000/health` (returns "healthy")
- Server: `http://localhost:5000/health` (returns health status)

**Docker Health Checks:**
```bash
# Check container health
docker ps

# View health check logs
docker inspect <container-id> | jq '.[0].State.Health'
```

### Logs

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server

# Production
docker-compose -f docker-compose.prod.yml logs -f
```

### Metrics

**Container metrics:**
```bash
# Resource usage
docker stats

# Container events
docker events
```

## Best Practices

### Development Workflow

1. Create feature branch from `develop`
2. Make changes with conventional commits
3. Push and create pull request
4. CI pipeline runs automatically
5. Address any failures
6. Request code review
7. Merge to `develop`

### Release Workflow

1. Merge `develop` to `main` when ready for release
2. Semantic release runs automatically
3. Version is determined from commit messages
4. CHANGELOG is generated
5. GitHub Release is created
6. Container images are tagged
7. Artifacts are uploaded

### Documentation Workflow

1. Add JSDoc comments to API routes
2. Add TypeDoc comments to functions/classes
3. Push changes to `main` or `develop`
4. Documentation workflow generates updated docs
5. GitHub Pages is updated automatically

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Trivy Security Scanner](https://aquasecurity.github.io/trivy/)
- [Cosign Image Signing](https://docs.sigstore.dev/cosign/overview/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Axe Accessibility](https://www.deque.com/axe/)
- [K6 Load Testing](https://k6.io/docs/)

## Support

For issues or questions:
- GitHub Issues: https://github.com/hamdanyasser/SilentTalkFYP/issues
- Documentation: https://hamdanyasser.github.io/SilentTalkFYP/
