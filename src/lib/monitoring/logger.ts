interface LogContext {
	userId?: string;
	orgId?: string;
	requestId?: string;
	[key: string]: unknown;
}

interface LogEntry {
	level: "info" | "warn" | "error" | "debug";
	message: string;
	context?: LogContext;
	timestamp: string;
	environment: string;
}

class Logger {
	private environment: string;

	constructor() {
		this.environment = process.env.NODE_ENV || "development";
	}

	private createLogEntry(
		level: LogEntry["level"],
		message: string,
		context?: LogContext
	): LogEntry {
		return {
			level,
			message,
			context,
			timestamp: new Date().toISOString(),
			environment: this.environment,
		};
	}

	private log(entry: LogEntry) {
		// In development, use console
		if (this.environment === "development") {
			const logMethod =
				entry.level === "error"
					? console.error
					: entry.level === "warn"
					? console.warn
					: console.log;

			logMethod(
				`[${entry.level.toUpperCase()}] ${entry.message}`,
				entry.context || ""
			);
			return;
		}

		// In production, structure logs for external services
		const structuredLog = {
			...entry,
			// Add additional metadata for production
			service: "sprintforge",
			version: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
		};

		console.log(JSON.stringify(structuredLog));
	}

	info(message: string, context?: LogContext) {
		this.log(this.createLogEntry("info", message, context));
	}

	warn(message: string, context?: LogContext) {
		this.log(this.createLogEntry("warn", message, context));
	}

	error(message: string, error?: Error, context?: LogContext) {
		const errorContext = {
			...context,
			error: error
				? {
						name: error.name,
						message: error.message,
						stack: error.stack,
				  }
				: undefined,
		};

		this.log(this.createLogEntry("error", message, errorContext));
	}

	debug(message: string, context?: LogContext) {
		if (this.environment === "development") {
			this.log(this.createLogEntry("debug", message, context));
		}
	}
}

export const logger = new Logger();

// Request ID middleware helper
export function generateRequestId(): string {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	);
}

// Error tracking utilities
export function trackError(error: Error, context?: LogContext) {
	logger.error("Unhandled error", error, context);

	// In production, you could send to external error tracking service
	if (process.env.NODE_ENV === "production") {
		// Example: Sentry, LogRocket, etc.
		// Sentry.captureException(error, { contexts: { custom: context } });
	}
}

// Performance monitoring
export function trackPerformance(
	operation: string,
	duration: number,
	context?: LogContext
) {
	logger.info(`Performance: ${operation}`, {
		...context,
		duration_ms: duration,
		operation,
	});
}

// API monitoring helper
export function withMonitoring<T extends unknown[], R>(
	fn: (...args: T) => Promise<R>,
	operationName: string
) {
	return async (...args: T): Promise<R> => {
		const startTime = Date.now();
		const requestId = generateRequestId();

		try {
			logger.info(`Starting ${operationName}`, { requestId });
			const result = await fn(...args);

			const duration = Date.now() - startTime;
			trackPerformance(operationName, duration, { requestId });

			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			trackError(error as Error, {
				requestId,
				operation: operationName,
				duration_ms: duration,
			});
			throw error;
		}
	};
}
