import type {
	GitHubPRData,
	GitHubPRFile,
	PRSizeMetrics,
	PRRiskFactors,
	PRScoreResult,
} from "./types";

/**
 * PR scoring algorithms for size and risk assessment
 */
export class PRScoringService {
	/**
	 * Calculate comprehensive PR score including size and risk
	 */
	calculatePRScore(prData: GitHubPRData): PRScoreResult {
		const sizeMetrics = this.calculateSizeMetrics(prData);
		const riskFactors = this.calculateRiskFactors(prData, sizeMetrics);

		const sizeScore = this.calculateSizeScore(sizeMetrics);
		const riskScore = this.calculateRiskScore(riskFactors);

		return {
			size_score: Math.round(sizeScore * 10) / 10,
			risk_score: Math.round(riskScore * 10) / 10,
			risk_factors: riskFactors,
			size_metrics: sizeMetrics,
		};
	}

	/**
	 * Calculate size metrics from PR data
	 */
	private calculateSizeMetrics(prData: GitHubPRData): PRSizeMetrics {
		const files = prData.files || [];

		// Count test files
		const testFiles = files.filter((file) => this.isTestFile(file.filename));
		const testsChanged = testFiles.reduce((sum, file) => sum + file.changes, 0);

		return {
			additions: prData.additions,
			deletions: prData.deletions,
			files_changed: prData.changed_files,
			tests_changed: testsChanged,
			total_changes: prData.additions + prData.deletions,
		};
	}

	/**
	 * Calculate risk factors for the PR
	 */
	private calculateRiskFactors(
		prData: GitHubPRData,
		sizeMetrics: PRSizeMetrics
	): PRRiskFactors {
		const files = prData.files || [];

		return {
			size_factor: this.calculateSizeFactor(sizeMetrics),
			complexity_factor: this.calculateComplexityFactor(prData, files),
			test_coverage_factor: this.calculateTestCoverageFactor(
				sizeMetrics,
				files
			),
			file_type_factor: this.calculateFileTypeFactor(files),
			author_experience_factor: this.calculateAuthorExperienceFactor(prData),
		};
	}

	/**
	 * Calculate size score (0-10 scale)
	 */
	private calculateSizeScore(metrics: PRSizeMetrics): number {
		// Size score based on total changes with logarithmic scaling
		const totalChanges = metrics.total_changes;

		if (totalChanges <= 10) return 1;
		if (totalChanges <= 50) return 2;
		if (totalChanges <= 100) return 3;
		if (totalChanges <= 200) return 4;
		if (totalChanges <= 400) return 5;
		if (totalChanges <= 800) return 6;
		if (totalChanges <= 1200) return 7;
		if (totalChanges <= 1600) return 8;
		if (totalChanges <= 2000) return 9;

		return 10;
	}

	/**
	 * Calculate overall risk score (0-10 scale)
	 */
	private calculateRiskScore(factors: PRRiskFactors): number {
		// Weighted average of risk factors
		const weights = {
			size_factor: 0.25,
			complexity_factor: 0.3,
			test_coverage_factor: 0.25,
			file_type_factor: 0.15,
			author_experience_factor: 0.05,
		};

		const weightedScore =
			factors.size_factor * weights.size_factor +
			factors.complexity_factor * weights.complexity_factor +
			factors.test_coverage_factor * weights.test_coverage_factor +
			factors.file_type_factor * weights.file_type_factor +
			factors.author_experience_factor * weights.author_experience_factor;

		return Math.min(10, Math.max(0, weightedScore));
	}

	/**
	 * Calculate size factor (0-10 scale)
	 */
	private calculateSizeFactor(metrics: PRSizeMetrics): number {
		const { total_changes, files_changed } = metrics;

		// Base score from total changes
		let score = 0;
		if (total_changes > 2000) score += 4;
		else if (total_changes > 1000) score += 3;
		else if (total_changes > 500) score += 2;
		else if (total_changes > 200) score += 1;

		// Additional score from file count
		if (files_changed > 50) score += 3;
		else if (files_changed > 20) score += 2;
		else if (files_changed > 10) score += 1;

		// Bonus for very large PRs
		if (total_changes > 3000 || files_changed > 100) score += 3;

		return Math.min(10, score);
	}

	/**
	 * Calculate complexity factor based on file types and patterns
	 */
	private calculateComplexityFactor(
		prData: GitHubPRData,
		files: GitHubPRFile[]
	): number {
		let score = 0;

		// Check for complex file types
		const complexFiles = files.filter((file) =>
			this.isComplexFile(file.filename)
		);
		if (complexFiles.length > 0) {
			score += Math.min(3, complexFiles.length * 0.5);
		}

		// Check for database migrations
		const migrationFiles = files.filter((file) =>
			this.isMigrationFile(file.filename)
		);
		if (migrationFiles.length > 0) {
			score += 2;
		}

		// Check for configuration changes
		const configFiles = files.filter((file) =>
			this.isConfigFile(file.filename)
		);
		if (configFiles.length > 0) {
			score += 1;
		}

		// Check for dependency changes
		const dependencyFiles = files.filter((file) =>
			this.isDependencyFile(file.filename)
		);
		if (dependencyFiles.length > 0) {
			score += 1.5;
		}

		// Check for large individual file changes
		const largeFileChanges = files.filter((file) => file.changes > 200);
		if (largeFileChanges.length > 0) {
			score += Math.min(2, largeFileChanges.length * 0.5);
		}

		// Check commit count as complexity indicator
		if (prData.commits > 20) score += 2;
		else if (prData.commits > 10) score += 1;

		return Math.min(10, score);
	}

	/**
	 * Calculate test coverage factor (higher score = worse coverage)
	 */
	private calculateTestCoverageFactor(
		metrics: PRSizeMetrics,
		files: GitHubPRFile[]
	): number {
		const { total_changes, tests_changed } = metrics;

		// If no code changes, no risk
		if (total_changes === 0) return 0;

		// Calculate test coverage ratio
		const testCoverageRatio = tests_changed / total_changes;

		// Score based on test coverage (inverted - less coverage = higher risk)
		let score = 0;

		if (testCoverageRatio === 0) {
			// No tests at all
			score = 8;
		} else if (testCoverageRatio < 0.1) {
			// Very low test coverage
			score = 6;
		} else if (testCoverageRatio < 0.2) {
			// Low test coverage
			score = 4;
		} else if (testCoverageRatio < 0.4) {
			// Moderate test coverage
			score = 2;
		} else {
			// Good test coverage
			score = 1;
		}

		// Bonus penalty for large PRs with no tests
		if (total_changes > 500 && tests_changed === 0) {
			score += 2;
		}

		// Check if only test files are changed (lower risk)
		const nonTestFiles = files.filter(
			(file) => !this.isTestFile(file.filename)
		);
		if (nonTestFiles.length === 0) {
			score = 0;
		}

		return Math.min(10, score);
	}

	/**
	 * Calculate file type risk factor
	 */
	private calculateFileTypeFactor(files: GitHubPRFile[]): number {
		let score = 0;

		// Critical system files
		const criticalFiles = files.filter((file) =>
			this.isCriticalFile(file.filename)
		);
		if (criticalFiles.length > 0) {
			score += 3;
		}

		// Security-related files
		const securityFiles = files.filter((file) =>
			this.isSecurityFile(file.filename)
		);
		if (securityFiles.length > 0) {
			score += 2;
		}

		// Infrastructure files
		const infraFiles = files.filter((file) =>
			this.isInfrastructureFile(file.filename)
		);
		if (infraFiles.length > 0) {
			score += 1.5;
		}

		// Documentation only changes (lower risk)
		const docFiles = files.filter((file) =>
			this.isDocumentationFile(file.filename)
		);
		if (docFiles.length === files.length && files.length > 0) {
			score = 0.5;
		}

		return Math.min(10, score);
	}

	/**
	 * Calculate author experience factor (placeholder - would need historical data)
	 */
	private calculateAuthorExperienceFactor(prData: GitHubPRData): number {
		// Placeholder implementation - in real system would check:
		// - Author's previous PR history
		// - Time since first contribution
		// - Success rate of previous PRs
		// - Repository familiarity

		// For now, return neutral score
		return 2;
	}

	/**
	 * File type detection helpers
	 */
	private isTestFile(filename: string): boolean {
		const testPatterns = [
			/\.test\./,
			/\.spec\./,
			/__tests__\//,
			/\/tests?\//,
			/\.test$/,
			/\.spec$/,
		];
		return testPatterns.some((pattern) => pattern.test(filename));
	}

	private isComplexFile(filename: string): boolean {
		const complexPatterns = [
			/\.(sql|migration)$/,
			/webpack\./,
			/rollup\./,
			/vite\./,
			/babel\./,
			/\.d\.ts$/,
		];
		return complexPatterns.some((pattern) => pattern.test(filename));
	}

	private isMigrationFile(filename: string): boolean {
		const migrationPatterns = [/migration/i, /migrate/i, /\.sql$/, /schema/i];
		return migrationPatterns.some((pattern) => pattern.test(filename));
	}

	private isConfigFile(filename: string): boolean {
		const configPatterns = [
			/\.config\./,
			/\.env/,
			/\.json$/,
			/\.yaml$/,
			/\.yml$/,
			/\.toml$/,
			/Dockerfile/,
			/docker-compose/,
		];
		return configPatterns.some((pattern) => pattern.test(filename));
	}

	private isDependencyFile(filename: string): boolean {
		const depPatterns = [
			/package\.json$/,
			/package-lock\.json$/,
			/yarn\.lock$/,
			/pnpm-lock\.yaml$/,
			/Gemfile/,
			/requirements\.txt$/,
			/Pipfile/,
			/go\.mod$/,
			/go\.sum$/,
		];
		return depPatterns.some((pattern) => pattern.test(filename));
	}

	private isCriticalFile(filename: string): boolean {
		const criticalPatterns = [
			/\/middleware\//,
			/\/auth/,
			/\/security/,
			/\/core/,
			/\/kernel/,
			/\/system/,
		];
		return criticalPatterns.some((pattern) => pattern.test(filename));
	}

	private isSecurityFile(filename: string): boolean {
		const securityPatterns = [
			/auth/i,
			/security/i,
			/permission/i,
			/role/i,
			/oauth/i,
			/jwt/i,
			/crypto/i,
		];
		return securityPatterns.some((pattern) => pattern.test(filename));
	}

	private isInfrastructureFile(filename: string): boolean {
		const infraPatterns = [
			/\.tf$/,
			/\.terraform/,
			/kubernetes/i,
			/k8s/i,
			/helm/i,
			/ansible/i,
			/cloudformation/i,
		];
		return infraPatterns.some((pattern) => pattern.test(filename));
	}

	private isDocumentationFile(filename: string): boolean {
		const docPatterns = [
			/\.md$/,
			/\.txt$/,
			/README/i,
			/CHANGELOG/i,
			/LICENSE/i,
			/docs?\//,
		];
		return docPatterns.some((pattern) => pattern.test(filename));
	}
}

/**
 * Create PR scoring service instance
 */
export function createPRScoringService(): PRScoringService {
	return new PRScoringService();
}
