import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createUniversalBlock } from "@/features/templates/types";
import BlockInspector from "./block-inspector";

vi.mock("./icon-picker", () => ({
  default: () => <input aria-label="Search icons" />,
}));

const callbacks = {
  selectedCount: 1,
  onChange: vi.fn(),
  onStyleChange: vi.fn(),
  onStack: vi.fn(),
};

describe("BlockInspector icon loading", () => {
  it("keeps the full icon picker behind the lazy boundary", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "components/dashboard/templates/block-inspector.tsx"),
      "utf8"
    );
    expect(source).toContain('from "./lazy-icon-picker"');
    expect(source).not.toContain('from "./icon-picker"');
  });

  it("loads the icon picker only for icon blocks", async () => {
    const textBlock = createUniversalBlock(0, 0, "text", 0);
    const iconBlock = createUniversalBlock(0, 0, "icon", 0);
    const { rerender } = render(
      <BlockInspector block={textBlock} {...callbacks} />
    );

    expect(screen.queryByLabelText("Search icons")).not.toBeInTheDocument();
    rerender(<BlockInspector block={iconBlock} {...callbacks} />);
    expect(await screen.findByLabelText("Search icons")).toBeInTheDocument();
  });
});
