# ============================================
# Makefile for SilentsTalk Monorepo
# ============================================

.PHONY: help dev-up dev-down dev-logs dev-restart clean seed lint format test build install health check-deps

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Docker Compose file
DOCKER_COMPOSE := infrastructure/docker/docker-compose.yml
DOCKER_COMPOSE_CMD := docker-compose -f $(DOCKER_COMPOSE)

## help: Display this help message
help:
	@echo "$(BLUE)SilentsTalk Monorepo - Available Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev-up          - Start all development services"
	@echo "  make dev-down        - Stop all development services"
	@echo "  make dev-restart     - Restart all services"
	@echo "  make dev-logs        - Follow logs from all services"
	@echo "  make health          - Check health of all services"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  make seed            - Seed databases with initial data"
	@echo "  make db-migrate      - Run database migrations"
	@echo "  make db-reset        - Reset databases (WARNING: deletes data)"
	@echo ""
	@echo "$(GREEN)Code Quality:$(NC)"
	@echo "  make lint            - Run linters for all services"
	@echo "  make format          - Format code for all services"
	@echo "  make test            - Run all tests"
	@echo "  make test-coverage   - Run tests with coverage"
	@echo ""
	@echo "$(GREEN)Build:$(NC)"
	@echo "  make build           - Build all services"
	@echo "  make install         - Install all dependencies"
	@echo ""
	@echo "$(GREEN)Cleanup:$(NC)"
	@echo "  make clean           - Remove build artifacts and containers"
	@echo "  make clean-all       - Remove everything including volumes"
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@echo "  make check-deps      - Check for required dependencies"
	@echo "  make setup-hooks     - Setup pre-commit hooks"

## check-deps: Check for required dependencies
check-deps:
	@echo "$(BLUE)Checking dependencies...$(NC)"
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)Error: docker is required but not installed$(NC)"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "$(RED)Error: docker-compose is required but not installed$(NC)"; exit 1; }
	@command -v dotnet >/dev/null 2>&1 || { echo "$(YELLOW)Warning: .NET SDK not found (required for local development)$(NC)"; }
	@command -v node >/dev/null 2>&1 || { echo "$(YELLOW)Warning: Node.js not found (required for local development)$(NC)"; }
	@command -v python3 >/dev/null 2>&1 || { echo "$(YELLOW)Warning: Python 3 not found (required for ML service)$(NC)"; }
	@echo "$(GREEN)✓ Core dependencies found$(NC)"

## dev-up: Start all development services
dev-up: check-deps
	@echo "$(BLUE)Starting development environment...$(NC)"
	@$(DOCKER_COMPOSE_CMD) up -d
	@echo "$(GREEN)✓ All services started$(NC)"
	@echo ""
	@echo "$(BLUE)Services available at:$(NC)"
	@echo "  - Frontend:        http://localhost:3000"
	@echo "  - Backend API:     http://localhost:5000"
	@echo "  - ML Service:      http://localhost:8000"
	@echo "  - Swagger UI:      http://localhost:5000/swagger"
	@echo "  - Kibana:          http://localhost:5601"
	@echo "  - MinIO Console:   http://localhost:9001"
	@echo ""
	@echo "$(YELLOW)Run 'make dev-logs' to view logs$(NC)"
	@echo "$(YELLOW)Run 'make health' to check service health$(NC)"

## dev-down: Stop all development services
dev-down:
	@echo "$(BLUE)Stopping development environment...$(NC)"
	@$(DOCKER_COMPOSE_CMD) down
	@echo "$(GREEN)✓ All services stopped$(NC)"

## dev-restart: Restart all services
dev-restart: dev-down dev-up

## dev-logs: Follow logs from all services
dev-logs:
	@$(DOCKER_COMPOSE_CMD) logs -f

## health: Check health of all services
health:
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo "$(YELLOW)Backend API:$(NC)"
	@curl -s http://localhost:5000/health || echo "$(RED)✗ Backend not responding$(NC)"
	@echo ""
	@echo "$(YELLOW)ML Service:$(NC)"
	@curl -s http://localhost:8000/health || echo "$(RED)✗ ML Service not responding$(NC)"
	@echo ""
	@echo "$(YELLOW)Frontend:$(NC)"
	@curl -s http://localhost:3000 > /dev/null && echo "$(GREEN)✓ Frontend is running$(NC)" || echo "$(RED)✗ Frontend not responding$(NC)"
	@echo ""
	@echo "$(YELLOW)PostgreSQL:$(NC)"
	@$(DOCKER_COMPOSE_CMD) exec -T postgres pg_isready -U silentstalk || echo "$(RED)✗ PostgreSQL not ready$(NC)"
	@echo ""
	@echo "$(YELLOW)MongoDB:$(NC)"
	@$(DOCKER_COMPOSE_CMD) exec -T mongodb mongosh --eval "db.adminCommand('ping')" --quiet || echo "$(RED)✗ MongoDB not ready$(NC)"
	@echo ""
	@echo "$(YELLOW)Redis:$(NC)"
	@$(DOCKER_COMPOSE_CMD) exec -T redis redis-cli ping || echo "$(RED)✗ Redis not ready$(NC)"

## seed: Seed databases with initial data
seed:
	@echo "$(BLUE)Seeding databases...$(NC)"
	@cd server && dotnet run --project src/SilentsTalk.Api -- seed
	@echo "$(GREEN)✓ Database seeded$(NC)"

## db-migrate: Run database migrations
db-migrate:
	@echo "$(BLUE)Running database migrations...$(NC)"
	@cd server && dotnet ef database update --project src/SilentsTalk.Infrastructure --startup-project src/SilentsTalk.Api
	@echo "$(GREEN)✓ Migrations applied$(NC)"

## db-reset: Reset databases (WARNING: deletes data)
db-reset:
	@echo "$(RED)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(BLUE)Resetting databases...$(NC)"; \
		$(DOCKER_COMPOSE_CMD) down -v; \
		$(DOCKER_COMPOSE_CMD) up -d postgres mongodb redis; \
		sleep 5; \
		make db-migrate; \
		make seed; \
		echo "$(GREEN)✓ Databases reset$(NC)"; \
	fi

## install: Install all dependencies
install:
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@echo "$(YELLOW)Installing root dependencies...$(NC)"
	@npm install
	@echo "$(YELLOW)Installing client dependencies...$(NC)"
	@cd client && npm install
	@echo "$(YELLOW)Restoring server dependencies...$(NC)"
	@cd server && dotnet restore
	@echo "$(YELLOW)Installing ML service dependencies...$(NC)"
	@cd ml-service && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	@echo "$(GREEN)✓ All dependencies installed$(NC)"

## lint: Run linters for all services
lint:
	@echo "$(BLUE)Running linters...$(NC)"
	@npm run lint

## format: Format code for all services
format:
	@echo "$(BLUE)Formatting code...$(NC)"
	@npm run format
	@echo "$(GREEN)✓ Code formatted$(NC)"

## test: Run all tests
test:
	@echo "$(BLUE)Running tests...$(NC)"
	@npm run test

## test-coverage: Run tests with coverage
test-coverage:
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	@cd server && dotnet test /p:CollectCoverage=true /p:CoverageReportsFormat=opencover
	@cd client && npm run test:coverage
	@cd ml-service && . venv/bin/activate && pytest --cov=app --cov-report=html

## build: Build all services
build:
	@echo "$(BLUE)Building all services...$(NC)"
	@$(DOCKER_COMPOSE_CMD) build
	@echo "$(GREEN)✓ All services built$(NC)"

## clean: Remove build artifacts and containers
clean:
	@echo "$(BLUE)Cleaning up...$(NC)"
	@$(DOCKER_COMPOSE_CMD) down
	@cd server && dotnet clean
	@cd client && rm -rf dist node_modules
	@cd ml-service && rm -rf __pycache__ .pytest_cache
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

## clean-all: Remove everything including volumes
clean-all:
	@echo "$(RED)WARNING: This will delete all data including Docker volumes!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(BLUE)Removing everything...$(NC)"; \
		$(DOCKER_COMPOSE_CMD) down -v; \
		make clean; \
		echo "$(GREEN)✓ Everything removed$(NC)"; \
	fi

## setup-hooks: Setup pre-commit hooks
setup-hooks:
	@echo "$(BLUE)Setting up pre-commit hooks...$(NC)"
	@npm install
	@npx husky install
	@npx husky add .husky/pre-commit "npm run lint-staged"
	@chmod +x .husky/pre-commit
	@echo "$(GREEN)✓ Pre-commit hooks installed$(NC)"

# Default target
.DEFAULT_GOAL := help
