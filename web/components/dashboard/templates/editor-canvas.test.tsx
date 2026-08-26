import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CARDINAL_BLOCK_MIME } from "@/features/templates/drag-types";
import { DEFAULT_CANVAS } from "@/features/templates/types";
import EditorCanvas from "./editor-canvas";

let resizeObserverCallback: ResizeObserverCallback | undefined;

function canvasPan(element: HTMLElement) {
  const match = element.style.transform.match(
    /^translate3d\((-?[\d.]+)px, (-?[\d.]+)px, 0\)$/
  );
  if (!match) throw new Error(`Unexpected canvas transform: ${element.style.transform}`);
  return { x: Number(match[1]), y: Number(match[2]) };
}

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resizeObserverCallback = callback;
      }
      observe() {}
      disconnect() {}
    }
  );
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
});

describe("EditorCanvas drag-to-add", () => {
  it("accepts the shared block payload on an empty canvas and ignores unsupported drops", () => {
    const onAddAt = vi.fn();
    const props = {
      canvas: { ...DEFAULT_CANVAS, width: "400px", height: "240px" },
      blocks: [],
      selectedIds: [],
      onSelect: vi.fn(),
      onMove: vi.fn(),
      onResize: vi.fn(),
      onAddAt,
      onDelete: vi.fn(),
    };
    render(<EditorCanvas {...props} />);

    const dropLayer = screen.getByTestId("canvas-drop-layer");
    const values = new Map([[CARDINAL_BLOCK_MIME, "new"]]);
    fireEvent.drop(dropLayer, {
      clientX: 100,
      clientY: 80,
      dataTransfer: {
        types: [CARDINAL_BLOCK_MIME],
        getData: (type: string) => values.get(type) ?? "",
      },
    });
    expect(onAddAt).toHaveBeenCalledTimes(1);

    fireEvent.drop(dropLayer, {
      clientX: 100,
      clientY: 80,
      dataTransfer: { types: ["text/plain"], getData: () => "new" },
    });
    expect(onAddAt).toHaveBeenCalledTimes(1);
  });

  it("offers bounded zoom controls and returns to Fit mode", async () => {
    const user = userEvent.setup();
    render(
      <EditorCanvas
        canvas={{ ...DEFAULT_CANVAS, width: "400px", height: "240px" }}
        blocks={[]}
        selectedIds={[]}
        onSelect={vi.fn()}
        onMove={vi.fn()}
        onResize={vi.fn()}
        onAddAt={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const zoomOut = screen.getByRole("button", { name: "Zoom out" });
    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    const fit = screen.getByRole("button", { name: "Fit canvas" });
    const current = screen.getByLabelText("Current zoom");

    expect(zoomOut).toBeDisabled();
    expect(current).toHaveTextContent("25%");
    expect(fit).toHaveAttribute("aria-pressed", "true");

    for (let index = 0; index < 12; index += 1) await user.click(zoomIn);
    expect(current).toHaveTextContent("400%");
    expect(zoomIn).toBeDisabled();
    expect(fit).toHaveAttribute("aria-pressed", "false");

    await user.click(fit);
    expect(current).toHaveTextContent("25%");
    expect(fit).toHaveAttribute("aria-pressed", "true");
  });

  it("leaves normal wheel scrolling alone and supports modifier zoom and middle-button pan", async () => {
    render(
      <EditorCanvas
        canvas={{ ...DEFAULT_CANVAS, width: "400px", height: "240px" }}
        blocks={[]}
        selectedIds={[]}
        onSelect={vi.fn()}
        onMove={vi.fn()}
        onResize={vi.fn()}
        onAddAt={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const viewport = screen.getByTestId("canvas-viewport");
    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 800 });
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 600 });
    const panLayer = screen.getByTestId("canvas-pan-layer");
    const current = screen.getByLabelText("Current zoom");
    expect(fireEvent.wheel(viewport, { deltaY: -200 })).toBe(true);
    expect(current).toHaveTextContent("25%");

    expect(
      fireEvent.wheel(viewport, { clientX: 20, clientY: 20, ctrlKey: true, deltaY: -200 })
    ).toBe(false);
    expect(current).not.toHaveTextContent("25%");
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const beforePan = canvasPan(panLayer);
    fireEvent.pointerDown(viewport, {
      button: 1,
      pointerId: 7,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, { pointerId: 7, clientX: 70, clientY: 75 });
    const afterPan = canvasPan(panLayer);
    expect(afterPan.x).toBeCloseTo(beforePan.x - 30);
    expect(afterPan.y).toBeCloseTo(beforePan.y - 25);
    fireEvent.pointerUp(viewport, { pointerId: 7 });
  });

  it("does not claim the Space key for canvas navigation", () => {
    render(
      <EditorCanvas
        canvas={{ ...DEFAULT_CANVAS, width: "400px", height: "240px" }}
        blocks={[]}
        selectedIds={[]}
        onSelect={vi.fn()}
        onMove={vi.fn()}
        onResize={vi.fn()}
        onAddAt={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(fireEvent.keyDown(window, { code: "Space" })).toBe(true);
  });

  it("pans with the secondary button and stops on release or cancellation", () => {
    render(
      <EditorCanvas
        canvas={{ ...DEFAULT_CANVAS, width: "400px", height: "240px" }}
        blocks={[]}
        selectedIds={[]}
        onSelect={vi.fn()}
        onMove={vi.fn()}
        onResize={vi.fn()}
        onAddAt={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const viewport = screen.getByTestId("canvas-viewport");
    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 800 });
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 600 });
    const panLayer = screen.getByTestId("canvas-pan-layer");

    fireEvent.pointerDown(viewport, {
      button: 2,
      pointerId: 8,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, { pointerId: 8, clientX: 70, clientY: 75 });
    expect(panLayer).toHaveStyle({ transform: "translate3d(-30px, -25px, 0)" });

    fireEvent.pointerUp(viewport, { pointerId: 8 });
    fireEvent.pointerMove(viewport, { pointerId: 8, clientX: 40, clientY: 40 });
    expect(panLayer).toHaveStyle({ transform: "translate3d(-30px, -25px, 0)" });

    fireEvent.pointerDown(viewport, {
      button: 2,
      pointerId: 9,
      clientX: 70,
      clientY: 75,
    });
    fireEvent.pointerCancel(viewport, { pointerId: 9 });
    fireEvent.pointerMove(viewport, { pointerId: 9, clientX: 20, clientY: 20 });
    expect(panLayer).toHaveStyle({ transform: "translate3d(-30px, -25px, 0)" });
  });

  it("moves the canvas itself when secondary-dragging at Fit zoom", () => {
    render(
      <EditorCanvas
        canvas={{ ...DEFAULT_CANVAS, width: "400px", height: "240px" }}
        blocks={[]}
        selectedIds={[]}
        onSelect={vi.fn()}
        onMove={vi.fn()}
        onResize={vi.fn()}
        onAddAt={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const viewport = screen.getByTestId("canvas-viewport");
    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 800 });
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 600 });
    const panLayer = screen.queryByTestId("canvas-pan-layer");
    expect(panLayer).not.toBeNull();
    if (!panLayer) return;

    fireEvent.pointerDown(viewport, {
      button: 2,
      pointerId: 11,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, { pointerId: 11, clientX: 130, clientY: 125 });

    expect(panLayer).toHaveStyle({ transform: "translate3d(30px, 25px, 0)" });
  });

  it("recenters a translated canvas when Fit is pressed", () => {
    render(
      <EditorCanvas
        canvas={{ ...DEFAULT_CANVAS, width: "400px", height: "240px" }}
        blocks={[]}
        selectedIds={[]}
        onSelect={vi.fn()}
        onMove={vi.fn()}
        onResize={vi.fn()}
        onAddAt={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const viewport = screen.getByTestId("canvas-viewport");
    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 800 });
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 600 });
    const panLayer = screen.getByTestId("canvas-pan-layer");

    fireEvent.pointerDown(viewport, {
      button: 2,
      pointerId: 12,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, { pointerId: 12, clientX: 130, clientY: 125 });
    expect(panLayer).toHaveStyle({ transform: "translate3d(30px, 25px, 0)" });

    fireEvent.click(screen.getByRole("button", { name: "Fit canvas" }));
    expect(panLayer).toHaveStyle({ transform: "translate3d(0px, 0px, 0)" });
  });

  it("reclamps a translated canvas when the viewport becomes smaller", () => {
    render(
      <EditorCanvas
        canvas={{ ...DEFAULT_CANVAS, width: "400px", height: "240px" }}
        blocks={[]}
        selectedIds={[]}
        onSelect={vi.fn()}
        onMove={vi.fn()}
        onResize={vi.fn()}
        onAddAt={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const viewport = screen.getByTestId("canvas-viewport");
    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 800 });
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 600 });
    const panLayer = screen.getByTestId("canvas-pan-layer");

    fireEvent.pointerDown(viewport, {
      button: 2,
      pointerId: 13,
      clientX: 0,
      clientY: 0,
    });
    fireEvent.pointerMove(viewport, { pointerId: 13, clientX: 2000, clientY: 2000 });
    expect(panLayer).toHaveStyle({ transform: "translate3d(386px, 508px, 0)" });

    Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 300 });
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 200 });
    act(() => resizeObserverCallback?.([], {} as ResizeObserver));

    expect(panLayer).toHaveStyle({ transform: "translate3d(136px, 108px, 0)" });
  });

  it("suppresses the context menu and starts secondary panning only inside the canvas viewport", () => {
    render(
      <EditorCanvas
        canvas={{ ...DEFAULT_CANVAS, width: "400px", height: "240px" }}
        blocks={[]}
        selectedIds={[]}
        onSelect={vi.fn()}
        onMove={vi.fn()}
        onResize={vi.fn()}
        onAddAt={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const viewport = screen.getByTestId("canvas-viewport");
    const panLayer = screen.getByTestId("canvas-pan-layer");

    fireEvent.pointerDown(document.body, {
      button: 2,
      pointerId: 10,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, { pointerId: 10, clientX: 70, clientY: 75 });
    expect(panLayer).toHaveStyle({ transform: "translate3d(0px, 0px, 0)" });

    expect(fireEvent.contextMenu(viewport)).toBe(false);
    expect(fireEvent.contextMenu(document.body)).toBe(true);
  });
});
