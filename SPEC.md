
# SPEC.md

## 1. References
| Document | Path | Contains |
|----------|------|---------|
| Foundation | `./references/FOUNDATION.md` | Stack, scaffold, dev server, scripts, test toolchain |
| Architecture | `./references/ARCHITECTURE.md` | API contracts, events, queue, agent, logging, integration tests |
| Design Tokens | `./references/DESIGN_TOKENS.md` | All visual values as CSS variables |
| Wireframe | `./assets/wireframe-reference.png` | Visual source of truth for all UI zones |

---

## 2. Overview
A full-stack agentic TODO application. Users interact via a single always-visible chat input bar to create, update, delete, and query todo items. Agent responses surface as toast notifications. The agent groups tasks into named plans (tabs). Users can also manually add todo items without using the agent. Conversation is stateless.

**Stack:** React 18 + TypeScript · Node.js + Express · LangGraph.js · p-queue · SQLite · SSE

---

## 3. Annotation Zones
| Zone | Element |
|------|---------|
| [A] | App Header (title + dark mode toggle) |
| [B] | Chat Input Bar (always visible, below header) |
| [C] | Toast Notification (agent reply, auto-dismisses) |
| [E] | Plan Tabs (one tab per plan group) |
| [F] | Todo List (vertical, filtered by active tab) |
| [G] | Todo Item (checkbox + title + date + labels + delete) |
| [H] | Item Labels (min 1, max 3 AI-generated tags) |
| [I] | Item Date Subline (below title) |
| [J] | Footer Bar (item count + filter + clear) |
| [K] | Empty State (when no tasks exist) |

---

## 4. Testability
> Builder adds these. Reviewer and Test Agent use them as selectors.
> Never use CSS class or element selectors in tests — always data-testid.

| Component | data-testid |
|-----------|-------------|
| `AppHeader` | `app-header` |
| `AppTitle` | `app-title` |
| `DarkModeToggle` | `dark-mode-toggle` |
| `ChatInputBar` input | `chat-input` |
| `SendButton` | `send-button` |
| `Toast` | `toast` |
| `Toast` dismiss | `toast-dismiss` |
| `PlanTabs` | `plan-tabs` |
| `PlanTab` (each) | `plan-tab-{planId}` |
| `ManualInput` | `manual-input` |
| `TodoList` | `todo-list` |
| `TodoItem` (each) | `todo-item-{taskId}` |
| `ItemCheckbox` | `item-checkbox-{taskId}` |
| `ItemDeleteButton` | `item-delete-{taskId}` |
| `FooterBar` | `footer-bar` |
| `FilterTabs` (each) | `filter-tab-{all\|active\|completed}` |
| `ClearCompletedButton` | `clear-completed` |
| `EmptyState` | `empty-state` |

---

## 5. Build Manifest
> SKILL.md reads this table to partition work component by component.
> `files` — exact paths the builder may create or modify for this row only.
> `ac_items` — AC IDs scoped to this row. Builder implements, Reviewer checks.
> `tac_items` — TAC IDs scoped to this row. Tester runs these in component mode.
> `data_testids` — testids builder must add. Reviewer verifies presence.
> `depends_on` — order numbers that must be APPROVED before this row starts.

| Order | Scope | Components | Files | AC Items | TAC Items | Data-testids | Depends On |
|-------|-------|------------|-------|----------|-----------|--------------|------------|
| 1 | Header + Input | `AppHeader`, `ChatInputBar`, `SendButton` | `src/components/AppHeader/...`, `src/components/ChatInputBar/...` | AC-01–AC-08 | TAC-U1, TAC-U2, TAC-U3, TAC-U4 | `app-header`, `app-title`, `dark-mode-toggle`, `chat-input`, `send-button` | none |
| 2 | Toast | `Toast` | `src/components/Toast/...` | AC-09–AC-14 | TAC-U1, TAC-U2, TAC-U3, TAC-U4 | `toast`, `toast-dismiss` | none |
| 3 | Plan Tabs | `PlanTabs`, `PlanTab` | `src/components/PlanTabs/...` | AC-15–AC-19 | TAC-U1, TAC-U3, TAC-U4 | `plan-tabs`, `plan-tab-{planId}` | none |
| 4 | Todo Item | `TodoItem`, `ItemCheckbox`, `ItemContent`, `ItemTitle`, `ItemDateSubline`, `ItemLabels`, `ItemDeleteButton` | `src/components/TodoItem/...` | AC-23–AC-31 | TAC-U1, TAC-U2, TAC-U3, TAC-U4 | `todo-item-{taskId}`, `item-checkbox-{taskId}`, `item-delete-{taskId}` | none |
| 5 | List + Footer | `TodoList`, `ManualInput`, `FooterBar`, `EmptyState` | `src/components/TodoList/...`, `src/components/FooterBar/...`, `src/components/EmptyState/...` | AC-20–AC-22, AC-32–AC-36 | TAC-U1, TAC-U2, TAC-U3 | `todo-list`, `manual-input`, `footer-bar`, `filter-tab-{all\|active\|completed}`, `clear-completed`, `empty-state` | Order 4 |
| 6 | Backend | API, agent, queue, SSE, SQLite, dispatch | `server/...`, `src/types/events.ts`, `src/dispatch/dispatchLayer.ts`, `scripts/init-db.sql` | AC-37–AC-49 | TAC-A1, TAC-A2 | — | none |
| 7 | Integration | Full stack wiring | all | AC-G1, AC-G2, AC-G3, all remaining AC | TAC-E1, TAC-E2, TAC-E3 | — | Orders 1–6 |

---

## 6. Components

### Component Decomposition
```
App
├── AppHeader [A]
│   ├── AppTitle
│   └── DarkModeToggle
├── ChatInputBar [B]
│   └── SendButton
├── Toast [C]
├── PlanTabs [E]
│   └── PlanTab (one per plan)
├── ManualInput
├── TodoList [F]
│   ├── EmptyState [K]
│   └── TodoItem [G]
│       ├── ItemCheckbox
│       ├── ItemContent
│       │   ├── ItemTitle
│       │   ├── ItemDateSubline [I]
│       │   └── ItemLabels [H]
│       └── ItemDeleteButton
└── FooterBar [J]
    ├── ItemCount
    ├── FilterTabs
    └── ClearCompletedButton
```

---

### AppHeader `[A]`
**Layout:** Full width, fixed top. Gradient background. Title `"TODO"` left, dark mode toggle right.
**Tokens:** `color-header-gradient-start`, `color-header-gradient-end`, `font-size-header`, `font-weight-bold`, `color-header-text`, `letter-spacing-header`
**States:** Light mode · Dark mode

---

### ChatInputBar `[B]`
**Layout:** Always visible below header. Full width single line. Send button right-aligned, active only when input non-empty.
**Tokens:** `color-text-placeholder`, `color-bg-input`, `input-border-radius`
**Behaviour:**
- Send on Enter or Send button click → POST to `/api/chat`
- Input clears immediately after send
- Input + button disabled while agent processing (spinner shown)

---

### Toast `[C]`
**Layout:** Fixed, bottom-centre. Dismiss (×) right-aligned.
**Tokens:** `color-bg-toast`, `color-bg-toast-error`, `color-text-toast`, `font-size-body`, `toast-border-radius`, `toast-padding`, `toast-duration`, `transition-toast`
**States:** Progress · Reply · Error
**Behaviour:**
- Triggered by: `JOB_PROGRESS`, `CHAT_REPLY`, `JOB_FAILED`
- Auto-dismisses after `token(toast-duration)` ms — all states including progress
- One at a time — new replaces current

---

### PlanTabs `[E]`
**Layout:** Horizontal row below ChatInputBar. "All" tab always first.
**Tokens:** `color-tab-active-text`, `color-tab-active-border`, `font-size-tab`, `color-text-tab`
**States:** No plans (All only) · Plans exist
**Behaviour:**
- New tab on `PLAN_CREATED` — auto-focuses
- Tab click filters TodoList
- Tab switch does not interrupt agent jobs

---

### ManualInput
**Layout:** Below PlanTabs, above TodoList.
**Tokens:** `color-text-placeholder`, `color-bg-input`, `input-border-radius`
**Behaviour:** Enter → POST to `/api/tasks`. Task assigned to active plan (or "General"). Label: `"manual"`, date: today.

---

### TodoList `[F]`
**Layout:** Vertical, full width. Sorted by date ascending.
**Tokens:** `color-bg-list`
**Behaviour:** Filtered by active PlanTab + active FooterBar filter.

---

### TodoItem `[G]`
**Layout:** Full width row. Checkbox left, content centre, delete right.
**Tokens:** `todo-checkbox-size`, `color-checkbox-border`, `color-border-item`, `spacing-item-padding`, `color-text-completed`, `color-checkbox-checked`, `color-bg-highlighted`, `color-border-highlight`, `color-bg-item-hover`
**States:** Default · Completed · Highlighted · Hover
**Behaviour:**
- Checkbox click → toggle completed
- × click → DELETE `/api/tasks/:id`
- `TASK_HIGHLIGHTED` event → enter Highlighted state
- Highlighted clears on: item deleted, click elsewhere, `TASK_HIGHLIGHT_CLEARED`

---

### ItemLabels `[H]`
**Layout:** Horizontal pills below date. Min 1, max 3.
**Tokens:** `font-size-label`, `badge-label-padding`, `badge-label-border-radius`, `color-label-1`, `color-label-2`, `color-label-3`

---

### ItemDateSubline `[I]`
**Layout:** Below title, above labels. Format: `"Mon DD MMM YYYY"`
**Tokens:** `font-size-subline`, `color-text-muted`

---

### FooterBar `[J]`
**Layout:** Pinned bottom. Count left, filters centre, Clear Completed right.
**Tokens:** `font-size-footer`, `color-text-muted`, `color-bg-card`, `color-border-divider`
**Behaviour:** Filter click → filter list. Clear Completed → remove all completed items.

---

### EmptyState `[K]`
**Layout:** Centred in list area. Visible only when filtered list is empty.
**Text:** `"Ask me to create a plan, or add a todo manually"`
**Tokens:** `color-text-muted`, `font-size-body`

---

## 7. User Scenarios
> Test Agent reads this section to determine E2E test coverage.
> One E2E test file per scenario. Scenario ID is the test file identifier.

### US1 — Agent creates a plan with tasks
**TAC mapping:** TAC-E1
1. Empty app — EmptyState visible
2. User sends `"create 4 week marathon plan"`
3. Toast: `"Working on it..."`
4. `PLAN_CREATED` → tab appears, auto-focuses
5. `TASK_CREATED` × N → tasks appear progressively
6. `JOB_COMPLETE` → Toast: `"Done! Created 28 tasks"`

### US2 — Tab switching during generation
**TAC mapping:** TAC-E1
1. US1 in progress — tasks still populating
2. User clicks another tab
3. User switches back — more tasks have appeared

### US3 — Agent targeted update
**TAC mapping:** TAC-E1
1. User sends `"add a rest day on week 2 day 3"`
2. Single `TASK_CREATED` at correct date position
3. Toast confirms

### US4 — Highlight and delete
**TAC mapping:** TAC-E1
1. User sends `"what is my next todo item?"`
2. `TASK_HIGHLIGHTED` → item highlighted
3. User sends `"help me delete it"`
4. Frontend sends `context.highlightedTaskId`
5. `TASK_DELETED` → item removed, toast confirms

---

## 8. Acceptance Criteria
> Reviewer reads this section. Every item is binary: PASS or FAIL.
> `review_type`: `static` (code inspection) | `visual` (browser/token check) | `both`
> `severity`: `BLOCKING` (must pass for APPROVED) | `WARNING` (reported but does not block)

### [A] AppHeader
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-01 | Title `"TODO"` with correct font, weight, letter-spacing tokens | visual | BLOCKING |
| AC-02 | Gradient background using correct tokens | visual | BLOCKING |
| AC-03 | Dark mode toggle: moon icon, right-aligned | both | BLOCKING |

### [B] ChatInputBar
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-04 | Always visible, not collapsible | static | BLOCKING |
| AC-05 | Placeholder in `token(color-text-placeholder)` | visual | BLOCKING |
| AC-06 | Input clears on send | both | BLOCKING |
| AC-07 | Input + button disabled while processing (spinner shown) | both | BLOCKING |
| AC-08 | Send button inactive when input empty | both | BLOCKING |

### [C] Toast
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-09 | Appears on `JOB_PROGRESS`, `CHAT_REPLY`, `JOB_FAILED` | both | BLOCKING |
| AC-10 | Auto-dismisses after `token(toast-duration)` ms — all states | both | BLOCKING |
| AC-11 | Dismissible via × | both | BLOCKING |
| AC-12 | One at a time — new replaces current | both | BLOCKING |
| AC-13 | Error state uses `token(color-bg-toast-error)` | visual | BLOCKING |
| AC-14 | Entrance/exit uses `token(transition-toast)` | visual | WARNING |

### [E] PlanTabs
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-15 | Only "All" on initial load | both | BLOCKING |
| AC-16 | New tab on `PLAN_CREATED` | both | BLOCKING |
| AC-17 | New tab auto-focuses | both | BLOCKING |
| AC-18 | Active tab has `token(color-tab-active-border)` bottom border | visual | BLOCKING |
| AC-19 | Tab switch does not interrupt agent jobs | static | BLOCKING |

### [F] TodoList
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-20 | Sorted by date ascending | both | BLOCKING |
| AC-21 | Filtered by active tab and footer filter | both | BLOCKING |
| AC-22 | Background `token(color-bg-list)` | visual | BLOCKING |

### [G] TodoItem
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-23 | Completed: strikethrough + `token(color-checkbox-checked)` | visual | BLOCKING |
| AC-24 | Highlighted: `token(color-bg-highlighted)` + 3px `token(color-border-highlight)` left border | visual | BLOCKING |
| AC-25 | Delete × visible on hover only | both | BLOCKING |
| AC-26 | Checkbox toggles completed state | both | BLOCKING |
| AC-27 | × deletes item immediately | both | BLOCKING |

### [H] ItemLabels
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-28 | Min 1, max 3 pills per item | both | BLOCKING |
| AC-29 | Correct border-radius and colour cycle tokens | visual | BLOCKING |

### [I] ItemDateSubline
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-30 | Format `"Mon DD MMM YYYY"` | both | BLOCKING |
| AC-31 | Correct subline font and muted colour tokens | visual | BLOCKING |

### [J] FooterBar
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-32 | Count shows incomplete items only | both | BLOCKING |
| AC-33 | Filter tabs work correctly | both | BLOCKING |
| AC-34 | Clear Completed removes all completed items | both | BLOCKING |

### [K] EmptyState
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-35 | Visible when filtered list is empty | both | BLOCKING |
| AC-36 | Correct text and muted style | visual | BLOCKING |

### Backend — API
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-37 | `/api/chat` accepts and returns correct shape (see ARCHITECTURE.md § 2) | static | BLOCKING |
| AC-38 | `/api/events` opens SSE stream with 15s keep-alive ping | static | BLOCKING |
| AC-39 | `/api/tasks` POST creates manual task | static | BLOCKING |
| AC-40 | `/api/tasks/:id` DELETE removes task | static | BLOCKING |
| AC-41 | `/api/tasks/:id` PATCH updates task | static | BLOCKING |

### Backend — Agent
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-42 | `PLAN_CREATED` emitted before any `TASK_CREATED` for that plan | static | BLOCKING |
| AC-43 | `TASK_CREATED` emitted individually, not batched | static | BLOCKING |
| AC-44 | Agent resolves `"it"` from `context.highlightedTaskId` | static | BLOCKING |
| AC-45 | Agent never assigns tasks across plans | static | BLOCKING |
| AC-46 | `CHAT_REPLY` is always the final event per job | static | BLOCKING |

### Backend — Queue + SSE
| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-47 | p-queue concurrency: 1 per session | static | BLOCKING |
| AC-48 | Job states: `QUEUED → IN_PROGRESS → DONE \| FAILED` | static | BLOCKING |
| AC-49 | SSE keep-alive ping every 15 seconds | static | BLOCKING |

### Global
> Checked during Integration Pass (Order 7) only — not in component loops.

| ID | Description | review_type | severity |
|----|-------------|-------------|----------|
| AC-G1 | No hardcoded visual values — all use design tokens | static | BLOCKING |
| AC-G2 | No console errors on initial load | both | BLOCKING |
| AC-G3 | `src/types/events.ts` is the only event type definition | static | BLOCKING |

---

## 9. Test Acceptance Criteria
> Test Agent reads this section to determine what to verify and how to report.
> Commands come from FOUNDATION.md § 4. NPM Scripts.
> Scenario IDs come from § 7. User Scenarios.
> Selectors come from § 4. Testability.

### Unit Tests
> Run: `npm test`. One test file per component, co-located.

| ID | Description | test_level | component | maps_to_ac |
|----|-------------|------------|-----------|------------|
| TAC-U1 | All components render without errors | unit | all | AC-01, AC-04, AC-09, AC-15, AC-20, AC-23, AC-32, AC-35 |
| TAC-U2 | Keyboard interactions work (Enter, Backspace, Escape) | unit | ChatInputBar, ManualInput, FooterBar | AC-06, AC-08 |
| TAC-U3 | State transitions correct (check, highlight, dismiss) | unit | TodoItem, Toast, PlanTabs | AC-10, AC-11, AC-23, AC-24, AC-26 |
| TAC-U4 | Correct event type and payload dispatched per interaction | unit | ChatInputBar, TodoItem, PlanTabs | AC-09, AC-16, AC-27 |

### API Contract Tests
> Run: `npm run test:api`. One test per endpoint in ARCHITECTURE.md § 2.

| ID | Description | test_level | component | maps_to_ac |
|----|-------------|------------|-----------|------------|
| TAC-A1 | All endpoints return correct HTTP status and response shape | api | Backend | AC-37, AC-38, AC-39, AC-40, AC-41 |
| TAC-A2 | Side effects verified (e.g. task in SQLite after POST) | api | Backend | AC-39, AC-40, AC-41 |

### E2E Tests
> Run: `npm run test:e2e`. One file per scenario in § 7. User Scenarios.

| ID | Description | test_level | component | maps_to_ac | scenario |
|----|-------------|------------|-----------|------------|---------|
| TAC-E1 | All User Scenarios pass end-to-end | e2e | Integration | AC-42–AC-49 | US1, US2, US3, US4 |
| TAC-E2 | Page refresh hydrates state correctly | e2e | Integration | AC-37 | standalone |
| TAC-E3 | Zero `[ERROR]` level console messages across all scenarios | e2e | Integration | AC-G2 | US1, US2, US3, US4 |
