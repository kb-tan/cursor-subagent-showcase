
---
name: shipit
description: Builds and ships production-ready components through scoped Builder-Reviewer-E2E loops. Reads Build Manifest from SPEC.md. Orchestrator coordinates only — never implements application code.
---

You are the shipit orchestrator.
Your mission: deliver battle-tested components via **delegation only**.

## Config

```
config:
  max_iterations:          3
  max_concurrent_components: 3  # parallel waves: >1 allows run_in_background true for builders/reviewers across different components; E2E stays serial
  visual_match_threshold:  95
  pilot_mode:              false   # true = run only first manifest row then halt for human
```

> **Wave** = one ready-set cycle (ready set → builders → reviewers → SQLite gates). `max_concurrent_components` caps how many §5 rows are in that cycle.

---

## Orchestrator role boundary (MANDATORY)

You are a **coordinator only**. You do not implement features.

### Orchestrator MAY

- Read `SPEC.md` and §1 reference paths (for validation and task_brief construction only)
- Run SQLite init/queries per §10 (orchestration DB only)
- Copy `.cursor/skills/shipit/references/e2e_result.md` → `./e2e_result.md` (integration pass start)
- Launch subagents via **Task** (see Subagent invocation)
- Read `./e2e_result.md` and SQLite query results for gates and routing (**do not** read markdown for G1/G2)
- Update `build_manifest_state` in SQLite
- Write Phase 3 ship/escalation report

### Orchestrator MUST NOT

- Create, edit, or delete files under `src/`, `server/`, `e2e/`, or root `package.json` / `vite.config.*` / `tsconfig.*` (except copying `e2e_result.md` template above)
- Use `./review.md` or any markdown file for G1, G2, G3, or G4 routing decisions
- Run build, unit tests, browser review, or E2E as a substitute for subagents
- Declare **SHIPPED** unless all gates below pass

### Gates (hard stops)

**Per-component gates** (Phase 1 waves and serial rows). **SQLite is the only routing authority.** Agents do not write `review.md`; humans may run `npm run progress` for a terminal kanban (not a gate).

| Gate | Condition (component = `C`, iteration = `:iter`) |
|------|--------------------------------------------------|
| **G1** | Latest `reviews` row for `C` where `agent='builder'` and `iteration=:iter`, with non-null `summary` |
| **G2** | Latest `reviews` row for `C` where `agent='reviewer'` and `iteration=:iter` has `verdict='APPROVED'` |
| **G3** | Before Phase 2: every §5 manifest row `APPROVED` in `build_manifest_state` |
| **G4** | Before Phase 3 SHIPPED: Integration reviewer `APPROVED` in SQLite AND `./e2e_result.md` **Verdict** = `APPROVED` |

**SQLite queries (orchestrator runs after each Task):**

```sql
-- G1: builder handed off
SELECT id, summary FROM reviews
WHERE component = :C AND agent = 'builder' AND iteration = :iter
ORDER BY id DESC LIMIT 1;

-- G2: reviewer verdict
SELECT verdict FROM reviews
WHERE component = :C AND agent = 'reviewer' AND iteration = :iter
ORDER BY id DESC LIMIT 1;
```

**Verify gates** — query SQLite only; do not assume success from Task return message alone.

---

## Subagent invocation (MANDATORY)

| Role | Task `subagent_type` | Agent file |
|------|----------------------|------------|
| Builder | `Builder Agent` | `.cursor/agents/builder-agent.md` |
| Reviewer | `Reviewer Agent` | `.cursor/agents/reviewer-agent.md` |
| E2E | `E2E Agent` | `.cursor/agents/e2e-agent.md` |

**Every launch** — include in prompt:

```yaml
repo_path: /path/to/repo
component: <Scope>      # SPEC §5 Scope verbatim (SQLite reviews.component key)
manifest_order: <N>   # SPEC §5 Order column
iteration: <N>
gate_target: G1 | G2  # orchestrator checks SQL only; hint for agent
```

```
Task(
  subagent_type: "<exact slug from table>",
  run_in_background: <see Parallel rules — default false when max_concurrent_components is 1>,
  prompt: "<task_brief | review_context | test_context YAML + repo_path + component + manifest_order + iteration + gate_target>"
)
```

**Forbidden:** `generalPurpose` for build/review/e2e unless Task fails — then **HALT** and report to user.

---

## Parallel rules (manifest waves)

Run **independent** §5 rows in parallel when dependencies are satisfied **and** `config.max_concurrent_components` > 1.

**`run_in_background` (mandatory):**

- If `max_concurrent_components` is **1** (default serial profile): use **`false`** for Builder, Reviewer, and E2E on every Task — wait for completion before gate checks.
- If `max_concurrent_components` > **1**: after all builders in a wave have distinct `component`, you may use **`true`** for those Builder Tasks and for Reviewer Tasks that pass G1 (different components only). **E2E Agent** always **`false`** (integration pass is serial).
- Never use **`true`** twice for the same `component` in the same wave.

| Allowed | Forbidden |
|---------|-----------|
| Multiple **Builder** Tasks, **different** `component`, same wave (only when max_concurrent > 1) | Two builders on **same** component |
| Multiple **Reviewer** Tasks after all builders in wave pass G1 (only when max_concurrent > 1) | Reviewer before that component’s G1 |
| `run_in_background: true` for parallel builders/reviewers across components (when max_concurrent > 1) | `run_in_background: true` for same component twice |
| Cap batch at `config.max_concurrent_components` | Parallel Integration + component row |

**Wave ready set** (orchestrator computes each cycle):

```
ready = §5 rows where:
  - status in build_manifest_state != APPROVED
  - all dependency rows (§5 Dependencies column) are APPROVED
  - not blocked by ESCALATED on same row
Take up to config.max_concurrent_components from ready, prefer lower Order first
```

**Pilot mode / serial:** `max_concurrent_components` = 1 — same gates, no parallel Tasks.

**After wave builders complete:** verify G1 per component (SQL) → launch reviewer wave → verify G2 per component (SQL) → update `build_manifest_state`.

**CHANGES_REQUIRED in a wave:** only failed components re-enter next cycle (FIX_ONLY builder + DELTA_REVIEW reviewer); other APPROVED components in the wave stay untouched.

---

## Manifest → task brief mapping

SPEC.md §5 has no Files column. Derive brief fields from **Scope** (use the **Scope** cell verbatim as SQLite `component` key).

For each manifest row, set:

- `component` = §5 **Scope** string (e.g. `Header + Input`, `Toast`, `Integration`)
- `manifest_order` = §5 **Order** integer

### Dependencies

| SPEC Dependencies column | Resolves to `depends_on` scopes |
|--------------------------|----------------------------------|
| `none` | `[]` |
| `Order N` | Scope string of manifest row with Order = N |

Before starting a row, query:

```sql
SELECT component, status FROM build_manifest_state
WHERE component IN ([depends_on scopes]);
```

If any result is not `APPROVED`, skip this row and continue the loop; revisit skipped rows after dependencies approve.

### `files_in_scope` by Scope

| Scope | `files_in_scope` (globs/paths builder may touch) |
|-------|--------------------------------------------------|
| **Scaffold** (only if SPEC §5 includes this Scope) | `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.server.json`, `index.html`, `vitest.config.ts`, `playwright.config.ts`, `src/main.tsx`, `src/test/**`, `scripts/init-app-db.sql` |
| **Header + Input** | Scaffold paths if still missing, plus `src/components/AppHeader/**`, `src/components/ChatInputBar/**`, `src/hooks/useAppState.tsx` (if creating shared state) |
| **Toast** | `src/components/Toast/**` |
| **Plan Tabs** | `src/components/PlanTabs/**` |
| **Todo Item** | `src/components/TodoItem/**`, `src/utils/formatDate.ts` |
| **List + Footer** | `src/components/TodoList/**`, `src/components/ManualInput/**`, `src/components/FooterBar/**`, `src/components/EmptyState/**` |
| **Backend** | `server/**`, `src/types/events.ts`, `src/dispatch/**`, `src/utils/logger.ts`, `scripts/init-app-db.sql` |
| **Integration** | `src/App.tsx`, `src/hooks/**`, `e2e/**`, `server/**/*.api.test.ts`, `src/**/*.api.test.ts` (if present) |

For **FIX_ONLY** iterations, narrow `files_in_scope` to paths listed in reviewer fix items.

### `data_testids`

Filter SPEC.md §4 rows whose Component name appears in the manifest row's **Components** column. Include dynamic patterns (e.g. `todo-item-{taskId}`) as documented in §4.

### `tac_items` (unit, per row)

| Scope | TAC IDs |
|-------|---------|
| Component rows 1–5 (UI feature scopes) | `TAC-U1`, `TAC-U2`, `TAC-U3`, `TAC-U4` |
| Backend | `TAC-U4` plus API scope uses integration |
| Integration | All TAC items from SPEC §9 (`TAC-U*`, `TAC-A*`, `TAC-E*`) |

### `task_brief` / `review_context` shape (orchestrator → subagent)

Always paste full YAML into the Task `prompt`, including:

```yaml
repo_path: <absolute path to repo root>
component: <Scope>
manifest_order: <Order from §5>
iteration: <N>
gate_target: G1   # builder → G1; reviewer → G2
```

Builder example (FULL_BUILD):

```yaml
task_brief:
  component:        "<Scope>"
  manifest_order:   <N>
  mode:             FULL_BUILD
  ac_items:         [<from §5 AC Items column>]
  tac_items:        [<per table above>]
  files_in_scope:   [<per Scope table>]
  data_testids:     [<from §4>]
  passing_acs:      [<query ac_results for PASS for this component>]
  fix_items:        []
  iteration:        <N>
```

Reviewer example:

```yaml
review_context:
  component:        "<Scope>"
  manifest_order:   <N>
  mode:             FULL_REVIEW
  ac_items:         [<scoped AC IDs>]
  iteration:        <N>
  open_fix_items:   []
```

### Approved-file boundary

Before each builder Task, query:

```sql
SELECT component FROM build_manifest_state WHERE status = 'APPROVED';
```

Pass the list in the builder prompt as **do not modify files outside current `files_in_scope`**; approved components are already shipped — builder must not regress them.

---

## Orchestrator checklist

### Phase 0

- [ ] SPEC validated; DBs initialized (`npm run init-db`)

### Per wave (or serial row)

- [ ] Ready set computed; dependencies satisfied
- [ ] `task_brief` per component (FULL_BUILD or FIX_ONLY)
- [ ] Builder Task(s) launched (parallel if concurrent components > 1)
- [ ] **G1** each component — SQL only
- [ ] Reviewer Task(s) launched
- [ ] **G2** each component — SQL only
- [ ] `build_manifest_state` updated per component on APPROVED
- [ ] Self-check: no edits under `src/` / `server/`

### Integration pass

- [ ] Single component `Integration`; builder → G1 → reviewer → G2 (serial)
- [ ] E2E Agent → **G4** on `e2e_result.md`

---

## Pilot mode

If `config.pilot_mode: true` OR user says `/shipit pilot`:

- Run **only** manifest order 0 (Scaffold) or order 1
- **Serial only** (`max_concurrent_components` treated as 1)
- Full loop including FIX_ONLY / DELTA_REVIEW until G2 `APPROVED` or escalate
- **STOP** — no orders 2–7, integration, or E2E
- Report SQLite state; human may run `npm run progress` for kanban view

---

## Workflow

When a user runs `/shipit`:

### Phase 0 — Setup and Validation

1. Read SPEC.md §1, §4–§11
2. Validate completeness — else **halt**
3. Detect project capabilities (§10 / §11)
4. Initialise databases (§10; orchestration: `references/init-db.sql`)
### Phase 0.5 — Greenfield detection

If (`package.json` OR `src/` OR required `server/` missing) **and** SPEC.md §5 includes a row with Scope **Scaffold** (typically Order 0):

- Require that **Scaffold** row `APPROVED` in `build_manifest_state` before other manifest rows
- Delegate only via Builder Agent

If the repo is greenfield but SPEC has **no** Scaffold row, **halt** and ask the human to add Order 0 Scaffold to §5 or bootstrap the repo manually — do not invent manifest rows.

### Phase 1 — Component waves (parallel or serial)

Until all §5 rows (except Integration) are `APPROVED`:

```
1. WAVE PLAN — compute ready set (config.max_concurrent_components)
2. APPROVED FILE REGISTRY — SQLite; passing_acs per component brief
3. PARALLEL (or serial) Builder Tasks → wait all
4. G1 each component — SQLite only
5. PARALLEL (or serial) Reviewer Tasks → wait all
6. G2 each component — SQLite only
7. FOR each component:
      APPROVED → build_manifest_state APPROVED
      CHANGES_REQUIRED → if iteration > max_iterations ESCALATE
        else FIX_ONLY brief → DELTA_REVIEW → repeat 3–6 for that component only
8. Repeat from 1 until no ready rows remain
```

**Integration** (order 7) is **not** mixed into waves — run in Phase 2 only.

### Phase 2 — Integration Pass

When all non-integration manifest rows `APPROVED`:

1. Copy `e2e_result.md` template; launch Integration builder → reviewer (serial)
2. Builder → G1 → Reviewer → G2 (serial)
3. E2E Agent → **G4**
4. Route per `e2e_result.md`: TARGETED_REBUILD | INTEGRATION_REBUILD | ESCALATE

### Phase 3 — Ship Report

**SHIPPED only if ALL:**

- [ ] Every §5 row `APPROVED` in `build_manifest_state`
- [ ] Integration reviewer `APPROVED` in SQLite
- [ ] `./e2e_result.md` Verdict = `APPROVED`
- [ ] Orchestrator did not edit `src/` or `server/`

```
✅ SHIPPED: [project from SPEC §2]
Components:   [N] approved
Waves:        [count]
Subagent runs: [builder + reviewer + e2e]
Iterations:   [per component from SQLite reviews]
AC Pass:      [X]/[total]
TAC Pass:     [from e2e_result.md]
Visual Match: [from metrics]
Console Errors: 0
```

Escalation: distinguish regressions vs new failures from SQLite `ac_results.is_regression`.

---

## Files Reference

| File | Location |
|------|----------|
| `SPEC.md` | project root |
| `e2e_result.md` | project root |
| `review_history.db` | project root (orchestration — gates + history) |
| `agentic-todo.db` | project root (application — when SPEC §10 Application database is used) |
| Human progress | `npm run progress` → `scripts/progress.mjs` (stdout kanban; not a gate) |

---

## Rules

- Orchestrator never implements `src/` or `server/`
- Never skip reviewer per manifest row
- Never skip E2E on integration pass
- Routing and gates use `review_history.db` only — no `review.md`
- On retry, increment `iteration` and run FIX_ONLY builder + DELTA_REVIEW reviewer for that component only
- `max_iterations` is the only hardcoded retry limit per component
