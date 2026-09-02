import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CANVAS } from "@/features/templates/types";

const queries = vi.hoisted(() => ({ createAiLayout: vi.fn(), createAiReferenceLayout: vi.fn() }));
vi.mock("@/features/templates/queries", () => queries);

import AiCreateDialog from "./ai-create-dialog";

describe("AiCreateDialog", () => {
  it("keeps the prompt focused while the user types", async () => {
    const user = userEvent.setup();
    render(<AiCreateDialog open canvas={DEFAULT_CANVAS} onClose={vi.fn()} onApply={vi.fn()} />);

    const prompt = screen.getByLabelText("Describe the card you want to create");
    await user.click(prompt);
    await user.type(prompt, "A member card");

    expect(prompt).toHaveFocus();
    expect(prompt).toHaveValue("A member card");
  });

  it("keeps generated content temporary until the user applies it", async () => {
    queries.createAiLayout.mockResolvedValue({
      version: 4,
      canvas: DEFAULT_CANVAS,
      metadata: [],
      blocks: [{ id: "ai-block", type: "text", x: 0, y: 0, width: 100, height: 40, z: 0, text: "Welcome", style: { color: "inherit", backgroundColor: "transparent", fontSize: 16, fontWeight: 400, textAlign: "left", padding: 8, borderWidth: 0, borderColor: "#d4d4d8", borderRadius: 0 } }],
    });
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(<AiCreateDialog open canvas={DEFAULT_CANVAS} onClose={vi.fn()} onApply={onApply} />);

    await user.type(screen.getByLabelText("Describe the card you want to create"), "A welcome card");
    await user.click(screen.getByRole("button", { name: "Generate layout" }));

    expect(await screen.findByText("1 editable block generated")).toBeInTheDocument();
    expect(screen.getByLabelText("Preview generated layout")).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Apply layout" }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ blocks: expect.arrayContaining([expect.objectContaining({ text: "Welcome" })]) }));
  });

  it("rejects unsupported reference files before creating an AI request", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<AiCreateDialog open canvas={DEFAULT_CANVAS} onClose={vi.fn()} onApply={vi.fn()} />);

    await user.upload(screen.getByLabelText("Upload reference image"), new File(["not an image"], "reference.gif", { type: "image/gif" }));

    expect(screen.getByRole("alert")).toHaveTextContent("PNG, JPEG, or WebP");
    expect(queries.createAiReferenceLayout).not.toHaveBeenCalled();
  });

  it("preserves the visible prompt while generation is in progress", async () => {
    let finish!: (value: unknown) => void;
    queries.createAiLayout.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    render(<AiCreateDialog open canvas={DEFAULT_CANVAS} onClose={vi.fn()} onApply={vi.fn()} />);

    const prompt = screen.getByLabelText("Describe the card you want to create");
    await user.type(prompt, "Gold member card");
    expect(prompt).toHaveValue("Gold member card");

    await user.click(screen.getByRole("button", { name: "Generate layout" }));
    expect(queries.createAiLayout).toHaveBeenCalledWith("Gold member card", DEFAULT_CANVAS);
    expect(prompt).toHaveValue("Gold member card");
    expect(screen.queryByRole("button", { name: "Low generation mode" })).not.toBeInTheDocument();
    finish({ version: 4, canvas: DEFAULT_CANVAS, metadata: [], blocks: [] });
  });
});
