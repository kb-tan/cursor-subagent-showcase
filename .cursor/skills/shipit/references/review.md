
# review.md

> Multi-component review board. Template: `.cursor/skills/shipit/references/review.md`
>
> | Section | Who writes |
> |---------|------------|
> | **Manifest board** | **Orchestrator only** |
> | **Builder Output** blocks | **Builder Agent** — inside `<!-- shipit:component=… -->` markers only |
> | **Reviewer Feedback** blocks | **Reviewer Agent** — inside matching markers only |
> | **Iteration log** | **Orchestrator only** |
>
> **Gates (per component):** Orchestrator reads **SQLite first** (`review_history.db`), then confirms anchored blocks in this file.
> Full history: `review_history.db`.

---

## Manifest board

> **Orchestrator only.** Agents MUST NOT edit this table.

| Order | Component | Builder | Reviewer | Iter | Run ID |
|------:|-----------|---------|----------|-----:|--------|
| — | — | — | — | — | — |

**Builder / Reviewer column values:** `PENDING` · `IN_PROGRESS` · `AWAITING_REVIEW` · `APPROVED` · `CHANGES_REQUIRED` · `ESCALATED`

---

## Builder Output

> One anchored block per active manifest row. Orchestrator seeds stubs from `references/review-component-stub.md`.

---

## Reviewer Feedback

> One anchored block per active manifest row. Orchestrator seeds reviewer stubs before launching reviewers.

---

## Iteration log

> **Orchestrator only** — append one row per component iteration (build or review).

| Order | Component | Iteration | Mode | Agent | Verdict | AC Pass | Visual | Regressions |
|------:|-----------|----------:|------|-------|---------|---------|--------|-------------|
| — | — | — | — | — | — | — | — | — |
