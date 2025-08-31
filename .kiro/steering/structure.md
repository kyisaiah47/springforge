# Project Structure

SprintForge follows Next.js App Router conventions with a modular architecture for scalability and maintainability.

## Root Structure

```
├── src/                    # Source code
├── supabase/              # Database migrations and schema
├── scripts/               # Database and utility scripts
├── public/                # Static assets
└── .kiro/                 # Kiro configuration and steering
```

## Source Organization (`src/`)

### App Directory (`src/app/`)

- **App Router**: Next.js 13+ routing with nested layouts
- **Route Groups**: `(modules)` for feature organization
- **API Routes**: RESTful endpoints in `api/` directory
- **Auth Flow**: Dedicated auth pages and callbacks

### Components (`src/components/`)

- **UI Components**: Reusable design system components in `ui/`
- **Module Components**: Feature-specific components in `modules/`
- **Shared Components**: Cross-module reusable components

### Library (`src/lib/`)

- **Auth**: Authentication providers and route protection
- **Supabase**: Database client configuration (client/server)
- **Modules**: Business logic organized by feature
- **Types**: TypeScript definitions and database types
- **Utils**: Shared utility functions

## Module Architecture

Each module follows a consistent pattern:

- **App Routes**: `src/app/(modules)/{module}/`
- **API Routes**: `src/app/api/{module}/`
- **Components**: `src/components/modules/{module}/`
- **Business Logic**: `src/lib/modules/{module}/`

## Database Structure (`supabase/`)

- **Migrations**: Numbered SQL files for schema changes
- **001_initial_schema.sql**: Core tables and relationships
- **002_rls_policies.sql**: Row Level Security policies

## Naming Conventions

- **Files**: kebab-case for all files and directories
- **Components**: PascalCase for React components
- **Functions**: camelCase for functions and variables
- **Database**: snake_case for tables and columns
- **Routes**: lowercase with hyphens for URL segments

## Import Patterns

- Use `@/` alias for src imports: `import { Component } from '@/components/ui/button'`
- Relative imports for same-directory files
- Absolute imports for cross-module dependencies

## Authentication Flow

- **Protected Routes**: Wrap with `ProtectedRoute` component
- **Auth Provider**: Global context in root layout
- **Server Components**: Use `src/lib/supabase/server.ts`
- **Client Components**: Use `src/lib/supabase/client.ts`
