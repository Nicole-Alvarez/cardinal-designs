# Canvas Workspace and Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add intuitive zoom and pan, keep selected off-canvas block chrome visible while clipping content, repair empty-canvas drag-to-add, and make the desktop editor fill the viewport.

**Architecture:** Keep template coordinates unchanged and introduce local viewport state around the existing canvas. Split visual content from interaction chrome, use the scroll container for panning, and let the central flex layout—not fixed viewport constants—allocate editor height.

**Tech Stack:** React 19, TypeScript, Pointer Events, HTML Drag and Drop, Vitest, Testing Library, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-08-26-template-editor-workspace-design.md`

## Global Constraints

- Zoom range is 25%–400%; Fit is the initial mode.
- Zoom and pan never enter template data, history, saves, code output, or exports.
- Block content remains clipped to the canvas; selection chrome may overflow.
- Block geometry remains unrestricted and is not clamped.
- Unsupported drag payloads do nothing.
- Desktop fills remaining viewport space; mobile remains document flow.
- Remove icons only from Commands, Canvas, and Block tab titles.
- Do not commit unless the user explicitly authorizes a Git commit.

---

### Task 1: Specify and implement pure canvas-view calculations

**Files:**
- Create: `web/features/templates/canvas-viewport.ts`
- Create: `web/features/templates/canvas-viewport.test.ts`

**Interfaces:**
- Produces:
  - `MIN_ZOOM = 0.25`
  - `MAX_ZOOM = 4`
  - `clampZoom(value: number): number`
  - `stepZoom(value: number, direction: -1 | 1): number`
  - `fitCanvasZoom(viewport, canvas, padding): number`
  - `zoomScrollOffset(input): { left: number; top: number }`

- [ ] **Step 1: Write failing calculation tests**

Create tests with exact expectations:

```ts
import { describe, expect, it } from "vitest";
import {
  clampZoom,
  fitCanvasZoom,
  stepZoom,
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
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run:

```bash
cd web && yarn test features/templates/canvas-viewport.test.ts
```

Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement the pure helpers**

Use these presets and formulas:

```ts
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
export const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const;

export function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function stepZoom(value: number, direction: -1 | 1): number {
  const candidates = direction > 0
    ? ZOOM_STEPS.filter((step) => step > value + 0.001)
    : [...ZOOM_STEPS].reverse().filter((step) => step < value - 0.001);
  return candidates[0] ?? (direction > 0 ? MAX_ZOOM : MIN_ZOOM);
}

export function fitCanvasZoom(
  viewport: { width: number; height: number },
  canvas: { width: number; height: number },
  padding: number
): number {
  const width = Math.max(1, viewport.width - padding * 2);
  const height = Math.max(1, viewport.height - padding * 2);
  return clampZoom(Math.min(width / canvas.width, height / canvas.height, 1));
}

export function zoomScrollOffset(input: {
  previousScale: number;
  nextScale: number;
  scrollLeft: number;
  scrollTop: number;
  anchorX: number;
  anchorY: number;
}) {
  const ratio = input.nextScale / input.previousScale;
  return {
    left: (input.scrollLeft + input.anchorX) * ratio - input.anchorX,
    top: (input.scrollTop + input.anchorY) * ratio - input.anchorY,
  };
}
```

- [ ] **Step 4: Run the helper tests**

Run:

```bash
cd web && yarn test features/templates/canvas-viewport.test.ts
```

Expected: PASS.

---

### Task 2: Split clipped canvas content from overflow-visible interaction chrome

**Files:**
- Modify: `web/components/dashboard/templates/canvas-stage.tsx`
- Modify: `web/components/dashboard/templates/editor-canvas.tsx`
- Create: `web/components/dashboard/templates/canvas-stage.test.tsx`

**Interfaces:**
- `CanvasStage` consumes separate `content: ReactNode` and `interaction: ReactNode` layers.
- `EditorCanvas` renders each block once visually and once as transparent interaction chrome.

- [ ] **Step 1: Write a failing layer-structure test**

Render `CanvasStage` with labeled content and interaction children and assert:

```tsx
expect(screen.getByTestId("canvas-content-clip")).toHaveStyle({ overflow: "hidden" });
expect(screen.getByTestId("canvas-interaction-layer")).toHaveStyle({ overflow: "visible" });
expect(screen.getByText("visual content")).toBeInTheDocument();
expect(screen.getByText("selection chrome")).toBeInTheDocument();
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
cd web && yarn test components/dashboard/templates/canvas-stage.test.tsx
```

Expected: FAIL because `CanvasStage` currently has one clipped children wrapper.

- [ ] **Step 3: Refactor `CanvasStage` into two layers**

Change its props to:

```ts
{
  canvas: TemplateCanvas;
  content?: ReactNode;
  interaction?: ReactNode;
  showGrid?: boolean;
  gridSize?: number;
}
```

The outer root owns width, height, box sizing, and `position: relative`, but not clipping. The content layer is `absolute inset-0 overflow-hidden`, owns background, border, radius, grid, and overlay image, and renders `content`. The interaction layer is `absolute inset-0 overflow-visible`, has a transparent background, and renders `interaction` above the content.

Use stable test hooks:

```tsx
<div data-testid="canvas-content-clip" style={{ overflow: "hidden", ... }}>
  {content}
</div>
<div data-testid="canvas-interaction-layer" style={{ overflow: "visible" }}>
  {interaction}
</div>
```

- [ ] **Step 4: Split `BlockFrame` rendering**

Add a visual-only map to the clipped content layer:

```tsx
{sortedBlocks.map((block) => (
  <div
    key={block.id}
    className="pointer-events-none absolute"
    style={{
      left: block.x,
      top: block.y,
      width: block.width,
      height: block.height,
      zIndex: block.z,
    }}
  >
    <BlockPreview block={block} />
  </div>
))}
```

Remove `previewBlock` and `<BlockPreview>` from `BlockFrame`. Keep its transparent rectangle, pointer handlers, outline, handles, keyboard-independent delete control, comparison outline, and z-index in the interaction layer.

Move alignment guides, spacing overlays, measurements, and selection chrome into the interaction layer. The content layer contains only canvas visuals.

- [ ] **Step 5: Run layer tests and type checking**

Run:

```bash
cd web && yarn test components/dashboard/templates/canvas-stage.test.tsx && yarn tsc --noEmit
```

Expected: PASS.

---

### Task 3: Repair empty-canvas drag-to-add

**Files:**
- Create: `web/features/templates/drag-types.ts`
- Modify: `web/components/dashboard/templates/editor-commands.tsx`
- Modify: `web/components/dashboard/templates/editor-canvas.tsx`
- Create: `web/components/dashboard/templates/editor-canvas.test.tsx`

**Interfaces:**
- Produces: `CARDINAL_BLOCK_MIME = "application/x-cardinal-block"` shared by drag source and drop target.

- [ ] **Step 1: Write a failing empty-canvas drop test**

Render `EditorCanvas` with `blocks={[]}` and an `onAddAt` spy. Provide a minimal DataTransfer stub:

```ts
const data = new Map<string, string>();
const dataTransfer = {
  setData: (type: string, value: string) => data.set(type, value),
  getData: (type: string) => data.get(type) ?? "",
  types: ["application/x-cardinal-block"],
} as unknown as DataTransfer;
```

Fire `dragOver` and `drop` on `screen.getByTestId("canvas-drop-layer")` with the supported MIME payload. Assert `onAddAt` is called once. Repeat with no supported payload and assert no additional call.

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
cd web && yarn test components/dashboard/templates/editor-canvas.test.tsx
```

Expected: FAIL because the current drop layer collapses and does not validate the payload.

- [ ] **Step 3: Share and validate the drag MIME type**

Create:

```ts
export const CARDINAL_BLOCK_MIME = "application/x-cardinal-block";
export const CARDINAL_NEW_BLOCK_PAYLOAD = "new";
```

Use these constants in `EditorCommands.onDragStart`. In `EditorCanvas.handleDrop`, return unless:

```ts
event.dataTransfer.getData(CARDINAL_BLOCK_MIME) === CARDINAL_NEW_BLOCK_PAYLOAD
```

- [ ] **Step 4: Add a full-size drop layer and center placement**

Render an `absolute inset-0` drop layer inside the interaction layer with `data-testid="canvas-drop-layer"`. Give it `onDragOver`, `onDrop`, and the empty-canvas selection handler. Keep block frames above it by z-index.

Change `onAddAt` semantics to receive the intended block center. In `TemplateEditorPage.addBlockAt`, create the default block, then subtract half its width and height before storing it:

```ts
const draft = createUniversalBlock(0, 0, "text", nextZ());
const block = {
  ...draft,
  x: Math.round(x - draft.width / 2),
  y: Math.round(y - draft.height / 2),
};
```

Do not clamp negative or oversized coordinates.

- [ ] **Step 5: Run the drop tests**

Run:

```bash
cd web && yarn test components/dashboard/templates/editor-canvas.test.tsx
```

Expected: PASS.

---

### Task 4: Add Fit, zoom controls, pointer zoom, and panning

**Files:**
- Modify: `web/components/dashboard/templates/editor-canvas.tsx`
- Modify: `web/components/dashboard/templates/editor-canvas.test.tsx`

**Interfaces:**
- Consumes: canvas viewport helpers from Task 1.
- Produces: local `viewMode: "fit" | "manual"`, `scale`, and pan gesture state.

- [ ] **Step 1: Add failing toolbar behavior tests**

Mock `ResizeObserver`, render the canvas, and assert:

1. `Zoom out`, `Zoom in`, and `Fit canvas` are keyboard-reachable buttons.
2. The current percentage is visible.
3. Zoom out disables at 25%; zoom in disables at 400%.
4. Clicking Fit returns the viewport to calculated Fit mode.

- [ ] **Step 2: Add explicit view state**

Use:

```ts
const viewportRef = useRef<HTMLDivElement>(null);
const [viewMode, setViewMode] = useState<"fit" | "manual">("fit");
const [scale, setScale] = useState(1);
```

The ResizeObserver computes `fitCanvasZoom` from both viewport width and height only while `viewMode === "fit"`. Canvas dimension changes also recompute Fit.

- [ ] **Step 3: Render the intuitive toolbar controls**

Add the visible pattern `−`, percentage, `+`, and `Fit` to the existing canvas toolbar. Use accessible labels `Zoom out`, `Current zoom`, `Zoom in`, and `Fit canvas`. Disable buttons at limits. Clicking `−` or `+` calls `stepZoom`, switches to manual, and anchors at the viewport center.

- [ ] **Step 4: Implement zoom anchoring**

Before changing scale, capture the viewport's scroll offsets and either pointer offset or center offset. Calculate the next offsets with `zoomScrollOffset`. After the scaled sizer is committed, use `requestAnimationFrame` to assign the calculated `scrollLeft` and `scrollTop`.

For `Ctrl/Cmd + wheel`, call `preventDefault`, derive a continuous factor from `deltaY`, clamp it, switch to manual, and use the pointer position relative to the viewport as the anchor. A wheel without the modifier remains untouched.

- [ ] **Step 5: Implement Space/middle-button panning**

Track whether Space is held using window key listeners that ignore input, textarea, select, and contenteditable targets. Start a pan gesture only for middle button or primary button while Space is held:

```ts
{
  pointerId,
  startX,
  startY,
  startScrollLeft,
  startScrollTop,
}
```

Capture the pointer on the viewport. Pointer movement sets scroll positions from the starting values. Pointer up, cancellation, or lost capture clears the gesture. While Space is held show `cursor-grab`; while panning show `cursor-grabbing`.

- [ ] **Step 6: Run interaction tests**

Run:

```bash
cd web && yarn test features/templates/canvas-viewport.test.ts components/dashboard/templates/editor-canvas.test.tsx
```

Expected: PASS.

---

### Task 5: Make the desktop editor fill remaining viewport height

**Files:**
- Modify: `web/features/templates/[id]/template-editor-page.tsx`
- Modify: `web/components/dashboard/templates/editor-canvas.tsx`

**Interfaces:**
- Produces: equal-height canvas and panel in the flexible center region.

- [ ] **Step 1: Replace the fixed WYSIWYG height cap**

Change the central scroller and WYSIWYG grid so desktop layout follows this structure:

```tsx
<div className="mx-auto flex h-dvh w-full max-w-7xl flex-col gap-4 overflow-hidden">
  <header className="shrink-0">...</header>
  <main className="min-h-0 flex-1 overflow-hidden">
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-4">
      <section className="min-h-96 lg:col-span-3 lg:h-full lg:min-h-0">...</section>
      <aside className="min-h-0 overflow-hidden lg:col-span-1 lg:flex lg:h-full lg:flex-col">...</aside>
    </div>
  </main>
  <footer className="shrink-0">...</footer>
</div>
```

Preserve the project's actual header/footer components rather than adding nested semantic elements if they already render those tags. Remove `lg:h-[70vh]`, `max-h-[70vh]`, and competing hard-coded viewport subtraction from the WYSIWYG path.

- [ ] **Step 2: Keep mobile in document flow**

Apply the fixed remaining-space layout only at the desktop breakpoint. Below it, allow the page and panels to grow naturally; retain a practical minimum canvas height.

- [ ] **Step 3: Keep scrolling inside the correct surfaces**

The canvas viewport uses `h-full min-h-0 overflow-auto`. The right panel keeps a fixed tab bar and makes only its active tab panel `min-h-0 flex-1 overflow-y-auto`. Code mode retains its existing usable document flow unless a class must be adjusted to prevent regression.

- [ ] **Step 4: Run static verification**

Run:

```bash
cd web && yarn lint && yarn tsc --noEmit
```

Expected: PASS.

---

### Task 6: Remove icons from the right-panel tab titles

**Files:**
- Modify: `web/features/templates/[id]/template-editor-page.tsx`
- Create: `web/features/templates/[id]/template-editor-page.test.tsx`

**Interfaces:**
- Preserves the existing tab IDs, labels, ARIA relations, and panels.

- [ ] **Step 1: Add a tab-semantics assertion**

Mock `getTemplate` with a minimal WYSIWYG template and mock the heavyweight canvas/output children with labeled stubs. Render `TemplateEditorPage`, await loading completion, then assert the three tab buttons are named `Commands`, `Canvas`, and `Block`, have `role="tab"`, and contain no SVG descendants. Click Commands and assert it becomes `aria-selected="true"` while its linked panel uses `aria-labelledby="editor-tab-commands"`.

- [ ] **Step 2: Remove tab icon metadata and rendering**

Change the tab configuration to:

```ts
[
  { id: "commands", label: "Commands" },
  { id: "canvas", label: "Canvas" },
  { id: "block", label: "Block" },
]
```

Remove the `EditorIcon` inside each tab only. Restyle tabs as single-line text labels with the existing selected, hover, and focus-visible states and at least a 36px target height.

- [ ] **Step 3: Run the focused test and build**

Run:

```bash
cd web && yarn test features/templates/\[id\]/template-editor-page.test.tsx && yarn test && yarn next build --webpack
```

Expected: all tests pass and the production build exits 0.

---

### Task 7: Bounded visual and regression verification

**Files:**
- No source changes unless the single review pass exposes a defect.

**Interfaces:**
- Verifies the complete approved canvas and layout behavior.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
cd web && yarn test && yarn lint && yarn tsc --noEmit && yarn next build --webpack
cd ../api && yarn test && yarn build && yarn prisma validate
cd .. && git diff --check
```

Expected: every command exits 0.

- [ ] **Step 2: Perform one desktop and mobile review pass**

On desktop verify:

1. Canvas and right panel fill equal remaining height.
2. Fit, `−`, percentage, and `+` are immediately understandable.
3. Pointer zoom does not jump away from its anchor.
4. Space-drag and middle-drag pan without moving blocks.
5. An off-canvas block's content is clipped but its selected border and handles remain visible.
6. Empty-canvas drop adds one centered block.
7. Right-panel tabs have text only and independent scrolling.

On mobile verify the canvas and panels remain in document flow, controls do not overlap, and zoom buttons remain reachable.

- [ ] **Step 3: Apply at most one batched correction pass**

Group every defect found in Step 2 into one correction batch, rerun the focused tests, then perform one confirmation review. Do not start an open-ended polish loop.

- [ ] **Step 4: Record final workspace state without committing**

Run:

```bash
git status --short && git diff --stat && git diff --check
```

Expected: only intended implementation, tests, migrations, dependency locks, the approved spec, and these plans are changed; no whitespace errors are present.
