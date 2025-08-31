"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HealthStatus {
	status: "healthy" | "degraded" | "unhealthy";
	timestamp: string;
	services: {
		database: ServiceHealth;
		github: ServiceHealth;
		slack: ServiceHealth;
	};
	version: string;
	uptime: number;
}

interface ServiceHealth {
	status: "up" | "down" | "degraded";
	responseTime?: number;
	error?: string;
}

export function HealthStatus() {
	const [health, setHealth] = useState<HealthStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchHealth = async () => {
		try {
			const response = await fetch("/api/health");
			const data = await response.json();
			setHealth(data);
			setError(null);
		} catch {
			setError("Failed to fetch health status");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchHealth();
		const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
		return () => clearInterval(interval);
	}, []);

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>System Health</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="animate-pulse">Loading...</div>
				</CardContent>
			</Card>
		);
	}

	if (error || !health) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>System Health</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-red-600">
						{error || "Failed to load health status"}
					</div>
				</CardContent>
			</Card>
		);
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case "healthy":
			case "up":
				return "text-green-600";
			case "degraded":
				return "text-yellow-600";
			case "unhealthy":
			case "down":
				return "text-red-600";
			default:
				return "text-gray-600";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "healthy":
			case "up":
				return "●";
			case "degraded":
				return "◐";
			case "unhealthy":
			case "down":
				return "●";
			default:
				return "○";
		}
	};

	const formatUptime = (ms: number) => {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ${hours % 24}h`;
		if (hours > 0) return `${hours}h ${minutes % 60}m`;
		if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
		return `${seconds}s`;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<span className={getStatusColor(health.status)}>
						{getStatusIcon(health.status)}
					</span>
					System Health
					<span
						className={`text-sm font-normal ${getStatusColor(health.status)}`}
					>
						{health.status}
					</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{Object.entries(health.services).map(([service, serviceHealth]) => (
						<div
							key={service}
							className="flex items-center justify-between p-2 border rounded"
						>
							<div className="flex items-center gap-2">
								<span className={getStatusColor(serviceHealth.status)}>
									{getStatusIcon(serviceHealth.status)}
								</span>
								<span className="capitalize">{service}</span>
							</div>
							<div className="text-sm text-gray-500">
								{serviceHealth.responseTime && (
									<span>{serviceHealth.responseTime}ms</span>
								)}
								{serviceHealth.error && (
									<span
										className="text-red-500"
										title={serviceHealth.error}
									>
										Error
									</span>
								)}
							</div>
						</div>
					))}
				</div>

				<div className="flex justify-between text-sm text-gray-500">
					<span>Uptime: {formatUptime(health.uptime)}</span>
					<span>Version: {health.version}</span>
				</div>

				<div className="text-xs text-gray-400">
					Last updated: {new Date(health.timestamp).toLocaleString()}
				</div>
			</CardContent>
		</Card>
	);
}
