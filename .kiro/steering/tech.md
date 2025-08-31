# Technology Stack

SprintForge is built with modern web technologies optimized for developer productivity and scalability.

## Core Framework & Runtime

- **Next.js 15.5.2**: React framework with App Router
- **React 19.1.0**: UI library with latest features
- **TypeScript 5**: Type-safe development
- **Node.js**: Server-side runtime

## Database & Backend

- **Supabase**: PostgreSQL database with real-time capabilities
- **Row Level Security (RLS)**: Multi-tenant data isolation
- **Supabase Auth**: GitHub OAuth integration
- **Server-side rendering**: Next.js API routes and server components

## Styling & UI

- **Tailwind CSS 4**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant management
- **Geist Font**: Vercel's font family

## Development Tools

- **ESLint 9**: Code linting with Next.js config
- **TSX**: TypeScript execution for scripts
- **Turbopack**: Fast bundler for development and builds

## Common Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Production build with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint

# Database Operations
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed demo data
npm run db:reset     # Reset database (migrate + seed)
```

## Environment Setup

- Copy `.env.local.example` to `.env.local`
- Configure Supabase URL and keys
- Set up GitHub OAuth application
- Run migrations and seed data for development
