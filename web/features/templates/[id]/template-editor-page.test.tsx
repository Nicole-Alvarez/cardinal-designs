import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CANVAS } from "../types";

const queries = vi.hoisted(() => ({
  getTemplate: vi.fn(),
  updateTemplate: vi.fn(),
}));

vi.mock("../queries", () => queries);
vi.mock("@/components/dashboard/templates/editor-canvas", () => ({
  default: () => <div>Canvas stub</div>,
}));
vi.mock("@/components/dashboard/templates/editor-commands", () => ({
  default: () => <div>Commands panel</div>,
}));
vi.mock("@/components/dashboard/templates/canvas-panel", () => ({
  default: () => <div>Canvas panel</div>,
}));
vi.mock("@/components/dashboard/templates/block-inspector", () => ({
  default: () => <div>Block panel</div>,
}));
vi.mock("@/components/dashboard/templates/code-editor-panel", () => ({
  default: () => <div>Code editor</div>,
}));
vi.mock("@/components/dashboard/templates/code-output", () => ({
  default: () => <div>Code output</div>,
}));
vi.mock("@/components/dashboard/templates/metadata-dialog", () => ({
  default: () => null,
}));
vi.mock("@/components/dashboard/templates/template-editor-footer", () => ({
  default: () => <footer>Editor footer</footer>,
}));

import TemplateEditorPage from "./template-editor-page";

describe("TemplateEditorPage panel tabs", () => {
  it("uses accessible text-only Commands, Canvas, and Block tabs", async () => {
    queries.getTemplate.mockResolvedValue({
      id: "template-a",
      title: "Member Card",
      description: "",
      content: { version: 4, canvas: DEFAULT_CANVAS, blocks: [], metadata: [] },
      html: "",
      react: "",
      angular: "",
      isCode: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const user = userEvent.setup();
    render(<TemplateEditorPage templateId="template-a" />);

    const commands = await screen.findByRole("tab", { name: "Commands" });
    const canvas = screen.getByRole("tab", { name: "Canvas" });
    const block = screen.getByRole("tab", { name: "Block" });

    expect(commands.querySelector("svg")).toBeNull();
    expect(canvas.querySelector("svg")).toBeNull();
    expect(block.querySelector("svg")).toBeNull();

    await user.click(commands);
    expect(commands).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "aria-labelledby",
      "editor-tab-commands"
    );
  });
});
