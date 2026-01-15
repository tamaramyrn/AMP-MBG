# AMP MBG Backend

Hono API server with PostgreSQL 17.

## Quick Start

```sh
# From project root
make setup-dev    # Setup development environment
make dev          # Run frontend + backend
```

## Environments

| Environment | Database | Storage |
|------------|----------|---------|
| Development | Docker PostgreSQL 17 | Local filesystem |
| Staging | Supabase (free) | Supabase Storage |
| Production | VPS PostgreSQL | Cloudflare R2 |

## Commands

```sh
make db-up        # Start PostgreSQL
make db-push      # Apply schema
make db-seed      # Seed data
make db-studio    # Open Drizzle Studio
```

## API Endpoints

### Auth
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login (email/NIK/phone)
- `GET /api/auth/me` - Current user
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Reset password

### Reports
- `GET /api/reports` - List (pagination, filters)
- `GET /api/reports/stats` - Statistics
- `POST /api/reports` - Create report
- `POST /api/reports/:id/files` - Upload files
- `PATCH /api/reports/:id/status` - Update status (admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - User management
- `GET /api/admin/reports` - Report management
- `GET /api/admin/mbg-schedules` - MBG schedules

### Locations
- `GET /api/locations/provinces` - Provinces
- `GET /api/locations/provinces/:id/cities` - Cities
- `GET /api/locations/cities/:id/districts` - Districts

## Default Users

After `make db-seed`:
- Admin: `admin@ampmbg.id` / `Admin@123!`
- Public: `test@ampmbg.id` / `Test@123!`
