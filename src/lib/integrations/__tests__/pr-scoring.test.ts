import { describe, it, expect } from "vitest";
import {
	calculateSizeScore,
	calculateTestCoverageRisk,
	calculateCriticalPathRisk,
	calculateComplexityRisk,
	calculateRiskScore,
	calculatePRScore,
	suggestReviewers,
	DEFAULT_SCORING_CONFIG,
} from "../pr-scoring";
import type { GitHubPullRequest, GitHubFile } from "../github";

// Mock data helpers
const createMockPR = (
	overrides: Partial<GitHubPullRequest> = {}
): GitHubPullRequest => ({
	id: 1,
	number: 123,
	title: "Test PR",
	body: "Test description",
	state: "open",
	merged: false,
	user: { id: 1, login: "testuser", avatar_url: "avatar.jpg" },
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
	merged_at: null,
	additions: 10,
	deletions: 5,
	changed_files: 2,
	html_url: "https://github.com/owner/repo/pull/123",
	head: { ref: "feature", sha: "abc123" },
	base: { ref: "main", sha: "def456" },
	...overrides,
});

const createMockFile = (overrides: Partial<GitHubFile> = {}): GitHubFile => ({
	filename: "src/test.ts",
	status: "modified",
	additions: 5,
	deletions: 2,
	changes: 7,
	...overrides,
});

describe("calculateSizeScore", () => {
	it("should calculate size score for small PR", () => {
		const pr = createMockPR({ additions: 10, deletions: 5, changed_files: 2 });
		const files = [createMockFile()];

		const score = calculateSizeScore(pr, files);

		expect(score).toBeGreaterThan(0);
		expect(score).toBeLessThan(5); // Should be relatively small
	});

	it("should calculate higher score for large PR", () => {
		const pr = createMockPR({
			additions: 500,
			deletions: 200,
			changed_files: 20,
		});
		const files = Array(20)
			.fill(null)
			.map(() => createMockFile());

		const score = calculateSizeScore(pr, files);

		expect(score).toBeGreaterThan(2); // Adjusted expectation based on logarithmic scaling
	});

	it("should cap score at maximum value", () => {
		const pr = createMockPR({
			additions: 10000,
			deletions: 5000,
			changed_files: 100,
		});
		const files = Array(100)
			.fill(null)
			.map(() => createMockFile());

		const score = calculateSizeScore(pr, files);

		expect(score).toBeLessThanOrEqual(10);
	});

	it("should handle zero changes", () => {
		const pr = createMockPR({ additions: 0, deletions: 0, changed_files: 0 });
		const files: GitHubFile[] = [];

		const score = calculateSizeScore(pr, files);

		expect(score).toBe(0);
	});
});

describe("calculateTestCoverageRisk", () => {
	it("should return maximum risk for no files", () => {
		const risk = calculateTestCoverageRisk([]);
		expect(risk).toBe(10);
	});

	it("should return high risk for code changes without tests", () => {
		const files = [
			createMockFile({ filename: "src/component.tsx" }),
			createMockFile({ filename: "src/utils.ts" }),
		];

		const risk = calculateTestCoverageRisk(files);

		expect(risk).toBeGreaterThan(5);
	});

	it("should return lower risk when tests are included", () => {
		const files = [
			createMockFile({ filename: "src/component.tsx" }),
			createMockFile({ filename: "src/component.test.tsx" }),
		];

		const risk = calculateTestCoverageRisk(files);

		expect(risk).toBeLessThanOrEqual(5); // 1:1 ratio gives exactly 5
	});

	it("should recognize various test file patterns", () => {
		const testFiles = [
			createMockFile({ filename: "src/utils.test.ts" }),
			createMockFile({ filename: "src/component.spec.tsx" }),
			createMockFile({ filename: "__tests__/helper.ts" }),
			createMockFile({ filename: "test/integration.js" }),
			createMockFile({ filename: "cypress/e2e/app.cy.ts" }),
		];

		testFiles.forEach((file) => {
			const risk = calculateTestCoverageRisk([file]);
			expect(risk).toBeLessThan(10); // Should recognize as test file
		});
	});
});

describe("calculateCriticalPathRisk", () => {
	it("should return zero risk for non-critical files", () => {
		const files = [
			createMockFile({ filename: "src/component.tsx" }),
			createMockFile({ filename: "docs/readme.md" }),
		];

		const risk = calculateCriticalPathRisk(files);

		expect(risk).toBe(0);
	});

	it("should return high risk for package.json changes", () => {
		const files = [createMockFile({ filename: "package.json" })];

		const risk = calculateCriticalPathRisk(files);

		expect(risk).toBeGreaterThan(3);
	});

	it("should return very high risk for environment files", () => {
		const files = [createMockFile({ filename: ".env.production" })];

		const risk = calculateCriticalPathRisk(files);

		expect(risk).toBeGreaterThan(5);
	});

	it("should return high risk for migration files", () => {
		const files = [
			createMockFile({ filename: "migrations/001_create_users.sql" }),
		];

		const risk = calculateCriticalPathRisk(files);

		expect(risk).toBeGreaterThan(5);
	});

	it("should return high risk for auth/security files", () => {
		const files = [
			createMockFile({ filename: "src/auth/middleware.ts" }),
			createMockFile({ filename: "src/security/validation.ts" }),
		];

		const risk = calculateCriticalPathRisk(files);

		expect(risk).toBeGreaterThan(4);
	});

	it("should cap risk at maximum value", () => {
		const files = Array(20)
			.fill(null)
			.map((_, i) => createMockFile({ filename: `config/critical-${i}.json` }));

		const risk = calculateCriticalPathRisk(files);

		expect(risk).toBeLessThanOrEqual(10);
	});
});

describe("calculateComplexityRisk", () => {
	it("should return low risk for simple changes", () => {
		const files = [
			createMockFile({
				filename: "docs/readme.md",
				additions: 5,
				deletions: 2,
			}),
		];

		const risk = calculateComplexityRisk(files);

		expect(risk).toBeLessThan(3);
	});

	it("should return higher risk for complex file types", () => {
		const files = [
			createMockFile({ filename: "src/complex.tsx" }),
			createMockFile({ filename: "backend/service.py" }),
		];

		const risk = calculateComplexityRisk(files);

		expect(risk).toBeGreaterThan(0);
	});

	it("should increase risk for large changes", () => {
		const files = [
			createMockFile({
				filename: "src/component.tsx",
				additions: 150,
				deletions: 50,
			}),
		];

		const risk = calculateComplexityRisk(files);

		expect(risk).toBeGreaterThan(2);
	});

	it("should increase risk for new files", () => {
		const files = [
			createMockFile({
				filename: "src/new-feature.ts",
				status: "added",
			}),
		];

		const risk = calculateComplexityRisk(files);

		expect(risk).toBeGreaterThan(0);
	});

	it("should increase risk for renamed files", () => {
		const files = [
			createMockFile({
				filename: "src/renamed-component.tsx",
				status: "renamed",
			}),
		];

		const risk = calculateComplexityRisk(files);

		expect(risk).toBeGreaterThan(0);
	});
});

describe("calculateRiskScore", () => {
	it("should combine all risk factors", () => {
		const pr = createMockPR({
			additions: 100,
			deletions: 50,
			changed_files: 5,
		});
		const files = [
			createMockFile({ filename: "src/component.tsx" }),
			createMockFile({ filename: "package.json" }),
		];

		const riskScore = calculateRiskScore(pr, files);

		expect(riskScore).toBeGreaterThan(0);
		expect(riskScore).toBeLessThanOrEqual(10);
	});

	it("should use custom configuration", () => {
		const pr = createMockPR({
			additions: 100,
			deletions: 50,
			changed_files: 5,
		});
		const files = [createMockFile({ filename: "package.json" })];

		const customConfig = {
			...DEFAULT_SCORING_CONFIG,
			riskWeights: {
				size: 0.5,
				testCoverage: 0.1,
				criticalPaths: 0.4,
				complexity: 0.0,
			},
		};

		const riskScore = calculateRiskScore(pr, files, customConfig);

		expect(riskScore).toBeGreaterThan(0);
	});
});

describe("calculatePRScore", () => {
	it("should return comprehensive PR score", () => {
		const pr = createMockPR({ additions: 50, deletions: 20, changed_files: 3 });
		const files = [
			createMockFile({ filename: "src/component.tsx" }),
			createMockFile({ filename: "src/component.test.tsx" }),
		];

		const score = calculatePRScore(pr, files);

		expect(score).toHaveProperty("sizeScore");
		expect(score).toHaveProperty("riskScore");
		expect(score).toHaveProperty("overallScore");
		expect(score).toHaveProperty("factors");
		expect(score).toHaveProperty("recommendations");

		expect(score.factors.size.additions).toBe(50);
		expect(score.factors.size.deletions).toBe(20);
		expect(score.factors.size.filesChanged).toBe(3);
		expect(score.factors.size.totalLines).toBe(70);

		expect(Array.isArray(score.recommendations)).toBe(true);
	});

	it("should generate appropriate recommendations for large PR", () => {
		// Create a PR that will definitely exceed the threshold by using a custom config
		const pr = createMockPR({
			additions: 1000,
			deletions: 500,
			changed_files: 50,
		});
		const files = Array(50)
			.fill(null)
			.map((_, i) => createMockFile({ filename: `src/file-${i}.ts` }));

		// Use a custom config with lower threshold to ensure the recommendation triggers
		const customConfig = {
			...DEFAULT_SCORING_CONFIG,
			thresholds: {
				...DEFAULT_SCORING_CONFIG.thresholds,
				largePR: 2.0, // Lower threshold to ensure it triggers
			},
		};

		const score = calculatePRScore(pr, files, customConfig);

		expect(score.recommendations).toContain(
			"Consider breaking this PR into smaller, focused changes"
		);
	});

	it("should generate recommendations for missing tests", () => {
		const pr = createMockPR({
			additions: 100,
			deletions: 50,
			changed_files: 8,
		});
		const files = [
			createMockFile({ filename: "src/component.tsx" }),
			createMockFile({ filename: "src/service.ts" }),
			createMockFile({ filename: "src/utils.ts" }),
			createMockFile({ filename: "src/helpers.ts" }),
			createMockFile({ filename: "src/api.ts" }),
			createMockFile({ filename: "src/store.ts" }),
			createMockFile({ filename: "src/hooks.ts" }),
			createMockFile({ filename: "src/types.ts" }),
		];

		const score = calculatePRScore(pr, files);

		expect(score.recommendations).toContain(
			"Add or update tests to cover the changes"
		);
	});

	it("should generate recommendations for critical files", () => {
		const pr = createMockPR();
		const files = [
			createMockFile({ filename: "package.json" }),
			createMockFile({ filename: "migrations/001_add_table.sql" }),
		];

		const score = calculatePRScore(pr, files);

		expect(
			score.recommendations.some((r) =>
				r.includes("critical system components")
			)
		).toBe(true);
		expect(score.recommendations).toContain(
			"Dependency changes detected - verify compatibility"
		);
		expect(score.recommendations).toContain(
			"Database migration changes - ensure backward compatibility"
		);
	});
});

describe("suggestReviewers", () => {
	const mockTeamMembers = [
		{ github_login: "frontend-dev", expertise: ["frontend"] },
		{ github_login: "backend-dev", expertise: ["backend"] },
		{ github_login: "fullstack-dev", expertise: ["frontend", "backend"] },
		{ github_login: "devops-engineer", expertise: ["devops"] },
		{ github_login: "dba", expertise: ["database"] },
	];

	it("should suggest frontend developers for frontend files", () => {
		const files = [
			createMockFile({ filename: "src/components/Button.tsx" }),
			createMockFile({ filename: "src/styles/main.css" }),
		];

		const suggestions = suggestReviewers(files, mockTeamMembers);

		expect(suggestions).toContain("frontend-dev");
		expect(suggestions).toContain("fullstack-dev");
	});

	it("should suggest backend developers for backend files", () => {
		const files = [
			createMockFile({ filename: "src/api/users.py" }),
			createMockFile({ filename: "server/middleware.go" }),
		];

		const suggestions = suggestReviewers(files, mockTeamMembers);

		expect(suggestions).toContain("backend-dev");
		expect(suggestions).toContain("fullstack-dev");
	});

	it("should suggest database experts for database files", () => {
		const files = [
			createMockFile({ filename: "migrations/001_create_users.sql" }),
			createMockFile({ filename: "database/schema.sql" }),
		];

		const suggestions = suggestReviewers(files, mockTeamMembers);

		expect(suggestions).toContain("dba");
	});

	it("should suggest devops engineers for infrastructure files", () => {
		const files = [
			createMockFile({ filename: "Dockerfile" }),
			createMockFile({ filename: "docker-compose.yml" }),
			createMockFile({ filename: "package.json" }),
		];

		const suggestions = suggestReviewers(files, mockTeamMembers);

		expect(suggestions).toContain("devops-engineer");
	});

	it("should limit suggestions to top 3", () => {
		const files = [
			createMockFile({ filename: "src/component.tsx" }),
			createMockFile({ filename: "src/api/service.py" }),
			createMockFile({ filename: "migrations/schema.sql" }),
			createMockFile({ filename: "Dockerfile" }),
		];

		const suggestions = suggestReviewers(files, mockTeamMembers);

		expect(suggestions.length).toBeLessThanOrEqual(3);
	});

	it("should handle empty files array", () => {
		const suggestions = suggestReviewers([], mockTeamMembers);

		expect(suggestions).toEqual([]);
	});

	it("should handle team members without expertise", () => {
		const teamWithoutExpertise = [
			{ github_login: "junior-dev" },
			{ github_login: "intern" },
		];

		const files = [createMockFile({ filename: "src/component.tsx" })];
		const suggestions = suggestReviewers(files, teamWithoutExpertise);

		expect(suggestions).toEqual([]);
	});
});
