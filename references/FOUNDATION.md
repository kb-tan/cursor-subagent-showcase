
> **SCHEMA CONTRACT**
> Agents locate information in this file by exact section heading and column name.
> Do not rename sections. Do not reorder columns within tables.
> Required sections: `Tech Stack`, `Project Scaffold`, `Dev Server`, `NPM Scripts`, `Test Toolchain`, `Styling Rules`
> Phase 0 validation: SKILL.md reads this file first and halts if any required section is missing.

# FOUNDATION.md

## Table of Contents
| # | Section | Purpose |
|---|---------|---------|
| 1 | Tech Stack | Languages, frameworks, runtimes |
| 2 | Project Scaffold | Required files and folder structure |
| 3 | Dev Server | How to start, ports, health check |
| 4 | NPM Scripts | All runnable commands |
| 5 | Test Toolchain | Test frameworks, config, conventions |
| 6 | Styling Rules | CSS variable conventions |

---

## 1. Tech Stack
| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Frontend build | Vite 5 |
| Backend runtime | Node.js + Express |
| Agent framework | LangGraph.js |
| Job queue | p-queue |
| Persistence | SQLite via `better-sqlite3` |
| Real-time | Server-Sent Events (SSE) |
| Package manager | npm |

---

## 2. Project Scaffold
Required files — create if missing, never overwrite if correct:

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | Vite config — proxies `/api` to backend |
| `tsconfig.json` | TypeScript config (frontend) |
| `tsconfig.server.json` | TypeScript config (backend) |
| `index.html` | HTML entry point |
| `src/main.tsx` | React mount point |
| `src/App.tsx` | Root component |
| `src/styles/tokens.css` | Design tokens as CSS variables |
| `src/types/events.ts` | Single source of truth for all event types |
| `src/dispatch/dispatchLayer.ts` | Frontend SSE event router |
| `src/utils/logger.ts` | Frontend structured logger |
| `server/index.ts` | Express entry point |
| `server/logger.ts` | Backend structured logger |
| `scripts/init-db.sql` | SQLite schema |
| `playwright.config.ts` | E2E test config |
| `vitest.config.ts` | Unit test config |

Folder structure:
```
src/
  components/[ComponentName]/
    [ComponentName].tsx
    [ComponentName].css
    [ComponentName].test.tsx
  dispatch/
  styles/
  types/
  utils/
server/
  agent/tools/
  queue/
  routes/
  sse/
e2e/
scripts/
```

---

## 3. Dev Server
| | Frontend | Backend |
|---|---|---|
| Command | `npm run dev:frontend` | `npm run dev:backend` |
| Default port | `5173` | `3001` |
| Base URL | `http://localhost:5173` | `http://localhost:3001` |
| Health check | — | `GET /api/health` → `{ status: "ok" }` |

> Ports are defaults. If changed, update here — agents read from this section.

---

## 4. NPM Scripts
| Script | Command |
|--------|---------|
| `dev:frontend` | `vite` |
| `dev:backend` | `tsx watch server/index.ts` |
| `build` | `tsc && vite build` |
| `init-db` | `sqlite3 review_history.db < scripts/init-db.sql` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:api` | `vitest run --project api` |
| `test:e2e` | `playwright test` |
| `test:all` | `npm test && npm run test:api && npm run test:e2e` |

---

## 5. Test Toolchain
| Tool | Purpose | Scope | When |
|------|---------|-------|------|
| Vitest + React Testing Library | Unit tests — co-located with components | `unit` | Every component loop |
| MSW | Mock SSE and API in unit tests | `unit` | Every component loop |
| Supertest | API contract tests — no browser | `api` | Integration pass |
| Playwright | E2E tests — full stack, real browser | `e2e` | Integration pass |

> The `Scope` column is the authoritative mapping agents use to determine which test level each tool covers.
> Tester reads this table to decide which commands to run per operating mode.
> Playwright starts both servers automatically via `webServer` config.
> Use `reuseExistingServer: true` — reuses already-running servers.

Unit test files live next to the component they test:
```
src/components/Toast/Toast.tsx
src/components/Toast/Toast.test.tsx   ← same folder
```

---

## 6. Styling Rules
- All values come from CSS variables in `src/styles/tokens.css`
- Token definitions live in `references/DESIGN_TOKENS.md`
- No CSS-in-JS, no UI component libraries
- Never use raw pixel values — always use a token
