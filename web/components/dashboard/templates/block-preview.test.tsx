import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createUniversalBlock } from "@/features/templates/types";
import BlockPreview from "./block-preview";

describe("BlockPreview", () => {
  it("renders the divider with the same current-color rule used by generated previews", () => {
    const { container } = render(
      <BlockPreview block={createUniversalBlock(0, 0, "divider")} />
    );

    const divider = container.querySelector("hr");
    expect(divider?.style.borderTop).toBe("1px solid");
    expect(divider).toHaveAttribute(
      "style",
      expect.stringContaining("border-color: currentcolor")
    );
    expect(divider).toHaveStyle({ margin: "0px", opacity: "0.2", width: "100%" });
    expect(divider).not.toHaveClass("border-zinc-300");
  });
});
