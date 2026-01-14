# AMP MBG Backend

Hono API server with PostgreSQL database.

## Setup

```sh
bun install
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL
```

## Database

```sh
bun run db:push    # Push schema to database
bun run db:seed    # Seed provinces, cities, districts
bun run db:studio  # Open Drizzle Studio
```

## Development

```sh
bun run dev
```

Server runs at http://localhost:3000

## API Endpoints

### Auth
- `POST /api/auth/signup` - Register user (NIK, email, name, password)
- `POST /api/auth/signup-member` - Register member (+ organization)
- `POST /api/auth/login` - Login (email/phone + password)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Reports
- `GET /api/reports` - List reports (pagination, filters)
- `GET /api/reports/stats` - Report statistics
- `GET /api/reports/recent` - Recent 6 reports
- `GET /api/reports/:id` - Single report
- `POST /api/reports` - Create report
- `GET /api/reports/my/reports` - User's reports

### Locations
- `GET /api/locations/provinces` - All provinces
- `GET /api/locations/provinces/:id/cities` - Cities by province
- `GET /api/locations/cities/:id/districts` - Districts by city
- `GET /api/locations/search?q=` - Search locations

### Categories
- `GET /api/categories` - Report categories
- `GET /api/categories/organizations` - Organization types
- `GET /api/categories/relations` - Reporter relations

## Build

```sh
bun run build
```
