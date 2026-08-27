import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import MobileEditorActions from "./mobile-editor-actions";

describe("MobileEditorActions", () => {
  it("exposes pressed tool semantics and touch-safe actions", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<MobileEditorActions active="canvas" onSelect={onSelect} />);

    const toolbar = screen.getByRole("toolbar", { name: "Editor tools" });
    expect(toolbar).toBeInTheDocument();
    const canvas = screen.getByRole("button", { name: "Canvas" });
    expect(canvas).toHaveAttribute("aria-pressed", "true");
    expect(canvas).toHaveClass("min-h-11");

    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onSelect).toHaveBeenCalledWith("add");
  });
});
