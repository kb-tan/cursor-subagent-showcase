
# SPEC.md

> This is the single source of truth for the Agentic TODO Demo.
> All agents must read this file first and follow all references declared here.

## References

> **Foundation:** `./FOUNDATION.md`
> Tech stack, project scaffold, dev server requirements, npm scripts.

> **Architecture:** `./ARCHITECTURE.md`
> Backend design: event envelope contract, API endpoints, queue, agent worker, SSE, MCP tools.

> **Design Tokens:** `./DESIGN_TOKENS.md`
> All colours, spacing, typography and timing values.
> Never hardcode a value that exists as a token.

> **Wireframe:** `./assets/wireframe-reference.png`
> Primary visual source of truth for UI layout and component appearance.
> All annotation zones [A]–[K] are referenced throughout this spec.

---

## Overview

A full-stack agentic TODO application. Users interact via a collapsible chat drawer to
create, update, delete, and query todo items. The agent groups tasks into named plans
(tabs). Users can also manually add todo items without using the agent.

**Stack summary:** React 18 + TypeScript (frontend) · Node.js + Express (backend) ·
LangGraph.js (agent) · p-queue (job queue) · SQLite (persistence) · SSE (real-time push)

---

## Annotation Zones

| Zone | Element |
|------|---------|
| [A] | App Header (title + dark mode toggle) |
| [B] | Chat Drawer (collapsible overlay, sits above list) |
| [C] | Chat Input (inside drawer) |
| [D] | Chat Message List (agent replies + progress) |
| [E] | Plan Tabs (one tab per plan group) |
| [F] | Todo List (vertical, filtered by active tab) |
| [G] | Todo Item (checkbox + title + date + labels + delete) |
| [H] | Item Labels (min 1, max 3 AI-generated tags) |
| [I] | Item Date Subline (below title) |
| [J] | Footer Bar (item count + All/Active/Completed filter + Clear Completed) |
| [K] | Empty State (placeholder when no tasks exist) |

---

## Component Decomposition

```
App
├── AppHeader                          [A]
│   ├── AppTitle
│   └── DarkModeToggle
├── ChatDrawer (collapsible)           [B]
│   ├── ChatMessageList                [D]
│   │   ├── AgentMessage
│   │   ├── UserMessage
│   │   └── ProgressMessage
│   └── ChatInput                      [C]
├── PlanTabs                           [E]
│   └── PlanTab (one per plan)
├── ManualInput
├── TodoList                           [F]
│   ├── EmptyState                     [K]
│   └── TodoItem (repeated)            [G]
│       ├── ItemCheckbox
│       ├── ItemContent
│       │   ├── ItemTitle
│       │   ├── ItemDateSubline        [I]
│       │   └── ItemLabels             [H]
│       └── ItemDeleteButton
└── FooterBar                          [J]
    ├── ItemCount
    ├── FilterTabs (All / Active / Completed)
    └── ClearCompletedButton
```

---

## Component: AppHeader `[A]`

### Layout
- Full width, fixed at top
- Background: gradient `token(color-header-gradient-start)` → `token(color-header-gradient-end)`
- Title: `"TODO"` — `token(font-size-header)` / `token(font-weight-bold)` / `token(color-header-text)` / `token(letter-spacing-header)`
- Dark mode toggle: moon icon, right-aligned

### States
| State | Visual |
|-------|--------|
| **Light** | Gradient header, light list background |
| **Dark** | Same gradient header, dark list background |

---

## Component: ChatDrawer `[B]`

### Layout
- Position: overlay, sits above the todo list, below the header
- Width: full app width
- Collapsed height: `token(chat-collapsed-height)` — shows only a toggle handle bar
- Expanded height: `token(chat-expanded-height)`
- Background: `token(color-bg-card)`
- Toggle handle: centred chevron icon, clickable
- Transition: `token(transition-drawer)`

### States
| State | Visual |
|-------|--------|
| **Collapsed** | Handle bar only visible, list fully accessible |
| **Expanded** | Message list + input visible |

### Behaviour
- **Given** user clicks handle **When** drawer collapsed **Then** drawer expands
- **Given** user clicks handle **When** drawer expanded **Then** drawer collapses
- Drawer starts **collapsed** on load

---

## Component: ChatInput `[C]`

### Layout
- Inside ChatDrawer, pinned to bottom of drawer
- Placeholder: `"Ask me anything about your todos..."` in `token(color-text-placeholder)`
- Background: `token(color-bg-input)`
- Border-radius: `token(input-border-radius)`
- Send button: right side, active only when input non-empty

### Behaviour
- **Given** user presses Enter or clicks Send **When** input non-empty **Then** POST `/api/chat`
- Input clears after send
- Input disabled while agent is processing (spinner in send button)

---

## Component: ChatMessageList `[D]`

### Layout
- Scrollable list inside ChatDrawer, oldest → newest
- Auto-scrolls to bottom on new message

### Message Types
| Type | Appearance |
|------|-----------|
| **UserMessage** | Right-aligned, `token(color-bg-user-message)` bubble |
| **AgentMessage** | Left-aligned, `token(color-bg-agent-message)` bubble |
| **ProgressMessage** | Left-aligned, italic, `token(color-text-muted)` |

---

## Component: PlanTabs `[E]`

### Layout
- Horizontal tab row, below ChatDrawer
- Active tab: `token(color-tab-active-text)` + `token(color-tab-active-border)` bottom border
- First tab is always **"All"** — shows tasks across all plans

### States
| State | Visual |
|-------|--------|
| **No plans** | Only "All" tab visible |
| **Plans exist** | "All" + one tab per plan |

### Behaviour
- **Given** `PLAN_CREATED` event received **Then** new tab appears and auto-focuses
- **Given** user clicks tab **Then** todo list filters to that plan's tasks
- Switching tabs does not interrupt ongoing agent jobs

---

## Component: ManualInput

### Layout
- Below PlanTabs, above TodoList
- Placeholder: `"Add a todo manually..."` in `token(color-text-placeholder)`
- Background: `token(color-bg-input)`
- Border-radius: `token(input-border-radius)`

### Behaviour
- On Enter: creates task in active plan tab (or "General" if "All" tab active)
- Manual tasks get label `"manual"` and today's date
- Direct POST to `/api/tasks` — no agent involvement

---

## Component: TodoList `[F]`

### Layout
- Vertical list, full width
- Background: `token(color-bg-list)`
- Filtered by: active PlanTab + active FooterBar filter
- Sorted by: task date ascending

---

## Component: TodoItem `[G]`

### Layout
- Full width row
- Left: circle checkbox — `token(todo-checkbox-size)` / `token(color-checkbox-border)`
- Centre: ItemContent (title + date subline + labels)
- Right: delete button (×), visible on hover only
- Bottom border: `token(color-border-item)`
- Padding: `token(spacing-item-padding)`

### States
| State | Visual |
|-------|--------|
| **Default** | Normal text, unchecked circle |
| **Completed** | Strikethrough title, `token(color-text-completed)`, checked circle `token(color-checkbox-checked)` |
| **Highlighted** | Background `token(color-bg-highlighted)`, 3px left border `token(color-border-highlight)` |
| **Hover** | Delete (×) appears, `token(color-bg-item-hover)` background |

### Behaviour
- **Given** user clicks checkbox **Then** item toggles completed state
- **Given** user clicks × **Then** item deleted (manual, no agent)
- **Given** `TASK_HIGHLIGHTED` event with matching taskId **Then** item enters Highlighted state
- **Given** item deleted while highlighted **Then** highlight disappears with item
- Highlighted state persists until: item deleted, user clicks elsewhere, or `TASK_HIGHLIGHT_CLEARED` received

---

## Component: ItemLabels `[H]`

### Layout
- Horizontal pill badges, below date subline
- Min 1, max 3 labels per item
- Each label: `token(font-size-label)` / `token(badge-label-padding)` / `token(badge-label-border-radius)`
- Colours cycle: `token(color-label-1)` → `token(color-label-2)` → `token(color-label-3)`

---

## Component: ItemDateSubline `[I]`

### Layout
- Below item title, above labels
- Format: `"Mon DD MMM YYYY"` — e.g. `"Mon 03 Feb 2025"`
- Font: `token(font-size-subline)` / `token(color-text-muted)`

---

## Component: FooterBar `[J]`

### Layout
- Pinned to bottom of todo list
- Left: `"N items left"` — `token(font-size-footer)` / `token(color-text-muted)`
- Centre: All · Active · Completed filter tabs
- Right: `"Clear Completed"` button
- Background: `token(color-bg-card)`
- Top border: `token(color-border-divider)`

### Behaviour
- **Given** user clicks filter tab **Then** list filters accordingly
- **Given** user clicks Clear Completed **Then** all completed items removed

---

## Component: EmptyState `[K]`

### Layout
- Centred in todo list area
- Text: `"Ask me to create a plan, or add a todo manually"`
- Style: `token(color-text-muted)` / `token(font-size-body)`
- Visible only when filtered list is empty

---

## User Scenarios

### US1 — Agent creates a plan with tasks
1. User opens app — collapsed chat drawer, empty list, EmptyState visible
2. User expands drawer, types `"create 4 week marathon plan"`
3. Chat shows ProgressMessage: `"Working on it..."`
4. `PLAN_CREATED` event → Marathon Plan tab appears, auto-focuses
5. `TASK_CREATED` events one by one → tasks appear progressively with labels + dates
6. `JOB_COMPLETE` → Chat shows: `"Done! Created 28 tasks for your Marathon Plan"`

### US2 — Tab switching during generation
1. While Marathon Plan tasks still populating (US1 in progress)
2. User clicks a different tab
3. Tasks in other tabs unaffected
4. User switches back — more tasks have appeared since they left

### US3 — Agent targeted update
1. User types `"add a rest day on week 2 day 3"`
2. Agent identifies correct plan and date slot
3. Single `TASK_CREATED` event emitted
4. New task appears at correct date position
5. Chat confirms: `"Added rest day on Week 2, Day 3"`

### US4 — Conversational context + highlight + delete
1. User types `"what is my next todo item?"`
2. Agent queries tasks sorted by date, finds earliest incomplete task (e.g. `"30 mins jogging"`)
3. `TASK_HIGHLIGHTED` event → item enters Highlighted state
4. User types `"help me delete it"`
5. Frontend sends `context.highlightedTaskId` in POST `/api/chat`
6. Agent resolves `"it"` from `context.highlightedTaskId`
7. `TASK_DELETED` event → item removed
8. Chat confirms: `"Deleted '30 mins jogging'"`

---

## Acceptance Criteria

> Reviewer Agent: evaluate each AC as PASS or FAIL.
> Visual ACs: reference wireframe declared above.
> Token ACs: reference DESIGN_TOKENS.md declared above.
> Backend ACs: reference ARCHITECTURE.md declared above.

### [A] AppHeader
- [ ] **AC-01** Title renders as `"TODO"` with `token(letter-spacing-header)` using `token(font-size-header)` and `token(font-weight-bold)`
- [ ] **AC-02** Header background is gradient using `token(color-header-gradient-start)` and `token(color-header-gradient-end)`
- [ ] **AC-03** Dark mode toggle renders as moon icon, right-aligned

### [B] ChatDrawer
- [ ] **AC-04** Drawer starts collapsed on load
- [ ] **AC-05** Clicking handle toggles expanded/collapsed
- [ ] **AC-06** Collapsed height matches `token(chat-collapsed-height)`
- [ ] **AC-07** Expanded height matches `token(chat-expanded-height)`
- [ ] **AC-08** Transition uses `token(transition-drawer)`

### [C] ChatInput
- [ ] **AC-09** Placeholder renders in `token(color-text-placeholder)`
- [ ] **AC-10** Input clears after send
- [ ] **AC-11** Input disabled while agent processing
- [ ] **AC-12** Send button inactive when input empty

### [D] ChatMessageList
- [ ] **AC-13** User messages right-aligned with `token(color-bg-user-message)`
- [ ] **AC-14** Agent messages left-aligned with `token(color-bg-agent-message)`
- [ ] **AC-15** Progress messages italic in `token(color-text-muted)`
- [ ] **AC-16** List auto-scrolls to bottom on new message

### [E] PlanTabs
- [ ] **AC-17** Only "All" tab on initial load
- [ ] **AC-18** New tab appears on `PLAN_CREATED` event
- [ ] **AC-19** New tab auto-focuses on creation
- [ ] **AC-20** Active tab has `token(color-tab-active-border)` bottom border
- [ ] **AC-21** Switching tabs does not interrupt agent jobs

### [F] TodoList
- [ ] **AC-22** List sorted by task date ascending
- [ ] **AC-23** List filters by active tab and footer filter
- [ ] **AC-24** Background is `token(color-bg-list)`

### [G] TodoItem
- [ ] **AC-25** Completed item: strikethrough + `token(color-checkbox-checked)` circle
- [ ] **AC-26** Highlighted item: `token(color-bg-highlighted)` + 3px `token(color-border-highlight)` left border
- [ ] **AC-27** Delete (×) visible on hover only
- [ ] **AC-28** Checkbox click toggles completed state
- [ ] **AC-29** × click deletes item immediately

### [H] ItemLabels
- [ ] **AC-30** Each item has min 1, max 3 label pills
- [ ] **AC-31** Labels use `token(badge-label-border-radius)` and cycle through label colour tokens

### [I] ItemDateSubline
- [ ] **AC-32** Date format is `"Mon DD MMM YYYY"`
- [ ] **AC-33** Date uses `token(font-size-subline)` and `token(color-text-muted)`

### [J] FooterBar
- [ ] **AC-34** Item count shows number of incomplete items
- [ ] **AC-35** Filter tabs work correctly
- [ ] **AC-36** Clear Completed removes all completed items

### [K] EmptyState
- [ ] **AC-37** Renders when filtered list is empty
- [ ] **AC-38** Text: `"Ask me to create a plan, or add a todo manually"`

### Backend — API
- [ ] **AC-39** `POST /api/chat` accepts `{ message, sessionId, context: { highlightedTaskId? } }` returns `{ jobId }`
- [ ] **AC-40** `GET /api/events?sessionId=` opens SSE stream with 15s keep-alive ping
- [ ] **AC-41** `POST /api/tasks` creates manual task without agent
- [ ] **AC-42** `DELETE /api/tasks/:id` deletes task
- [ ] **AC-43** `PATCH /api/tasks/:id` updates task

### Backend — Agent
- [ ] **AC-44** Agent emits `PLAN_CREATED` before any `TASK_CREATED` for that plan
- [ ] **AC-45** Agent emits `TASK_CREATED` individually (not batched)
- [ ] **AC-46** Agent resolves `"it"` from `context.highlightedTaskId`
- [ ] **AC-47** Agent never assigns tasks from one plan into another
- [ ] **AC-48** Agent emits `CHAT_REPLY` as final event for every job

### Backend — Queue + SSE
- [ ] **AC-49** p-queue concurrency: 1 per session
- [ ] **AC-50** Job state: `QUEUED → IN_PROGRESS → DONE | FAILED`
- [ ] **AC-51** SSE keep-alive ping every 15 seconds

### Global
- [ ] **AC-52** No hardcoded colour/spacing values — all use design tokens
- [ ] **AC-53** No console errors on initial load
- [ ] **AC-54** `src/types/events.ts` is the single definition of all event types (imported by both frontend and backend)

