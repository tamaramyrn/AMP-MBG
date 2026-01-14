# AMP MBG Monorepo

Monorepo workspace for AMP MBG project using Bun workspaces.

## Project Structure

```
amp-mbg/
├── apps/
│   ├── backend/          # Hono API server (Bun runtime)
│   └── frontend/         # React + Vite app
├── package.json          # Root workspace config
└── tsconfig.json         # Shared TypeScript config
```

## Tech Stack

### Backend (apps/backend)

- **Runtime**: Bun 1.3.5
- **Framework**: Hono 4.11.4
- **Language**: TypeScript 5.x

### Frontend (apps/frontend)

- **Build Tool**: Vite 7.2.4
- **Framework**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Linting**: ESLint 9 (Flat Config)

### Recommended Additions

When you need routing and data fetching:

- **Router**: `@tanstack/react-router` (type-safe routing)
- **Data Fetching**: `@tanstack/react-query` (server state management)

## Getting Started

### Prerequisites

- Bun 1.3.5 or later
- Node.js (for some tooling compatibility)

### Installation

```bash
# Install all dependencies across the monorepo
bun install
```

### Development

Run both frontend and backend in development mode:

```bash
# From root - runs all workspace dev scripts
bun run dev

# Or run individually:
cd apps/backend && bun run dev
cd apps/frontend && bun run dev
```

**URLs:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Environment Variables

Copy the example env files and configure:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env
```

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

### Recommended Setup

Install TanStack Router and Query when ready:

```bash
cd apps/frontend
bun add @tanstack/react-router @tanstack/react-query
```

## Building for Production

```bash
# Build all apps
bun run build

# Or build individually:
cd apps/backend && bun build
cd apps/frontend && bun run build
```

Frontend build output: `apps/frontend/dist/`

## Deployment

### Backend

Deploy to any VPS that supports Bun or Docker:

```bash
cd apps/backend
bun run src/index.ts
```

### Frontend

Deploy the `dist/` folder to:

- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting

Configure environment variables in your hosting platform.

## Workspace Commands

From the root directory:

```bash
bun run dev      # Run dev mode for all apps
bun run build    # Build all apps
bun install      # Install all dependencies
```

## Notes

- Bun automatically loads `.env` files (no need for dotenv)
- Backend uses Bun's native APIs where possible
- Frontend uses Vite for best React DX
- TypeScript strict mode enabled for both apps
