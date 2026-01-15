# AMP MBG Makefile

.PHONY: help all run stop install dev build clean db-up db-down db-push db-seed db-reset db-studio setup docker-build docker-up docker-down docker-logs

DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_PROD = docker compose -f docker-compose.prod.yml

# Default target
help:
	@echo "AMP MBG - Makefile Commands"
	@echo ""
	@echo "Quick Start:"
	@echo "  make all            First time setup (install + db + seed)"
	@echo "  make run            Start development servers"
	@echo "  make stop           Stop all services"
	@echo ""
	@echo "Development:"
	@echo "  make dev            Run frontend + backend"
	@echo "  make dev-fe         Run frontend only"
	@echo "  make dev-be         Run backend only"
	@echo ""
	@echo "Database:"
	@echo "  make db-up          Start PostgreSQL"
	@echo "  make db-down        Stop PostgreSQL"
	@echo "  make db-push        Apply schema"
	@echo "  make db-seed        Seed data"
	@echo "  make db-reset       Reset database"
	@echo "  make db-studio      Open Drizzle Studio"
	@echo ""
	@echo "Build:"
	@echo "  make build          Build frontend + backend"
	@echo "  make build-fe       Build frontend only"
	@echo "  make build-be       Build backend only"
	@echo ""
	@echo "Production:"
	@echo "  make docker-build   Build Docker image"
	@echo "  make docker-up      Start production"
	@echo "  make docker-down    Stop production"
	@echo "  make docker-logs    View production logs"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          Remove node_modules and dist"

# Quick Start Commands
all: setup
	@echo ""
	@echo "[all] Setup complete!"
	@echo "Run: make run"

setup:
	@echo "[setup] Setting up development environment..."
	@cp -n apps/backend/.env.example apps/backend/.env 2>/dev/null || true
	@cp -n apps/frontend/.env.example apps/frontend/.env 2>/dev/null || true
	@mkdir -p apps/backend/uploads
	bun install
	$(MAKE) db-up
	@sleep 3
	$(MAKE) db-push
	$(MAKE) db-seed
	@echo "[setup] Done!"

run: db-up
	@echo "[run] Starting development servers..."
	bun run dev

stop:
	@echo "[stop] Stopping all services..."
	$(DOCKER_COMPOSE) down
	@pkill -f "bun" 2>/dev/null || true
	@echo "[stop] All services stopped"

# Development
install:
	bun install

dev: db-up
	bun run dev

dev-fe:
	bun run dev:fe

dev-be: db-up
	bun run dev:be

# Database
db-up:
	@echo "[db-up] Starting PostgreSQL..."
	@$(DOCKER_COMPOSE) up -d postgres
	@until docker exec ampmbg-postgres pg_isready -U ampmbg -d ampmbg_dev > /dev/null 2>&1; do sleep 1; done
	@echo "[db-up] PostgreSQL ready"

db-down:
	@echo "[db-down] Stopping PostgreSQL..."
	$(DOCKER_COMPOSE) down

db-push:
	@echo "[db-push] Applying schema..."
	bun run db:push

db-seed:
	@echo "[db-seed] Seeding database..."
	bun run db:seed

db-studio:
	bun run db:studio

db-reset: db-down
	@echo "[db-reset] Resetting database..."
	docker volume rm amp-mbg_postgres-data 2>/dev/null || true
	$(MAKE) db-up
	@sleep 3
	$(MAKE) db-push
	$(MAKE) db-seed
	@echo "[db-reset] Database reset complete"

# Build
build:
	@echo "[build] Building all..."
	bun run build

build-fe:
	@echo "[build-fe] Building frontend..."
	bun run build:fe

build-be:
	@echo "[build-be] Building backend..."
	bun run build:be

# Docker Production
docker-build:
	@echo "[docker-build] Building backend image..."
	docker build -t ampmbg-backend:latest apps/backend

docker-up:
	@echo "[docker-up] Starting production..."
	$(DOCKER_COMPOSE_PROD) up -d

docker-down:
	@echo "[docker-down] Stopping production..."
	$(DOCKER_COMPOSE_PROD) down

docker-logs:
	$(DOCKER_COMPOSE_PROD) logs -f

# Cleanup
clean:
	@echo "[clean] Cleaning up..."
	rm -rf node_modules apps/*/node_modules apps/*/dist apps/backend/uploads
	$(DOCKER_COMPOSE) down -v 2>/dev/null || true
	@echo "[clean] Done"


