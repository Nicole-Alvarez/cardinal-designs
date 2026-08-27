import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CANVAS } from "../types";

const queries = vi.hoisted(() => ({
  getTemplate: vi.fn(),
  updateTemplate: vi.fn(),
}));
const canvasQueries = vi.hoisted(() => ({
  listCanvases: vi.fn(),
  getCanvas: vi.fn(),
  createCanvas: vi.fn(),
  updateCanvas: vi.fn(),
  deleteCanvas: vi.fn(),
}));

vi.mock("../queries", () => queries);
vi.mock("../canvas-queries", () => canvasQueries);
vi.mock("@/components/dashboard/templates/editor-canvas", () => ({
  default: ({ blocks }: { blocks: { type: string }[] }) => (
    <div>Canvas blocks: {blocks.map((block) => block.type).join(", ") || "none"}</div>
  ),
}));
vi.mock("@/components/dashboard/templates/editor-commands", () => ({
  default: ({ onAdd }: { onAdd: (type: "image") => void }) => (
    <button type="button" onClick={() => onAdd("image")}>Add image</button>
  ),
}));
vi.mock("@/components/dashboard/templates/canvas-panel", () => ({
  default: () => <div>Canvas panel</div>,
}));
vi.mock("@/components/dashboard/templates/block-inspector", () => ({
  default: ({ block }: { block: { type: string } | null }) => (
    <div>{block ? `Selected block: ${block.type}` : "No selected block"}</div>
  ),
}));
vi.mock("@/components/dashboard/templates/code-editor-panel", () => ({
  default: ({ lang }: { lang: string }) => <div>Code editor language: {lang}</div>,
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
  beforeEach(() => {
    queries.getTemplate.mockReset();
    canvasQueries.listCanvases.mockReset().mockResolvedValue([]);
  });

  it("uses accessible text-only Add, Canvas, and Block tabs", async () => {
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

    const commands = await screen.findByRole("tab", { name: "Add" });
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

  it("shows a terminal retry state when the template cannot load", async () => {
    queries.getTemplate
      .mockRejectedValueOnce(new Error("Template could not be loaded."))
      .mockResolvedValueOnce({
        id: "template-a",
        title: "Recovered template",
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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Template could not be loaded."
    );
    expect(screen.queryByRole("toolbar", { name: "Template editor toolbar" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByDisplayValue("Recovered template")).toBeInTheDocument();
  });

  it("creates the requested block type, selects it, and records one undo step", async () => {
    queries.getTemplate.mockResolvedValue({
      id: "template-a",
      title: "Member Card",
      description: "",
      isPrivate: true,
      isCode: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const user = userEvent.setup();
    render(<TemplateEditorPage templateId="template-a" />);

    await user.click(await screen.findByRole("tab", { name: "Add" }));
    const undo = screen.getByRole("button", { name: "Undo" });
    expect(undo).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Add image" }));

    expect(screen.getByText("Canvas blocks: image")).toBeInTheDocument();
    expect(screen.getByText("Selected block: image")).toBeInTheDocument();
    expect(undo).toBeEnabled();
  });

  it("falls back to HTML when a saved code canvas only contains Angular", async () => {
    queries.getTemplate.mockResolvedValue({
      id: "template-a",
      title: "Member Card",
      description: "",
      isPrivate: true,
      isCode: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    canvasQueries.listCanvases.mockResolvedValue([
      {
        id: "canvas-a",
        title: "Front",
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    canvasQueries.getCanvas.mockResolvedValue({
      id: "canvas-a",
      title: "Front",
      position: 0,
      content: { version: 4, canvas: DEFAULT_CANVAS, blocks: [], metadata: [] },
      html: "",
      react: "",
      angular: "export class Card {}",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<TemplateEditorPage templateId="template-a" />);

    expect(await screen.findByText("Code editor language: html")).toBeInTheDocument();
  });
});
