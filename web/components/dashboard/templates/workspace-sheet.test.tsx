import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import WorkspaceSheet from "./workspace-sheet";

describe("WorkspaceSheet", () => {
  it("uses the shared dialog focus and Escape behavior", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <WorkspaceSheet open title="Add blocks" placement="bottom" onClose={onClose}>
        <button type="button">Add text</button>
      </WorkspaceSheet>
    );

    expect(screen.getByRole("dialog", { name: "Add blocks" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add text" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
