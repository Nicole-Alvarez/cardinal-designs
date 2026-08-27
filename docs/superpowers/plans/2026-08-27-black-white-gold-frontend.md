# Black, White, and Gold Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Cardinal Designs into a cohesive dark creative workspace with restrained gold accents, a useful dashboard, clearer templates workflow, and canvas-first responsive editor while preserving all existing behavior, accessibility, performance, and preview security.

**Architecture:** Introduce semantic CSS tokens and a small shared button primitive first, then migrate one complete user flow at a time. Keep the current data model and editor mechanics; reorganize only presentation and frontend interaction boundaries. Responsive editor controls use the existing accessible-dialog foundation for drawers and sheets, and expensive icon data remains isolated behind a dynamic import.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, existing Lucide-derived icon generator.

**Spec:** `docs/superpowers/specs/2026-08-27-black-white-gold-frontend-design.md`

## Global Constraints

- Do not change backend APIs, authentication behavior, database schemas, or environment files.
- Do not read, print, reuse, rotate, or modify environment secrets.
- Preserve sandboxed HTML/React previews, opaque-origin isolation, message validation, payload validation, and authenticated-parent isolation.
- Preserve dialog focus trapping/restoration, keyboard tabs, accessible names, touch targets, status announcements, and reduced-motion behavior.
- Preserve drag, resize, zoom, pan, snapping, clipping, spacing, undo, generated code, printing, PNG, QR, barcode, and download behavior.
- Retain Geist Sans and Geist Mono.
- Do not add a visual, animation, icon, or component dependency.
- Do not undo the generated UI-icon catalog split.
- Work in the existing dirty worktree without overwriting unrelated user changes.
- Do not create commits unless the user separately authorizes commits.
- Run commands with Node 24: `PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH`.

---

### Task 1: Protect Security and Accessibility Contracts

**Files:**
- Modify: `web/components/dashboard/templates/code-editor-panel.test.tsx`
- Modify: `web/components/dashboard/templates/confirm-dialog.test.tsx`
- Modify: `web/components/dashboard/app-shell.test.tsx`
- Test: `web/features/templates/sandbox-preview-messages.test.ts`

**Interfaces:**
- Consumes: existing `AccessibleDialog`, `SandboxedCodePreview`, and sandbox message guards.
- Produces: regression coverage that every later visual task must keep passing.

- [ ] **Step 1: Extend the sandbox regression test**

Add assertions that the iframe has only the required capability and does not expose preview markup in the parent:

```tsx
const frame = screen.getByTitle("HTML template preview");
expect(frame).toHaveAttribute("sandbox", "allow-scripts");
expect(frame.getAttribute("sandbox")).not.toContain("allow-same-origin");
expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
expect(document.querySelector("[data-untrusted-preview]")).toBeNull();
```

- [ ] **Step 2: Extend dialog and drawer focus tests**

Cover initial focus, Tab containment, Escape, and opener restoration:

```tsx
await user.click(opener);
expect(screen.getByRole("dialog")).toBeInTheDocument();
await user.tab({ shift: true });
expect(screen.getByRole("button", { name: /cancel|close/i })).toHaveFocus();
await user.keyboard("{Escape}");
expect(opener).toHaveFocus();
```

- [ ] **Step 3: Run the focused tests**

Run:

```bash
cd web
PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npm test -- code-editor-panel.test.tsx confirm-dialog.test.tsx app-shell.test.tsx sandbox-preview-messages.test.ts
```

Expected: all focused tests pass before visual work begins.

- [ ] **Step 4: Record the checkpoint**

Run `git diff --check` and confirm only the intended test files changed in this task.

---

### Task 2: Establish Semantic Theme and Button Primitives

**Files:**
- Create: `web/components/ui/button.tsx`
- Create: `web/components/ui/button.test.tsx`
- Create: `web/features/design/theme-contract.test.ts`
- Modify: `web/app/globals.css`

**Interfaces:**
- Produces: `buttonClassName(variant, size, className?)` and `Button`.
- Produces semantic utilities backed by `--app-bg`, `--surface-*`, `--text-*`, `--border-*`, `--accent-*`, and semantic status variables.
- Later tasks consume these primitives instead of repeating primary/secondary/destructive classes.

- [ ] **Step 1: Write the failing theme contract test**

```ts
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("application theme", () => {
  it("defines the semantic black, white, and gold contract", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
    for (const token of [
      "--app-bg", "--surface-1", "--surface-2", "--surface-3",
      "--text-primary", "--text-secondary", "--text-muted",
      "--border-subtle", "--accent", "--accent-hover",
      "--accent-active", "--accent-soft", "--accent-foreground", "--focus",
    ]) expect(css).toContain(token);
    expect(css).not.toContain("#7c3aed");
  });
});
```

- [ ] **Step 2: Run the contract test and verify RED**

Run `PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npm test -- theme-contract.test.ts` from `web`.

Expected: FAIL because the semantic tokens do not exist yet.

- [ ] **Step 3: Add the semantic tokens**

Define one dark-first token set and expose it to Tailwind:

```css
:root {
  color-scheme: dark;
  --app-bg: #080806;
  --surface-1: #0f0f0c;
  --surface-2: #171713;
  --surface-3: #201f19;
  --surface-selected: #2a2519;
  --text-primary: #faf9f4;
  --text-secondary: #c5c1b6;
  --text-muted: #8f8b80;
  --border-subtle: #2d2b24;
  --border-strong: #454136;
  --accent: #c9a45c;
  --accent-hover: #d8b86f;
  --accent-active: #a9823f;
  --accent-soft: rgb(201 164 92 / 14%);
  --accent-foreground: #12100b;
  --focus: #e7c77f;
}

@theme inline {
  --color-app: var(--app-bg);
  --color-surface-1: var(--surface-1);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  --color-accent: var(--accent);
}
```

Update body, selection, focus, and reduced-motion rules to consume these variables. Keep semantic red, amber, and green values separate.

- [ ] **Step 4: Write the failing button-variant test**

```tsx
render(<Button variant="primary">Create template</Button>);
expect(screen.getByRole("button", { name: "Create template" })).toHaveClass("bg-accent");
rerender(<Button variant="destructive">Delete</Button>);
expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("bg-red-600");
```

- [ ] **Step 5: Implement the shared button primitive**

Use native button props and explicit class maps:

```tsx
export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "default" | "compact" | "icon";

export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "default",
  className = ""
): string;

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
): React.JSX.Element;
```

Every size keeps a practical 44px mobile target and a visible gold focus ring. Primary uses gold with dark text; destructive remains red.

- [ ] **Step 6: Run tests, typecheck, and lint**

```bash
PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npm test -- theme-contract.test.ts button.test.tsx
PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npx tsc --noEmit
PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npm run lint
```

Expected: all commands exit 0.

---

### Task 3: Modernize the Shell and Public Experience

**Files:**
- Modify: `web/components/dashboard/app-shell.tsx`
- Modify: `web/components/dashboard/app-sidebar.tsx`
- Modify: `web/components/dashboard/app-shell.test.tsx`
- Modify: `web/components/logout-button.tsx`
- Modify: `web/lib/sidebar-menu.ts`
- Modify: `web/components/home/hero.tsx`
- Modify: `web/components/home/search-bar.tsx`
- Modify: `web/components/home/card-item.tsx`
- Modify: `web/components/home/card-grid.tsx`
- Modify: `web/components/home/about.tsx`
- Modify: `web/components/home/footer.tsx`
- Modify: `web/features/home/data.ts`

**Interfaces:**
- Consumes: semantic theme and `buttonClassName` from Task 2.
- Preserves: `AccessibleDialog` mobile drawer behavior and existing home filtering data flow.

- [ ] **Step 1: Extend the shell test for navigation identity**

```tsx
expect(screen.getByRole("navigation")).toBeInTheDocument();
expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
expect(screen.getByText("Nicole")).toBeInTheDocument();
```

- [ ] **Step 2: Restyle the shell without changing drawer behavior**

Use `bg-app`, `bg-surface-1`, semantic borders, warm text, and a gold-soft current-route treatment. Add existing generated UI icons to global navigation only where they aid recognition. Keep the current dialog title, close button, Escape behavior, and focus restoration unchanged.

- [ ] **Step 3: Align the public home surface**

Replace violet/pink ambient gradients with a restrained neutral radial treatment and a single gold detail. Keep card artwork colorful. Convert primary buttons, search focus, pressed filters, tags, footer links, and cards to semantic tokens. Remove repeated feature-card borders from About when spacing alone establishes grouping.

- [ ] **Step 4: Verify behavior and detector regressions**

Run:

```bash
PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npm test -- app-shell.test.tsx
PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npx tsc --noEmit
PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npm run lint
```

Expected: the drawer regression test still passes and no violet/pink gradient remains in the home feature data or Hero chrome.

---

### Task 4: Build a Useful Dashboard

**Files:**
- Create: `web/features/dashboard/dashboard-page.test.tsx`
- Modify: `web/features/dashboard/dashboard-page.tsx`
- Consume without changing: `web/features/templates/queries.ts`

**Interfaces:**
- Consumes: `listTemplates(): Promise<TemplateSummary[]>` and `createTemplate()`.
- Produces: a client dashboard that preserves the `name: string` prop and exposes creation, browse, recent, loading, empty, and recoverable recent-list states.

- [ ] **Step 1: Write failing dashboard tests**

```tsx
queries.listTemplates.mockResolvedValue([templateSummary]);
render(<DashboardPage name="Nicole" />);
expect(screen.getByRole("button", { name: "Create template" })).toBeEnabled();
expect(await screen.findByRole("link", { name: /Member card/ })).toBeInTheDocument();

queries.listTemplates.mockRejectedValueOnce(new Error("Recent templates unavailable"));
render(<DashboardPage name="Nicole" />);
expect(await screen.findByRole("status")).toHaveTextContent("Recent templates unavailable");
expect(screen.getByRole("button", { name: "Create template" })).toBeEnabled();
```

- [ ] **Step 2: Run the dashboard test and verify RED**

Run `PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npm test -- dashboard-page.test.tsx`.

Expected: FAIL because recent templates and direct creation are absent.

- [ ] **Step 3: Implement bounded recent-work state**

Make `DashboardPage` a client component. Load templates, sort descending by `updatedAt`, and render at most four records. Use the existing create query and route to the returned editor ID:

```ts
const recent = [...templates]
  .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  .slice(0, 4);
```

Failure to load recent items renders a quiet `role="status"` message with retry while leaving Create and Browse usable. Creation uses an announced loading state and disables duplicate submission.

- [ ] **Step 4: Apply the approved hierarchy**

Use one page introduction, a gold Create action, a neutral Browse action, and a single recent-work section. Do not add metrics, charts, or ornamental cards.

- [ ] **Step 5: Run dashboard tests and checks**

Run the focused test, TypeScript, and ESLint. Expected: all exit 0.

---

### Task 5: Simplify the Templates Collection

**Files:**
- Modify: `web/features/templates/templates-page.tsx`
- Modify: `web/features/templates/templates-page.test.tsx`
- Modify: `web/components/dashboard/templates/templates-table.tsx`
- Create: `web/components/dashboard/templates/templates-table.test.tsx`

**Interfaces:**
- Consumes: current `TemplateSummary`, create, delete, and retry behavior.
- Produces: an editorial responsive list with a single obvious open affordance and quieter destructive action.

- [ ] **Step 1: Write failing collection semantics tests**

```tsx
render(<TemplatesTable templates={[template]} onDelete={onDelete} deletingId={null} />);
expect(screen.getAllByRole("link", { name: /Member card/ })).toHaveLength(1);
expect(screen.getByText("Anyone with link")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Delete Member card" })).toBeEnabled();
```

Extend `templates-page.test.tsx` to assert the loading state renders multiple skeleton rows with `aria-label="Loading templates"` before the request settles.

- [ ] **Step 2: Run tests and verify RED**

Run `npm test -- templates-page.test.tsx templates-table.test.tsx` with Node 24.

Expected: FAIL because the row currently has two open links and no layout-preserving skeleton.

- [ ] **Step 3: Implement the editorial list**

Keep title and description primary, visibility secondary, updated date tertiary, and created date disclosed on wider screens. Remove the duplicate open icon. Keep delete explicitly labeled and keyboard accessible. Use semantic gold focus/hover treatment only on the open affordance.

- [ ] **Step 4: Implement stable page states**

Replace the centered spinner with three skeleton rows shaped like the final collection. Retain retry, empty, create, delete confirmation, error announcements, and duplicate-submit protection. Remove violet/blue decoration from the page header.

- [ ] **Step 5: Run focused tests, TypeScript, and lint**

Expected: all checks exit 0 and existing retry assertions remain green.

---

### Task 6: Make Add Direct and the Inspector Progressive

**Files:**
- Modify: `web/components/dashboard/templates/editor-commands.tsx`
- Create: `web/components/dashboard/templates/editor-commands.test.tsx`
- Modify: `web/features/templates/[id]/template-editor-page.tsx`
- Modify: `web/features/templates/[id]/template-editor-page.test.tsx`
- Modify: `web/features/templates/drag-types.ts`
- Modify: `web/components/dashboard/templates/editor-canvas.tsx`
- Modify: `web/components/dashboard/templates/editor-canvas.test.tsx`
- Create: `web/components/ui/disclosure.tsx`
- Create: `web/components/ui/disclosure.test.tsx`
- Modify: `web/components/dashboard/templates/block-inspector.tsx`

**Interfaces:**
- Changes `EditorCommands` to accept only `onAdd(type: BlockType): void`; Add canvas remains available through `CanvasSelector`.
- Adds `addBlockCentered(type: BlockType): void` in the editor page.
- Changes `EditorCanvas.onAddAt` to `(x: number, y: number, type: BlockType) => void` and adds typed drag-payload encode/decode helpers.
- Produces `Disclosure({ title, defaultOpen, children })` using a native button with `aria-expanded` and `aria-controls`.

- [ ] **Step 1: Write failing Add tests**

```tsx
const onAdd = vi.fn();
render(<EditorCommands onAdd={onAdd} />);
await user.click(screen.getByRole("button", { name: /Add image/ }));
expect(onAdd).toHaveBeenCalledWith("image");
await user.click(screen.getByRole("button", { name: /Add QR code/ }));
expect(onAdd).toHaveBeenCalledWith("qr");
```

- [ ] **Step 2: Run the Add test and verify RED**

Expected: FAIL because only a generic Add block action exists.

- [ ] **Step 3: Implement the direct block picker**

Define a typed UI list for all supported `BlockType` values. Each button contains an existing UI icon, plain label, accessible name, and touch-safe size. Keep pointer drag support by serializing the selected block type in the existing Cardinal drag payload without changing the MIME boundary.

Add helpers with explicit validation:

```ts
export function blockDragPayload(type: BlockType): string {
  return `new:${type}`;
}

export function blockTypeFromDragPayload(value: string): BlockType | null;
```

The decoder returns `null` for unknown or malformed values. `EditorCanvas` ignores invalid payloads and calls `onAddAt(point.x, point.y, type)` for valid payloads.

Change centered creation to:

```ts
function addBlockCentered(type: BlockType) {
  checkpoint(`add:${type}`);
  const block = createUniversalBlock(centerX, centerY, type, nextZ());
  setBlocks((current) => [...current, block]);
  setSelectedIds([block.id]);
  setPanelTab("block");
  markDirty();
}
```

The implementation must use the existing calculated canvas center values rather than literal coordinates.

- [ ] **Step 4: Write and implement disclosure tests**

```tsx
render(<Disclosure title="Advanced" defaultOpen={false}><p>Stacking</p></Disclosure>);
expect(screen.queryByText("Stacking")).not.toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "Advanced" }));
expect(screen.getByText("Stacking")).toBeVisible();
expect(screen.getByRole("button", { name: "Advanced" })).toHaveAttribute("aria-expanded", "true");
```

Use the disclosure to group essential content, geometry, appearance, and advanced stacking/border controls. Do not hide the fields required to edit the currently selected block’s primary content.

- [ ] **Step 5: Move document actions out of Add**

Remove Add canvas, Preview data, and Settings from `EditorCommands`. Add canvas remains in `CanvasSelector`; add document-level Preview data and Settings triggers in the editor toolbar while retaining the same callbacks and dialogs.

- [ ] **Step 6: Run focused editor tests, TypeScript, and lint**

Expected: direct creation selects the correct block type, opens Block, creates one history checkpoint, and keeps prior drag behavior green.

---

### Task 7: Recompose the Desktop Editor Workspace

**Files:**
- Create: `web/components/dashboard/templates/editor-toolbar.tsx`
- Create: `web/components/dashboard/templates/editor-toolbar.test.tsx`
- Create: `web/components/dashboard/templates/output-drawer.tsx`
- Create: `web/components/dashboard/templates/output-drawer.test.tsx`
- Modify: `web/features/templates/[id]/template-editor-page.tsx`
- Modify: `web/components/dashboard/templates/editor-canvas.tsx`
- Modify: `web/components/dashboard/templates/canvas-selector.tsx`
- Modify: `web/components/dashboard/templates/template-editor-footer.tsx`
- Modify: `web/components/dashboard/templates/code-output.tsx`

**Interfaces:**
- `EditorToolbar` receives document title/description, mode, history capabilities, save state, canvas selector content, and callbacks; it does not own template data.
- `OutputDrawer` receives `open`, `onOpenChange`, a labelled title, and output children.
- Existing `CodeOutput` props remain unchanged.

- [ ] **Step 1: Write failing toolbar hierarchy tests**

```tsx
render(<EditorToolbar {...props} />);
expect(screen.getByRole("button", { name: "Save template" })).toBeEnabled();
expect(screen.getByRole("button", { name: "Preview data" })).toBeEnabled();
expect(screen.getByRole("button", { name: "Template settings" })).toBeEnabled();
expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
```

Test `Saving…`, `Saved`, and error/dirty status without duplicating a second status footer.

- [ ] **Step 2: Implement the controlled toolbar**

Extract toolbar presentation from the large editor page while leaving state and API calls in the page. Use grouped navigation/document, canvas, mode/history, document actions, and save regions. Keep Back, Save, mode, and accessible names visible at desktop widths.

- [ ] **Step 3: Write failing output-drawer tests**

```tsx
render(<OutputDrawer open={false} onOpenChange={onOpenChange}><p>Generated output</p></OutputDrawer>);
expect(screen.queryByText("Generated output")).not.toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "Open preview and export" }));
expect(onOpenChange).toHaveBeenCalledWith(true);
```

- [ ] **Step 4: Implement contextual output presentation**

Use an accessible disclosure on desktop and a sheet entry point consumed by Task 8 on mobile. Preserve `CodeOutput`, keyboard tabs, copy/download, print, PNG, and preview refs. The default visual-editor state keeps output collapsed so the canvas retains the available height.

- [ ] **Step 5: Restyle canvas-first workspace**

Use dark tonal workspace chrome, a restrained panel boundary, and semantic selected states. Keep canvas content styles and exported markup unchanged. Move persistent save messaging out of `TemplateEditorFooter`; retain shortcuts only at wide viewports if they do not reduce canvas height.

- [ ] **Step 6: Run editor toolbar/output tests and existing canvas tests**

```bash
PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npm test -- editor-toolbar.test.tsx output-drawer.test.tsx template-editor-page.test.tsx editor-canvas.test.tsx code-output.test.tsx
```

Expected: all tests pass and existing canvas interaction assertions remain unchanged.

---

### Task 8: Create Canvas-First Tablet and Mobile Editing

**Files:**
- Create: `web/components/dashboard/templates/workspace-sheet.tsx`
- Create: `web/components/dashboard/templates/workspace-sheet.test.tsx`
- Create: `web/components/dashboard/templates/mobile-editor-actions.tsx`
- Create: `web/components/dashboard/templates/mobile-editor-actions.test.tsx`
- Modify: `web/features/templates/[id]/template-editor-page.tsx`
- Modify: `web/components/dashboard/templates/editor-toolbar.tsx`
- Modify: `web/components/dashboard/templates/output-drawer.tsx`

**Interfaces:**
- `WorkspaceSheet` wraps `AccessibleDialog` and accepts `open`, `title`, `onClose`, `children`, and `placement: "right" | "bottom"`.
- `MobileEditorActions` accepts active panel state and callbacks for Add, Edit, Canvas, and Preview.
- Desktop right-panel behavior remains present at `lg` and above.

- [ ] **Step 1: Write failing workspace-sheet accessibility tests**

```tsx
render(<WorkspaceSheet open title="Add blocks" placement="bottom" onClose={onClose}><button>Add text</button></WorkspaceSheet>);
expect(screen.getByRole("dialog", { name: "Add blocks" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Add text" })).toHaveFocus();
await user.keyboard("{Escape}");
expect(onClose).toHaveBeenCalledOnce();
```

- [ ] **Step 2: Implement the sheet on the shared dialog foundation**

Do not duplicate focus management. `WorkspaceSheet` supplies only responsive positioning, compact title/close chrome, and safe-area padding. Bottom placement uses a mobile-height cap and internal scrolling; right placement supports tablet.

- [ ] **Step 3: Write failing mobile-action semantics tests**

```tsx
render(<MobileEditorActions active="canvas" onSelect={onSelect} />);
expect(screen.getByRole("toolbar", { name: "Editor tools" })).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "Add" }));
expect(onSelect).toHaveBeenCalledWith("add");
expect(screen.getByRole("button", { name: "Canvas" })).toHaveAttribute("aria-pressed", "true");
```

- [ ] **Step 4: Integrate responsive workspace behavior**

Below `lg`, remove the permanent right column. At tablet width, open Add/Canvas/Block in a right sheet. Below `md`, use the bottom action toolbar and bottom sheets. Preview/output opens in a dedicated sheet. The compact mobile top bar exposes Back, title, Save status/action, and More without wrapping the desktop toolbar.

- [ ] **Step 5: Verify mobile constraints**

Assert sheet semantics, 44px actions, no persistent mobile footer, and canvas presence before sheet content in DOM reading order. Run all editor-focused tests, TypeScript, and lint.

---

### Task 9: Normalize Dialogs, Forms, Feedback, and Icon Loading

**Files:**
- Modify: `web/components/dashboard/templates/metadata-dialog.tsx`
- Modify: `web/components/dashboard/templates/settings-dialog.tsx`
- Modify: `web/components/dashboard/templates/confirm-dialog.tsx`
- Modify: `web/components/dashboard/templates/preview-export-actions.tsx`
- Modify: `web/components/dashboard/templates/block-inspector.tsx`
- Modify: `web/components/dashboard/templates/canvas-panel.tsx`
- Modify: `web/components/dashboard/templates/inspector-controls.tsx`
- Modify: `web/components/dashboard/templates/icon-picker.tsx`
- Create: `web/features/templates/icon-constants.ts`
- Modify: `web/features/templates/icons.ts`
- Modify: `web/features/templates/types.ts`
- Create: `web/components/dashboard/templates/lazy-icon-picker.tsx`
- Create: `web/components/dashboard/templates/lazy-icon-picker.test.tsx`

**Interfaces:**
- `LazyIconPicker` preserves `value?: string` and `onChange(icon: string): void`.
- `DEFAULT_ICON_NAME` moves to `icon-constants.ts` so core template types do not import the full icon catalog.
- Existing dialog props and callback behavior remain unchanged.

- [ ] **Step 1: Write the lazy icon-picker test**

Mock `./icon-picker` and verify it is requested only when rendered for an icon block:

```tsx
render(<BlockInspector block={textBlock} {...callbacks} />);
expect(screen.queryByLabelText("Search icons")).not.toBeInTheDocument();
rerender(<BlockInspector block={iconBlock} {...callbacks} />);
expect(await screen.findByLabelText("Search icons")).toBeInTheDocument();
```

- [ ] **Step 2: Implement the dynamic boundary**

```tsx
const IconPicker = dynamic(() => import("./icon-picker"), {
  ssr: false,
  loading: () => <div role="status" aria-label="Loading icons" className="min-h-48 animate-pulse rounded-xl bg-surface-2" />,
});
```

`BlockInspector` imports only `LazyIconPicker`, preventing the full icon catalog from entering unrelated shared chunks.

Move the lightweight default name without changing its value:

```ts
// features/templates/icon-constants.ts
export const DEFAULT_ICON_NAME = "star";
```

`types.ts` imports from `icon-constants.ts`; `icons.ts` re-exports the constant for existing consumers while retaining the full catalog only for the dynamically loaded picker.

- [ ] **Step 3: Apply shared dialog and form hierarchy**

Use semantic surfaces, the shared Button primitive, consistent field borders, gold focus, neutral cancel actions, gold primary actions, and semantic destructive actions. Keep labels, descriptions, import behavior, JSON validation, privacy confirmation, saving locks, and accessible dialog behavior unchanged.

- [ ] **Step 4: Normalize feedback**

Use stable status placement and semantic tokens for clipboard, upload, export fallback, save, validation, success, warning, and errors. Do not replace `role="alert"` or `aria-live` behavior with color-only feedback.

- [ ] **Step 5: Run dialog, export, inspector, and bundle checks**

Run focused tests plus TypeScript and lint. After a production build, inspect `.next/static/chunks` and confirm the UI catalog remains small and the full design icon catalog is not imported by Templates or Dashboard routes.

---

### Task 10: Full Verification, Bounded Polish, and Audit

**Files:**
- Modify only files with defects confirmed by verification.
- Update tests only when they capture intended behavior rather than implementation details.

**Interfaces:**
- Consumes every completed task.
- Produces the verified implementation and before/after report.

- [ ] **Step 1: Run the complete automated suite**

From `web`:

```bash
PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npm test
PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npx tsc --noEmit
PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npm run lint
PATH=/Users/nicolealvarez/.nvm/versions/node/v24.15.0/bin:$PATH npm run build
```

If Turbopack cannot bind its CSS worker port in the managed environment, record that environment failure and run the supported fallback `npx next build --webpack`; do not alter application configuration merely to hide the environment restriction.

- [ ] **Step 2: Inspect the production bundle**

Run:

```bash
find .next/static/chunks -type f -name '*.js' -exec wc -c {} + | sort -nr | head -20
```

Verify that the full icon catalog is isolated to the editor path and that Babel remains isolated to the preview sandbox path.

- [ ] **Step 3: Perform one bounded visual review**

Use existing browser tooling if available. Review Dashboard, Templates, and the editor at approximately 1440px, 900px, and 390px widths. In one combined pass, check hierarchy, overflow, canvas usefulness, toolbar wrapping, sheets, long titles, loading, empty, error, save, focus, and reduced-motion states.

- [ ] **Step 4: Apply one evidence-backed correction batch**

Fix only defects observed in Step 3. Do not add new features or restyle unaffected surfaces. Repeat the affected focused tests after the correction batch.

- [ ] **Step 5: Run final verification fresh**

Repeat the complete tests, TypeScript, ESLint, production build, and `git diff --check`. Inspect `git status --short` to confirm no backend, schema, authentication, environment, or unrelated files changed.

- [ ] **Step 6: Rerun the Impeccable audit once**

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json web
```

Verify every finding in context, separate true defects from static-analysis false positives, compare the result with the 14/20 pre-implementation reassessment, and report remaining risks honestly.

## Completion Report

The final handoff must include:

- Files changed, grouped by design system, shell/public, dashboard/templates, editor, and tests.
- P0, P1, P2, and P3 items completed.
- Items deferred and the reason for each.
- Test count and result.
- TypeScript, ESLint, and production-build results.
- Bundle comparison.
- New Impeccable score and comparison with 14/20.
- Remaining accessibility, responsive, performance, and security risks.
- Explicit confirmation that backend, schema, authentication, environment secrets, and sandbox behavior were not changed.
