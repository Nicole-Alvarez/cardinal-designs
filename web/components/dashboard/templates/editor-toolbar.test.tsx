import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EditorToolbar from "./editor-toolbar";

const baseProps = {
  title: "Member card",
  description: "Loyalty card",
  mode: "wysiwyg" as const,
  canUndo: false,
  canRedo: false,
  canSelectAll: true,
  allSelected: false,
  previewDataCount: 0,
  dirty: true,
  saving: false,
  savedAt: null,
  onTitleCommit: vi.fn(),
  onDescriptionChange: vi.fn(),
  onModeChange: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  onSelectAll: vi.fn(),
  onPreviewData: vi.fn(),
  onSettings: vi.fn(),
  onSave: vi.fn(),
};

describe("EditorToolbar", () => {
  it("keeps toolbar popovers above the editor canvas without clipping", () => {
    render(
      <EditorToolbar
        {...baseProps}
        canvasSelector={<button type="button">Canvas list</button>}
      />
    );

    const toolbar = screen.getByRole("toolbar", {
      name: "Template editor toolbar",
    });
    const header = toolbar.closest("header");
    expect(header).toHaveClass("sticky", "top-0", "z-40", "overflow-visible");
  });

  it("exposes document actions and one clear save status", () => {
    render(<EditorToolbar {...baseProps} />);

    expect(screen.getByRole("button", { name: "Save template" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Preview data" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Template settings" })).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
  });

  it.each([
    [{ saving: true }, "Saving…"],
    [{ dirty: false, savedAt: "2:30 PM" }, "Saved 2:30 PM"],
  ])("shows the current save state", (state, label) => {
    render(<EditorToolbar {...baseProps} {...state} />);
    expect(screen.getByRole("status")).toHaveTextContent(label);
  });
});
