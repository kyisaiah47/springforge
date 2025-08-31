# PR Radar Module

The PR Radar module provides intelligent pull request analysis, scoring, and reviewer suggestions for development teams.

## Features

### 1. PR Scoring System

- **Size Scoring**: Evaluates PR size based on lines changed and files modified
- **Risk Scoring**: Comprehensive risk assessment considering:
  - Code complexity factors
  - Test coverage analysis
  - File type risk (security, infrastructure, migrations)
  - Author experience (placeholder for future enhancement)

### 2. Reviewer Suggestions

- **Code Ownership Analysis**: Identifies primary and recent contributors to modified files
- **Expertise Area Detection**: Categorizes changes by domain (Frontend, Backend, Database, etc.)
- **Confidence Scoring**: Provides confidence levels for reviewer suggestions
- **Smart Filtering**: Excludes PR authors and considers team member availability

### 3. Stale PR Detection

- **Configurable Thresholds**: Detect PRs that haven't been updated in specified timeframes
- **Alert Levels**: Warning (2-7 days) and Critical (7+ days) classifications
- **Repository Filtering**: Focus on specific repositories or teams

## Core Components

### Data Models (`types.ts`)

- `PRInsight`: Main data structure for PR analysis results
- `PRScoreResult`: Detailed scoring breakdown with risk factors
- `ReviewerSuggestion`: Suggested reviewers with confidence and reasoning
- `StalePRAlert`: Stale PR detection results

### Scoring Engine (`scoring.ts`)

- `PRScoringService`: Calculates size and risk scores
- Configurable scoring algorithms with weighted factors
- File type detection for specialized risk assessment
- Test coverage analysis

### Reviewer Engine (`reviewer-suggestions.ts`)

- `ReviewerSuggestionService`: Generates reviewer recommendations
- GitHub commit history analysis
- Code ownership pattern detection
- Expertise area mapping

### Main Service (`service.ts`)

- `PRRadarService`: Orchestrates all PR Radar functionality
- Database operations for PR insights
- Integration with GitHub API
- Pagination and filtering support

## Usage Examples

### Basic PR Scoring

```typescript
import { createPRRadarService } from "@/lib/modules/pr-radar";

const prRadar = createPRRadarService();

// Score a PR from GitHub data
const result = await prRadar.scorePR(orgId, {
	repo: "owner/repo",
	number: 123,
	github_data: prData,
});

console.log(`Risk Score: ${result.score_result.risk_score}/10`);
console.log(`Size Score: ${result.score_result.size_score}/10`);
```

### Get Reviewer Suggestions

```typescript
const suggestions = await prRadar.getReviewerSuggestions(orgId, {
	repo: "owner/repo",
	number: 123,
	touched_paths: ["src/auth/middleware.ts", "src/api/users.ts"],
	author_github_login: "pr-author",
});

suggestions.suggestions.forEach((suggestion) => {
	console.log(
		`${suggestion.github_login}: ${suggestion.confidence_score} confidence`
	);
	console.log(`Reasoning: ${suggestion.reasoning.join(", ")}`);
});
```

### Create PR Insight

```typescript
const insight = await prRadar.createPRInsight(orgId, {
	repo: "owner/repo",
	number: 123,
	github_data: prData,
});

console.log(`Created PR insight: ${insight.pr_insight.id}`);
console.log(`Suggested reviewers: ${insight.pr_insight.suggested_reviewers}`);
```

### Find Stale PRs

```typescript
const stalePRs = await prRadar.getStalePRs(orgId, {
	days_threshold: 3,
	repos: ["owner/repo1", "owner/repo2"],
});

stalePRs.stale_prs.forEach((stale) => {
	console.log(`PR #${stale.pr_insight.number}: ${stale.days_stale} days stale`);
	console.log(`Alert level: ${stale.alert_level}`);
});
```

## Scoring Algorithm Details

### Size Score (1-10 scale)

- Based on total lines changed with logarithmic scaling
- Considers file count as additional factor
- 1-2: Small changes (< 100 lines)
- 8-10: Large changes (> 1600 lines)

### Risk Score (0-10 scale)

Weighted combination of:

- **Size Factor (25%)**: Impact of PR size
- **Complexity Factor (30%)**: File types, dependencies, commits
- **Test Coverage Factor (25%)**: Ratio of test changes to code changes
- **File Type Factor (15%)**: Critical system files, security files
- **Author Experience Factor (5%)**: Placeholder for future enhancement

### File Type Risk Categories

- **Critical**: Middleware, auth, security, core system files
- **High**: Database migrations, configuration files
- **Medium**: Dependencies, infrastructure files
- **Low**: Documentation, test files

## Testing

The module includes comprehensive unit tests covering:

- Scoring algorithm accuracy across different PR types
- Edge cases and boundary conditions
- File type detection patterns
- Service initialization and core logic

Run tests with:

```bash
npm test -- --run src/lib/modules/pr-radar
```

## Integration Requirements

### Database Schema

The module requires the `pr_insights` table (already defined in the database schema):

- Stores PR analysis results
- Links to organization and member records
- Supports filtering and pagination

### GitHub Integration

Requires GitHub API access for:

- PR details and file changes
- Commit history analysis
- Repository access permissions

### Supabase Integration

Uses Supabase for:

- Data persistence
- Row Level Security (RLS)
- Real-time updates (future enhancement)

## Future Enhancements

1. **Author Experience Scoring**: Implement historical analysis of author's PR success rate
2. **Machine Learning**: Train models on historical PR data for better risk prediction
3. **Real-time Updates**: WebSocket integration for live PR status updates
4. **Advanced Code Analysis**: Static analysis integration for deeper complexity scoring
5. **Team Performance Metrics**: Aggregate insights for team productivity analysis
