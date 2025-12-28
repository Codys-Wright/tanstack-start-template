# TanStack Start Template

A production-ready monorepo template built with TanStack Start, Nx, Effect, and Better Auth.

## 🏗️ Project Structure

This is an **Nx monorepo** with the following structure:

```
.
├── apps/
│   ├── my-artist-type/          # Main TanStack Start application
│   └── explore/                 # Experimental playground app
├── packages/
│   ├── auth/                    # Authentication package (@auth)
│   │   ├── src/features/        # Feature-based organization
│   │   │   ├── _core/          # Core auth services (AuthService, middleware, etc.)
│   │   │   ├── account/        # Account management
│   │   │   ├── admin/          # Admin functionality
│   │   │   ├── invitation/     # Team invitations
│   │   │   ├── member/         # Team members
│   │   │   ├── organization/   # Organizations & teams
│   │   │   ├── security/       # 2FA, passkeys
│   │   │   ├── session/        # Session management
│   │   │   └── user/           # User management
│   │   └── database/           # Auth database migrations
│   ├── core/                    # Core utilities (@core)
│   ├── email/                   # Email service (@email)
│   ├── todo/                    # Todo feature example (@todo)
│   └── ui/                      # UI packages
│       ├── shadcn/             # shadcn/ui components (@shadcn)
│       └── theme/              # Theme system
└── scripts/                     # Build and utility scripts
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) - Runtime and package manager
- [Nx](https://nx.dev/) - Monorepo tooling (installed automatically)

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp apps/my-artist-type/.env.example apps/my-artist-type/.env
# Edit .env with your configuration
```

### Development

```bash
# Run the main app
nx dev my-artist-type

# Or using bun directly
cd apps/my-artist-type
bun dev

# Run the playground app
nx dev explore
```

### Database Setup

This project uses PostgreSQL with Better Auth for authentication:

```bash
# Start database (requires Docker)
cd apps/my-artist-type
docker-compose up -d

# Run migrations
nx run my-artist-type:db:migrate

# Seed database (optional)
nx run my-artist-type:db:seed
```

## 📦 Packages

### `@auth` - Authentication Package

Full-featured authentication built on [Better Auth](https://better-auth.com/) with Effect integration.

**Features:**
- Email/password authentication
- Social login (Google)
- Organizations & Teams
- Role-based access control
- Two-factor authentication
- Passkey support
- Session management

**Key Services:**
- `AuthService` - Main authentication service
- `AuthConfig` - Configuration management
- `AuthDatabase` - Database connection
- `HttpAuthenticationMiddleware` - HTTP middleware
- `RpcAuthenticationMiddleware` - RPC middleware

### `@core` - Core Package

Shared utilities and database infrastructure using Effect.

### `@email` - Email Service

Mock email service for development (Effect-based).

### `@todo` - Todo Package

Example feature demonstrating the architecture patterns.

### `@shadcn` - UI Components

shadcn/ui components configured for the project.

## 🛠️ Nx Commands

### Development

```bash
# Run any app
nx dev <app-name>

# Build an app
nx build <app-name>

# Run tests
nx test <app-name>

# Type check
nx check
```

### Useful Commands

```bash
# See what's affected by changes
nx affected:graph

# Run command for all affected projects
nx affected:test
nx affected:build

# Clear Nx cache
nx reset
```

### Project-Specific Tasks

```bash
# Database operations
nx run my-artist-type:db:migrate
nx run my-artist-type:db:reset
nx run my-artist-type:db:seed
nx run my-artist-type:db:clean

# Make user admin
nx run my-artist-type:admin:set
```

## 🏛️ Architecture

### Effect-TS

This project uses [Effect](https://effect.website/) for:
- Type-safe dependency injection
- Error handling
- Service composition
- Runtime management

### Better Auth

Authentication is handled by [Better Auth](https://better-auth.com/) with:
- Full TypeScript support
- Database-backed sessions
- Plugin system (organizations, 2FA, passkeys)
- React hooks for client-side

### Feature-Based Organization

Each feature in `@auth` follows this structure:
```
feature/
├── feature.schema.ts       # Zod/Effect schemas
├── feature.repository.ts   # Database operations
├── feature.atoms.ts        # Client state (jotai)
└── ui/                     # React components
```

### Monorepo Benefits

- **Shared code** - Common packages used across apps
- **Type safety** - Full TypeScript across package boundaries
- **Fast builds** - Nx caching and task orchestration
- **Isolated testing** - Test packages independently

## 🧪 Testing

```bash
# Run all tests
bun test

# Run tests for specific package
nx test auth

# Run tests in watch mode
nx test auth --watch
```

## 🏗️ Building for Production

```bash
# Build the main app
nx build my-artist-type

# Build all apps
nx run-many --target=build --all

# Build only affected apps
nx affected:build
```

## 📝 Environment Variables

Required environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key
CLIENT_ORIGIN=http://localhost:5173

# OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# App
APP_NAME=My Artist Type
```

## 🎨 Styling

- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful, accessible components
- **CSS Variables** - Theme system with dark mode

## 📚 Tech Stack

- **Framework:** TanStack Start
- **Monorepo:** Nx
- **Runtime:** Bun
- **Language:** TypeScript
- **Auth:** Better Auth
- **Database:** PostgreSQL (Kysely query builder)
- **Effects:** Effect-TS
- **State:** Jotai (atoms)
- **Styling:** Tailwind CSS + shadcn/ui
- **Testing:** Vitest

## 🔗 Useful Links

- [TanStack Start](https://tanstack.com/start)
- [Nx Documentation](https://nx.dev/)
- [Effect Documentation](https://effect.website/)
- [Better Auth](https://better-auth.com/)
- [shadcn/ui](https://ui.shadcn.com/)

## 📄 License

MIT
