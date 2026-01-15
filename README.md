# AMP MBG

Platform pelaporan masyarakat untuk mengawal Program Makan Bergizi Gratis (MBG) di Indonesia.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, TailwindCSS, Shadcn UI, TanStack Router/Query |
| Backend | Hono, TypeScript, Drizzle ORM |
| Database | PostgreSQL 17 |
| Runtime | Bun |

## Project Structure

```
amp-mbg/
├── apps/
│   ├── backend/
│   │   └── src/
│   │       ├── db/
│   │       ├── lib/
│   │       ├── middleware/
│   │       ├── routes/
│   │       └── types/
│   └── frontend/
│       └── src/
│           ├── components/
│           ├── hooks/
│           ├── lib/
│           ├── routes/
│           └── services/
├── docker-compose.yml
├── Makefile
└── package.json
```

## Quick Start

```sh
# First time setup
make all

# Run development servers
make run

# Stop all services
make stop
```

## Commands

| Command | Description |
|---------|-------------|
| `make all` | First time setup (install + db + seed) |
| `make run` | Start frontend + backend |
| `make stop` | Stop all services |
| `make dev` | Run frontend + backend (same as run) |
| `make dev-fe` | Run frontend only |
| `make dev-be` | Run backend only |
| `make db-up` | Start PostgreSQL |
| `make db-down` | Stop PostgreSQL |
| `make db-push` | Apply schema migrations |
| `make db-seed` | Seed database with sample data |
| `make db-reset` | Reset database (drop + recreate + seed) |
| `make db-studio` | Open Drizzle Studio |
| `make build` | Build frontend + backend |
| `make clean` | Remove node_modules and dist |

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| API Base | http://localhost:3000/api |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ampmbg.id | Admin@123! |
| User | budi@example.com | Test@123! |
| User | siti@example.com | Test@123! |

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/categories` | Report categories |
| GET | `/api/categories/relations` | Reporter relations |
| GET | `/api/categories/statuses` | Report statuses |
| GET | `/api/locations/provinces` | All provinces |
| GET | `/api/locations/provinces/:id/cities` | Cities by province |
| GET | `/api/locations/cities/:id/districts` | Districts by city |
| GET | `/api/reports` | Public reports (verified only) |
| GET | `/api/reports/stats` | Report statistics |
| GET | `/api/reports/summary` | Summary statistics |
| GET | `/api/reports/recent` | Recent reports |
| GET | `/api/reports/:id` | Report detail |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user info |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/verify-email` | Verify email |

### User (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports` | Create report |
| POST | `/api/reports/:id/files` | Upload report files |
| GET | `/api/profile` | User profile + stats |
| PATCH | `/api/profile` | Update profile |
| PUT | `/api/profile/password` | Change password |
| GET | `/api/profile/reports` | User's reports |

### Admin (Admin Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard statistics |
| GET | `/api/admin/analytics` | Analytics data |
| GET | `/api/admin/users` | List users |
| GET | `/api/admin/users/:id` | User detail |
| PATCH | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/reports` | All reports |
| GET | `/api/admin/reports/:id` | Report detail |
| PATCH | `/api/admin/reports/:id/status` | Update report status |
| POST | `/api/admin/reports/bulk-status` | Bulk update status |
| GET | `/api/admin/reports/:id/history` | Status history |

## Report Categories

| Value | Label |
|-------|-------|
| poisoning | Keracunan dan Masalah Kesehatan |
| kitchen | Operasional Dapur |
| quality | Kualitas dan Keamanan Dapur |
| policy | Kebijakan dan Anggaran |
| implementation | Implementasi Program |
| social | Dampak Sosial dan Ekonomi |

## Report Statuses

| Value | Label |
|-------|-------|
| pending | Menunggu Verifikasi |
| verified | Terverifikasi |
| in_progress | Sedang Ditindaklanjuti |
| resolved | Selesai |
| rejected | Ditolak |

## Credibility Levels

| Level | Min Score | Description |
|-------|-----------|-------------|
| high | 12 | Highly credible, urgent |
| medium | 7 | Moderate, needs verification |
| low | 0 | Weak, incomplete information |

## Environment Variables

### Backend (`apps/backend/.env`)

```env
DATABASE_URL=postgresql://ampmbg:ampmbg@localhost:5432/ampmbg_dev
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
```

### Frontend (`apps/frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

## Production Deployment

```sh
# Build Docker image
make docker-build

# Start production
make docker-up

# View logs
make docker-logs

# Stop production
make docker-down
```

## Database Schema

Main tables:
- `users` - User accounts
- `reports` - MBG reports
- `report_files` - Report attachments
- `report_status_history` - Status change logs
- `provinces` - 38 Indonesian provinces
- `cities` - Cities/regencies
- `districts` - Districts
- `mbg_schedules` - MBG program schedules
- `sessions` - User sessions

## License

MIT


