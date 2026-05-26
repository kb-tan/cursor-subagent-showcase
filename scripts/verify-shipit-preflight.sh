#!/usr/bin/env sh
# Preflight checks for shipit multi-agent sync (agentic-patterns profile).
# Run from repo root: sh scripts/verify-shipit-preflight.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

test -f .cursor/agents/builder-agent.md || fail "missing builder-agent"
test -f .cursor/agents/reviewer-agent.md || fail "missing reviewer-agent"
test -f .cursor/agents/e2e-agent.md || fail "missing e2e-agent"
test -f .cursor/skills/shipit/SKILL.md || fail "missing shipit SKILL"
test -f .cursor/skills/shipit/references/review.md || fail "missing review template"
test -f .cursor/skills/shipit/references/review-component-stub.md || fail "missing review-component-stub"
test -f .cursor/skills/shipit/references/init-db.sql || fail "missing init-db.sql"
test -f scripts/init-app-db.sql || fail "missing scripts/init-app-db.sql"
test -f SPEC.md || fail "missing SPEC.md"

grep -q '^name: Builder Agent' .cursor/agents/builder-agent.md || fail "builder name mismatch"
grep -q '^name: Reviewer Agent' .cursor/agents/reviewer-agent.md || fail "reviewer name mismatch"
grep -q '^name: E2E Agent' .cursor/agents/e2e-agent.md || fail "e2e name mismatch"

grep -q '`Builder Agent`' .cursor/skills/shipit/SKILL.md || fail "SKILL missing Builder Agent slug"
grep -q '`Reviewer Agent`' .cursor/skills/shipit/SKILL.md || fail "SKILL missing Reviewer Agent slug"
grep -q '`E2E Agent`' .cursor/skills/shipit/SKILL.md || fail "SKILL missing E2E Agent slug"

grep -q 'shipit:component=' .cursor/skills/shipit/references/review.md || fail "review template missing anchors"
grep -q 'BRAID.md' SPEC.md && fail "SPEC must not reference BRAID on agentic-patterns profile" || true
grep -q 'Visual contract' SPEC.md || fail "SPEC should document Visual contract (DESIGN_TOKENS)"
grep -q 'Orchestration database' SPEC.md || fail "SPEC §10 should include Orchestration database"

rm -f /tmp/shipit-preflight-rh.db /tmp/shipit-preflight-app.db
sqlite3 /tmp/shipit-preflight-rh.db < .cursor/skills/shipit/references/init-db.sql
sqlite3 /tmp/shipit-preflight-app.db < scripts/init-app-db.sql

echo "OK: shipit preflight passed."
