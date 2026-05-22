
# review.md

> Template file. Location: `.cursor/skills/shipit/references/review.md`
> Orchestrator copies this to `./review.md` at the start of each iteration.
> Builder writes to "Builder Output" section only.
> Reviewer writes to "Reviewer Feedback" section only.
> Orchestrator reads verdict and fix items to drive next iteration.
> Full history is in `review_history.db`.

---

## Status

```
IN_PROGRESS | AWAITING_REVIEW | APPROVED | CHANGES_REQUIRED
```

**Current:** `IN_PROGRESS`
**Iteration:** —
**Component:** —

---

## Builder Output

> Builder writes here after completing the build.

### Files Created / Modified

<!-- list each file path -->

### data-testid Attributes Added

<!-- list each testid added -->

### Unit Tests Written

<!-- list TAC items covered -->

### Fix Items Actioned

<!-- FIX_ONLY mode: list each Fix ID actioned, or "N/A" -->

### Deviations from Spec

<!-- any intentional deviation with justification, or "None" -->

### Status

`AWAITING_REVIEW`

---

## Reviewer Feedback

> Reviewer writes here after completing the review.
> Orchestrator reads verdict and fix items table to drive next iteration.

### Regression Check

<!-- REGRESSION items listed here — highest priority. "None" if clean. -->

### Fix Items

| Fix ID | AC | Severity | File | Issue | Fix Instruction |
|--------|----|----------|------|-------|-----------------|
| | | | | | |

### Quantified Results

- AC: —/— pass
- Visual: —%
- Console errors: —
- Unit tests: —/— pass

### Verdict

`APPROVED` | `CHANGES_REQUIRED`

---

## Iteration Log

> Orchestrator updates this after each iteration.

| Iteration | Mode | Verdict | AC Pass | Visual | Regressions |
|-----------|------|---------|---------|--------|-------------|
| | | | | | |
