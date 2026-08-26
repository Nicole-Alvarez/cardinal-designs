# Template Ownership and Descriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make templates private to their authenticated creator, scope title uniqueness per user, preserve existing templates, and add editable descriptions.

**Architecture:** Add an owner relation and description to Prisma, backfill existing rows to a deterministic user, and pass the authenticated user ID through routes into owner-scoped services. Extend the existing frontend template state and list without letting the browser choose ownership.

**Tech Stack:** Prisma 6, PostgreSQL, Express 4, TypeScript, Vitest, Next.js 16, React 19.

**Spec:** `docs/superpowers/specs/2026-08-26-template-editor-workspace-design.md`

## Global Constraints

- Existing templates belong to the oldest admin, falling back to the oldest user.
- Existing templates must never be silently deleted or orphaned.
- Title uniqueness is trimmed, case-sensitive, and scoped to `(userId, title)`.
- Cross-user template access returns `404`.
- Description is stored as a trimmed string with a 500-character maximum and `""` default.
- The client never sends or selects `userId`.
- Do not commit unless the user explicitly authorizes a Git commit.

---

### Task 1: Add API test infrastructure and failing ownership tests

**Files:**
- Modify: `api/package.json`
- Modify: `api/yarn.lock`
- Create: `api/src/services/template.service.test.ts`

**Interfaces:**
- Consumes: current `template.service.ts` exports.
- Produces: an executable Vitest suite defining the new owner-scoped service contract.

- [ ] **Step 1: Install the API test runner and add the script**

Run:

```bash
cd api && yarn add --dev vitest
```

Add to `api/package.json` scripts:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write failing owner-scope and description tests**

Create `api/src/services/template.service.test.ts` with a hoisted Prisma mock. Cover these exact calls:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  template: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../prisma", () => ({ default: prisma }));

import { create, getById, list, remove, update } from "./template.service";

describe("template ownership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists only templates owned by the authenticated user", async () => {
    prisma.template.findMany.mockResolvedValue([]);
    await list("user-a");
    expect(prisma.template.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-a" } })
    );
  });

  it("returns 404 when the owner-scoped lookup misses", async () => {
    prisma.template.findFirst.mockResolvedValue(null);
    await expect(getById("template-a", "user-b")).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prisma.template.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "template-a", userId: "user-b" } })
    );
  });

  it("assigns ownership and an empty description on create", async () => {
    prisma.template.create.mockResolvedValue({ id: "template-a" });
    await create("user-a");
    expect(prisma.template.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-a", description: "" }),
      })
    );
  });

  it("trims a valid description", async () => {
    prisma.template.update.mockResolvedValue({ id: "template-a" });
    await update("template-a", "user-a", { description: "  Member card  " });
    expect(prisma.template.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "template-a", userId: "user-a" },
        data: { description: "Member card" },
      })
    );
  });

  it("rejects descriptions longer than 500 characters", async () => {
    await expect(
      update("template-a", "user-a", { description: "x".repeat(501) })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("deletes by template ID and owner ID", async () => {
    prisma.template.delete.mockResolvedValue({ id: "template-a" });
    await remove("template-a", "user-a");
    expect(prisma.template.delete).toHaveBeenCalledWith({
      where: { id: "template-a", userId: "user-a" },
    });
  });
});
```

- [ ] **Step 3: Run the tests and verify the new contract fails**

Run:

```bash
cd api && yarn test src/services/template.service.test.ts
```

Expected: FAIL because `list`, `getById`, `create`, `update`, and `remove` do not yet accept owner IDs or descriptions.

---

### Task 2: Add the owner and description database migration

**Files:**
- Modify: `api/prisma/schema.prisma`
- Create: `api/prisma/migrations/<timestamp>_add_template_owner_description/migration.sql`

**Interfaces:**
- Produces: `Template.userId`, `Template.user`, `Template.description`, `User.templates`, and unique `(userId, title)`.

- [ ] **Step 1: Update the Prisma models**

Use these model fields and indexes:

```prisma
model User {
  // existing fields
  templates Template[]
}

model Template {
  id          String   @id @default(cuid())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  title       String
  description String   @default("")
  content     Json?
  html        String?
  react       String?
  angular     String?
  isCode      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, title])
  @@index([userId])
}
```

- [ ] **Step 2: Generate a migration without applying it and replace its SQL with the safe backfill**

Run:

```bash
cd api && yarn prisma migrate dev --create-only --name add_template_owner_description
```

The migration SQL must perform these operations in order:

```sql
ALTER TABLE "Template"
  ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "userId" TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Template") AND NOT EXISTS (SELECT 1 FROM "User") THEN
    RAISE EXCEPTION 'Cannot assign existing templates because no user exists';
  END IF;
END $$;

UPDATE "Template"
SET "userId" = (
  SELECT "id"
  FROM "User"
  ORDER BY CASE WHEN "role" = 'admin' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
)
WHERE "userId" IS NULL;

ALTER TABLE "Template" ALTER COLUMN "userId" SET NOT NULL;
DROP INDEX "Template_title_key";
CREATE UNIQUE INDEX "Template_userId_title_key" ON "Template"("userId", "title");
CREATE INDEX "Template_userId_idx" ON "Template"("userId");
ALTER TABLE "Template"
  ADD CONSTRAINT "Template_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Validate and generate the Prisma client**

Run:

```bash
cd api && yarn prisma validate && yarn prisma generate
```

Expected: both commands exit 0.

---

### Task 3: Implement owner-scoped template services

**Files:**
- Modify: `api/src/services/template.service.ts`

**Interfaces:**
- Produces:
  - `list(userId: string): Promise<TemplateSummary[]>`
  - `getById(id: string, userId: string): Promise<Template>`
  - `create(userId: string): Promise<Template>`
  - `update(id: string, userId: string, input: UpdateTemplateInput): Promise<Template>`
  - `remove(id: string, userId: string): Promise<void>`

- [ ] **Step 1: Add description to public selections and validation**

Add `description: true` to `publicColumns` and `TemplateSummary`. Add `description?: unknown` to `UpdateTemplateInput`. Normalize with:

```ts
function normalizeDescription(value: unknown): string {
  if (typeof value !== "string") {
    throw new TemplateError("Description must be a string");
  }
  const description = value.trim();
  if (description.length > 500) {
    throw new TemplateError("Description must be 500 characters or fewer");
  }
  return description;
}
```

- [ ] **Step 2: Scope every Prisma query by owner**

Use these query shapes:

```ts
prisma.template.findMany({
  where: { userId },
  select: { id: true, title: true, description: true, createdAt: true, updatedAt: true },
  orderBy: { updatedAt: "desc" },
});

prisma.template.findFirst({
  where: { id, userId },
  select: publicColumns,
});

prisma.template.create({
  data: { userId, title: `Untitled-${randomSuffix()}`, description: "" },
  select: publicColumns,
});

prisma.template.update({
  where: { id, userId },
  data,
  select: publicColumns,
});

prisma.template.delete({ where: { id, userId } });
```

Retain the existing `P2002` to `409` and `P2025` to `404` translations. Set `data.description = normalizeDescription(input.description)` only when description is provided.

- [ ] **Step 3: Run the focused service tests**

Run:

```bash
cd api && yarn test src/services/template.service.test.ts
```

Expected: PASS.

---

### Task 4: Pass the authenticated owner through template routes

**Files:**
- Modify: `api/src/routes/template.routes.ts`

**Interfaces:**
- Consumes: `req.user.id` established by `requireAuth`.
- Produces: routes that never call a template service without an owner ID.

- [ ] **Step 1: Replace every service call with an owner-scoped call**

Use `req: Request` for the list handler and call:

```ts
await list(req.user!.id);
await create(req.user!.id);
await getById(req.params.id, req.user!.id);
await update(req.params.id, req.user!.id, req.body ?? {});
await remove(req.params.id, req.user!.id);
```

Do not read `userId` from params, query strings, or request bodies.

- [ ] **Step 2: Run API verification**

Run:

```bash
cd api && yarn test && yarn build
```

Expected: tests pass and TypeScript compilation exits 0.

---

### Task 5: Carry descriptions through frontend types, history, save, and list UI

**Files:**
- Modify: `web/features/templates/types.ts`
- Modify: `web/features/templates/queries.ts`
- Modify: `web/features/templates/use-history.ts`
- Modify: `web/features/templates/[id]/template-editor-page.tsx`
- Modify: `web/components/dashboard/templates/templates-table.tsx`

**Interfaces:**
- Produces: `TemplateSummary.description: string`, `Template.description: string`, and `TemplateSnapshot.description: string`.

- [ ] **Step 1: Extend frontend types and payloads**

Add `description: string` to `TemplateSummary`; `Template` inherits it. Add `description?: string` to `UpdateTemplateInput`. Add `description: string` to `TemplateSnapshot`.

- [ ] **Step 2: Add description to editor document state and history**

In `TemplateEditorPage`, add:

```ts
const [description, setDescription] = useState("");
```

Load `template.description`, include description in `history.setCurrent`, `snapshot`, `applySnapshot`, both WYSIWYG and code save payloads, and the relevant effect dependency arrays. A description edit calls `checkpoint("description")`, updates state, and marks dirty.

- [ ] **Step 3: Render the optional description field below the title**

Group title and description in a flexible header column. Use:

```tsx
<input
  value={description}
  onChange={(event) => handleDescriptionChange(event.target.value)}
  maxLength={500}
  aria-label="Template description"
  placeholder="Add a short description"
/>
```

Keep save and mode actions aligned and usable at narrow widths.

- [ ] **Step 4: Show descriptions in the template list**

Replace `Open template editor` with:

```tsx
{template.description || "No description"}
```

Preserve truncation, muted styling, and existing title/action behavior.

- [ ] **Step 5: Run frontend verification**

Run:

```bash
cd web && yarn lint && yarn tsc --noEmit && yarn next build --webpack
```

Expected: all commands exit 0 and `/dashboard/templates` plus `/dashboard/templates/[id]` build successfully.

---

### Task 6: Verify migration and user isolation against a disposable database

**Files:**
- No source changes unless verification exposes a defect.

**Interfaces:**
- Verifies the migration and API contract end to end.

- [ ] **Step 1: Apply the migration in a disposable or approved development database**

Run only against a database approved for migration testing:

```bash
cd api && yarn prisma migrate deploy
```

- [ ] **Step 2: Verify ownership and uniqueness cases**

Confirm with two test users:

1. Existing templates belong to the selected admin/fallback user.
2. User A and User B can each save `Member Card`.
3. User A cannot save a second `Member Card` and receives `409`.
4. User B receives `404` for User A's template ID on get, update, and delete.
5. A 500-character description saves; 501 characters returns `400`.

- [ ] **Step 3: Record the checkpoint without committing**

Run:

```bash
git diff --check && git status --short
```

Expected: no whitespace errors; only intended ownership/description files and generated migration changes are present.
