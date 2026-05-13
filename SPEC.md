# UI Spec: Simple TODO List

## Visual Reference

> **Wireframe:** `./assets/wireframe-reference.png`
> Use this as the primary visual source of truth.
> All annotation zones [A]–[I] are referenced throughout this spec.

| Zone | Element |
|------|---------|
| [A] | Page Title |
| [B] | MEMO Panel |
| [C] | Memo Item (checkbox + label) |
| [D] | TODO Panel |
| [E] | View Toggle (board/list switch) |
| [F] | Toolbar Icons (filter, sort, search) |
| [G] | Status Column (Not Started / In Progress / Completed) |
| [H] | Status Badge (dot + label + count) |
| [I] | Todo Card |

> **Design tokens:** `./DESIGN_TOKENS.md`
> All colours, spacing, typography and timing values must use tokens defined there.
> Never hardcode a value that exists as a token.

> **Foundation:** `./FOUNDATION.md`
> Project setup, tech stack, and dev server requirements.

---

## Overview

A two-panel todo application with a MEMO panel on the left and a kanban-style TODO board on the right.
No routing, no backend — pure in-memory frontend component.

---

## Component Decomposition

```
TodoPage
  ├── PageTitle                    [A]
  ├── MemoPanel                    [B]
  │     └── MemoItem               [C] — checkbox + label
  └── TodoPanel                    [D]
        ├── PanelHeader
        │     ├── ViewToggle       [E]
        │     └── Toolbar          [F] — filter, sort, search icons
        └── KanbanBoard
              ├── StatusColumn [G] — Not Started
              │     ├── StatusBadge [H]
              │     └── TodoCard    [I]
              ├── StatusColumn [G] — In Progress
              │     ├── StatusBadge [H]
              │     └── TodoCard    [I]
              └── StatusColumn [G] — Completed
                    ├── StatusBadge [H]
                    └── TodoCard    [I]
```

---

## Component: PageTitle `[A]`

### Layout
- Position: top of page, full width, above both panels
- Font: `token(font-size-title)` / `token(font-weight-bold)` / `token(color-text-primary)`
- Static text: `"Simple TODO List"` — not editable

### States

| State | Visual |
|-------|--------|
| **Default** | Bold static text, no interaction |

---

## Component: MemoPanel `[B]`

### Layout
- Position: left side of page
- Width: `token(layout-memo-width)` (fixed)
- Background: `token(color-bg-panel)`
- Section label: `"MEMO"` in `token(font-size-label)` / `token(color-text-label)` / `token(letter-spacing-label)` uppercase
- Horizontal divider below label: `token(color-border-divider)`
- Internal padding: `token(spacing-memo-padding)`

### States

| State | Visual |
|-------|--------|
| **Default** | Panel visible with label and item list |
| **Empty** | Panel shows label only, no items |

---

## Component: MemoItem `[C]`

### Layout
- Children: square checkbox (left) · text label (right)
- Checkbox size: `token(memo-checkbox-size)` · border-radius: `token(memo-checkbox-border-radius)`
- Font: `token(font-size-body)` / `token(color-text-secondary)`

### States

| State | Visual |
|-------|--------|
| **Unchecked** | Empty square, `token(memo-checkbox-border)` |
| **Checked** | Filled square, checkmark visible |

> ⚠️ Memo checkbox is **square** (border-radius: 3px) — distinct from kanban card checkboxes

---

## Component: ViewToggle `[E]`

### Layout
- Position: top-left of TODO panel, below `"TODO"` label
- Appearance: pill/toggle switch with board icon active
- Background: `token(color-toggle-bg)`
- Active indicator: `token(color-toggle-active)`
- Border-radius: `token(toggle-border-radius)`
- Icon size: `token(toggle-icon-size)`

### States

| State | Visual |
|-------|--------|
| **Board view (default)** | Board/grid icon highlighted in `token(color-toggle-active)` |
| **List view** | List icon highlighted |

### Behaviour
- **Given** user clicks toggle **When** board icon active **Then** switches to list view
- **Given** user clicks toggle **When** list icon active **Then** switches to board view

---

## Component: Toolbar `[F]`

### Layout
- Position: top-right of TODO panel, aligned with ViewToggle
- Icons: filter (`≡`) · sort (`↕`) · search (`🔍`) — 3 icons, right-aligned
- Icon colour: `token(color-icon)`
- Icon size: 16px

### States

| State | Visual |
|-------|--------|
| **Default** | Icons in `token(color-icon)` |
| **Hover** | Icon colour shifts to `token(color-icon-hover)` via `token(transition-hover)` |

---

## Component: StatusColumn `[G]`

### Layout
- Min-width: `token(layout-column-width)`
- Background: `token(color-bg-panel)`
- Gap between columns: `token(layout-column-gap)`
- Children: StatusBadge `[H]` at top · stack of TodoCards `[I]` below

### States

| State | Visual |
|-------|--------|
| **Empty** | Shows StatusBadge with count `0`, no cards |
| **Has items** | Shows StatusBadge with count, cards stacked below |

---

## Component: StatusBadge `[H]`

### Layout
- Shape: pill — `token(badge-border-radius)`
- Padding: `token(badge-padding)`
- Children: coloured dot (`token(badge-dot-size)`) · label text · count number
- Font: `token(font-size-badge)` / `token(font-weight-semibold)`

### Variants

| Variant | Dot colour | Badge bg | Text colour |
|---------|-----------|----------|-------------|
| **Not Started** | `token(color-accent-grey)` | `token(color-badge-bg-notstarted)` | `token(color-badge-text-notstarted)` |
| **In Progress** | `token(color-accent-blue)` | `token(color-badge-bg-inprogress)` | `token(color-badge-text-inprogress)` |
| **Completed** | `token(color-accent-green)` | `token(color-badge-bg-completed)` | `token(color-badge-text-completed)` |

---

## Component: TodoCard `[I]`

### Layout
- Width: full column width
- Padding: `token(spacing-card-padding)`
- Border: `token(card-border)`
- Border-radius: `token(card-border-radius)`
- Shadow: `token(card-shadow)`
- Background: `token(color-bg-card)`
- Font: `token(font-size-body)` / `token(color-text-secondary)`

### States

| State | Visual |
|-------|--------|
| **Default** | White card, subtle border and shadow |
| **Hover** | Shadow deepens to `token(card-shadow-hover)`, bg `token(color-bg-card-hover)` via `token(transition-hover)` |
| **With checkbox** | Shows square checkbox inside card (as seen in wireframe "Check insurance policy") |

---

## Page Layout

- Background: `token(color-bg-page)`
- Padding: `token(spacing-page-padding)`
- Two-panel horizontal layout: MEMO `[B]` (fixed) + TODO `[D]` (flexible)
- Gap between panels: `token(layout-panel-gap)`
- No max-width constraint — full viewport width

---

## Initial State on Load

- Page title: `"Simple TODO List"` static
- MEMO panel: 2 sample items pre-loaded (`"License Renewal"`, `"Receive unattended parcel"`)
- TODO board: 3 columns visible — Not Started (0), In Progress (2), Completed (0)
- In Progress pre-loaded with: `"Buy stamps at the post office"`, `"Check insurance policy"`, `"Call insurance company"`
- No persisted state — in-memory only

---

## Out of Scope

- No drag-and-drop between columns
- No due dates or tags
- No dark mode
- No backend / API / localStorage persistence
- No list view implementation (toggle UI only)

---

## Acceptance Criteria (Reviewer Checklist)

> Reviewer Agent: evaluate each AC as **PASS** or **FAIL**.
> Reference `./assets/wireframe-reference.png` for visual verification.
> Reference `./DESIGN_TOKENS.md` for all value verification.

### `[A]` PageTitle
- [ ] **AC-01** Title renders as `"Simple TODO List"` using `token(font-size-title)` and `token(font-weight-bold)`
- [ ] **AC-02** Title is static — not editable

### `[B]` MEMO Panel
- [ ] **AC-03** Panel width matches `token(layout-memo-width)`
- [ ] **AC-04** `"MEMO"` label renders in uppercase, `token(font-size-label)`, `token(color-text-label)`
- [ ] **AC-05** Horizontal divider renders below label in `token(color-border-divider)`

### `[C]` Memo Item
- [ ] **AC-06** Checkbox is square (`token(memo-checkbox-border-radius)` = 3px)
- [ ] **AC-07** Memo items render with `token(font-size-body)` and `token(color-text-secondary)`

### `[D]` TODO Panel
- [ ] **AC-08** `"TODO"` label renders in uppercase, `token(font-size-label)`, `token(color-text-label)`
- [ ] **AC-09** Panel fills remaining width after MEMO panel

### `[E]` View Toggle
- [ ] **AC-10** Toggle renders with `token(color-toggle-bg)` background
- [ ] **AC-11** Board icon is active by default, highlighted in `token(color-toggle-active)`

### `[F]` Toolbar
- [ ] **AC-12** Three icons (filter, sort, search) render right-aligned in `token(color-icon)`
- [ ] **AC-13** Icons shift to `token(color-icon-hover)` on hover via `token(transition-hover)`

### `[G]` Status Columns
- [ ] **AC-14** Three columns render: Not Started · In Progress · Completed
- [ ] **AC-15** Each column min-width matches `token(layout-column-width)`
- [ ] **AC-16** Column background is `token(color-bg-panel)`

### `[H]` Status Badge
- [ ] **AC-17** Each badge renders correct dot colour per variant
- [ ] **AC-18** Badge shape is pill (`token(badge-border-radius)`)
- [ ] **AC-19** Count number reflects actual number of cards in column

### `[I]` Todo Card
- [ ] **AC-20** Card renders with `token(card-border-radius)` and `token(card-shadow)`
- [ ] **AC-21** Card hover applies `token(card-shadow-hover)` via `token(transition-hover)`
- [ ] **AC-22** Card text uses `token(font-size-body)` and `token(color-text-secondary)`

### Global
- [ ] **AC-23** Two-panel layout renders side by side with `token(layout-panel-gap)` gap
- [ ] **AC-24** No hardcoded colour/spacing values — all use design tokens
- [ ] **AC-25** No console errors on initial load