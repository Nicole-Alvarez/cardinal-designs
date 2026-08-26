# Template Editor Workspace Design

**Status:** Approved

**Date:** 2026-08-26

## Goal

Make the template editor feel immediately understandable to a first-time user while fixing the canvas interaction, form editing, layout, and template ownership problems as one coordinated update.

The editor will gain conventional zoom and pan controls, reliable drag-to-add behavior, selection chrome that remains visible outside the clipped card, user-owned templates with descriptions, draft-safe inputs, and a full-height workspace.

## Scope

This design covers:

1. Canvas zoom and panning.
2. Visible selection borders and handles for blocks outside the canvas.
3. Drag-to-add on an empty canvas.
4. Per-user template ownership and title uniqueness.
5. Optional template descriptions.
6. Draft-safe required and numeric inputs.
7. A viewport-filling canvas and inspector panel.
8. Text-only Commands, Canvas, and Block tabs.

## Non-goals

- Replacing the custom editor with Fabric.js, Konva, or another canvas library.
- Preventing blocks from moving or resizing outside the canvas.
- Changing how exported previews, PNG files, or print output are sized.
- Persisting zoom or pan state with the template.
- Sharing templates between users or adding organization-level ownership.
- Redesigning the code editor or generated-code output.
- Removing icons outside the three right-panel tab titles.

## Confirmed Direction

Extend the current React editor rather than replacing it. Keep template content coordinates independent of viewport zoom, isolate canvas navigation from document data, and establish small shared helpers for view transforms and draft input validation.

The surface remains an operate-mode editing workspace: controls favor recognition, predictable feedback, and familiar design-tool conventions over decoration.

## Canvas Workspace

### Zoom controls

The canvas toolbar will expose four immediately readable controls:

- Decrease zoom.
- Current zoom percentage.
- Increase zoom.
- Fit canvas to the available viewport.

The visible text pattern is `− 100% + Fit`. Icon-only controls may retain accessible names and tooltips, but the percentage and Fit action remain textual so their meaning is not hidden.

Zoom behavior:

- Minimum: 25%.
- Maximum: 400%.
- Button increments use predictable preset steps.
- `Ctrl/Cmd + wheel` and trackpad pinch zoom toward the pointer.
- Fit mode recalculates when the viewport or canvas size changes.
- A manual zoom action leaves Fit mode and preserves the chosen percentage.
- Zoom changes keep the same canvas point beneath the pointer or viewport center to avoid visual jumps.
- Zoom and pan are editor view state only and never enter template content, undo history, API payloads, generated code, or exports.

### Panning

Users can pan the canvas using either:

- Spacebar plus primary-button drag.
- Middle-button drag.

The canvas viewport changes from an open-hand cursor to a closed-hand cursor during panning. Panning must not move blocks, change selection, trigger drag-to-add, or mark the template dirty. Normal wheel and trackpad scrolling remain available when the zoom modifier is not pressed.

The implementation should use the scrollable canvas viewport as the pan surface. Panning updates its scroll position rather than introducing template-coordinate offsets. This keeps pointer-to-canvas coordinate conversion and export rendering independent of the viewport position.

### Two-layer canvas rendering

Block geometry remains unrestricted. Blocks may cross any edge of the main canvas.

The canvas will separate rendering into two aligned layers:

1. **Clipped content layer**
   - Contains the canvas background, overlay image, grid, and visual block previews.
   - Clips everything to the canvas rectangle and corner radius.
   - Matches preview, PNG, and print behavior.

2. **Overflow-visible interaction layer**
   - Contains block hit areas, selection borders, resize handles, alignment guides, spacing measurements, and comparison outlines.
   - Uses the same unscaled template coordinates as the content layer.
   - Allows selection chrome to remain visible when a block is partially outside the canvas.
   - Keeps off-canvas chrome interactive so a block can be dragged or resized back into view.

Only editor chrome may appear outside the canvas. Block text, images, backgrounds, borders, QR codes, and barcodes remain clipped.

### Drag-to-add

The current empty-canvas failure comes from an absolutely positioned drop layer inside a wrapper without an in-flow height. The revised canvas provides a full-size drop target explicitly aligned to the canvas rectangle.

Drag behavior:

- The Commands panel continues to support both click-to-add and drag-to-add.
- Dragging Add block over any empty canvas area activates the drop target.
- The new block is centered around the pointer location.
- Existing unrestricted geometry behavior remains; no boundary clamp is added.
- Dropping adds exactly one block, selects it, switches to the Block panel, marks the template dirty, and creates one undo checkpoint.
- Unsupported drag payloads are ignored.

## Template Ownership and Descriptions

### Data model

Each template belongs to exactly one user.

The `Template` model gains:

- Required `userId` foreign key to `User`, with cascade deletion.
- Plain-text `description` with an empty-string default; the API trims it and stores an omitted or whitespace-only value as `""`.
- Composite unique constraint on `(userId, title)`.
- Index on `userId` for user-scoped listing.

The existing global unique constraint on `title` is removed. Two users may use the same title; one user may not have two templates with the same trimmed, case-sensitive title. For example, `Member Card` and `member card` remain distinct.

### Existing-template migration

Existing templates are assigned to a deterministic migration owner:

1. The oldest user with role `admin`.
2. If no admin exists, the oldest user.

If templates exist but no user exists, migration must stop rather than orphan or delete templates. The migration then makes `userId` required and installs the foreign key and composite unique constraint.

### Authorization

Every template service operation receives the authenticated user ID:

- List returns only that user's templates.
- Create assigns the authenticated user as owner.
- Get, update, and delete require both template ID and owner ID.
- Requests for another user's template return `404`, matching a missing template and avoiding ownership disclosure.

The route layer remains responsible for authentication and passes `req.user.id` into the service. The service remains responsible for owner-scoped Prisma access and title-conflict translation.

Untitled template generation continues to use a random suffix, but collision checks are scoped to the owner. A duplicate title for the same user returns `409`; the same title owned by another user is valid.

### Description behavior

- Description is optional.
- Empty description is valid.
- Leading and trailing whitespace is removed on save.
- Maximum saved length is 500 characters.
- The templates list displays the description under the title.
- Missing descriptions display `No description` as muted interface copy without saving that string.
- The editor header provides a description input beneath the title without crowding primary toolbar actions.
- Description participates in dirty state, WYSIWYG undo/redo snapshots, save payloads, API types, list summaries, and full template responses.

## Draft-safe Inputs

### Required behavior

Inputs whose values must remain valid will not write every intermediate keystroke directly into template state.

While focused, each such input maintains a local string draft. This permits temporary states such as an empty string, a minus sign, or a partially typed number.

Commit rules:

- Blur commits a valid draft.
- Enter commits a valid draft and ends editing.
- Escape discards the draft and restores the previous committed value.
- Empty, malformed, non-finite, or out-of-range drafts restore the previous committed value on blur.
- Valid numeric values are rounded or clamped only according to that field's existing rules.
- External value changes refresh the displayed draft when the input is not actively being edited.
- Undo history receives one committed change rather than one entry per temporary keystroke.

### Fields covered

The shared draft-number behavior applies to:

- Block X and Y coordinates.
- Block width, height, square size, and z-index.
- Custom canvas width and height.
- Overlay margin and padding.
- Grid size.
- Text font size.
- Font weight.
- Any equivalent numeric inspector field added through the shared control.

The required template title uses the same draft/commit/revert principle for an empty value. Its server-side per-user uniqueness is still validated on save; a `409` keeps the editor dirty and shows the existing save error surface.

Optional free-text fields—including description, block text, URLs, alternative text, QR data, and barcode data—may remain empty and continue to update normally.

## Viewport-filling Editor Layout

On desktop, the editor becomes a true remaining-space layout:

- The page root occupies the available dynamic viewport height.
- Header and footer remain visible and consume only their intrinsic heights.
- The central editor region uses `min-height: 0` and fills all remaining space.
- The WYSIWYG workspace grid fills that central region instead of using a fixed `70vh` cap.
- The canvas viewport and right-side panel have equal height.
- Canvas overflow, zoom, and pan stay inside the canvas viewport.
- The active Commands, Canvas, or Block panel scrolls independently within the right-side panel.
- Page-level scrolling is avoided on desktop while editor-internal scrolling remains available.

On smaller screens, the editor remains in document flow. Canvas and panel content must not be forced into a compressed desktop-height split.

## Right-panel Tabs

The Commands, Canvas, and Block tab titles become text-only.

- Remove their title icons.
- Preserve the existing three-tab structure and panel content.
- Keep clear selected, hover, focus-visible, and disabled states.
- Preserve `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and the corresponding tab panel relationship.
- Keep touch targets large enough for mobile use.

No other icons in the Commands content, canvas controls, block inspector, toolbar, previews, or exports are removed.

## State and Data Flow

- Canvas zoom, Fit mode, and pan position remain local to `EditorCanvas`.
- Template title and description remain editor document state and flow through history and save operations.
- Numeric drafts remain local to their input controls until committed.
- Template ownership is derived only from the authenticated server session; the browser never sends or chooses `userId`.
- Metadata preview records remain session-only and unaffected by this work.
- Canvas block coordinates remain template data and may be outside canvas dimensions.

## Error and Edge States

- Zoom controls disable at the 25% and 400% limits.
- Fit handles very large and very small canvases without producing an invalid or zero scale.
- Pointer zoom works when the canvas is partially scrolled.
- Panning ends cleanly on pointer release, pointer cancellation, or lost capture.
- Spacebar does not trigger panning while focus is in an input, textarea, select, or editable region.
- A fully or partially off-canvas selected block retains usable selection chrome within the editor viewport.
- Invalid drag payloads do nothing.
- Failed saves preserve dirty state and user-entered title/description drafts.
- Duplicate titles are rejected only for the same owner.
- Cross-user get, update, and delete requests reveal no template data.
- Empty descriptions and descriptions at the 500-character limit save successfully; longer values are rejected with a clear validation error.

## Accessibility

- Zoom controls have accessible names and communicate the current percentage as text.
- Fit and zoom buttons are keyboard reachable with visible focus indicators.
- Panning is an enhancement; scrollbars and zoom buttons provide non-gesture alternatives.
- Cursor changes are reinforced by control labels and are not the sole indication of state.
- Draft inputs retain native labels and expose numeric constraints.
- Invalid save errors remain available through the editor's visible error surface.
- Text-only panel tabs retain full keyboard and ARIA tab semantics.
- Existing reduced-motion behavior remains respected; zoom and pan do not require decorative animation.

## Acceptance Criteria

1. A user can zoom from 25% to 400%, return to Fit, zoom toward the pointer, and pan without modifying template data.
2. Block content remains clipped at the canvas edge while selected borders and handles remain visible outside it.
3. Dragging Add block onto an empty canvas creates one block at the intended location.
4. Two users can use the same template title, while duplicate titles for one user return `409`.
5. Users cannot list, read, update, or delete another user's templates.
6. Existing templates survive migration and belong to the selected admin/fallback user.
7. Template descriptions can be edited, saved, loaded, and displayed in the list.
8. Required and numeric inputs can be temporarily cleared; invalid drafts revert on blur without corrupting editor state.
9. Desktop canvas and right panel fill equal remaining viewport height and scroll internally.
10. Commands, Canvas, and Block tab titles contain text but no icons.
11. Existing WYSIWYG/code modes, metadata preview behavior, undo/redo, generated code, PNG export, and print remain functional.

## Verification Strategy

- Unit-test zoom clamping, preset stepping, coordinate preservation, and draft parsing/commit helpers.
- Unit-test template validation and owner-scoped service behavior, including same-user conflicts and cross-user denial.
- Add interaction coverage for empty-canvas drop, zoom controls, pan gestures, off-canvas selection chrome, input commit/revert, and tab semantics.
- Run API and web type checks, lint, production builds, and Prisma schema validation.
- Perform one bounded desktop and mobile visual review of the finished editor, then one confirmation pass after any resulting corrections.
