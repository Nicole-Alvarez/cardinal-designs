import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("uses the semantic primary and destructive variants", () => {
    const { rerender } = render(<Button variant="primary">Create template</Button>);
    expect(screen.getByRole("button", { name: "Create template" })).toHaveClass("bg-accent");

    rerender(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("bg-red-600");
  });
});
