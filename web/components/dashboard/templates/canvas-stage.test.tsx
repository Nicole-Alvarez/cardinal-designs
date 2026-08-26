import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CanvasStage from "./canvas-stage";
import { DEFAULT_CANVAS } from "@/features/templates/types";

describe("CanvasStage", () => {
  it("clips visual content while allowing interaction chrome to overflow", () => {
    render(
      <CanvasStage
        canvas={{ ...DEFAULT_CANVAS, width: "400px", height: "240px" }}
        content={<span>visual content</span>}
        interaction={<span>selection chrome</span>}
      />
    );

    expect(screen.getByTestId("canvas-content-clip")).toHaveStyle({ overflow: "hidden" });
    expect(screen.getByTestId("canvas-interaction-layer")).toHaveStyle({ overflow: "visible" });
    expect(screen.getByText("visual content")).toBeInTheDocument();
    expect(screen.getByText("selection chrome")).toBeInTheDocument();
  });
});
