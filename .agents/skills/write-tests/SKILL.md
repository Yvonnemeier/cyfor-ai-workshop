# Test-writing skill

You are writing tests for the **cyfor-ai-workshop** repository.
This is a Hono API + React frontend monorepo with no tests yet; use **Vitest** for both workspaces.

## Stack context

| Layer | Tech |
|-------|------|
| API | Hono + `@hono/zod-openapi` + Prisma + SQLite |
| Web | React 19 + Vite + Vitest + `@testing-library/react` |
| Client generation | Orval (reads `api/openapi.json`) |

---

## API tests (`api/`)

### Setup

Install once if not present:

```bash
npm install --save-dev vitest @types/node --workspace api
```

Add to `api/package.json`:

```json
"test": "vitest run"
```

Create `api/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node' } })
```

### How to test routes

Use `app.request()` — no real server needed:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { app } from '../src/app.js'
import { prisma } from '../src/db.js'

vi.mock('../src/db.js', () => ({
  prisma: {
    item: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

const mockedPrisma = vi.mocked(prisma)
```

### What to test

- **Happy path** — correct status code and response shape.
- **Validation errors** — missing required fields, values out of range (e.g. title > 120 chars) return 4xx.
- **404 paths** — PATCH / DELETE on a non-existent ID returns `{ error: '...' }` with status 404.
- **Edge values** — empty string title, max-length description, null-able fields (`description`, `resourceType`).

### Example: list route

```ts
it('GET /items returns 200 with items array', async () => {
  const fakeItem = {
    id: 1, title: 'Room A', description: null, resourceType: null, createdAt: new Date()
  }
  mockedPrisma.item.findMany.mockResolvedValue([fakeItem])

  const res = await app.request('/items')
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.items).toHaveLength(1)
  expect(body.items[0].title).toBe('Room A')
})
```

### Example: validation

```ts
it('POST /items rejects a title that exceeds 120 chars', async () => {
  const res = await app.request('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'x'.repeat(121) })
  })
  expect(res.status).toBe(400)
})
```

---

## Web tests (`web/`)

### Setup

Install once if not present:

```bash
npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event jsdom --workspace web
```

Add to `web/package.json`:

```json
"test": "vitest run"
```

Add to `web/vite.config.ts` (or create `web/vitest.config.ts`):

```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test-setup.ts'
}
```

Create `web/src/test-setup.ts`:

```ts
import '@testing-library/jest-dom'
```

### How to test components

Mock generated API hooks (`web/src/api/`) at the module level — never import the real generated client in tests:

```ts
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import App from '../App'

vi.mock('./api', () => ({
  useGetItems: vi.fn(),
  usePostItems: vi.fn(),
  useDeleteItemsId: vi.fn(),
  usePatchItemsId: vi.fn(),
  getGetItemsQueryKey: vi.fn().mockReturnValue(['items']),
}))
```

Wrap components that use React Query in a `QueryClientProvider`:

```ts
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
)
```

### What to test

- **Loading state** — spinner / placeholder text while `isPending` is true.
- **Empty state** — "No resources yet." when items array is empty.
- **Renders items** — title, resourceType badge, and description appear.
- **Form validation** — "Add resource" button is disabled when title is blank.
- **Mutations** — clicking Remove calls `deleteMutation.mutate` with the correct ID.

---

## General guidelines

1. **One assertion group per behaviour** — each `it` block tests one thing.
2. **Prefer `screen.getByRole` / `getByText`** over implementation details.
3. **Never test generated files** (`web/src/api/`) — they are auto-generated; mock them instead.
4. **Reset mocks** between tests with `beforeEach(() => vi.clearAllMocks())`.
5. **Co-locate test files** — `*.test.ts` alongside the source file, or in a `__tests__/` folder in the same workspace.
6. **Do not add real database calls** in tests — always mock `prisma` in API tests.
