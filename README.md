# AMP MBG

MBG (Makan Bergizi Gratis) reporting application.

## Structure

```
amp-mbg/
├── apps/
│   ├── backend/    # Hono API (Bun)
│   └── frontend/   # React + Vite
├── Makefile        # Build automation
└── package.json    # Workspace config
```

## Quick Start

```sh
make setup-dev      # Setup local development
make dev            # Run frontend + backend
```

## Environments

| Env | Database | Storage | Frontend | Backend |
|-----|----------|---------|----------|---------|
| dev | Docker PostgreSQL | Local filesystem | localhost:5173 | localhost:3000 |
| staging | Supabase (free) | Supabase Storage | Vercel | Vercel/Railway |
| prod | VPS PostgreSQL | Cloudflare R2 | Cloudflare Pages | Dokploy |

## Commands

```sh
make help           # Show all commands
make setup-dev      # Setup development
make setup-staging  # Setup staging (Supabase)
make setup-prod     # Setup production (DO + CF)
make dev            # Run dev servers
make build          # Build all
make db-up          # Start database
make db-push        # Apply schema
make db-seed        # Seed data
make docker-build   # Build production image
```

## URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API: http://localhost:3000/api

## Default Users

- Admin: `admin@ampmbg.id` / `Admin@123!`
- Public: `test@ampmbg.id` / `Test@123!`



## Backend API

The backend runs on port 3000 with the following routes:

- `GET /` - API welcome message
- `GET /api/health` - Health check endpoint

### Adding New Routes

Edit `apps/backend/src/index.ts`:

```typescript
app.get("/api/users", (c) => {
  return c.json({ users: [] });
});
```

## Frontend Development

The frontend is proxied to the backend API. All `/api/*` requests are forwarded to `http://localhost:3000`.

### Vite Configuration

See `apps/frontend/vite.config.ts` for proxy and build configuration.


