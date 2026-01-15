# AMP MBG Makefile
# Usage: make [target]

.PHONY: help install dev build clean db-up db-down db-push db-seed setup-dev setup-staging setup-prod docker-build docker-up docker-down

DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_PROD = docker compose -f docker-compose.prod.yml

help:
	@echo "AMP MBG Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make setup-dev      Setup local development"
	@echo "  make setup-staging  Setup staging (Supabase)"
	@echo "  make setup-prod     Setup production (DO + CF)"
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
	@echo ""
	@echo "Production:"
	@echo "  make docker-build   Build Docker image"
	@echo "  make docker-up      Start production"
	@echo "  make docker-down    Stop production"

# Setup environments
setup-dev:
	@echo "[setup-dev] Setting up development..."
	@cp -n apps/backend/.env.example apps/backend/.env 2>/dev/null || true
	@mkdir -p apps/backend/uploads
	bun install
	$(MAKE) db-up
	@sleep 3
	$(MAKE) db-push
	$(MAKE) db-seed
	@echo "[setup-dev] Done. Run: make dev"

setup-staging:
	@echo "[setup-staging] Setting up staging..."
	@echo "[setup-staging] Configure Supabase credentials in apps/backend/.env"
	@echo "  1. Create project at supabase.com"
	@echo "  2. Copy DATABASE_URL from Settings > Database"
	@echo "  3. Create storage bucket 'uploads' (public)"

setup-prod:
	@echo "[setup-prod] Setting up production..."
	@echo "[setup-prod] Configure in apps/backend/.env:"
	@echo "  1. DB_PASSWORD for PostgreSQL"
	@echo "  2. JWT_SECRET (openssl rand -base64 64)"
	@echo "  3. Cloudflare R2 credentials"

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
	$(DOCKER_COMPOSE) up -d postgres
	@until docker exec ampmbg-postgres pg_isready -U ampmbg -d ampmbg_dev > /dev/null 2>&1; do sleep 2; done
	@echo "[db-up] PostgreSQL ready"

db-down:
	$(DOCKER_COMPOSE) down

db-push:
	bun run db:push

db-seed:
	bun run db:seed

db-studio:
	bun run db:studio

db-reset: db-down
	docker volume rm ampmbg-postgres-data 2>/dev/null || true
	$(MAKE) db-up
	@sleep 3
	$(MAKE) db-push
	$(MAKE) db-seed

# Build
build:
	bun run build

build-fe:
	bun run build:fe

build-be:
	bun run build:be

# Docker Production
docker-build:
	docker build -t ampmbg-backend:latest apps/backend

docker-up:
	$(DOCKER_COMPOSE_PROD) up -d

docker-down:
	$(DOCKER_COMPOSE_PROD) down

docker-logs:
	$(DOCKER_COMPOSE_PROD) logs -f

# Cleanup
clean:
	rm -rf node_modules apps/*/node_modules apps/*/dist apps/backend/uploads
	$(DOCKER_COMPOSE) down -v 2>/dev/null || true


