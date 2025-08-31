# Orbit Onboarding Guide

This document describes the onboarding flow and demo data features in Orbit.

## Onboarding Flow

Orbit includes a comprehensive onboarding experience for new users:

### 1. Welcome Flow

- **Automatic Trigger**: Shows for first-time users
- **Multi-step Process**: Introduces Orbit modules and features
- **Demo Data Loading**: Option to load realistic demo data
- **Guided Tour**: Optional tour of the interface after onboarding

### 2. Demo Data

The demo data includes:

- **Organization**: "Demo Team" with realistic settings
- **Team Members**: 4 sample developers with GitHub profiles
- **Standups**: Recent standup data with GitHub activity
- **PR Insights**: Sample pull requests with scoring and suggestions
- **Retrospectives**: Active retro board with notes and votes
- **Arcade Challenges**: 3 coding challenges with sample runs

### 3. Empty States

Each module includes helpful empty states with:

- **Clear messaging** about the module's purpose
- **Call-to-action buttons** to get started
- **Demo data options** for immediate exploration

## Usage

### For New Users

1. Sign in with GitHub
2. Complete the onboarding flow
3. Choose to load demo data (recommended)
4. Take the guided tour
5. Explore the modules

### For Developers

```bash
# Test demo seeding
npm run db:test

# Seed demo data manually
npm run db:seed

# Reset database and seed
npm run db:reset
```

### API Endpoints

- `POST /api/onboarding/seed-demo` - Load demo data via API

## Components

### OnboardingFlow

- **Location**: `src/components/onboarding/onboarding-flow.tsx`
- **Purpose**: Multi-step onboarding wizard
- **Features**: Progress indicator, demo data loading, skip option

### GuidedTour

- **Location**: `src/components/onboarding/guided-tour.tsx`
- **Purpose**: Interactive tour of the interface
- **Features**: Element highlighting, step navigation, skip option

### EmptyState

- **Location**: `src/components/ui/empty-state.tsx`
- **Purpose**: Consistent empty state design
- **Features**: Icon, title, description, action buttons

### OnboardingProvider

- **Location**: `src/lib/onboarding/onboarding-provider.tsx`
- **Purpose**: Manages onboarding state across the app
- **Features**: LocalStorage persistence, state management

## Customization

### Adding Tour Steps

```typescript
const customTourSteps: TourStep[] = [
	{
		id: "custom-step",
		title: "Custom Feature",
		content: "Description of your feature",
		target: "[data-tour='custom-element']",
	},
];
```

### Modifying Demo Data

Edit `scripts/seed-demo.ts` to customize:

- Organization settings
- Team member profiles
- Sample data content
- Integration configurations

### Empty State Customization

```typescript
<EmptyState
	icon={<YourIcon className="size-8" />}
	title="Your Title"
	description="Your description"
	action={{
		label: "Primary Action",
		onClick: handleAction,
	}}
	secondaryAction={{
		label: "Secondary Action",
		onClick: handleSecondaryAction,
		variant: "outline",
	}}
/>
```

## Best Practices

1. **Progressive Disclosure**: Show features gradually
2. **Clear Value Proposition**: Explain benefits upfront
3. **Interactive Elements**: Let users try features
4. **Skip Options**: Always provide escape routes
5. **Contextual Help**: Offer help when needed

## Troubleshooting

### Demo Data Issues

- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- Check database permissions
- Verify table schemas match

### Onboarding Not Showing

- Clear localStorage: `localStorage.removeItem('sprintforge-onboarding')`
- Check OnboardingProvider is wrapped around app
- Verify component imports

### Tour Not Working

- Ensure target elements have `data-tour` attributes
- Check element visibility and positioning
- Verify tour steps are properly configured
