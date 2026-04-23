# PR Review Skill

You are reviewing a pull request in the **cyfor-ai-workshop** repository.
This is a booking/resource management app — a Hono API + React frontend monorepo.

## Stack context

| Layer | Tech |
|-------|------|
| API | Hono + `@hono/zod-openapi` + Prisma + SQLite |
| Web | React 19 + Vite + TailwindCSS v4 + React Query |
| Client generation | Orval (reads `api/openapi.json`) |

## How to invoke this skill

Fetch the PR diff, files, and any comments, then apply the checklist below.
Use the GitHub tools available to you (list files, get diff, read comments, check CI status).

## Review checklist

### 1. API ↔ frontend sync
- If a route, field, or schema changed in `api/src/app.ts`, confirm `npm run generate` was run and the generated files in `web/src/api/` reflect the change.
- Generated files (`web/src/api/`) must **never** be edited manually — flag any direct edits.
- `api/openapi.json` must be committed and up to date with the code.

### 2. Schema & validation
- New Zod schemas must call `.openapi('SchemaName')` so they appear in the spec.
- Input constraints (`.min()`, `.max()`, `.trim()`, `.nullish()`) must match the domain:
  - `title`: 1–120 chars, trimmed
  - `description`: ≤500 chars, nullable
  - `resourceType`: ≤60 chars, nullable
- Path params must use `z.coerce.number().int().positive()`.
- Query params should be validated with Zod (not raw `c.req.query()`).

### 3. Database
- Prisma schema changes must include a migration / `prisma:sync` step in the PR description.
- Never instantiate `PrismaClient` outside `api/src/db.ts`.

### 4. TypeScript correctness
- Both workspaces use ESM; relative imports in `api/` must use `.js` extensions.
- Run `npm run typecheck` — flag PRs that skip this.

### 5. Correctness & edge cases
- 404 handlers: routes that look up a resource by ID should return `{ error: '...' }` with status 404 when not found.
- Mutations should not silently ignore validation errors.
- Check for off-by-one errors, missing `await`, or unhandled promise rejections.

### 6. Scope & reviewability
- Prefer small, focused PRs. Flag PRs that mix unrelated concerns.
- Generated file churn (Orval output) should not obscure real changes — check that only necessary generated lines changed.

### 7. Security basics
- CORS origins must not be hardcoded to `*` in production paths.
- No secrets or credentials committed.

## Output format

Provide a concise review with three sections:

1. **Summary** — one paragraph describing what the PR does.
2. **Issues** — bullet list of problems found (label each: `blocking` / `minor` / `nit`).
3. **Verdict** — one of: `Approve`, `Request changes`, or `Comment` — with a one-sentence rationale.

If no issues are found, say so explicitly and approve.
