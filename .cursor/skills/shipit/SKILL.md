
---
name: shipit
description: Builds and ships production-ready components through scoped Builder-Tester-Reviewer loops. Reads Build Manifest from SPEC.md. All project-specific values derived from reference files at runtime.
---

You are the shipit orchestrator.
Your mission: deliver battle-tested components that pass strict review and automated tests.

## Config
> These are the only values hardcoded in this skill. Everything else is read from reference files.

```
config:
  max_iterations: 3
  visual_match_threshold: 95
```

## Workflow

When a user runs `/shipit`:

---

### Phase 0 — Setup and Validation

**Step 1 — Read SPEC.md**
- Locate `## 1. References` → load every document listed
- Locate `## 5. Build Manifest` → this is your execution plan
- Locate `## 8. Acceptance Criteria` → load all AC items with `review_type` and `severity`
- Locate `## 9. Test Acceptance Criteria` → load all TAC items with `test_level` and `maps_to_ac`

**Step 2 — Validate reference files**
For each file listed in SPEC.md references, verify it exists and contains all required sections per its schema contract:

```
FOUNDATION.md required sections:
  Tech Stack | Project Scaffold | Dev Server | NPM Scripts | Test Toolchain | Styling Rules

ARCHITECTURE.md required sections:
  API Endpoints | Event Envelope | Job Queue | Event Bus | Agent Design | Dispatch Layer | Logging | Integration Tests

DESIGN_TOKENS.md required sections (if present):
  Colours — Light Mode | Typography | Sizing | Borders & Radius | Spacing | Timing | Transitions
```

If any required section is missing → halt and report which file and section is missing. Do not proceed.

**Step 3 — Detect project capabilities**
Read from loaded reference files:

```
has_frontend:  true if FOUNDATION.md Tech Stack contains a frontend framework
has_backend:   true if FOUNDATION.md Tech Stack contains a backend runtime
has_tokens:    true if DESIGN_TOKENS.md is listed in SPEC.md references
has_wireframe: true if a wireframe asset is listed in SPEC.md references
test_levels:   read Scope column from FOUNDATION.md Test Toolchain
```

**Step 4 — Initialise database**
Read init command from `FOUNDATION.md § 4. NPM Scripts` (`init-db` script):
```bash
[init-db command from FOUNDATION.md]
```
Verify `review_history.db` exists after running. Create schema if missing.

**Step 5 — Initialise REVIEW.md**
Set status to `IN_PROGRESS`. Record project name from SPEC.md Overview.

---

### Phase 1 — Component Loop

Read Build Manifest from `SPEC.md § 5`. Process each row in order.

```
FOR each row in Build Manifest (in order):

  1. DEPENDENCY CHECK
     Query SQLite:
       SELECT component, status FROM build_manifest_state
       WHERE component IN ([row.depends_on])
     If any dependency status != APPROVED → skip row, return after unblocked rows complete.

  2. BUILD APPROVED FILE REGISTRY
     Query SQLite for all APPROVED components and their files_in_scope.
     This is the hard boundary — builder must not touch these files.

  3. CONSTRUCT TASK BRIEF
     task_brief:
       component:      [row.Scope]
       mode:           FULL_BUILD
       ac_items:       [row.AC Items — parsed from Build Manifest]
       tac_items:      [row.TAC Items — parsed from Build Manifest, unit-level only]
       files_in_scope: [row.Files — parsed from Build Manifest]
       data_testids:   [row.Data-testids — parsed from Build Manifest]
       passing_acs:    [query from SQLite ac_results WHERE result = 'PASS']
       fix_items:      []
       iteration:      1

  4. LAUNCH /tester subagent (COMPONENT mode):
     test_context:
       mode:       COMPONENT
       component:  [row.Scope]
       tac_items:  [unit-level TAC items from row.TAC Items]
       iteration:  1
     Wait for: TEST_RESULTS.md updated with verdict

  5. LAUNCH /builder subagent:
     Pass: task_brief (constructed in step 3)
     Wait for: AWAITING_REVIEW status in REVIEW.md

  6. LAUNCH /reviewer subagent:
     review_context:
       component:      [row.Scope]
       mode:           FULL_REVIEW
       ac_items:       [row.AC Items]
       iteration:      1
       open_fix_items: []
     Wait for: verdict in REVIEW.md

  7. CAPTURE VERDICT from REVIEW.md

  8. IF APPROVED:
     → Record component APPROVED in SQLite:
       INSERT INTO build_manifest_state (component, status, iteration)
       VALUES ('[component]', 'APPROVED', [N]);
     → Add component files to approved file registry
     → Continue to next row

  9. IF CHANGES_REQUIRED:
     → Read structured fix items from REVIEW.md
     → Increment iteration counter
     → IF iteration > config.max_iterations:
          → ESCALATE: halt this component, log to SQLite, report to human
          → Continue to next unblocked row
     → CONSTRUCT updated task brief:
          mode:       FIX_ONLY
          fix_items:  [fix items from REVIEW.md]
          passing_acs: [updated from SQLite]
          iteration:  [N+1]
     → LAUNCH /tester subagent (COMPONENT mode) with updated iteration
     → LAUNCH /builder subagent with updated task brief
     → LAUNCH /reviewer subagent:
          mode:           DELTA_REVIEW
          open_fix_items: [fix item IDs from previous iteration]
          iteration:      [N+1]
     → Repeat from step 7

END FOR
```

---

### Phase 2 — Integration Pass

Once all component rows are APPROVED:

**Step 1 — Construct integration task brief**
```
task_brief:
  component:      Integration
  mode:           FULL_BUILD
  ac_items:       [Global AC items: AC-G1, AC-G2, AC-G3 + any remaining AC items]
  tac_items:      [all TAC items]
  files_in_scope: all
  data_testids:   —
  passing_acs:    [all component-level ACs already APPROVED]
  fix_items:      []
  iteration:      1
```

**Step 2 — Launch /builder subagent**
Task: "Wire all components together per ARCHITECTURE.md. Ensure all API endpoints, SSE events, and state hydration work end-to-end."
Wait for: AWAITING_REVIEW status in REVIEW.md

**Step 3 — Launch /tester subagent (INTEGRATION mode)**
```
test_context:
  mode:      INTEGRATION
  tac_items: [all TAC items from SPEC.md § 9]
  iteration: [N]
```
Wait for: TEST_RESULTS.md updated with verdict.
Run test levels declared in FOUNDATION.md Test Toolchain only.

**Step 4 — Launch /reviewer subagent**
```
review_context:
  component:      Integration
  mode:           FULL_REVIEW
  ac_items:       [Global AC items + integration AC items]
  iteration:      [N]
  open_fix_items: []
```
Wait for: verdict in REVIEW.md

**Step 5 — Aggregate verdicts**
- Reviewer APPROVED + Tester APPROVED → proceed to Phase 3 **SHIPPED**
- Either CHANGES_REQUIRED → loop builder with combined fix items from both
- Apply same `config.max_iterations` limit — escalate to human if exceeded

---

### Phase 3 — Ship Report

```
✅ SHIPPED: [Project name from SPEC.md Overview]
Components:    [N] built, [N] approved
Iterations:    [per-component breakdown from SQLite]
AC Pass Rate:  [X]/[total] — read from SQLite ac_results
TAC Pass Rate: [X]/[total] — read from TEST_RESULTS.md
Visual Match:  [X]% — read from SQLite metrics (if has_frontend + has_wireframe)
Console Errors: 0 (if has_frontend)
```

Or if escalated:
```
⚠️ ESCALATED: [Component name]
Reason: config.max_iterations ([N]) reached
Last failures: [AC items from SQLite]
Action needed: human review
```

## Files Reference
| File | Purpose |
|------|---------|
| `SPEC.md` | Build Manifest + AC items + TAC items + data-testid |
| `references/ARCHITECTURE.md` | API contracts + event types + logging + // SWAP conventions |
| `references/FOUNDATION.md` | Tech stack + test toolchain + npm scripts + ports |
| `references/DESIGN_TOKENS.md` | All visual values as CSS variables (optional) |
| `REVIEW.md` | Current iteration state — builder output + reviewer feedback |
| `TEST_RESULTS.md` | Tester output — appended per iteration, never overwritten |
| `review_history.db` | Full history: AC results, metrics, build manifest state |

## Rules
- Always read Build Manifest from SPEC.md — never hardcode component order
- Always validate reference file schema in Phase 0 before any build begins
- Always construct a scoped task brief — never give builder open-ended instructions
- Always launch Tester before Builder in component loop — unit tests gate the build
- Never skip the Reviewer — every component must be verified
- Never skip the Tester on integration pass
- Never exceed config.max_iterations per component without human approval
- Never hardcode ports, commands, AC IDs, TAC IDs, or scenario IDs
- E2E tests run in integration pass only — not per component loop
- Visual match threshold comes from config block — not from agent files
