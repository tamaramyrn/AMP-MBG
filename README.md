# AMP MBG

Platform pelaporan masyarakat untuk mengawal Program Makan Bergizi Gratis (MBG) di Indonesia.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, TailwindCSS, Shadcn UI, TanStack Router/Query |
| Backend | Hono, TypeScript, Drizzle ORM |
| Database | PostgreSQL 17 |
| Runtime | Bun |

## Quick Start

```sh
make setup    # First time setup
make run      # Start development
make stop     # Stop all services
```

## Commands

| Command | Description |
|---------|-------------|
| `make setup` | First time setup (install + db + seed) |
| `make run` | Start frontend + backend |
| `make stop` | Stop all services |
| `make build` | Build for production |
| `make clean` | Remove node_modules and dist |
| `make db-reset` | Reset database |
| `make db-studio` | Open Drizzle Studio |

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ampmbg.id | Admin@123! |
| User | budi@example.com | Test@123! |

## Environment Variables

### Frontend (`apps/frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=AMP MBG
```

### Backend (`apps/backend/.env`)
```env
DATABASE_URL=postgresql://ampmbg:ampmbg@localhost:5432/ampmbg_dev
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
```

## Production

```sh
make docker-build   # Build image
make docker-up      # Start production
make docker-down    # Stop production
make docker-logs    # View logs
```

## License

MIT
