# SprintForge

**An all-in-one developer productivity suite that streamlines team workflows through automation and gamification.**

SprintForge integrates with GitHub and Slack to provide four powerful modules: AutoStand for automated daily standups, PR Radar for intelligent pull request management, Retro Arena for collaborative retrospectives, and Debug Arcade for coding challenges.

## 🚀 Features

- **AutoStand**: Automated daily standups generated from GitHub activity
- **PR Radar**: Pull request scoring, reviewer suggestions, and stale PR alerts
- **Retro Arena**: Collaborative retrospective boards with real-time sticky notes
- **Debug Arcade**: Coding challenges with automated testing and leaderboards
- **GitHub Integration**: OAuth authentication and comprehensive API integration
- **Slack Integration**: Automated notifications and webhook support
- **Real-time Collaboration**: Live updates across all modules
- **Multi-tenant**: Organization-based access control with role management

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.5.2 with App Router, React 19, TypeScript
- **Backend**: Next.js API Routes, Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Tailwind CSS 4, shadcn/ui components, Lucide icons
- **Authentication**: Supabase Auth with GitHub OAuth
- **Deployment**: Vercel with automated CI/CD
- **Testing**: Vitest for unit/integration tests

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- GitHub OAuth application
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-username/sprintforge.git
cd sprintforge
npm install
```

### 2. Environment Setup

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Authentication (for production)
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:migrate

# Seed with demo data (recommended for first-time setup)
npm run db:seed

# Or reset and seed in one command
npm run db:reset
```

### 4. GitHub OAuth Setup

1. Create a GitHub OAuth App:

   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Set Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
   - Note your Client ID and Client Secret

2. Configure in Supabase:
   - Dashboard > Authentication > Providers > GitHub
   - Enable and add your OAuth credentials
   - Set scopes: `read:user user:email repo`

### 5. Start Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in with GitHub!

## 📚 Documentation

- **[Database Setup](./DATABASE_SETUP.md)** - Detailed database configuration
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions
- **[Onboarding Guide](./ONBOARDING.md)** - User onboarding and demo data
- **[API Documentation](#api-documentation)** - Complete API reference

## 🗄️ Database Schema

SprintForge uses PostgreSQL with Supabase, featuring Row Level Security (RLS) for multi-tenant data isolation.

### Custom Types

```sql
-- Enumerated types for type safety
CREATE TYPE member_role AS ENUM ('admin', 'member');
CREATE TYPE integration_type AS ENUM ('github', 'slack');
CREATE TYPE pr_status AS ENUM ('open', 'merged', 'closed');
CREATE TYPE retro_status AS ENUM ('planning', 'active', 'voting', 'completed', 'archived');
CREATE TYPE retro_column AS ENUM ('went_well', 'went_poorly', 'ideas', 'action_items');
CREATE TYPE programming_language AS ENUM ('typescript', 'python');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
```

### Core Tables

#### Organizations

```sql
organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
)
```

#### Members

```sql
members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    github_login TEXT NULL,
    github_id TEXT NULL,
    avatar_url TEXT NULL,
    slack_user_id TEXT NULL,
    role member_role DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE(org_id, email)
)
```

#### Integrations

```sql
integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type integration_type NOT NULL,
    access_token TEXT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE(org_id, type)
)
```

### Module Tables

#### AutoStand - Standups

```sql
standups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    yesterday TEXT[] DEFAULT '{}',
    today TEXT[] DEFAULT '{}',
    blockers TEXT[] DEFAULT '{}',
    raw_github_data JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, member_id, date)
)
```

#### PR Radar - PR Insights

```sql
pr_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    repo TEXT NOT NULL,
    number INTEGER NOT NULL,
    author_member_id UUID NULL REFERENCES members(id) ON DELETE SET NULL,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    files_changed INTEGER DEFAULT 0,
    tests_changed INTEGER DEFAULT 0,
    touched_paths TEXT[] DEFAULT '{}',
    size_score DECIMAL(3,1) DEFAULT 0.0,
    risk_score DECIMAL(3,1) DEFAULT 0.0,
    suggested_reviewers TEXT[] DEFAULT '{}',
    status pr_status DEFAULT 'open',
    opened_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, repo, number)
)
```

#### Retro Arena - Retros & Notes

```sql
retros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sprint TEXT NULL,
    status retro_status DEFAULT 'planning',
    created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
)

retro_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retro_id UUID NOT NULL REFERENCES retros(id) ON DELETE CASCADE,
    author_member_id UUID NULL REFERENCES members(id) ON DELETE SET NULL,
    column_key retro_column NOT NULL,
    text TEXT NOT NULL,
    color TEXT DEFAULT '#fbbf24',
    votes INTEGER DEFAULT 0,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
)
```

#### Debug Arcade - Levels & Runs

```sql
arcade_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    language programming_language NOT NULL,
    difficulty difficulty_level NOT NULL,
    starter_code TEXT NOT NULL,
    test_cases TEXT NOT NULL,
    solution TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
)

arcade_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_id UUID NOT NULL REFERENCES arcade_levels(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    submitted_code TEXT NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    duration_ms INTEGER DEFAULT 0,
    points_awarded INTEGER DEFAULT 0,
    test_output TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### System Tables

#### Job Locks (Cron Management)

```sql
job_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name TEXT NOT NULL UNIQUE,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_by TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Database Functions

#### Job Lock Management

```sql
-- Acquire a distributed lock for cron jobs
acquire_job_lock(job_name TEXT, locked_by TEXT, duration_minutes INTEGER DEFAULT 60) RETURNS BOOLEAN

-- Release a job lock
release_job_lock(job_name TEXT, locked_by TEXT) RETURNS BOOLEAN

-- Check if a job is currently locked
is_job_locked(job_name TEXT) RETURNS BOOLEAN
```

#### RLS Helper Functions

```sql
-- Get current authenticated user's member record
get_current_member() RETURNS UUID

-- Get current user's organization ID
get_current_org() RETURNS UUID

-- Check if current user is an admin
is_admin() RETURNS BOOLEAN
```

### Key Features

- **Row Level Security (RLS)**: All tables have comprehensive policies ensuring users only access their organization's data
- **Soft Deletes**: Organizations, members, and integrations use `deleted_at` for soft deletion
- **Unique Constraints**: GitHub IDs are unique across the platform (partial unique index)
- **Performance Indexes**: Comprehensive indexing strategy including:
  - Composite indexes for common query patterns
  - Partial indexes for filtered queries (stale PRs, high-risk PRs)
  - Optimized leaderboard queries with points and duration
- **Triggers**: Automatic `updated_at` timestamp updates for PR insights
- **Distributed Locking**: Job lock system prevents duplicate cron job executions
- **Onboarding Support**: Special policies allow authenticated users to create organizations and member records

### Security Policies

The database implements comprehensive RLS policies:

- **Multi-tenant Isolation**: Users can only access data within their organization
- **Role-based Access**: Admins have additional permissions for organization management
- **Self-service**: Users can update their own profiles and create their own content
- **Anonymous Support**: Retro notes can be posted anonymously
- **Public Arcade**: Arcade levels are publicly readable for all users

### Migration Management

Database changes are managed through numbered migration files in `supabase/migrations/`:

- `001_initial_schema.sql` - Core tables, types, and relationships
- `002_rls_policies.sql` - Row Level Security policies and helper functions
- `003_job_lock_table.sql` - Distributed job locking system
- `003_onboarding_policies.sql` - Onboarding flow policies
- `004_performance_indexes.sql` - Performance optimization indexes and analytics

## 🏗️ Project Structure

```
sprintforge/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (modules)/         # Feature modules (AutoStand, PR Radar, etc.)
│   │   ├── api/               # API routes
│   │   └── auth/              # Authentication pages
│   ├── components/            # React components
│   │   ├── ui/               # Design system components
│   │   └── modules/          # Feature-specific components
│   └── lib/                   # Business logic and utilities
│       ├── modules/          # Module-specific services
│       ├── integrations/     # GitHub/Slack integrations
│       └── supabase/         # Database client configuration
├── supabase/
│   └── migrations/           # Database schema migrations
├── scripts/                  # Database and utility scripts
└── .kiro/                   # Kiro configuration and specs
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage

# Database Operations
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed demo data
npm run db:reset     # Reset database (migrate + seed)
npm run db:test      # Test demo data seeding

# Deployment
npm run deploy:check    # Pre-deployment checks
npm run deploy:migrate  # Run migrations in production
npm run deploy:verify   # Verify deployment health
```

## 🎯 Module Overview

### AutoStand

Automated daily standups from GitHub activity:

- Fetches commits, PRs, and issues from last 24 hours
- Generates structured summaries for team members
- Posts to Slack channels via webhooks
- Historical standup tracking and analytics

### PR Radar

Intelligent pull request management:

- Risk scoring based on size, complexity, and file changes
- Smart reviewer suggestions using code ownership
- Stale PR detection and automated alerts
- Real-time dashboard with filtering and sorting

### Retro Arena

Collaborative retrospective sessions:

- Real-time sticky note boards with drag-and-drop
- Dot voting system with live updates
- Anonymous posting support
- Markdown export and Notion integration

### Debug Arcade

Gamified coding challenges:

- Progressive difficulty levels with multiple languages
- Sandboxed code execution with automated testing
- Leaderboards and point systems
- Hint system and solution tracking

## 🔐 Security Features

- **Row Level Security (RLS)**: Multi-tenant data isolation
- **OAuth Authentication**: Secure GitHub integration
- **Input Validation**: Zod schemas for all API endpoints
- **Webhook Verification**: HMAC signature validation
- **Rate Limiting**: API abuse prevention
- **Security Headers**: CORS, CSP, and HSTS configuration

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**:

   ```bash
   vercel --prod
   ```

2. **Set Environment Variables** in Vercel dashboard

3. **Configure Custom Domain** (optional)

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions including:

- GitHub Actions setup
- Environment variable configuration
- Database migration pipeline
- Health monitoring setup

## 🧪 Testing

SprintForge includes comprehensive testing:

```bash
# Unit tests for business logic
npm run test src/lib/modules/

# Integration tests for API routes
npm run test src/app/api/

# Component tests
npm run test src/components/

# End-to-end tests (requires running app)
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run test:run`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Prettier for code formatting
- Write tests for new features
- Update documentation for API changes
- Follow conventional commit messages

## 📊 Monitoring and Health

SprintForge includes built-in monitoring:

- **Health Endpoint**: `/api/health` - System status and dependencies
- **Structured Logging**: JSON logs for production debugging
- **Error Tracking**: Comprehensive error boundaries and logging
- **Performance Metrics**: API response times and database query performance

## 🆘 Troubleshooting

### Common Issues

**Authentication Errors**:

```bash
# Verify OAuth configuration
curl -f http://localhost:3000/api/health
```

**Database Connection Issues**:

```bash
# Test database connectivity
npm run db:test
```

**Build Failures**:

```bash
# Check for type errors
npm run type-check

# Run linting
npm run lint
```

### Getting Help

- Check the [Issues](https://github.com/your-username/sprintforge/issues) page
- Review the [API Documentation](#api-documentation)
- Consult the health endpoint: `/api/health`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend-as-a-service platform
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Vercel](https://vercel.com/) for seamless deployment and hosting

---

**Built with ❤️ for developer productivity**
