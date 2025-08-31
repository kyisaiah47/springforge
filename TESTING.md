# Testing Guide

SprintForge uses a comprehensive testing strategy with both unit tests and end-to-end tests.

## Test Structure

### Unit Tests (Vitest)

- **Location**: `src/**/__tests__/*.test.ts(x)`
- **Framework**: Vitest with jsdom environment
- **Coverage**: Components, utilities, services, and API logic

### End-to-End Tests (Playwright)

- **Location**: `e2e/*.spec.ts`
- **Framework**: Playwright
- **Coverage**: Full user workflows and API endpoints

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### End-to-End Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed
```

### All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

## Test Configuration

### Vitest Configuration

- **Config File**: `vitest.config.ts`
- **Setup File**: `src/test-setup.ts`
- **Test Utils**: `src/test-utils.ts`

### Playwright Configuration

- **Config File**: `playwright.config.ts`
- **Test Directory**: `e2e/`

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test-utils";
import { Button } from "../button";

describe("Button Component", () => {
	it("renders with default props", () => {
		render(<Button>Click me</Button>);

		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toBeInTheDocument();
	});
});
```

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";

test("should load the homepage", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveTitle(/SprintForge/);
	await expect(page.locator("body")).toBeVisible();
});
```

## Test Utilities

### Mock Data Factories

- `createMockUser()` - Creates mock user data
- `createMockOrganization()` - Creates mock organization data
- `createMockMember()` - Creates mock member data

### Custom Render

The `render` function from `@/test-utils` includes necessary providers:

- ThemeProvider for consistent styling
- Mock Supabase client for database operations

## CI/CD Integration

Tests are automatically run in GitHub Actions:

- Unit tests run on every push
- E2E tests run on pull requests
- Coverage reports are generated and stored

## Best Practices

1. **Test Naming**: Use descriptive test names that explain the expected behavior
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **Mock External Dependencies**: Use mocks for Supabase, GitHub API, and Slack API
4. **Test User Interactions**: Focus on testing user-facing behavior, not implementation details
5. **Keep Tests Fast**: Unit tests should run quickly; use E2E tests for complex workflows

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm run test -- button.test.tsx

# Run tests matching pattern
npm run test -- --grep "Button"
```

### E2E Tests

```bash
# Run specific test file
npm run test:e2e -- smoke.spec.ts

# Debug mode with browser visible
npm run test:e2e:headed -- --debug
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory and include:

- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Target coverage thresholds:

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%
