import { describe, it, expect } from "vitest";
import * as React from "react";
import { render, screen } from "@/test-utils";
import { Button } from "../button";

describe("Button Component", () => {
	it("renders with default props", () => {
		render(<Button>Click me</Button>);

		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass("bg-primary");
	});

	it("renders with variant prop", () => {
		render(<Button variant="secondary">Secondary</Button>);

		const button = screen.getByRole("button", { name: /secondary/i });
		expect(button).toHaveClass("bg-secondary");
	});

	it("renders with size prop", () => {
		render(<Button size="sm">Small</Button>);

		const button = screen.getByRole("button", { name: /small/i });
		expect(button).toHaveClass("h-8"); // Small buttons have h-8 class
	});

	it("handles disabled state", () => {
		render(<Button disabled>Disabled</Button>);

		const button = screen.getByRole("button", { name: /disabled/i });
		expect(button).toBeDisabled();
		expect(button).toHaveClass("disabled:pointer-events-none");
	});

	it("renders as child component when asChild is true", () => {
		render(
			<Button asChild>
				<a href="/test">Link Button</a>
			</Button>
		);

		const link = screen.getByRole("link", { name: /link button/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/test");
	});
});
