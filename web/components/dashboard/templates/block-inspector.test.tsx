import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createUniversalBlock } from "@/features/templates/types";
import BlockInspector from "./block-inspector";

describe("BlockInspector spacer controls", () => {
  it("marks an existing spacer as legacy and allows conversion to Text", async () => {
    const user = userEvent.setup();
    render(
      <BlockInspector
        block={createUniversalBlock(0, 0, "spacer")}
        selectedCount={1}
        onChange={vi.fn()}
        onStyleChange={vi.fn()}
        onStack={vi.fn()}
      />
    );

    expect(screen.getByRole("option", { name: "Spacer (legacy)" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Divider" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Spacer" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Appearance/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.getByText("Padding")).toBeInTheDocument();
    expect(screen.queryByText("Text color")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Text" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Advanced/ }));
    expect(screen.getByText("Border width")).toBeInTheDocument();
    expect(screen.getByText("Corner radius")).toBeInTheDocument();
  });
});
