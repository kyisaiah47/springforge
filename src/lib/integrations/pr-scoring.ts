import { GitHubPullRequest, GitHubFile } from "./github";

// PR scoring configuration
export interface PRScoringConfig {
	sizeWeights: {
		additions: number;
		deletions: number;
		filesChanged: number;
	};
	riskWeights: {
		size: number;
		testCoverage: number;
		criticalPaths: number;
		complexity: number;
	};
	thresholds: {
		smallPR: number;
		largePR: number;
		highRisk: number;
	};
}

// Default scoring configuration
export const DEFAULT_SCORING_CONFIG: PRScoringConfig = {
	sizeWeights: {
		additions: 1.0,
		deletions: 0.8,
		filesChanged: 2.0,
	},
	riskWeights: {
		size: 0.3,
		testCoverage: 0.25,
		criticalPaths: 0.3,
		complexity: 0.15,
	},
	thresholds: {
		smallPR: 3.0,
		largePR: 7.0,
		highRisk: 7.0,
	},
};

// PR scoring result
export interface PRScore {
	sizeScore: number;
	riskScore: number;
	overallScore: number;
	factors: {
		size: {
			additions: number;
			deletions: number;
			filesChanged: number;
			totalLines: number;
		};
		risk: {
			sizeRisk: number;
			testCoverageRisk: number;
			criticalPathRisk: number;
			complexityRisk: number;
		};
	};
	recommendations: string[];
}

// Critical file patterns that indicate high-risk changes
const CRITICAL_FILE_PATTERNS = [
	/package\.json$/,
	/package-lock\.json$/,
	/yarn\.lock$/,
	/Dockerfile$/,
	/docker-compose\.ya?ml$/,
	/\.env/,
	/config\//,
	/migrations?\//,
	/schema\./,
	/auth/,
	/security/,
	/payment/,
	/billing/,
	/admin/,
	/\.sql$/,
	/database/,
];

// Test file patterns
const TEST_FILE_PATTERNS = [
	/\.test\./,
	/\.spec\./,
	/__tests__\//,
	/test\//,
	/tests\//,
	/cypress\//,
	/e2e\//,
];

// Complex file patterns (files that typically require more careful review)
const COMPLEX_FILE_PATTERNS = [
	/\.tsx?$/,
	/\.jsx?$/,
	/\.py$/,
	/\.java$/,
	/\.go$/,
	/\.rs$/,
	/\.cpp$/,
	/\.c$/,
];

/**
 * Calculate PR size score based on lines changed and files modified
 */
export function calculateSizeScore(
	pr: GitHubPullRequest,
	files: GitHubFile[],
	config: PRScoringConfig = DEFAULT_SCORING_CONFIG
): number {
	const { additions, deletions, changed_files } = pr;
	const { sizeWeights } = config;

	// Calculate weighted size score
	const additionsScore = additions * sizeWeights.additions;
	const deletionsScore = deletions * sizeWeights.deletions;
	const filesScore = changed_files * sizeWeights.filesChanged;

	// Combine scores with diminishing returns for very large PRs
	const rawScore = (additionsScore + deletionsScore + filesScore) / 100;

	// Apply logarithmic scaling to prevent extremely high scores
	const sizeScore = Math.min(10, Math.log10(rawScore + 1) * 3);

	return Math.max(0, sizeScore);
}

/**
 * Calculate test coverage risk based on test file changes
 */
export function calculateTestCoverageRisk(files: GitHubFile[]): number {
	const totalFiles = files.length;
	if (totalFiles === 0) return 10; // Maximum risk if no files

	const testFiles = files.filter((file) =>
		TEST_FILE_PATTERNS.some((pattern) => pattern.test(file.filename))
	);

	const codeFiles = files.filter(
		(file) =>
			COMPLEX_FILE_PATTERNS.some((pattern) => pattern.test(file.filename)) &&
			!TEST_FILE_PATTERNS.some((pattern) => pattern.test(file.filename))
	);

	// If there are code changes but no test changes, increase risk
	if (codeFiles.length > 0 && testFiles.length === 0) {
		return Math.min(10, 5 + codeFiles.length * 0.5);
	}

	// Calculate test coverage ratio
	const testCoverageRatio = testFiles.length / Math.max(1, codeFiles.length);

	// Lower ratio = higher risk
	return Math.max(0, 10 - testCoverageRatio * 5);
}

/**
 * Calculate critical path risk based on modified files
 */
export function calculateCriticalPathRisk(files: GitHubFile[]): number {
	const criticalFiles = files.filter((file) =>
		CRITICAL_FILE_PATTERNS.some((pattern) => pattern.test(file.filename))
	);

	if (criticalFiles.length === 0) return 0;

	// Base risk for having any critical files
	let risk = 3;

	// Increase risk based on number of critical files
	risk += Math.min(5, criticalFiles.length * 1.5);

	// Additional risk for specific critical file types
	criticalFiles.forEach((file) => {
		if (/package\.json$/.test(file.filename)) risk += 1;
		if (/\.env/.test(file.filename)) risk += 2;
		if (/migrations?\//.test(file.filename)) risk += 2;
		if (/auth|security|payment|billing/.test(file.filename)) risk += 1.5;
	});

	return Math.min(10, risk);
}

/**
 * Calculate complexity risk based on file types and changes
 */
export function calculateComplexityRisk(files: GitHubFile[]): number {
	let complexityScore = 0;

	files.forEach((file) => {
		// Base complexity for different file types
		if (COMPLEX_FILE_PATTERNS.some((pattern) => pattern.test(file.filename))) {
			complexityScore += 1;
		}

		// Additional complexity based on change size
		const changeSize = file.additions + file.deletions;
		if (changeSize > 100) complexityScore += 2;
		else if (changeSize > 50) complexityScore += 1;

		// Additional complexity for new files
		if (file.status === "added") complexityScore += 0.5;

		// Additional complexity for renamed files
		if (file.status === "renamed") complexityScore += 1;
	});

	// Normalize to 0-10 scale
	return Math.min(10, (complexityScore / Math.max(1, files.length)) * 5);
}

/**
 * Calculate overall risk score
 */
export function calculateRiskScore(
	pr: GitHubPullRequest,
	files: GitHubFile[],
	config: PRScoringConfig = DEFAULT_SCORING_CONFIG
): number {
	const sizeScore = calculateSizeScore(pr, files, config);
	const testCoverageRisk = calculateTestCoverageRisk(files);
	const criticalPathRisk = calculateCriticalPathRisk(files);
	const complexityRisk = calculateComplexityRisk(files);

	const { riskWeights } = config;

	// Weighted combination of risk factors
	const riskScore =
		sizeScore * riskWeights.size +
		testCoverageRisk * riskWeights.testCoverage +
		criticalPathRisk * riskWeights.criticalPaths +
		complexityRisk * riskWeights.complexity;

	return Math.min(10, Math.max(0, riskScore));
}

/**
 * Generate recommendations based on PR analysis
 */
export function generateRecommendations(
	pr: GitHubPullRequest,
	files: GitHubFile[],
	score: PRScore,
	config: PRScoringConfig = DEFAULT_SCORING_CONFIG
): string[] {
	const recommendations: string[] = [];

	// Size-based recommendations
	if (score.sizeScore > config.thresholds.largePR) {
		recommendations.push(
			"Consider breaking this PR into smaller, focused changes"
		);
	}

	// Test coverage recommendations
	if (score.factors.risk.testCoverageRisk > 7) {
		recommendations.push("Add or update tests to cover the changes");
	}

	// Critical path recommendations
	if (score.factors.risk.criticalPathRisk > 5) {
		recommendations.push(
			"Extra caution needed - changes affect critical system components"
		);
		recommendations.push(
			"Consider additional reviewers familiar with these components"
		);
	}

	// Complexity recommendations
	if (score.factors.risk.complexityRisk > 6) {
		recommendations.push(
			"Complex changes detected - ensure thorough code review"
		);
	}

	// Overall risk recommendations
	if (score.riskScore > config.thresholds.highRisk) {
		recommendations.push(
			"High-risk PR - consider requiring multiple approvals"
		);
		recommendations.push("Schedule additional testing before merge");
	}

	// File-specific recommendations
	const criticalFiles = files.filter((file) =>
		CRITICAL_FILE_PATTERNS.some((pattern) => pattern.test(file.filename))
	);

	if (criticalFiles.some((f) => /package\.json$/.test(f.filename))) {
		recommendations.push("Dependency changes detected - verify compatibility");
	}

	if (criticalFiles.some((f) => /migrations?\//.test(f.filename))) {
		recommendations.push(
			"Database migration changes - ensure backward compatibility"
		);
	}

	return recommendations;
}

/**
 * Calculate comprehensive PR score
 */
export function calculatePRScore(
	pr: GitHubPullRequest,
	files: GitHubFile[],
	config: PRScoringConfig = DEFAULT_SCORING_CONFIG
): PRScore {
	const sizeScore = calculateSizeScore(pr, files, config);
	const testCoverageRisk = calculateTestCoverageRisk(files);
	const criticalPathRisk = calculateCriticalPathRisk(files);
	const complexityRisk = calculateComplexityRisk(files);
	const riskScore = calculateRiskScore(pr, files, config);

	// Overall score combines size and risk
	const overallScore = (sizeScore + riskScore) / 2;

	const score: PRScore = {
		sizeScore,
		riskScore,
		overallScore,
		factors: {
			size: {
				additions: pr.additions,
				deletions: pr.deletions,
				filesChanged: pr.changed_files,
				totalLines: pr.additions + pr.deletions,
			},
			risk: {
				sizeRisk: sizeScore,
				testCoverageRisk,
				criticalPathRisk,
				complexityRisk,
			},
		},
		recommendations: [],
	};

	// Generate recommendations
	score.recommendations = generateRecommendations(pr, files, score, config);

	return score;
}

/**
 * Suggest reviewers based on file changes and code ownership patterns
 */
export function suggestReviewers(
	files: GitHubFile[],
	teamMembers: Array<{ github_login: string; expertise?: string[] }>
): string[] {
	const suggestions: Map<string, number> = new Map();

	// Analyze file patterns to suggest appropriate reviewers
	files.forEach((file) => {
		const path = file.filename.toLowerCase();

		// Frontend expertise
		if (
			/\.(tsx?|jsx?|css|scss|html)$/.test(path) ||
			/components?\//.test(path)
		) {
			teamMembers.forEach((member) => {
				if (member.expertise?.includes("frontend")) {
					suggestions.set(
						member.github_login,
						(suggestions.get(member.github_login) || 0) + 2
					);
				}
			});
		}

		// Backend expertise
		if (
			/\.(py|java|go|rs|php)$/.test(path) ||
			/api\/|server\/|backend\//.test(path)
		) {
			teamMembers.forEach((member) => {
				if (member.expertise?.includes("backend")) {
					suggestions.set(
						member.github_login,
						(suggestions.get(member.github_login) || 0) + 2
					);
				}
			});
		}

		// Database expertise
		if (
			/\.(sql|migration)$/.test(path) ||
			/migrations?\/|database\//.test(path)
		) {
			teamMembers.forEach((member) => {
				if (member.expertise?.includes("database")) {
					suggestions.set(
						member.github_login,
						(suggestions.get(member.github_login) || 0) + 3
					);
				}
			});
		}

		// DevOps expertise
		if (
			/dockerfile|docker-compose|\.ya?ml$|\.json$/.test(path) ||
			/deploy|infra|ops/.test(path)
		) {
			teamMembers.forEach((member) => {
				if (member.expertise?.includes("devops")) {
					suggestions.set(
						member.github_login,
						(suggestions.get(member.github_login) || 0) + 2
					);
				}
			});
		}
	});

	// Sort by score and return top suggestions
	return Array.from(suggestions.entries())
		.sort(([, a], [, b]) => b - a)
		.slice(0, 3)
		.map(([login]) => login);
}
