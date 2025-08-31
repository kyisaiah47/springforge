import { logger } from "./logger";

export interface SecurityEvent {
	type:
		| "auth_failure"
		| "rate_limit"
		| "suspicious_activity"
		| "data_breach_attempt"
		| "privilege_escalation";
	severity: "low" | "medium" | "high" | "critical";
	source_ip: string;
	user_id?: string;
	org_id?: string;
	details: Record<string, any>;
	timestamp: string;
}

export interface SecurityMetrics {
	failed_auth_attempts: number;
	rate_limit_violations: number;
	suspicious_requests: number;
	blocked_ips: Set<string>;
	last_24h_events: SecurityEvent[];
}

class SecurityAuditor {
	private metrics: SecurityMetrics = {
		failed_auth_attempts: 0,
		rate_limit_violations: 0,
		suspicious_requests: 0,
		blocked_ips: new Set(),
		last_24h_events: [],
	};

	private blockedIPs = new Set<string>();
	private suspiciousIPs = new Map<string, number>();

	/**
	 * Log a security event
	 */
	logSecurityEvent(event: Omit<SecurityEvent, "timestamp">): void {
		const securityEvent: SecurityEvent = {
			...event,
			timestamp: new Date().toISOString(),
		};

		// Add to metrics
		this.metrics.last_24h_events.push(securityEvent);

		// Clean old events (keep only last 24 hours)
		const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
		this.metrics.last_24h_events = this.metrics.last_24h_events.filter(
			(e) => new Date(e.timestamp).getTime() > oneDayAgo
		);

		// Update counters
		switch (event.type) {
			case "auth_failure":
				this.metrics.failed_auth_attempts++;
				this.trackSuspiciousIP(event.source_ip);
				break;
			case "rate_limit":
				this.metrics.rate_limit_violations++;
				this.trackSuspiciousIP(event.source_ip);
				break;
			case "suspicious_activity":
				this.metrics.suspicious_requests++;
				this.trackSuspiciousIP(event.source_ip, 3); // Higher weight for suspicious activity
				break;
		}

		// Log the event
		logger.warn("Security Event", {
			type: event.type,
			severity: event.severity,
			source_ip: event.source_ip,
			user_id: event.user_id,
			org_id: event.org_id,
			details: event.details,
		});

		// Check if we should block the IP
		this.checkForIPBlocking(event.source_ip);

		// Alert on critical events
		if (event.severity === "critical") {
			this.alertCriticalEvent(securityEvent);
		}
	}

	/**
	 * Track suspicious IP addresses
	 */
	private trackSuspiciousIP(ip: string, weight: number = 1): void {
		const current = this.suspiciousIPs.get(ip) || 0;
		this.suspiciousIPs.set(ip, current + weight);
	}

	/**
	 * Check if an IP should be blocked
	 */
	private checkForIPBlocking(ip: string): void {
		const suspicionLevel = this.suspiciousIPs.get(ip) || 0;

		// Block IP if it has too many suspicious activities
		if (suspicionLevel >= 10 && !this.blockedIPs.has(ip)) {
			this.blockIP(ip);
		}
	}

	/**
	 * Block an IP address
	 */
	private blockIP(ip: string): void {
		this.blockedIPs.add(ip);
		this.metrics.blocked_ips.add(ip);

		logger.error("IP Address Blocked", undefined, {
			blocked_ip: ip,
			suspicion_level: this.suspiciousIPs.get(ip),
			reason: "Excessive suspicious activity",
		});

		// In production, you would integrate with your firewall/CDN here
		// Example: Cloudflare API, AWS WAF, etc.
	}

	/**
	 * Check if an IP is blocked
	 */
	isIPBlocked(ip: string): boolean {
		return this.blockedIPs.has(ip);
	}

	/**
	 * Alert on critical security events
	 */
	private alertCriticalEvent(event: SecurityEvent): void {
		logger.error("CRITICAL SECURITY EVENT", undefined, {
			event_type: event.type,
			source_ip: event.source_ip,
			user_id: event.user_id,
			org_id: event.org_id,
			details: event.details,
		});

		// In production, send alerts via:
		// - Slack webhook
		// - Email
		// - PagerDuty
		// - SMS
	}

	/**
	 * Get current security metrics
	 */
	getMetrics(): SecurityMetrics {
		return { ...this.metrics };
	}

	/**
	 * Generate security report
	 */
	generateSecurityReport(): {
		summary: {
			total_events: number;
			critical_events: number;
			blocked_ips: number;
			top_threats: string[];
		};
		events_by_type: Record<string, number>;
		events_by_severity: Record<string, number>;
		top_source_ips: Array<{ ip: string; events: number }>;
	} {
		const events = this.metrics.last_24h_events;

		const eventsByType: Record<string, number> = {};
		const eventsBySeverity: Record<string, number> = {};
		const ipCounts: Record<string, number> = {};

		events.forEach((event) => {
			eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
			eventsBySeverity[event.severity] =
				(eventsBySeverity[event.severity] || 0) + 1;
			ipCounts[event.source_ip] = (ipCounts[event.source_ip] || 0) + 1;
		});

		const topSourceIPs = Object.entries(ipCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
			.map(([ip, events]) => ({ ip, events }));

		const criticalEvents = events.filter(
			(e) => e.severity === "critical"
		).length;

		return {
			summary: {
				total_events: events.length,
				critical_events: criticalEvents,
				blocked_ips: this.metrics.blocked_ips.size,
				top_threats: Object.keys(eventsByType).slice(0, 5),
			},
			events_by_type: eventsByType,
			events_by_severity: eventsBySeverity,
			top_source_ips: topSourceIPs,
		};
	}

	/**
	 * Reset metrics (useful for testing)
	 */
	resetMetrics(): void {
		this.metrics = {
			failed_auth_attempts: 0,
			rate_limit_violations: 0,
			suspicious_requests: 0,
			blocked_ips: new Set(),
			last_24h_events: [],
		};
		this.blockedIPs.clear();
		this.suspiciousIPs.clear();
	}
}

// Export singleton instance
export const securityAuditor = new SecurityAuditor();

// Helper functions for common security events
export function logAuthFailure(sourceIP: string, details: Record<string, any>) {
	securityAuditor.logSecurityEvent({
		type: "auth_failure",
		severity: "medium",
		source_ip: sourceIP,
		details,
	});
}

export function logRateLimitViolation(
	sourceIP: string,
	endpoint: string,
	details: Record<string, any>
) {
	securityAuditor.logSecurityEvent({
		type: "rate_limit",
		severity: "low",
		source_ip: sourceIP,
		details: { endpoint, ...details },
	});
}

export function logSuspiciousActivity(
	sourceIP: string,
	activity: string,
	details: Record<string, any>
) {
	securityAuditor.logSecurityEvent({
		type: "suspicious_activity",
		severity: "high",
		source_ip: sourceIP,
		details: { activity, ...details },
	});
}

export function logDataBreachAttempt(
	sourceIP: string,
	userId?: string,
	orgId?: string,
	details: Record<string, any>
) {
	securityAuditor.logSecurityEvent({
		type: "data_breach_attempt",
		severity: "critical",
		source_ip: sourceIP,
		user_id: userId,
		org_id: orgId,
		details,
	});
}

export function logPrivilegeEscalation(
	sourceIP: string,
	userId: string,
	orgId: string,
	details: Record<string, any>
) {
	securityAuditor.logSecurityEvent({
		type: "privilege_escalation",
		severity: "critical",
		source_ip: sourceIP,
		user_id: userId,
		org_id: orgId,
		details,
	});
}
