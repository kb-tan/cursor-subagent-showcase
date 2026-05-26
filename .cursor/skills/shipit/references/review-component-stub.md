# Component block stubs (orchestrator only)

Copy the matching stub into `./review.md` under **Builder Output** and **Reviewer Feedback** when seeding a wave or retry. Replace `{{COMPONENT}}`, `{{ORDER}}`, `{{ITERATION}}`.

---

## Builder stub

```markdown
<!-- shipit:component={{COMPONENT}} order={{ORDER}} -->

### Files Created / Modified

### data-testid Attributes Added

### Unit Tests Written

### Fix Items Actioned

N/A

### Deviations from Spec

None

**Builder status:** `IN_PROGRESS`

<!-- /shipit:component={{COMPONENT}} -->
```

---

## Reviewer stub

```markdown
<!-- shipit:component={{COMPONENT}} order={{ORDER}} -->

### Regression Check

Pending.

### Fix Items

| Fix ID | AC | Severity | File | Issue | Fix Instruction |
|--------|----|----------|------|-------|-----------------|
| — | — | — | — | — | — |

### Quantified Results

- AC: —/— pass
- Visual: —%
- Console errors: —
- Unit tests: —/— pass

### Verdict

`PENDING`

<!-- /shipit:component={{COMPONENT}} -->
```
