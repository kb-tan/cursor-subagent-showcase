
> **SCHEMA CONTRACT**
> Agents locate token values in this file by exact section heading and column name.
> Do not rename sections. Do not reorder columns within tables.
> Required sections: `Colours — Light Mode`, `Typography`, `Sizing`, `Borders & Radius`, `Spacing`, `Timing`, `Transitions`
> Optional sections: `Colours — Dark Mode` — present only if dark mode is supported.
> Presence contract: if this file is listed in SPEC.md `references`, token compliance checking is ON for all AC items marked `review_type: visual`. If absent, token compliance is skipped.

# DESIGN_TOKENS.md
All values must be defined as CSS variables in `src/styles/tokens.css`.
Never hardcode any value that exists as a token.

## Colours — Light Mode
| Token | Value | Usage |
|-------|-------|-------|
| `color-header-gradient-start` | `#6c5ce7` | Header gradient left |
| `color-header-gradient-end` | `#a29bfe` | Header gradient right |
| `color-header-text` | `#ffffff` | Header title |
| `color-bg-page` | `#f5f5f5` | Page background |
| `color-bg-list` | `#ffffff` | Todo list background |
| `color-bg-card` | `#ffffff` | Card / drawer background |
| `color-bg-input` | `#f9f9f9` | Input background |
| `color-bg-item-hover` | `#fafafa` | Todo item hover |
| `color-bg-highlighted` | `#fffbea` | Highlighted todo item |
| `color-bg-toast` | `#2d3436` | Toast background |
| `color-text-toast` | `#ffffff` | Toast text |
| `color-bg-toast-error` | `#d63031` | Toast error background |
| `color-text-primary` | `#2d3436` | Primary text |
| `color-text-secondary` | `#636e72` | Secondary / item text |
| `color-text-muted` | `#b2bec3` | Muted / placeholder |
| `color-text-completed` | `#b2bec3` | Completed item text |
| `color-text-placeholder` | `#b2bec3` | Input placeholder |
| `color-text-tab` | `#636e72` | Inactive tab text |
| `color-tab-active-text` | `#6c5ce7` | Active tab text |
| `color-tab-active-border` | `#6c5ce7` | Active tab bottom border |
| `color-checkbox-border` | `#dfe6e9` | Unchecked circle border |
| `color-checkbox-checked` | `#6c5ce7` | Checked circle fill |
| `color-border-item` | `#f0f0f0` | Item bottom border |
| `color-border-divider` | `#e0e0e0` | Divider lines |
| `color-border-highlight` | `#fdcb6e` | Highlighted item left border |
| `color-label-1` | `#6c5ce7` | Label colour 1 — purple |
| `color-label-2` | `#00b894` | Label colour 2 — green |
| `color-label-3` | `#fd79a8` | Label colour 3 — pink |

## Colours — Dark Mode
| Token | Value |
|-------|-------|
| `color-bg-page-dark` | `#1e1e2e` |
| `color-bg-list-dark` | `#2d2d3f` |
| `color-bg-card-dark` | `#2d2d3f` |
| `color-text-primary-dark` | `#f5f5f5` |
| `color-text-secondary-dark` | `#a0a0b0` |
| `color-border-item-dark` | `#3d3d50` |

## Typography
| Token | Value |
|-------|-------|
| `font-size-header` | `2rem` |
| `font-size-body` | `0.9375rem` |
| `font-size-subline` | `0.75rem` |
| `font-size-label` | `0.6875rem` |
| `font-size-tab` | `0.875rem` |
| `font-size-footer` | `0.8125rem` |
| `font-weight-bold` | `700` |
| `font-weight-semibold` | `600` |
| `letter-spacing-header` | `0.4em` |

## Sizing
| Token | Value |
|-------|-------|
| `todo-checkbox-size` | `20px` |

## Borders & Radius
| Token | Value |
|-------|-------|
| `input-border-radius` | `4px` |
| `badge-label-border-radius` | `12px` |
| `card-border-radius` | `4px` |
| `toast-border-radius` | `8px` |

## Spacing
| Token | Value |
|-------|-------|
| `spacing-item-padding` | `1rem 1.5rem` |
| `badge-label-padding` | `2px 8px` |
| `toast-padding` | `12px 16px` |

## Timing
| Token | Value |
|-------|-------|
| `toast-duration` | `4000` (ms) |

## Transitions
| Token | Value |
|-------|-------|
| `transition-hover` | `all 0.2s ease` |
| `transition-toast` | `all 0.25s ease` |
