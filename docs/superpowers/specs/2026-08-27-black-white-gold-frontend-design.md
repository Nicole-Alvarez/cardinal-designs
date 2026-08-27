# Black, White, and Gold Frontend Design

**Status:** Approved direction, pending written-spec review

**Date:** 2026-08-27

## Goal

Modernize Cardinal Designs into a cohesive, premium creative-productivity application using a restrained black, white, and gold visual system. Improve hierarchy, comprehension, workspace focus, responsive behavior, and interaction polish without changing backend contracts, template data, authentication, or working editor mechanics.

The product should feel immediately understandable to a first-time user. The design must make the next action obvious, keep the template canvas visually dominant, and preserve the accessibility, performance, and preview-security work already completed.

## Product Mode and Design Character

The authenticated application and template editor use **Operate** mode: clarity, scanability, predictable interaction, and efficient task completion take priority over decorative expression.

The public gallery uses a restrained **Persuade/Experience** mode while sharing the same product tokens and typography.

The chosen visual direction is a **dark creative studio**:

- Dark product chrome and tonal near-black surfaces frame the work.
- White and warm neutral text provide hierarchy and clarity.
- Muted gold identifies primary actions, selection, focus, and important state.
- Card canvases remain visually independent from the application theme.
- Semantic red, amber, and green remain reserved for destructive, warning, error, and success states.

The result must not resemble a casino, jewelry advertisement, cryptocurrency product, generic admin dashboard, or premade luxury theme. Gold is an accent, not a background treatment applied everywhere.

## Scope

This design covers:

1. Semantic color, surface, border, typography, focus, and interaction tokens.
2. Public home and gallery visual alignment.
3. Authenticated application shell and navigation.
4. A useful dashboard with clear creation and continuation paths.
5. Templates list, creation, loading, empty, error, and destructive states.
6. Template editor hierarchy, toolbar, canvas workspace, side panel, save state, preview, and export presentation.
7. Add, Canvas, Block, Preview data, and Settings information architecture.
8. Dialog, form, menu, tooltip, feedback, and selection consistency.
9. Intentional desktop, tablet, and mobile editor behavior.
10. Targeted performance improvements, including lazy loading of the full icon picker.

## Non-goals

- Changing backend APIs, service behavior, authentication, or database schemas.
- Reading or modifying environment secrets or rotating credentials.
- Replacing the custom editor or changing its document model.
- Changing drag, resize, zoom, pan, snapping, clipping, spacing, undo, or history behavior.
- Changing generated HTML, React, Angular, QR, barcode, print, PNG, or code-download behavior.
- Weakening the sandboxed HTML/React preview boundary.
- Adding analytics, statistics, charts, ornamental dashboard widgets, or speculative collaboration features.
- Adding a large animation, component, icon, or styling dependency.
- Pursuing a numerical audit score at the expense of product quality.

## Protected Foundations

The implementation must preserve:

- Opaque-origin sandboxed HTML and React previews.
- The absence of `allow-same-origin` on preview frames.
- Parent/frame message channel, source, payload, export, and dimension validation.
- Authenticated-parent isolation.
- Accessible dialog semantics, focus trapping, focus restoration, nested-dialog handling, and Escape behavior.
- Keyboard-accessible tabs and roving tab stops.
- Visible focus, accessible names, status announcements, and practical touch targets.
- Reduced-motion support.
- The generated icon catalog split and current lazy loading of expensive preview compilation.
- Geist Sans and Geist Mono typography.

Security and accessibility regression tests remain part of the release gate.

## Semantic Visual System

### Token strategy

Create reusable semantic CSS variables in `globals.css`. Components consume semantic roles rather than choosing raw gold or neutral values independently.

Token groups:

- `--app-bg`: deepest application background.
- `--surface-1`: main navigation and workspace chrome.
- `--surface-2`: panels, toolbars, and grouped controls.
- `--surface-3`: elevated menus, popovers, and dialogs.
- `--surface-selected`: restrained active or selected surface.
- `--text-primary`: important off-white text.
- `--text-secondary`: readable warm gray.
- `--text-muted`: tertiary information.
- `--border-subtle`: default structural separation.
- `--border-strong`: emphasized boundaries.
- `--accent`: primary muted gold.
- `--accent-hover`: lighter warm gold.
- `--accent-active`: deeper bronze-gold.
- `--accent-soft`: low-opacity selected background.
- `--accent-foreground`: near-black text used on filled gold controls.
- `--focus`: high-contrast pale gold focus indicator.
- Semantic success, warning, error, and destructive roles.

Token values must meet WCAG AA contrast for their intended text and control usage. Gold text uses a lighter accessible variant on dark surfaces. Filled gold buttons use near-black foreground text.

### Surface hierarchy

Use tonal contrast before borders and shadows:

1. Root background establishes the workspace.
2. Panels use a slightly lighter near-black surface.
3. Elevated menus and dialogs use the lightest dark surface with one subtle shadow.
4. Borders are used for structural separation, not to outline every group.
5. Gold borders appear only for focus, selection, or a truly emphasized state.

Avoid combining a border, shadow, background shift, and decorative glow when one or two cues are sufficient.

### Typography

- Retain Geist Sans and Geist Mono.
- Use sentence case for interface labels.
- Establish consistent page title, section title, control label, helper text, status, and code styles.
- Use weight and spacing for hierarchy before increasing font size.
- Keep body and helper copy concise and understandable without technical documentation.

### Motion

- Use short opacity, color, and transform transitions for panels, drawers, selections, and success feedback.
- Avoid ambient animation, gold glow, continuous motion, and layout-property animation.
- Loading indicators communicate real work and never conceal delays.
- Reduced-motion mode removes decorative movement while preserving immediate state changes.

## Application Shell and Navigation

### Desktop

- Use a persistent near-black sidebar with clear Cardinal Designs identity.
- Give the current route a gold-soft surface, gold indicator, and high-contrast text.
- Keep secondary navigation neutral and quiet.
- Add consistent existing iconography only when it improves recognition.
- Keep profile identity and logout separated at the bottom with lower visual priority.
- Use the main content background to distinguish application content from navigation without surrounding every page with a card.

### Mobile

- Retain the accessible modal navigation drawer.
- Style the drawer as the mobile form of the desktop navigation rather than a separate visual pattern.
- Keep a 44px menu trigger, visible close control, focus trap, Escape handling, and focus restoration.
- Keep the mobile top bar compact so it does not consume the working viewport.

## Dashboard

Replace the centered routing card with a purposeful start screen.

### Hierarchy

1. Concise greeting and product-purpose statement.
2. Primary `Create template` action.
3. Secondary `Browse designs` action.
4. Recent templates, loaded through the existing templates API.

### Recent templates

- Show a small, bounded list of the most recently updated templates.
- Each row exposes title, description when present, updated time, visibility, and an obvious continue/open action.
- Provide loading, empty, and recoverable error states.
- The dashboard remains useful when recent templates cannot load; creation and navigation must stay available.
- Do not add charts, usage statistics, decorative metrics, or filler cards.

Creating a template may reuse the existing frontend query and route flow. No new backend endpoint is introduced.

## Templates Experience

### Page header

- Remove the decorative violet/blue glow.
- Use a clean page heading, short purpose statement, template count, and one gold primary `Create template` action.
- Keep the header visually integrated with the page rather than placing it inside an oversized decorative card.

### Template collection

- Replace the traditional table appearance with a responsive editorial list.
- Make the title/description region and row affordance clearly open the template.
- Preserve visibility, updated date, and created date without giving them equal weight to the title.
- Remove the redundant open icon when the primary row link is already obvious.
- Place destructive deletion in a quiet, clearly named action that remains keyboard accessible.
- Retain the accessible confirmation dialog.

### States

- Use a layout-preserving skeleton matching the final list structure.
- Keep errors visible, concise, and recoverable with `Try again`.
- Make the empty state explain the value of a first template and provide the primary creation action.
- Creation feedback must remain announced and prevent duplicate requests without blocking unrelated navigation unnecessarily.

Template search and sorting remain optional until collection size justifies their permanent presence.

## Template Editor Information Architecture

### Workspace hierarchy

The canvas is the primary workspace. Toolbars and panels support it and visually recede.

Desktop composition:

- Compact document toolbar at the top.
- Full-height canvas workspace occupying the majority of width.
- Fixed-width contextual panel on the right.
- Collapsible output/preview/code region that does not permanently push the canvas down.
- Save state located near the Save action rather than duplicated across competing chrome.

### Document toolbar

Group controls in this order:

1. Back navigation, editable title, and description.
2. Canvas/side selector.
3. Visual/Code mode.
4. Undo and Redo.
5. Preview data and Settings.
6. Export/preview access where contextually appropriate.
7. Save button and save state.

The toolbar may use responsive grouping or an overflow menu, but primary Save, mode, and navigation controls remain discoverable.

### Right panel

The right panel retains three keyboard-accessible tabs:

- **Add**: direct content creation.
- **Canvas**: canvas dimensions and appearance.
- **Block**: selected-block content and style.

Preview data and Settings move out of Add because they affect the document rather than add canvas content.

### Add experience

Add exposes recognizable block types directly:

- Text
- Heading
- Image
- Icon
- Button
- QR code
- Barcode
- Divider
- Spacer

Selecting an item creates the correct block type, places it using the existing editor placement behavior, selects it, and opens Block editing. Existing drag-to-canvas behavior remains available where practical on pointer devices. Mobile emphasizes tap-to-add.

Add canvas remains associated with the canvas selector or Canvas panel rather than appearing as a content block.

### Block inspector

Organize controls into progressive groups:

1. Content and essential variant controls.
2. Position and size.
3. Appearance and typography.
4. Advanced spacing, border, and stacking controls.

Frequently used controls remain visible. Advanced controls use accessible disclosure rather than being removed. Selecting a single block automatically makes Block editing available; multiple selection retains the current explanatory state.

### Canvas

- Preserve all current zoom, pan, grid, spacing, snapping, distance, clipping, and selection-border behavior.
- Restyle view controls into compact tonal groups with gold only for active states.
- Keep the main canvas visibly distinct from dark editor chrome.
- Preserve unrestricted block geometry and visible selected chrome outside clipped content.
- Avoid decorative shadows that make the canvas appear detached from interaction guides.

### Save state

- Save remains an explicit primary action.
- `Saving`, `Saved`, `Unsaved changes`, and error states appear next to or within the Save control group.
- The persistent desktop footer is removed or reduced to contextual shortcuts only when enough viewport space exists.
- Mobile does not retain a sticky footer.
- Save errors remain announced and keep the document dirty.

### Preview and output

- Preview, generated code, print, PNG, copy, and download remain available.
- Present them in a collapsible lower workspace or dedicated panel rather than an always-expanded card below the editor.
- Preserve keyboard tab behavior and export feedback.
- Code mode retains its language tabs, undo/redo, Preview data, conversion disclaimer, sandboxed preview, and export actions.
- The preview sandbox architecture is not restyled internally in a way that weakens isolation.

## Dialogs, Forms, and Feedback

### Dialogs

- Continue using the shared accessible dialog primitive.
- Use a consistent elevated surface, title hierarchy, description measure, close control, and action footer.
- Primary actions use gold; cancel actions remain neutral; destructive actions remain semantic red.
- Nested privacy confirmation retains correct focus behavior.

### Forms

- Use shared visual treatments for text fields, text areas, selects, number inputs, color inputs, file controls, and validation messages.
- Gold focus is consistent and sufficiently contrasted.
- Labels remain visible; placeholders never replace labels.
- Preserve draft-safe input behavior and invalid-value restoration.

### Feedback

- Preserve live-region announcements for save, clipboard, upload, export, loading, error, and success states.
- Use concise copy and stable placement to avoid layout jumps.
- Loading controls retain their label while indicating progress.
- Destructive and permission-sensitive actions remain explicit and confirmed.

## Responsive Editor Behavior

### Desktop: 1024px and wider

- Full-height workspace.
- Canvas occupies roughly three quarters of the main editor width.
- Right panel occupies the remaining fixed or bounded width.
- Output panel is collapsible and does not compete with the canvas by default.
- Toolbar remains one compact visual system.

### Tablet: 768px to 1023px

- Canvas remains the main surface.
- Inspector opens as an overlay drawer rather than permanently compressing the canvas.
- Core toolbar actions remain visible; secondary document actions may enter an accessible overflow menu.
- Canvas controls stay reachable without covering the center of the work.

### Mobile: below 768px

- Compact top bar contains Back, title, save status/action, and More.
- A bottom action bar exposes Add, Edit, Canvas, and Preview.
- Add and inspector experiences open as accessible bottom sheets or full-height dialogs using the shared focus-management foundation.
- The canvas remains the initial and dominant viewport content.
- Code and output views use dedicated full-height panels.
- No sticky footer consumes canvas height.
- Touch controls remain at least 44px and do not depend on hover or drag.

Responsive changes must not simply stack every desktop panel into one long page.

## Public Home and Gallery

- Replace violet and pink decorative gradients with restrained neutral/gold details.
- Keep the product proposition, browse action, sign-in route, gallery filtering, About content, and footer navigation.
- Align buttons, focus, surfaces, tags, and typography with the application system.
- Let card artwork remain colorful; the surrounding interface stays neutral.
- Reduce generic feature-card repetition where typography and spacing communicate structure sufficiently.
- Preserve search labels, pressed filter states, touch targets, and the current no-results state.

## Performance

- Do not add visual or animation dependencies.
- Keep UI icons on the small generated catalog.
- Dynamically load the full icon picker only when an icon block is selected or created.
- Keep Babel/compiler loading inside the isolated preview route and only when React preview is required.
- Avoid expensive blur, filter, and shadow effects across large workspace areas.
- Prefer CSS transitions on opacity, color, and transforms.
- Avoid unnecessary state or data-model changes solely for styling.

## Accessibility

- Maintain WCAG AA contrast for text, controls, borders required for perception, focus, and semantic states.
- Gold is never the sole state indicator; active and selected controls also use shape, fill, text, or ARIA state.
- Preserve logical heading order and landmarks.
- Maintain keyboard access to navigation, tabs, drawers, dialogs, menus, editor controls, and disclosures.
- Preserve focus trapping/restoration and visible focus.
- Keep errors and asynchronous status changes announced.
- Retain alternative interaction paths for drag, pan, and gesture enhancements.
- Verify at 200% text zoom and representative desktop, tablet, and mobile viewports.

## Error and Edge States

- Dashboard recent-work failure does not block creation or global navigation.
- Templates loading, empty, failure, deletion, and creation states retain equivalent functionality.
- Long template titles and descriptions truncate or wrap without hiding the primary action.
- Editor save errors preserve dirty state and user content.
- Mobile drawers and sheets close on Escape where a keyboard exists and restore focus to their opener.
- Missing block selection explains how to begin without presenting disabled advanced controls as the primary content.
- Icon-picker loading has a bounded fallback that does not block other inspector controls.
- Reduced-motion mode preserves state visibility without animated transitions.
- Dark application chrome never changes exported canvas colors or template content.

## Expected Component Changes

### Design system and shell

- `web/app/globals.css`
- `web/components/dashboard/app-shell.tsx`
- `web/components/dashboard/app-sidebar.tsx`
- Existing shared dialog, tooltip, and control primitives where token consumption is needed.

### Dashboard and templates

- `web/features/dashboard/dashboard-page.tsx`
- `web/features/templates/templates-page.tsx`
- `web/components/dashboard/templates/templates-table.tsx`

### Editor

- `web/features/templates/[id]/template-editor-page.tsx`
- `web/components/dashboard/templates/editor-canvas.tsx`
- `web/components/dashboard/templates/editor-commands.tsx`
- `web/components/dashboard/templates/canvas-selector.tsx`
- `web/components/dashboard/templates/canvas-panel.tsx`
- `web/components/dashboard/templates/block-inspector.tsx`
- `web/components/dashboard/templates/code-editor-panel.tsx`
- `web/components/dashboard/templates/code-output.tsx`
- `web/components/dashboard/templates/template-editor-footer.tsx`
- Dialog, form, export, feedback, and icon-picker components used by those surfaces.

### Public experience

- Existing home Hero, Search, Gallery, About, and Footer components.

Tests will change only where structure, labels, or responsive presentation changes while preserving behavioral assertions.

## Implementation Order

### P0: guardrails and tokens

1. Lock existing preview sandbox and accessible-dialog behavior with regression coverage.
2. Add contrast-tested semantic visual tokens and shared interaction patterns.
3. Verify that token application cannot affect canvas export content.

### P1: core application experience

1. Apply the new shell and navigation system.
2. Build the useful dashboard and recent-template continuation path.
3. Simplify the Templates hierarchy and responsive collection presentation.
4. Recompose the editor toolbar and workspace around a dominant canvas.
5. Convert Add into a direct block-type picker.
6. Move Preview data and Settings to document-level actions.
7. Consolidate save state and make output/preview contextual.
8. Implement intentional tablet drawers and mobile bottom-sheet workflows.

### P2: system consistency and polish

1. Apply tokens to dialogs, forms, menus, tooltips, states, and public pages.
2. Normalize interaction and feedback states.
3. Add templates skeletons and stable loading transitions.
4. Lazy-load the full icon picker.
5. Reduce redundant surfaces, borders, shadows, and gradients.
6. Add restrained reduced-motion-safe transitions.

### P3: optional follow-up

- Template search and sorting when collection size warrants them.
- First-use hints and contextual shortcut discovery.
- Higher-quality template thumbnails if available without backend changes.

## Acceptance Criteria

1. The authenticated product uses a cohesive token-driven black, white, and restrained gold visual system.
2. All primary actions, active states, selected states, and focus indicators use consistent semantic roles and maintain WCAG AA contrast.
3. The dashboard offers immediate template creation and recent-work continuation without decorative filler.
4. The Templates page clearly prioritizes template identity, open/continue, and creation over table metadata.
5. The editor canvas is visually and spatially dominant on desktop, tablet, and mobile.
6. Add allows direct creation of each supported block type.
7. Preview data and Settings are document-level actions rather than Add items.
8. Mobile editing uses canvas-first controls and accessible sheets instead of a vertically stacked desktop layout.
9. Save state is clear, singular, announced, and located near Save.
10. Output, preview, export, print, copy, and download remain discoverable and functional without permanently crowding the canvas.
11. Existing accessibility behavior does not regress.
12. Existing sandbox attributes, opaque-origin isolation, message validation, and export payload validation do not regress.
13. Existing backend APIs, authentication, schema, template data, editor mechanics, and export dimensions remain unchanged.
14. The full icon catalog does not return to shared application chunks and loads only when needed in the editor.
15. Automated tests, TypeScript, ESLint, and a production build pass.
16. A bounded visual review covers desktop, tablet, and mobile, followed by no more than one confirmation pass.

## Verification Strategy

- Add or update unit and interaction tests before each behavioral or structural change.
- Verify sandbox iframe attributes and message guards explicitly.
- Verify dialogs, drawers, bottom sheets, tab keyboard navigation, focus restoration, and announcements.
- Test dashboard and Templates loading, empty, error, retry, creation, and deletion states.
- Test direct block-type creation and inspector selection behavior.
- Test responsive component state and accessible names without relying solely on CSS snapshots.
- Run the full web test suite, TypeScript check, ESLint, and production build.
- Check the final diff for unrelated backend, schema, authentication, environment, or generated-file changes.
- Compare production JavaScript chunks to ensure the icon optimization remains intact.
- Run one Impeccable detector/audit pass after implementation and verify each finding in context.
- If existing browser tooling is available, review the dashboard, Templates page, and editor at representative desktop, tablet, and mobile widths without installing a heavy dependency solely for screenshots.
