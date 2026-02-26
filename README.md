# AMP MBG

Platform pelaporan masyarakat untuk mengawal Program Makan Bergizi Gratis (MBG) di Indonesia.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Public | React 19, TypeScript, Vite, TailwindCSS, Shadcn UI, TanStack Router/Query |
| Frontend Admin | React 19, TypeScript, Vite, TailwindCSS, Shadcn UI, TanStack Router/Query |
| Backend | Hono, TypeScript, Drizzle ORM, Zod |
| Database | PostgreSQL 17 |
| Runtime | Bun 1.3.9 |
| Deployment | Cloudflare Pages (frontend), Docker + Dokploy (backend) |

## Project Structure

```
apps/
  frontend-public/   # Public-facing site (lapormbg.com)
  frontend-admin/    # Admin dashboard (panel.lapormbg.com)
  backend/           # API server (Hono)
```

## Quick Start

```sh
make setup    # Install deps, start DB, push schema, seed data
make run      # Start all dev servers (public :5173, admin :5174, backend :3000)
```

## Commands

| Command | Description |
|---------|-------------|
| `make setup` | First time setup (install + db + seed) |
| `make setup-fresh` | Clean setup (removes existing data) |
| `make run` | Start all dev servers |
| `make stop` | Stop all services |
| `make build` | Build all apps |
| `make test` | Run backend tests |
| `make clean` | Remove node_modules, dist, uploads |
| `make db-up` | Start PostgreSQL container |
| `make db-down` | Stop PostgreSQL container |
| `make db-push` | Apply Drizzle schema |
| `make db-seed` | Seed database |
| `make db-reset` | Reset database (drop + recreate + seed) |
| `make db-studio` | Open Drizzle Studio |
| `make mail-up` | Start Stalwart mail server |
| `make mail-down` | Stop Stalwart mail server |

## Dev URLs

| Service | URL |
|---------|-----|
| Frontend Public | http://localhost:5173 |
| Frontend Admin | http://localhost:5174 |
| Backend API | http://localhost:3000 |

## Production

```sh
make docker-build   # Build backend image
make docker-up      # Start production (docker-compose.prod.yml)
make docker-down    # Stop production
make docker-logs    # View logs
```

## License

MIT
