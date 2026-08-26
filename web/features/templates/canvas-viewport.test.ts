import { describe, expect, it } from "vitest";
import {
  clampCanvasPan,
  clampZoom,
  fitCanvasZoom,
  stepZoom,
  zoomPanOffset,
  zoomScrollOffset,
} from "./canvas-viewport";

describe("canvas viewport calculations", () => {
  it("clamps zoom to 25%–400%", () => {
    expect(clampZoom(0.1)).toBe(0.25);
    expect(clampZoom(5)).toBe(4);
  });

  it("steps through predictable zoom presets", () => {
    expect(stepZoom(1, 1)).toBe(1.25);
    expect(stepZoom(1, -1)).toBe(0.75);
  });

  it("fits both canvas dimensions inside the viewport", () => {
    expect(
      fitCanvasZoom(
        { width: 900, height: 600 },
        { width: 1000, height: 1000 },
        64
      )
    ).toBeCloseTo(0.472);
  });

  it("preserves an anchor while zooming", () => {
    expect(
      zoomScrollOffset({
        previousScale: 1,
        nextScale: 2,
        scrollLeft: 100,
        scrollTop: 50,
        anchorX: 200,
        anchorY: 100,
      })
    ).toEqual({ left: 400, top: 200 });
  });

  it("keeps at least 64 pixels of the canvas visible while panning", () => {
    expect(
      clampCanvasPan({
        offset: { x: 1000, y: -1000 },
        viewport: { width: 800, height: 600 },
        canvas: { width: 400, height: 240 },
        origin: { x: 200, y: 32 },
        minimumVisible: 64,
      })
    ).toEqual({ x: 536, y: -208 });
  });

  it("preserves the cursor anchor when zooming a translated canvas", () => {
    expect(
      zoomPanOffset({
        previousScale: 1,
        nextScale: 2,
        pan: { x: 30, y: 20 },
        anchor: { x: 200, y: 100 },
        previousOrigin: { x: 50, y: 40 },
        nextOrigin: { x: 20, y: 10 },
      })
    ).toEqual({ x: -60, y: 10 });
  });
});
