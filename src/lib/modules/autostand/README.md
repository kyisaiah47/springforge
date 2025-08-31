# AutoStand Module - Cron Job Implementation

This document describes the cron job implementation for automated daily standup generation.

## Overview

The AutoStand cron job automatically generates daily standups for all team members by:

1. Fetching GitHub activity from the last 24 hours
2. Generating standup summaries (yesterday, today, blockers)
3. Posting formatted messages to Slack channels

## Components

### 1. Job Lock System (`supabase/migrations/003_job_lock_table.sql`)

Prevents duplicate cron job executions using database-level locking:

- **`job_locks` table**: Stores active job locks with expiration times
- **`acquire_job_lock()`**: Function to acquire a lock for a specific job
- **`release_job_lock()`**: Function to release a job lock
- **`is_job_locked()`**: Function to check if a job is currently locked

### 2. Cron Service (`src/lib/modules/autostand/cron-service.ts`)

Core business logic for the cron job:

- **`AutoStandCronService`**: Main service class
- **`executeDailyStandupJob()`**: Main job execution method
- **Retry Logic**: Automatic retry for failed standup generation (3 attempts)
- **Error Handling**: Comprehensive error collection and reporting
- **Batch Processing**: Processes multiple organizations and members efficiently

### 3. API Endpoints

#### Cron Endpoint (`src/app/api/cron/daily-standups/route.ts`)

- **POST**: Main cron job endpoint called by Vercel Cron
- **GET**: Health check endpoint to monitor job status
- **Authentication**: Requires `CRON_SECRET` environment variable
- **Rate Limiting**: Protected against abuse

#### Manual Trigger (`src/app/api/standups/trigger-daily/route.ts`)

- **POST**: Allows admins to manually trigger the daily standup job
- **Authorization**: Requires admin role
- **Force Option**: Can override job locks when needed

### 4. Vercel Cron Configuration (`vercel.json`)

Schedules the cron job to run daily at 9am ET (1pm UTC) on weekdays:

```json
{
	"crons": [
		{
			"path": "/api/cron/daily-standups",
			"schedule": "0 13 * * 1-5"
		}
	]
}
```

## Job Execution Flow

1. **Lock Acquisition**: Acquire job lock to prevent duplicate executions
2. **Organization Processing**:
   - Fetch all organizations with Slack integrations
   - For each organization:
     - Get active members with GitHub logins
     - Fetch GitHub and Slack integrations
3. **Standup Generation**:
   - Generate standups for each member using GitHub activity
   - Retry failed generations up to 3 times
4. **Slack Delivery**:
   - Format standups as Slack messages
   - Send individual standups with delays to avoid rate limiting
   - Send team summary if configured
5. **Lock Release**: Always release job lock, even on errors

## Error Handling

### Retry Logic

- **Standup Generation**: 3 retries with exponential backoff (5s, 10s, 15s)
- **Slack Delivery**: Built-in retry in Slack service

### Error Collection

- All errors are collected and returned in the job result
- Errors don't stop processing of other organizations/members
- Detailed error messages for debugging

### Monitoring

- Job execution results are logged with metrics
- Health check endpoint for monitoring job status
- Lock status can be checked to detect stuck jobs

## Configuration

### Environment Variables

- `CRON_SECRET`: Secret token for authenticating cron requests
- Supabase credentials for database access
- GitHub and Slack integration tokens (stored in database)

### Database Setup

1. Run migration `003_job_lock_table.sql` to create job lock system
2. Ensure organizations have GitHub and Slack integrations configured
3. Members must have `github_login` set for standup generation

## Usage

### Automatic Execution

The cron job runs automatically via Vercel Cron at 9am ET on weekdays.

### Manual Execution

Admins can manually trigger the job:

```bash
curl -X POST /api/standups/trigger-daily \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
```

### Health Check

Monitor job status:

```bash
curl /api/cron/daily-standups
```

## Testing

Basic functionality tests are available in:

- `src/lib/modules/autostand/__tests__/cron-service-basic.test.ts`

Run tests with:

```bash
npm test src/lib/modules/autostand/
```

## Troubleshooting

### Job Not Running

1. Check Vercel Cron configuration
2. Verify `CRON_SECRET` environment variable
3. Check job lock status via health endpoint

### Standups Not Generated

1. Verify GitHub integrations are configured
2. Check member `github_login` values
3. Review error logs in job execution results

### Slack Messages Not Sent

1. Verify Slack webhook URLs are valid
2. Check Slack integration settings
3. Test webhook connectivity manually

### Job Stuck/Locked

1. Check job lock expiration (default 60 minutes)
2. Use manual trigger with `force: true` to override
3. Locks auto-expire to prevent permanent blocking
