import { createClient } from "@/lib/supabase/server";
import { createGitHubService } from "@/lib/integrations/github-service";
import type {
	CodeOwnershipData,
	ReviewerSuggestion,
	GetReviewerSuggestionsRequest,
	GetReviewerSuggestionsResponse,
} from "./types";
import type { Database } from "@/lib/types/database";

/**
 * Reviewer suggestion service based on code ownership and expertise
 */
export class ReviewerSuggestionService {
	private async getSupabase() {
		return await createClient();
	}

	/**
	 * Get reviewer suggestions for a PR
	 */
	async getReviewerSuggestions(
		orgId: string,
		request: GetReviewerSuggestionsRequest
	): Promise<GetReviewerSuggestionsResponse> {
		const supabase = await this.getSupabase();

		// Get GitHub integration
		const { data: integration, error: integrationError } = await supabase
			.from("integrations")
			.select("*")
			.eq("org_id", orgId)
			.eq("type", "github")
			.single();

		if (integrationError) {
			throw new Error(
				`GitHub integration not found: ${integrationError.message}`
			);
		}

		// Get organization members
		const { data: members, error: membersError } = await supabase
			.from("members")
			.select("*")
			.eq("org_id", orgId)
			.not("github_login", "is", null)
			.neq("github_login", request.author_github_login); // Exclude PR author

		if (membersError) {
			throw new Error(`Failed to fetch members: ${membersError.message}`);
		}

		if (!members || members.length === 0) {
			return {
				suggestions: [],
				confidence_threshold: 0.3,
			};
		}

		// Analyze code ownership for touched paths
		const ownershipData = await this.analyzeCodeOwnership(
			integration,
			request.repo,
			request.touched_paths
		);

		// Generate suggestions based on ownership and expertise
		const suggestions = await this.generateSuggestions(
			members,
			ownershipData,
			request.touched_paths
		);

		// Sort by confidence score and return top suggestions
		const sortedSuggestions = suggestions
			.sort((a, b) => b.confidence_score - a.confidence_score)
			.slice(0, 5); // Limit to top 5 suggestions

		return {
			suggestions: sortedSuggestions,
			confidence_threshold: 0.3,
		};
	}

	/**
	 * Analyze code ownership for given file paths
	 */
	private async analyzeCodeOwnership(
		integration: Database["public"]["Tables"]["integrations"]["Row"],
		repo: string,
		touchedPaths: string[]
	): Promise<CodeOwnershipData[]> {
		const githubService = createGitHubService(integration);
		const ownershipData: CodeOwnershipData[] = [];

		try {
			// For each touched path, analyze recent contributors
			for (const filePath of touchedPaths) {
				try {
					// Get recent commits for this file (last 50 commits)
					const commits = await githubService.getFileCommits(
						repo,
						filePath,
						50
					);

					// Analyze contributor patterns
					const contributorStats = this.analyzeContributors(commits);

					ownershipData.push({
						file_path: filePath,
						primary_contributors: contributorStats.primary,
						recent_contributors: contributorStats.recent,
						expertise_score: contributorStats.expertiseScore,
					});
				} catch (error) {
					console.warn(`Failed to analyze ownership for ${filePath}:`, error);
					// Add default ownership data for files we can't analyze
					ownershipData.push({
						file_path: filePath,
						primary_contributors: [],
						recent_contributors: [],
						expertise_score: 0,
					});
				}
			}
		} catch (error) {
			console.error("Failed to analyze code ownership:", error);
		}

		return ownershipData;
	}

	/**
	 * Analyze contributors from commit history
	 */
	private analyzeContributors(commits: any[]): {
		primary: string[];
		recent: string[];
		expertiseScore: number;
	} {
		if (!commits || commits.length === 0) {
			return { primary: [], recent: [], expertiseScore: 0 };
		}

		// Count contributions by author
		const contributionCounts = new Map<string, number>();
		const recentContributors = new Set<string>();

		// Consider last 30 days as "recent"
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		commits.forEach((commit) => {
			const author = commit.author?.login || commit.commit?.author?.name;
			if (!author) return;

			// Count total contributions
			contributionCounts.set(author, (contributionCounts.get(author) || 0) + 1);

			// Track recent contributors
			const commitDate = new Date(
				commit.commit?.author?.date || commit.created_at
			);
			if (commitDate > thirtyDaysAgo) {
				recentContributors.add(author);
			}
		});

		// Sort contributors by contribution count
		const sortedContributors = Array.from(contributionCounts.entries()).sort(
			([, a], [, b]) => b - a
		);

		// Primary contributors are those with significant contributions (>20% of total)
		const totalCommits = commits.length;
		const primary = sortedContributors
			.filter(([, count]) => count / totalCommits >= 0.2)
			.map(([author]) => author)
			.slice(0, 3); // Top 3 primary contributors

		// Calculate expertise score based on contribution diversity and recency
		const expertiseScore = Math.min(
			10,
			primary.length * 2 +
				recentContributors.size * 1.5 +
				Math.log(totalCommits + 1) * 0.5
		);

		return {
			primary,
			recent: Array.from(recentContributors),
			expertiseScore,
		};
	}

	/**
	 * Generate reviewer suggestions based on ownership data
	 */
	private async generateSuggestions(
		members: Database["public"]["Tables"]["members"]["Row"][],
		ownershipData: CodeOwnershipData[],
		touchedPaths: string[]
	): Promise<ReviewerSuggestion[]> {
		const suggestions: ReviewerSuggestion[] = [];

		for (const member of members) {
			if (!member.github_login) continue;

			const suggestion = this.calculateMemberSuggestion(
				member,
				ownershipData,
				touchedPaths
			);

			if (suggestion.confidence_score > 0) {
				suggestions.push(suggestion);
			}
		}

		return suggestions;
	}

	/**
	 * Calculate suggestion score for a specific member
	 */
	private calculateMemberSuggestion(
		member: Database["public"]["Tables"]["members"]["Row"],
		ownershipData: CodeOwnershipData[],
		touchedPaths: string[]
	): ReviewerSuggestion {
		const githubLogin = member.github_login!;
		let confidenceScore = 0;
		const reasoning: string[] = [];
		const expertiseAreas: string[] = [];

		// Analyze ownership across all touched files
		let primaryOwnershipCount = 0;
		let recentContributionCount = 0;
		let totalExpertiseScore = 0;

		ownershipData.forEach((ownership) => {
			// Check if member is a primary contributor
			if (ownership.primary_contributors.includes(githubLogin)) {
				primaryOwnershipCount++;
				confidenceScore += 3;
			}

			// Check if member has recent contributions
			if (ownership.recent_contributors.includes(githubLogin)) {
				recentContributionCount++;
				confidenceScore += 2;
			}

			// Add expertise score
			totalExpertiseScore += ownership.expertise_score;

			// Determine expertise areas based on file paths
			const area = this.determineExpertiseArea(ownership.file_path);
			if (area && !expertiseAreas.includes(area)) {
				expertiseAreas.push(area);
			}
		});

		// Generate reasoning based on analysis
		if (primaryOwnershipCount > 0) {
			reasoning.push(
				`Primary contributor to ${primaryOwnershipCount} of ${touchedPaths.length} modified files`
			);
		}

		if (recentContributionCount > 0) {
			reasoning.push(
				`Recent activity in ${recentContributionCount} of ${touchedPaths.length} modified files`
			);
		}

		// Bonus for broad expertise
		if (expertiseAreas.length > 1) {
			confidenceScore += 1;
			reasoning.push(
				`Experience across multiple areas: ${expertiseAreas.join(", ")}`
			);
		}

		// Bonus for high overall expertise
		const avgExpertiseScore = totalExpertiseScore / ownershipData.length;
		if (avgExpertiseScore > 5) {
			confidenceScore += 1;
			reasoning.push("High expertise in modified codebase areas");
		}

		// Normalize confidence score to 0-1 range
		const normalizedScore = Math.min(1, confidenceScore / 10);

		return {
			github_login: githubLogin,
			member_id: member.id,
			confidence_score: Math.round(normalizedScore * 100) / 100,
			reasoning: reasoning.length > 0 ? reasoning : ["Available for review"],
			expertise_areas: expertiseAreas,
		};
	}

	/**
	 * Determine expertise area based on file path
	 */
	private determineExpertiseArea(filePath: string): string | null {
		const areaPatterns = [
			{ pattern: /\/api\/|\/backend\/|\/server\//, area: "Backend" },
			{ pattern: /\/frontend\/|\/ui\/|\/components\//, area: "Frontend" },
			{ pattern: /\/database\/|\/migrations\/|\.sql$/, area: "Database" },
			{ pattern: /\/auth\/|\/security\//, area: "Security" },
			{ pattern: /\/test\/|\.test\.|\.spec\./, area: "Testing" },
			{ pattern: /\/docs\/|\.md$|README/, area: "Documentation" },
			{ pattern: /\/config\/|\.config\.|\.env/, area: "Configuration" },
			{ pattern: /\/deploy\/|\/infra\/|Dockerfile/, area: "Infrastructure" },
		];

		for (const { pattern, area } of areaPatterns) {
			if (pattern.test(filePath)) {
				return area;
			}
		}

		return null;
	}
}

/**
 * Create reviewer suggestion service instance
 */
export function createReviewerSuggestionService(): ReviewerSuggestionService {
	return new ReviewerSuggestionService();
}
