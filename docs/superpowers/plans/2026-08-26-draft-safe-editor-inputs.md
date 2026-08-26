# Draft-safe Editor Inputs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users clear and edit required or numeric values naturally, committing only valid finished values and reverting invalid drafts on blur.

**Architecture:** Introduce focused draft controls that own temporary strings while editing and emit only committed domain values. Replace direct `Number(event.target.value)` mutations and make title commits produce one history checkpoint.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, jsdom, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-08-26-template-editor-workspace-design.md`

## Global Constraints

- Empty or partial drafts are allowed while focused.
- Blur and Enter commit valid values; Escape cancels.
- Empty, malformed, non-finite, or out-of-range drafts revert to the previous value.
- Optional free text remains allowed to be empty.
- History records committed values rather than transient keystrokes.
- Do not commit unless the user explicitly authorizes a Git commit.

---

### Task 1: Add frontend component-test infrastructure

**Files:**
- Modify: `web/package.json`
- Modify: `web/yarn.lock`
- Create: `web/vitest.config.ts`
- Create: `web/test/setup.ts`

**Interfaces:**
- Produces: `yarn test` and a jsdom React test environment with the `@/` alias.

- [ ] **Step 1: Install the focused test dependencies**

Run:

```bash
cd web && yarn add --dev vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Add to `web/package.json` scripts:

```json
"test": "vitest run"
```

- [ ] **Step 2: Configure Vitest**

Create `web/vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
  },
});
```

Create `web/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Verify the empty suite runs**

Run:

```bash
cd web && yarn test --passWithNoTests
```

Expected: exit 0.

---

### Task 2: Specify draft-number behavior with failing tests

**Files:**
- Create: `web/components/dashboard/templates/draft-inputs.test.tsx`

**Interfaces:**
- Consumes future `DraftNumberInput` and `DraftTextInput` exports.

- [ ] **Step 1: Write the draft-number interaction tests**

Create tests covering clear, commit, revert, Escape, and external updates:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DraftNumberInput, DraftTextInput } from "./draft-inputs";

describe("DraftNumberInput", () => {
  it("allows an empty draft and restores the value on blur", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftNumberInput aria-label="Width" value={120} min={16} onCommit={onCommit} />);
    const input = screen.getByLabelText("Width");
    await user.clear(input);
    expect(input).toHaveValue(null);
    expect(onCommit).not.toHaveBeenCalled();
    await user.tab();
    expect(input).toHaveValue(120);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits a valid number on blur", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftNumberInput aria-label="Width" value={120} min={16} onCommit={onCommit} />);
    const input = screen.getByLabelText("Width");
    await user.clear(input);
    await user.type(input, "240");
    await user.tab();
    expect(onCommit).toHaveBeenCalledWith(240);
  });

  it("reverts an out-of-range number", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftNumberInput aria-label="Grid" value={8} min={4} max={64} onCommit={onCommit} />);
    const input = screen.getByLabelText("Grid");
    await user.clear(input);
    await user.type(input, "2");
    await user.tab();
    expect(input).toHaveValue(8);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("cancels with Escape", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftNumberInput aria-label="X" value={20} onCommit={onCommit} />);
    const input = screen.getByLabelText("X");
    await user.clear(input);
    await user.type(input, "99");
    await user.keyboard("{Escape}");
    expect(input).toHaveValue(20);
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe("DraftTextInput", () => {
  it("restores a required title when the draft is blank", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<DraftTextInput aria-label="Title" value="Member Card" required onCommit={onCommit} />);
    const input = screen.getByLabelText("Title");
    await user.clear(input);
    await user.tab();
    expect(input).toHaveValue("Member Card");
    expect(onCommit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```bash
cd web && yarn test components/dashboard/templates/draft-inputs.test.tsx
```

Expected: FAIL because `draft-inputs.tsx` does not exist.

---

### Task 3: Implement reusable draft controls

**Files:**
- Create: `web/components/dashboard/templates/draft-inputs.tsx`

**Interfaces:**
- Produces:
  - `DraftNumberInput({ value, onCommit, min?, max?, integer?, ...inputProps })`
  - `DraftTextInput({ value, onCommit, required?, normalize?, ...inputProps })`

- [ ] **Step 1: Implement strict numeric parsing**

Use a pure parser that rejects empty, partial, non-finite, and out-of-range drafts:

```ts
export function parseNumberDraft(
  draft: string,
  options: { min?: number; max?: number; integer?: boolean } = {}
): number | null {
  if (draft.trim() === "") return null;
  const value = Number(draft);
  if (!Number.isFinite(value)) return null;
  const normalized = options.integer ? Math.round(value) : value;
  if (options.min !== undefined && normalized < options.min) return null;
  if (options.max !== undefined && normalized > options.max) return null;
  return normalized;
}
```

- [ ] **Step 2: Implement the focused draft lifecycle**

Both controls must:

```ts
const [draft, setDraft] = useState(String(value));
const [editing, setEditing] = useState(false);
const cancelBlur = useRef(false);

useEffect(() => {
  if (!editing) setDraft(String(value));
}, [editing, value]);
```

For number blur, parse the draft. Restore `String(value)` when invalid; otherwise display the normalized value and call `onCommit` only when it differs. For Enter, call `event.currentTarget.blur()`. For Escape, set `cancelBlur.current = true`, restore the previous value, and blur without committing.

For required text, normalize with `(draft) => draft.trim()`, reject an empty normalized value, and follow the same commit/cancel lifecycle. Spread native input attributes after excluding conflicting `value`, `defaultValue`, `onChange`, `onBlur`, and `onKeyDown` props.

- [ ] **Step 3: Run the draft-control tests**

Run:

```bash
cd web && yarn test components/dashboard/templates/draft-inputs.test.tsx
```

Expected: PASS.

---

### Task 4: Replace direct numeric mutation in shared inspector controls

**Files:**
- Modify: `web/components/dashboard/templates/inspector-controls.tsx`
- Modify: `web/components/dashboard/templates/canvas-panel.tsx`

**Interfaces:**
- `NumberInput` keeps its existing `value`, `min`, and `onChange` public API but delegates to `DraftNumberInput` and emits only committed values.

- [ ] **Step 1: Rebuild `NumberInput` on `DraftNumberInput`**

Replace the direct controlled number input with:

```tsx
<DraftNumberInput
  value={value}
  min={min}
  onCommit={onChange}
  className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
/>
```

Add optional `max`, `integer`, and `aria-label` forwarding so callers can preserve field constraints.

- [ ] **Step 2: Make custom canvas sizes draft-safe**

In `SizeSelect`, keep preset selection immediate but use `NumberInput` for custom pixel values. Commit with `onChange(`${Math.round(n)}px`)` and require `min={1}` and `integer`.

- [ ] **Step 3: Verify Canvas panel numeric fields**

Confirm overlay margin, overlay padding, custom width, and custom height allow clearing while focused and revert invalid drafts on blur.

- [ ] **Step 4: Run focused tests and type checking**

Run:

```bash
cd web && yarn test components/dashboard/templates/draft-inputs.test.tsx && yarn tsc --noEmit
```

Expected: PASS.

---

### Task 5: Replace geometry, font, and grid numeric inputs

**Files:**
- Modify: `web/components/dashboard/templates/block-inspector.tsx`
- Modify: `web/components/dashboard/templates/editor-canvas.tsx`

**Interfaces:**
- Consumes: `DraftNumberInput`.
- Produces: commit-only X, Y, W, H, Size, Z-index, font size, font weight, and grid-size edits.

- [ ] **Step 1: Replace `GeometryInput` internals**

Keep its label wrapper and render:

```tsx
<DraftNumberInput
  aria-label={label}
  value={value}
  min={min}
  integer
  onCommit={onChange}
  className="w-full rounded-md border border-zinc-300 bg-transparent px-1 py-1 text-center text-xs focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
/>
```

X and Y retain their current minimum of `0`; width, height, and square size retain `16`; z-index retains `0`.

- [ ] **Step 2: Replace text font size and weight inputs**

Use `min={10} max={64} integer` for text font size and `min={100} max={900} integer` for font weight. Keep their adjacent slider/select behavior; external slider changes refresh the draft when it is not focused.

- [ ] **Step 3: Replace grid size input**

Use `min={4} max={64} integer`. Remove the `Number(value) || 8` fallback so clearing does not change grid state.

- [ ] **Step 4: Add integration assertions to the draft-input test**

Render the relevant inspector control with an `onCommit` spy and verify clearing does not emit `0`, while a valid blur emits once.

- [ ] **Step 5: Run frontend tests**

Run:

```bash
cd web && yarn test
```

Expected: all input tests pass.

---

### Task 6: Make the required template title commit-safe

**Files:**
- Modify: `web/features/templates/[id]/template-editor-page.tsx`

**Interfaces:**
- Consumes: `DraftTextInput` and existing `handleRename`.
- Produces: one rename checkpoint per committed title.

- [ ] **Step 1: Replace the title input**

Render:

```tsx
<DraftTextInput
  value={title}
  required
  onCommit={handleRename}
  aria-label="Template title"
  className="min-w-48 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-lg font-semibold tracking-tight transition-colors hover:border-zinc-200 focus:border-zinc-300 focus:bg-white focus:outline-none dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:bg-zinc-950"
/>
```

Keep `handleRename` responsible for checkpointing, updating title, and marking dirty. Do not checkpoint while the draft is incomplete.

- [ ] **Step 2: Add a title integration test**

Test the required text control directly: blank blur restores the title, whitespace-only blur restores it, a trimmed valid title commits once, Enter commits, and Escape cancels.

- [ ] **Step 3: Run full frontend verification**

Run:

```bash
cd web && yarn test && yarn lint && yarn tsc --noEmit && yarn next build --webpack
```

Expected: all commands exit 0.

- [ ] **Step 4: Record the checkpoint without committing**

Run:

```bash
git diff --check && git status --short
```

Expected: no whitespace errors and only the intended input/test files plus prior approved-plan changes are present.
