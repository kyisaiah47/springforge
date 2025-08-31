import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test-setup.ts"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/e2e/**", // Exclude Playwright tests
			"**/.{idea,git,cache,output,temp}/**",
		],
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
});
