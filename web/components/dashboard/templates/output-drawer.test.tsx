import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import OutputDrawer from "./output-drawer";

describe("OutputDrawer", () => {
  it("requests opening before exposing generated output", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <OutputDrawer
        open={false}
        onOpenChange={onOpenChange}
        title="Preview and export"
      >
        <p>Generated output</p>
      </OutputDrawer>
    );

    expect(screen.queryByText("Generated output")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Open preview and export" })
    );
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("renders a labelled region when expanded", () => {
    render(
      <OutputDrawer open onOpenChange={vi.fn()} title="Preview and export">
        <p>Generated output</p>
      </OutputDrawer>
    );

    expect(screen.getByRole("region", { name: "Preview and export" })).toBeVisible();
    expect(screen.getByText("Generated output")).toBeVisible();
  });
});
