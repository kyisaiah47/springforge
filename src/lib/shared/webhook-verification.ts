import * as crypto from "crypto";
import { APIErrors } from "./api-error";

/**
 * Safe timing comparison that handles different length buffers
 */
function safeTimingEqual(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}

	try {
		return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
	} catch (error) {
		return false;
	}
}

/**
 * GitHub webhook signature verification
 */
export class GitHubWebhookVerifier {
	private readonly secret: string;

	constructor(secret: string) {
		if (!secret) {
			throw new Error("GitHub webhook secret is required");
		}
		this.secret = secret;
	}

	/**
	 * Verify GitHub webhook signature using HMAC-SHA256
	 */
	verify(payload: string, signature: string): boolean {
		if (!signature) {
			return false;
		}

		// GitHub sends signature as "sha256=<hash>"
		if (!signature.startsWith("sha256=")) {
			return false;
		}

		const expectedSignature = signature.substring(7);
		const computedSignature = crypto
			.createHmac("sha256", this.secret)
			.update(payload, "utf8")
			.digest("hex");

		// Use timing-safe comparison to prevent timing attacks
		return safeTimingEqual(expectedSignature, computedSignature);
	}

	/**
	 * Verify GitHub webhook request
	 */
	verifyRequest(body: string, headers: Headers): void {
		const signature = headers.get("x-hub-signature-256");

		if (!signature) {
			throw APIErrors.webhookVerification("Missing GitHub webhook signature");
		}

		if (!this.verify(body, signature)) {
			throw APIErrors.webhookVerification("Invalid GitHub webhook signature");
		}
	}
}

/**
 * Slack webhook signature verification
 */
export class SlackWebhookVerifier {
	private readonly signingSecret: string;

	constructor(signingSecret: string) {
		if (!signingSecret) {
			throw new Error("Slack signing secret is required");
		}
		this.signingSecret = signingSecret;
	}

	/**
	 * Verify Slack webhook signature using HMAC-SHA256
	 */
	verify(timestamp: string, body: string, signature: string): boolean {
		if (!signature || !timestamp) {
			return false;
		}

		// Check timestamp to prevent replay attacks (within 5 minutes)
		const currentTime = Math.floor(Date.now() / 1000);
		const requestTime = parseInt(timestamp, 10);

		if (Math.abs(currentTime - requestTime) > 300) {
			return false; // Request is older than 5 minutes
		}

		// Slack sends signature as "v0=<hash>"
		if (!signature.startsWith("v0=")) {
			return false;
		}

		const expectedSignature = signature.substring(3);
		const baseString = `v0:${timestamp}:${body}`;
		const computedSignature = crypto
			.createHmac("sha256", this.signingSecret)
			.update(baseString, "utf8")
			.digest("hex");

		// Use timing-safe comparison to prevent timing attacks
		return safeTimingEqual(expectedSignature, computedSignature);
	}

	/**
	 * Verify Slack webhook request
	 */
	verifyRequest(body: string, headers: Headers): void {
		const signature = headers.get("x-slack-signature");
		const timestamp = headers.get("x-slack-request-timestamp");

		if (!signature || !timestamp) {
			throw APIErrors.webhookVerification(
				"Missing Slack webhook signature or timestamp"
			);
		}

		if (!this.verify(timestamp, body, signature)) {
			throw APIErrors.webhookVerification("Invalid Slack webhook signature");
		}
	}
}

/**
 * Generic webhook signature verification
 */
export class GenericWebhookVerifier {
	private readonly secret: string;
	private readonly algorithm: string;

	constructor(secret: string, algorithm: string = "sha256") {
		if (!secret) {
			throw new Error("Webhook secret is required");
		}
		this.secret = secret;
		this.algorithm = algorithm;
	}

	/**
	 * Verify generic webhook signature
	 */
	verify(payload: string, signature: string): boolean {
		if (!signature) {
			return false;
		}

		const computedSignature = crypto
			.createHmac(this.algorithm, this.secret)
			.update(payload, "utf8")
			.digest("hex");

		// Handle different signature formats
		let expectedSignature = signature;
		if (signature.includes("=")) {
			expectedSignature = signature.split("=")[1];
		}

		// Use timing-safe comparison to prevent timing attacks
		return safeTimingEqual(expectedSignature, computedSignature);
	}
}

/**
 * Webhook verification factory
 */
export class WebhookVerificationFactory {
	/**
	 * Create GitHub webhook verifier
	 */
	static createGitHubVerifier(): GitHubWebhookVerifier {
		const secret = process.env.GITHUB_WEBHOOK_SECRET;
		if (!secret) {
			throw new Error("GITHUB_WEBHOOK_SECRET environment variable is required");
		}
		return new GitHubWebhookVerifier(secret);
	}

	/**
	 * Create Slack webhook verifier
	 */
	static createSlackVerifier(): SlackWebhookVerifier {
		const secret = process.env.SLACK_SIGNING_SECRET;
		if (!secret) {
			throw new Error("SLACK_SIGNING_SECRET environment variable is required");
		}
		return new SlackWebhookVerifier(secret);
	}

	/**
	 * Create generic webhook verifier
	 */
	static createGenericVerifier(
		secret: string,
		algorithm?: string
	): GenericWebhookVerifier {
		return new GenericWebhookVerifier(secret, algorithm);
	}
}

/**
 * Utility function to extract raw body from Next.js request
 */
export async function getRawBody(req: Request): Promise<string> {
	const chunks: Uint8Array[] = [];
	const reader = req.body?.getReader();

	if (!reader) {
		return "";
	}

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}

	const buffer = new Uint8Array(
		chunks.reduce((acc, chunk) => acc + chunk.length, 0)
	);
	let offset = 0;

	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.length;
	}

	return new TextDecoder().decode(buffer);
}

/**
 * Middleware for webhook signature verification
 */
export function withWebhookVerification(
	handler: (req: Request, body: string) => Promise<Response>,
	verifierType:
		| "github"
		| "slack"
		| ((secret: string) => GenericWebhookVerifier)
) {
	return async (req: Request): Promise<Response> => {
		try {
			const body = await getRawBody(req);

			// Verify signature based on type
			if (verifierType === "github") {
				const verifier = WebhookVerificationFactory.createGitHubVerifier();
				verifier.verifyRequest(body, req.headers);
			} else if (verifierType === "slack") {
				const verifier = WebhookVerificationFactory.createSlackVerifier();
				verifier.verifyRequest(body, req.headers);
			} else if (typeof verifierType === "function") {
				const secret = process.env.WEBHOOK_SECRET || "";
				const verifier = verifierType(secret);
				const signature =
					req.headers.get("x-signature") || req.headers.get("signature") || "";

				if (!verifier.verify(body, signature)) {
					throw APIErrors.webhookVerification("Invalid webhook signature");
				}
			}

			return await handler(req, body);
		} catch (error) {
			console.error("Webhook verification error:", error);

			if (error instanceof Error && error.message.includes("webhook")) {
				throw error;
			}

			throw APIErrors.webhookVerification("Webhook verification failed");
		}
	};
}
