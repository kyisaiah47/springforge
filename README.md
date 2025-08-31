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
