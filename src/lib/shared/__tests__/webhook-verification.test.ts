import { describe, it, expect, beforeEach } from "vitest";
import * as crypto from "crypto";
import {
	GitHubWebhookVerifier,
	SlackWebhookVerifier,
} from "../webhook-verification";

describe("Webhook Verification", () => {
	const testSecret = "test-secret-key";

	describe("GitHubWebhookVerifier", () => {
		let verifier: GitHubWebhookVerifier;

		beforeEach(() => {
			verifier = new GitHubWebhookVerifier(testSecret);
		});

		it("should verify valid GitHub webhook signature", () => {
			const payload = '{"test": "data"}';
			const signature =
				"sha256=" +
				crypto
					.createHmac("sha256", testSecret)
					.update(payload, "utf8")
					.digest("hex");

			const isValid = verifier.verify(payload, signature);
			expect(isValid).toBe(true);
		});

		it("should reject invalid GitHub webhook signature", () => {
			const payload = '{"test": "data"}';
			const invalidSignature = "sha256=invalid-signature";

			const isValid = verifier.verify(payload, invalidSignature);
			expect(isValid).toBe(false);
		});

		it("should reject signature without sha256 prefix", () => {
			const payload = '{"test": "data"}';
			const signature = crypto
				.createHmac("sha256", testSecret)
				.update(payload, "utf8")
				.digest("hex");

			const isValid = verifier.verify(payload, signature);
			expect(isValid).toBe(false);
		});
	});

	describe("SlackWebhookVerifier", () => {
		let verifier: SlackWebhookVerifier;

		beforeEach(() => {
			verifier = new SlackWebhookVerifier(testSecret);
		});

		it("should verify valid Slack webhook signature", () => {
			const timestamp = Math.floor(Date.now() / 1000).toString();
			const body = "test=data&token=abc123";
			const baseString = `v0:${timestamp}:${body}`;
			const signature =
				"v0=" +
				crypto
					.createHmac("sha256", testSecret)
					.update(baseString, "utf8")
					.digest("hex");

			const isValid = verifier.verify(timestamp, body, signature);
			expect(isValid).toBe(true);
		});

		it("should reject old timestamp (replay attack protection)", () => {
			const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString(); // 400 seconds ago
			const body = "test=data&token=abc123";
			const baseString = `v0:${oldTimestamp}:${body}`;
			const signature =
				"v0=" +
				crypto
					.createHmac("sha256", testSecret)
					.update(baseString, "utf8")
					.digest("hex");

			const isValid = verifier.verify(oldTimestamp, body, signature);
			expect(isValid).toBe(false);
		});

		it("should reject invalid Slack webhook signature", () => {
			const timestamp = Math.floor(Date.now() / 1000).toString();
			const body = "test=data&token=abc123";
			const invalidSignature = "v0=invalid-signature";

			const isValid = verifier.verify(timestamp, body, invalidSignature);
			expect(isValid).toBe(false);
		});
	});
});
