# Orbit Deployment Guide

This guide covers deploying Orbit to production using Vercel with automated CI/CD.

## Prerequisites

- Vercel account
- Supabase project
- GitHub repository
- GitHub OAuth app configured

## Environment Variables

### Required Environment Variables

Set these in your Vercel project settings:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Authentication
NEXTAUTH_SECRET=your_secure_random_string_for_production
NEXTAUTH_URL=https://your-domain.vercel.app
```

### GitHub Secrets

For GitHub Actions, add these secrets to your repository:

```bash
# Vercel Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Environment Variables (same as above)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXTAUTH_SECRET=your_secure_random_string_for_production
```

## Deployment Steps

### 1. Initial Setup

1. **Fork/Clone Repository**

   ```bash
   git clone https://github.com/your-username/sprintforge.git
   cd sprintforge
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your values
   ```

### 2. Database Setup

1. **Run Migrations**

   ```bash
   npm run db:migrate
   ```

2. **Seed Demo Data (Optional)**
   ```bash
   npm run db:seed
   ```

### 3. Vercel Deployment

#### Option A: Vercel CLI (Recommended)

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy**

   ```bash
   vercel login
   vercel --prod
   ```

3. **Configure Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add NEXTAUTH_SECRET
   ```

#### Option B: GitHub Integration

1. **Connect Repository to Vercel**

   - Go to Vercel Dashboard
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**

   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all required variables listed above

### 4. GitHub Actions Setup

The repository includes automated CI/CD workflows:

- **`.github/workflows/ci.yml`**: Runs tests and linting on PRs
- **`.github/workflows/deploy.yml`**: Deploys to production on main branch

#### Required GitHub Secrets

Add these to your repository settings:

1. Go to Repository Settings > Secrets and Variables > Actions
2. Add the secrets listed in the "GitHub Secrets" section above

### 5. Post-Deployment Verification

1. **Health Check**

   ```bash
   curl https://your-domain.vercel.app/api/health
   ```

2. **Test Authentication**

   - Visit your deployed app
   - Test GitHub OAuth login
   - Verify dashboard access

3. **Test Integrations**
   - Configure GitHub integration
   - Set up Slack webhook
   - Test cron job execution

## Monitoring and Maintenance

### Health Monitoring

The application includes built-in health checks:

- **Endpoint**: `/api/health`
- **Monitors**: Database, GitHub API, Slack connectivity
- **Status Codes**: 200 (healthy/degraded), 503 (unhealthy)

### Logging

Structured logging is configured for production:

- **Development**: Console output with colors
- **Production**: JSON structured logs for external services

### Error Tracking

Basic error tracking is included:

- **Client-side**: Error boundaries with fallback UI
- **Server-side**: Structured error logging
- **Integration**: Ready for external services (Sentry, LogRocket)

### Performance Monitoring

Built-in performance tracking:

- **API Response Times**: Logged for all endpoints
- **Database Query Performance**: Monitored via health checks
- **External API Latency**: GitHub/Slack response times

## Troubleshooting

### Common Issues

1. **Build Failures**

   ```bash
   # Check type errors
   npm run type-check

   # Run tests locally
   npm run test:run

   # Check linting
   npm run lint
   ```

2. **Database Connection Issues**

   ```bash
   # Test database connection
   npm run db:test

   # Re-run migrations
   npm run db:migrate
   ```

3. **Environment Variable Issues**

   ```bash
   # Verify Vercel environment variables
   vercel env ls

   # Pull environment variables locally
   vercel env pull .env.local
   ```

### Rollback Procedure

1. **Revert to Previous Deployment**

   ```bash
   vercel rollback
   ```

2. **Or Deploy Specific Commit**
   ```bash
   vercel --prod --force
   ```

### Database Rollback

If you need to rollback database changes:

1. **Restore from Backup**

   - Use Supabase Dashboard > Settings > Database > Backups
   - Restore to point-in-time before migration

2. **Manual Rollback**
   - Create rollback migration files
   - Execute via Supabase SQL Editor

## Security Considerations

### Production Checklist

- [ ] Environment variables are set correctly
- [ ] NEXTAUTH_SECRET is a secure random string
- [ ] Supabase RLS policies are enabled
- [ ] GitHub OAuth app is configured for production domain
- [ ] Slack webhook URLs are validated
- [ ] Security headers are configured (via vercel.json)
- [ ] Dependencies are up to date and audited

### Regular Maintenance

1. **Weekly**

   - Check health endpoint status
   - Review error logs
   - Monitor performance metrics

2. **Monthly**

   - Update dependencies
   - Run security audit
   - Review and rotate secrets if needed

3. **Quarterly**
   - Review and update RLS policies
   - Audit user permissions
   - Performance optimization review

## Support

For deployment issues:

1. Check the health endpoint: `/api/health`
2. Review Vercel function logs
3. Check Supabase logs and metrics
4. Verify GitHub Actions workflow status

For additional help, refer to:

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
