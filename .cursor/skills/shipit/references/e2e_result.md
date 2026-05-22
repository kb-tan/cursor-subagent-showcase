
# e2e_result.md

> Template file. Location: `.cursor/skills/references/e2e_result.md`
> Orchestrator copies this to `./e2e_result.md` at the start of each integration pass.
> E2E Agent writes all sections.
> Orchestrator reads verdict and routing recommendation to make rebuild decisions.
> Full history is in `review_history.db`.

---

## Status

```
PENDING | RUNNING | APPROVED | CHANGES_REQUIRED
```

**Current:** `PENDING`
**Iteration:** —

---

## Scenario Results

> E2E Agent fills this in after running all scenarios from SPEC.md § 7.

| Scenario | TAC | Result | Failed Step |
|----------|-----|--------|-------------|
| | | | |

---

## Failure Analysis

> E2E Agent fills this in for every failed scenario.
> Orchestrator uses `confidence` and `suspected_component` to decide routing.

| Journey | Failed Step | Suspected Component | Zone | Confidence | Evidence |
|---------|-------------|---------------------|------|------------|----------|
| | | | | | |

---

## Console Errors

| Scenario | Error | Count |
|----------|-------|-------|
| | | |

---

## Summary

- Scenarios: —/— pass
- TAC-E items: —/— pass
- Console errors: —

---

## Verdict

`APPROVED` | `CHANGES_REQUIRED`

---

## Routing Recommendation

> E2E Agent writes one of the following based on failure analysis.
> Orchestrator reads this to decide: targeted rebuild, integration rebuild, or escalate.

```
TARGETED_REBUILD:    [ComponentName] [Zone] — high confidence, single component failure
INTEGRATION_REBUILD: — medium/low confidence or cross-cutting failure
ESCALATE:            — confidence too low to route automatically, human decision needed
SHIPPED:             — all scenarios pass
```

**Recommendation:** —
**Reason:** —
