# SprintForge Database Setup

This document provides instructions for setting up the Supabase database and authentication for SprintForge.

## Prerequisites

1. **Supabase Project**: Create a new project at [supabase.com](https://supabase.com)
2. **GitHub OAuth App**: Create a GitHub OAuth application for authentication

## Environment Configuration

1. Copy the example environment file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Database Schema Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Execute the query
5. Create another query and paste the contents of `supabase/migrations/002_rls_policies.sql`
6. Execute the RLS policies query

### Option 2: Using Migration Scripts

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the migration script:

   ```bash
   npm run db:migrate
   ```

   **Note**: The migration script may require manual execution of SQL in the Supabase dashboard due to RPC limitations.

## GitHub OAuth Setup

1. **Create GitHub OAuth App**:

   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Click "New OAuth App"
   - Set Authorization callback URL to: `https://your-project.supabase.co/auth/v1/callback`

2. **Configure Supabase Auth**:

   - In Supabase dashboard, go to Authentication > Providers
   - Enable GitHub provider
   - Add your GitHub OAuth App credentials:
     - Client ID: `your_github_client_id`
     - Client Secret: `your_github_client_secret`

3. **Set OAuth Scopes**:
   - The application requests these scopes: `read:user user:email repo`
   - These provide access to user profile, email, and repository data

## Seed Demo Data

To populate your database with demo data for testing:

```bash
npm run db:seed
```

This creates:

- Demo organization with 3 members
- Sample standups, PR insights, retro data
- Arcade levels and runs
- GitHub and Slack integrations

## Database Schema Overview

### Core Tables

- **organizations**: Team/company data with settings
- **members**: User profiles linked to GitHub accounts
- **integrations**: GitHub/Slack API configurations

### Module Tables

- **standups**: Daily standup summaries from GitHub activity
- **pr_insights**: Pull request analysis and scoring
- **retros**: Retrospective sessions
- **retro_notes**: Sticky notes for retrospectives
- **arcade_levels**: Coding challenge definitions
- **arcade_runs**: User attempts at coding challenges

### Security Features

- **Row Level Security (RLS)**: Multi-tenant data isolation
- **Authentication**: GitHub OAuth with Supabase Auth
- **Role-based Access**: Admin/member permissions
- **Soft Deletes**: Data preservation with audit trails

## Testing the Setup

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. You should be redirected to the login page
4. Click "Sign in with GitHub" to test the OAuth flow
5. After successful authentication, you'll see the dashboard

## Troubleshooting

### Common Issues

1. **OAuth Redirect Error**:

   - Verify the callback URL in GitHub OAuth app settings
   - Check that Supabase Auth is properly configured

2. **Database Connection Issues**:

   - Verify environment variables are correct
   - Check Supabase project status and API keys

3. **RLS Policy Errors**:

   - Ensure all RLS policies are properly created
   - Check that helper functions exist in the database

4. **Migration Failures**:
   - Execute SQL manually in Supabase dashboard
   - Check for syntax errors in migration files

### Useful Commands

```bash
# Reset database (migrate + seed)
npm run db:reset

# Run only migrations
npm run db:migrate

# Run only seeding
npm run db:seed
```

## Next Steps

After completing the database setup:

1. Implement individual module functionality (AutoStand, PR Radar, etc.)
2. Set up GitHub webhooks for real-time PR insights
3. Configure Slack integrations for notifications
4. Add real-time features using Supabase subscriptions

## Security Considerations

- Never commit `.env.local` to version control
- Use service role key only for server-side operations
- Regularly rotate API keys and OAuth secrets
- Monitor Supabase logs for suspicious activity
- Implement rate limiting for API endpoints
