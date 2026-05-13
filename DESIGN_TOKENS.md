# Design Tokens: Simple TODO List

> These are the single source of truth for all visual values.
> The Builder Agent must reference these tokens — never hardcode values.
> The Reviewer Agent must verify all rendered values match these tokens.

---

## Colour Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `color-bg-page` | `#FFFFFF` | Page background |
| `color-bg-panel` | `#F8F9FA` | MEMO panel background, column backgrounds |
| `color-bg-card` | `#FFFFFF` | Todo card background |
| `color-bg-card-hover` | `#F0F4F8` | Todo card hover state |
| `color-text-primary` | `#1A1A1A` | Page title, card text |
| `color-text-secondary` | `#4A5568` | Card body text |
| `color-text-label` | `#718096` | Column labels (MEMO, TODO), uppercase |
| `color-text-placeholder` | `#A0AEC0` | Empty state text |
| `color-border` | `#E2E8F0` | Panel borders, card borders |
| `color-border-divider` | `#E2E8F0` | Horizontal divider under MEMO header |
| `color-accent-blue` | `#4299E1` | In Progress dot |
| `color-accent-green` | `#48BB78` | Completed dot |
| `color-accent-grey` | `#A0AEC0` | Not Started dot |
| `color-badge-bg-inprogress` | `rgba(66, 153, 225, 0.12)` | In Progress badge background |
| `color-badge-text-inprogress` | `#2B6CB0` | In Progress badge text |
| `color-badge-bg-completed` | `rgba(72, 187, 120, 0.12)` | Completed badge background |
| `color-badge-text-completed` | `#276749` | Completed badge text |
| `color-badge-bg-notstarted` | `rgba(160, 174, 192, 0.12)` | Not Started badge background |
| `color-badge-text-notstarted` | `#4A5568` | Not Started badge text |
| `color-icon` | `#718096` | Toolbar icons (filter, sort, search) |
| `color-icon-hover` | `#2D3748` | Toolbar icon hover |
| `color-toggle-bg` | `#E2E8F0` | View toggle background |
| `color-toggle-active` | `#4299E1` | Active toggle indicator |

---

## Typography Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `font-family` | `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` | All text |
| `font-size-title` | `1.75rem` (28px) | Page title "Simple TODO List" |
| `font-size-label` | `0.6875rem` (11px) | Section labels MEMO / TODO (uppercase) |
| `font-size-body` | `0.9375rem` (15px) | Card text, memo item text |
| `font-size-badge` | `0.75rem` (12px) | Status badge text + count |
| `font-weight-bold` | `700` | Page title |
| `font-weight-semibold` | `600` | Status badge labels |
| `font-weight-normal` | `400` | Card text, memo items |
| `letter-spacing-label` | `0.08em` | MEMO / TODO uppercase labels |

---

## Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-xs` | `4px` | Dot margin, tight gaps |
| `spacing-sm` | `8px` | Card internal padding, badge padding |
| `spacing-md` | `16px` | Panel padding, card gap |
| `spacing-lg` | `24px` | Column gap, section gap |
| `spacing-xl` | `32px` | Page top padding |
| `spacing-card-padding` | `12px 16px` | Todo card padding |
| `spacing-memo-padding` | `12px` | Memo panel internal padding |
| `spacing-page-padding` | `32px 24px` | Page outer padding |

---

## Layout Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `layout-content-width` | `100%` | Full width layout |
| `layout-memo-width` | `280px` | MEMO panel fixed width |
| `layout-todo-width` | `1fr` | TODO panel fills remaining space |
| `layout-column-width` | `240px` | Each kanban status column min-width |
| `layout-panel-gap` | `32px` | Gap between MEMO and TODO panels |
| `layout-column-gap` | `16px` | Gap between kanban columns |

---

## Interaction / Animation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `transition-hover` | `all 120ms ease-in` | Card hover, icon hover |
| `transition-toggle` | `background 150ms ease` | View toggle switch |

---

## Component-Specific Tokens

### StatusBadge
| Token | Value |
|-------|-------|
| `badge-border-radius` | `999px` (pill shape) |
| `badge-padding` | `3px 10px` |
| `badge-dot-size` | `8px` |

### TodoCard
| Token | Value |
|-------|-------|
| `card-border-radius` | `8px` |
| `card-border` | `1px solid token(color-border)` |
| `card-shadow` | `0 1px 3px rgba(0,0,0,0.06)` |
| `card-shadow-hover` | `0 2px 6px rgba(0,0,0,0.10)` |

### MemoItem
| Token | Value |
|-------|-------|
| `memo-checkbox-size` | `14px` |
| `memo-checkbox-border-radius` | `3px` (square) |
| `memo-checkbox-border` | `1.5px solid token(color-border)` |

### ViewToggle
| Token | Value |
|-------|-------|
| `toggle-border-radius` | `6px` |
| `toggle-padding` | `4px` |
| `toggle-icon-size` | `16px` |

---

## Token Usage Map

> Quick reference: which token applies to which annotation zone in `./assets/wireframe-reference.png`

| Zone | Tokens Applied |
|------|---------------|
| `[A]` Page Title | `font-size-title`, `font-weight-bold`, `color-text-primary` |
| `[B]` MEMO Panel | `layout-memo-width`, `color-bg-panel`, `color-border-divider`, `color-text-label`, `letter-spacing-label` |
| `[C]` Memo Item | `memo-checkbox-size`, `memo-checkbox-border-radius`, `font-size-body`, `color-text-secondary` |
| `[D]` TODO Panel | `layout-todo-width`, `color-text-label`, `letter-spacing-label` |
| `[E]` View Toggle | `toggle-border-radius`, `color-toggle-bg`, `color-toggle-active`, `transition-toggle` |
| `[F]` Toolbar Icons | `color-icon`, `color-icon-hover`, `transition-hover` |
| `[G]` Status Column | `layout-column-width`, `color-bg-panel`, `badge-border-radius`, `badge-dot-size` |
| `[H]` Status Badge | `badge-padding`, `color-badge-bg-inprogress`, `color-badge-text-inprogress`, `font-size-badge` |
| `[I]` Todo Card | `card-border-radius`, `card-border`, `card-shadow`, `spacing-card-padding`, `font-size-body` |
