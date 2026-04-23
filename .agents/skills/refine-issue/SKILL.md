# Refine Issue Skill

You are refining a GitHub issue or vague requirement into an implementation-ready brief for the **cyfor-ai-workshop** repository — a booking/resource management app built as a Hono API + React frontend monorepo.

## Stack context

| Layer | Tech |
|-------|------|
| API | Hono + `@hono/zod-openapi` + Prisma + SQLite |
| Web | React 19 + Vite + TailwindCSS v4 + React Query |
| Client generation | Orval (reads `api/openapi.json`) |

---

## How to invoke this skill

1. Read the issue title, body, and any linked comments.
2. **If the issue is ambiguous**, ask the user targeted follow-up questions before writing the brief. Ask only what you genuinely cannot infer. Group related questions together. Wait for answers before proceeding.
3. Once you have enough information, produce the refined brief as a **single Markdown document** (see output format below).

### When to ask follow-up questions

Ask if any of the following are unclear:

- Who is the user or role affected?
- What is the desired outcome (not just the feature)?
- Are there constraints on validation, permissions, or data shape?
- Does this touch the database (new model, new field, migration)?
- Is the generated API client (`web/src/api/`) expected to change?
- Are there known edge cases or exceptional inputs?
- What is explicitly **out of scope**?

Do not ask about things you can reasonably infer from the issue or codebase context.

---

## Output format

Produce the following sections in order. Keep each section concise — prefer bullet points over prose.

```markdown
## Problem statement

One or two sentences. What is broken or missing, and why it matters.

## Affected user / role

Who experiences this problem or uses this feature.

## User story

> As a [role], I want to [action], so that [outcome].

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] ...

Each criterion must be specific and verifiable (testable with a unit or integration test, or observable in the UI).

## Non-goals

What this issue explicitly does **not** cover. Prevents scope creep.

## Assumptions

Facts assumed to be true that were not stated in the issue. Flag these clearly so they can be challenged.

## Hidden business rules

Implicit rules the implementation must respect (e.g. "title must be ≤ 120 chars", "only owners can delete").
Reference existing Zod schemas or Prisma models where relevant.

## Edge cases & validation rules

Inputs or states that require special handling. Examples:
- Empty string vs. null
- Duplicate entries
- Max-length boundaries
- Concurrent updates

## Impacted parts of the system

Check all that apply and briefly describe the change:

- [ ] `api/src/app.ts` — new or changed route
- [ ] `api/src/prisma/schema.prisma` — model or field change (requires migration)
- [ ] `api/openapi.json` — regenerate after route/schema changes (`npm run generate`)
- [ ] `web/src/api/` — generated client will change (do not edit manually)
- [ ] `web/src/` — UI component or hook change
- [ ] Tests — new test cases needed (see `write-tests` skill)
```
