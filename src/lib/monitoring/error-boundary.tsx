"use client";

import React from "react";
import { trackError } from "./logger";

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		trackError(error, {
			component: "ErrorBoundary",
			errorInfo: {
				componentStack: errorInfo.componentStack,
			},
		});
	}

	render() {
		if (this.state.hasError && this.state.error) {
			const FallbackComponent = this.props.fallback || DefaultErrorFallback;

			return (
				<FallbackComponent
					error={this.state.error}
					reset={() => this.setState({ hasError: false, error: undefined })}
				/>
			);
		}

		return this.props.children;
	}
}

function DefaultErrorFallback({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	const errorId = `err_${Date.now()}_${Math.random()
		.toString(36)
		.substr(2, 9)}`;

	const reloadPage = () => {
		window.location.reload();
	};

	const goHome = () => {
		window.location.href = "/dashboard";
	};

	const reportError = () => {
		const subject = encodeURIComponent(`Error Report - ${errorId}`);
		const body = encodeURIComponent(
			`Error ID: ${errorId}\n` +
				`Error: ${error.message}\n` +
				`URL: ${window.location.href}\n` +
				`Time: ${new Date().toISOString()}\n\n` +
				`Please describe what you were doing when this error occurred:`
		);
		window.open(
			`mailto:support@sprintforge.dev?subject=${subject}&body=${body}`
		);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
			<div className="max-w-lg w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
				<div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full">
					<svg
						className="w-6 h-6 text-red-600 dark:text-red-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>

				<div className="mt-4 text-center">
					<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
						Oops! Something went wrong
					</h3>
					<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
						We encountered an unexpected error. Don't worry, our team has been
						notified.
					</p>

					{process.env.NODE_ENV === "development" && (
						<details className="mt-4 text-left">
							<summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
								Error Details (Development)
							</summary>
							<div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded overflow-auto">
								<div>
									<strong>Error ID:</strong> {errorId}
								</div>
								<div>
									<strong>Message:</strong> {error.message}
								</div>
								{error.stack && (
									<pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
								)}
							</div>
						</details>
					)}

					<div className="mt-6 space-y-3">
						<div className="flex flex-col sm:flex-row gap-3">
							<button
								onClick={reset}
								className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								Try Again
							</button>

							<button
								onClick={reloadPage}
								className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								Reload Page
							</button>
						</div>

						<div className="flex flex-col sm:flex-row gap-3">
							<button
								onClick={goHome}
								className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
									/>
								</svg>
								Go Home
							</button>

							<button
								onClick={reportError}
								className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
									/>
								</svg>
								Report Issue
							</button>
						</div>
					</div>

					<p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
						Error ID: {errorId}
					</p>
				</div>
			</div>
		</div>
	);
}
