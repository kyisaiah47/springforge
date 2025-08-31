import { logger } from "./logger";

export interface PerformanceMetric {
	operation: string;
	duration_ms: number;
	timestamp: string;
	context?: Record<string, any>;
}

export interface DatabaseQueryMetric {
	query_type: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
	table: string;
	duration_ms: number;
	rows_affected?: number;
	timestamp: string;
}

class PerformanceMonitor {
	private metrics: PerformanceMetric[] = [];
	private dbMetrics: DatabaseQueryMetric[] = [];
	private slowQueryThreshold = 1000; // 1 second
	private maxMetricsHistory = 1000;

	/**
	 * Track operation performance
	 */
	trackOperation(
		operation: string,
		duration: number,
		context?: Record<string, any>
	): void {
		const metric: PerformanceMetric = {
			operation,
			duration_ms: duration,
			timestamp: new Date().toISOString(),
			context,
		};

		this.metrics.push(metric);

		// Keep only recent metrics
		if (this.metrics.length > this.maxMetricsHistory) {
			this.metrics = this.metrics.slice(-this.maxMetricsHistory);
		}

		// Log slow operations
		if (duration > this.slowQueryThreshold) {
			logger.warn("Slow operation detected", {
				operation,
				duration_ms: duration,
				context,
			});
		}

		// Log performance metric
		logger.info("Performance metric", {
			operation,
			duration_ms: duration,
			context,
		});
	}

	/**
	 * Track database query performance
	 */
	trackDatabaseQuery(
		queryType: DatabaseQueryMetric["query_type"],
		table: string,
		duration: number,
		rowsAffected?: number
	): void {
		const metric: DatabaseQueryMetric = {
			query_type: queryType,
			table,
			duration_ms: duration,
			rows_affected: rowsAffected,
			timestamp: new Date().toISOString(),
		};

		this.dbMetrics.push(metric);

		// Keep only recent metrics
		if (this.dbMetrics.length > this.maxMetricsHistory) {
			this.dbMetrics = this.dbMetrics.slice(-this.maxMetricsHistory);
		}

		// Log slow queries
		if (duration > this.slowQueryThreshold) {
			logger.warn("Slow database query detected", {
				query_type: queryType,
				table,
				duration_ms: duration,
				rows_affected: rowsAffected,
			});
		}
	}

	/**
	 * Get performance statistics
	 */
	getPerformanceStats(): {
		total_operations: number;
		avg_duration_ms: number;
		slow_operations: number;
		operations_by_type: Record<string, { count: number; avg_duration: number }>;
		database_stats: {
			total_queries: number;
			avg_duration_ms: number;
			slow_queries: number;
			queries_by_table: Record<string, { count: number; avg_duration: number }>;
		};
	} {
		// Calculate operation stats
		const totalOps = this.metrics.length;
		const avgDuration =
			totalOps > 0
				? this.metrics.reduce((sum, m) => sum + m.duration_ms, 0) / totalOps
				: 0;
		const slowOps = this.metrics.filter(
			(m) => m.duration_ms > this.slowQueryThreshold
		).length;

		const opsByType: Record<string, { count: number; total_duration: number }> =
			{};
		this.metrics.forEach((metric) => {
			if (!opsByType[metric.operation]) {
				opsByType[metric.operation] = { count: 0, total_duration: 0 };
			}
			opsByType[metric.operation].count++;
			opsByType[metric.operation].total_duration += metric.duration_ms;
		});

		const operationsByType: Record<
			string,
			{ count: number; avg_duration: number }
		> = {};
		Object.entries(opsByType).forEach(([op, stats]) => {
			operationsByType[op] = {
				count: stats.count,
				avg_duration: stats.total_duration / stats.count,
			};
		});

		// Calculate database stats
		const totalQueries = this.dbMetrics.length;
		const avgDbDuration =
			totalQueries > 0
				? this.dbMetrics.reduce((sum, m) => sum + m.duration_ms, 0) /
				  totalQueries
				: 0;
		const slowQueries = this.dbMetrics.filter(
			(m) => m.duration_ms > this.slowQueryThreshold
		).length;

		const queriesByTable: Record<
			string,
			{ count: number; total_duration: number }
		> = {};
		this.dbMetrics.forEach((metric) => {
			if (!queriesByTable[metric.table]) {
				queriesByTable[metric.table] = { count: 0, total_duration: 0 };
			}
			queriesByTable[metric.table].count++;
			queriesByTable[metric.table].total_duration += metric.duration_ms;
		});

		const dbQueriesByTable: Record<
			string,
			{ count: number; avg_duration: number }
		> = {};
		Object.entries(queriesByTable).forEach(([table, stats]) => {
			dbQueriesByTable[table] = {
				count: stats.count,
				avg_duration: stats.total_duration / stats.count,
			};
		});

		return {
			total_operations: totalOps,
			avg_duration_ms: avgDuration,
			slow_operations: slowOps,
			operations_by_type: operationsByType,
			database_stats: {
				total_queries: totalQueries,
				avg_duration_ms: avgDbDuration,
				slow_queries: slowQueries,
				queries_by_table: dbQueriesByTable,
			},
		};
	}

	/**
	 * Get recent slow operations
	 */
	getSlowOperations(limit: number = 10): PerformanceMetric[] {
		return this.metrics
			.filter((m) => m.duration_ms > this.slowQueryThreshold)
			.sort((a, b) => b.duration_ms - a.duration_ms)
			.slice(0, limit);
	}

	/**
	 * Get recent slow database queries
	 */
	getSlowQueries(limit: number = 10): DatabaseQueryMetric[] {
		return this.dbMetrics
			.filter((m) => m.duration_ms > this.slowQueryThreshold)
			.sort((a, b) => b.duration_ms - a.duration_ms)
			.slice(0, limit);
	}

	/**
	 * Clear metrics (useful for testing)
	 */
	clearMetrics(): void {
		this.metrics = [];
		this.dbMetrics = [];
	}

	/**
	 * Set slow query threshold
	 */
	setSlowQueryThreshold(ms: number): void {
		this.slowQueryThreshold = ms;
	}
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for tracking function performance
 */
export function trackPerformance<T extends (...args: any[]) => Promise<any>>(
	operation: string,
	fn: T
): T {
	return (async (...args: any[]) => {
		const startTime = Date.now();
		try {
			const result = await fn(...args);
			const duration = Date.now() - startTime;
			performanceMonitor.trackOperation(operation, duration, {
				success: true,
				args_count: args.length,
			});
			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			performanceMonitor.trackOperation(operation, duration, {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				args_count: args.length,
			});
			throw error;
		}
	}) as T;
}

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
	operation: string,
	fn: () => Promise<T>,
	context?: Record<string, any>
): Promise<T> {
	const startTime = Date.now();
	try {
		const result = await fn();
		const duration = Date.now() - startTime;
		performanceMonitor.trackOperation(operation, duration, {
			...context,
			success: true,
		});
		return result;
	} catch (error) {
		const duration = Date.now() - startTime;
		performanceMonitor.trackOperation(operation, duration, {
			...context,
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		});
		throw error;
	}
}
