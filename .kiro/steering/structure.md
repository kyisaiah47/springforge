# Orbit Structure Overview

**Mission:** Maintain a clean, modular Next.js 14+ codebase that makes it easy to demo, extend, and onboard contributors quickly.

## Root Structure

```
├── src/                    # Source code
├── supabase/               # Database migrations and schema
├── scripts/                # Utility and seed scripts
├── public/                 # Static assets
└── .kiro/                  # Kiro configuration and steering
```

## Source Organization (`src/`)

### App Directory (`src/app/`)

- **App Router**: Next.js 13+ routing with nested layouts.
- **Route Groups**: `(modules)` for feature organization.
- **API Routes**: RESTful endpoints in `api/`.
- **Auth Flow**: Dedicated auth pages and OAuth callbacks.

### Components (`src/components/`)

- **UI Components**: Reusable design system components in `ui/`.
- **Module Components**: Feature-specific components in `modules/`.
- **Shared Components**: Cross-module reusable building blocks.

### Library (`src/lib/`)

- **Auth**: Providers + `ProtectedRoute`.
- **Supabase**: Client + server configs.
- **Modules**: Business logic by feature.
- **Types**: TypeScript + DB types.
- **Utils**: Shared helpers.

## Module Architecture

Each feature module (AutoStand, PR Radar, Retro, Arcade) follows a consistent pattern:

- **App Routes** → `src/app/(modules)/{module}/`
- **API Routes** → `src/app/api/{module}/`
- **Components** → `src/components/modules/{module}/`
- **Logic** → `src/lib/modules/{module}/`

This enforces **separation of concerns** and makes each module demo-ready in isolation.

## Database (`supabase/`)

- **Migrations**: Numbered SQL files.
- **001_initial_schema.sql**: Core tables + relationships.
- **002_rls_policies.sql**: RLS policies.

## Naming Conventions

- Files → `kebab-case`
- Components → `PascalCase`
- Functions → `camelCase`
- DB → `snake_case`
- Routes → lowercase + hyphens

## Import Patterns

- Use `@/` alias for imports:
  ```ts
  import { Button } from "@/components/ui/button";
  ```
- Relative imports only for same-directory.
- Absolute imports for cross-module dependencies.

## Authentication Flow

- **Protected Routes** wrapped with `ProtectedRoute`.
- **AuthProvider** in root layout for global context.
- **Server Components**: `src/lib/supabase/server.ts`.
- **Client Components**: `src/lib/supabase/client.ts`.
