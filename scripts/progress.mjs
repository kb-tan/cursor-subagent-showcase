#!/usr/bin/env node
/**
 * Human progress view — reads review_history.db + SPEC §5, prints kanban to stdout.
 * Routing gates use SQLite only (see shipit SKILL). Does not write review.md.
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DB = join(ROOT, 'review_history.db');
const SPEC = join(ROOT, 'SPEC.md');

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function query(sql) {
  if (!existsSync(DB)) {
    console.error(`${c.yellow}No review_history.db — run: npm run init-db${c.reset}`);
    process.exit(1);
  }
  const oneLine = sql.replace(/\s+/g, ' ').trim();
  const out = execSync(`sqlite3 -json ${JSON.stringify(DB)} ${JSON.stringify(oneLine)}`, {
    encoding: 'utf8',
    cwd: ROOT,
  }).trim();
  return out ? JSON.parse(out) : [];
}

function parseManifest() {
  const text = readFileSync(SPEC, 'utf8');
  const section = text.split('## 5. Build Manifest')[1]?.split(/^## /m)[0] ?? '';
  const rows = [];
  for (const line of section.split('\n')) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/);
    if (!m || m[1] === 'Order') continue;
    rows.push({
      order: Number(m[1]),
      scope: m[2].trim(),
      dependencies: m[5].trim(),
    });
  }
  if (!rows.length) {
    console.error(`${c.yellow}Could not parse SPEC.md §5 Build Manifest${c.reset}`);
    process.exit(1);
  }
  return rows;
}

function shortLabel(scope, iteration) {
  const abbr = scope
    .replace('Header + Input', 'Header')
    .replace('Plan Tabs', 'Plans')
    .replace('List + Footer', 'List+Foot')
    .replace('Integration', 'Integr.')
    .replace('Todo Item', 'TodoItem');
  const base = abbr.slice(0, 11);
  return iteration > 1 ? `${base}(i${iteration})` : base;
}

function latestReviewsByComponent() {
  const rows = query(`
    SELECT r.component, r.agent, r.verdict, r.iteration, r.id
    FROM reviews r
    INNER JOIN (
      SELECT component, agent, MAX(id) AS max_id
      FROM reviews
      GROUP BY component, agent
    ) t ON r.id = t.max_id
  `);
  const by = new Map();
  for (const r of rows) {
    if (!by.has(r.component)) by.set(r.component, {});
    by.get(r.component)[r.agent] = r;
  }
  return by;
}

function manifestState() {
  const rows = query(`SELECT component, status, iteration FROM build_manifest_state`);
  return new Map(rows.map((r) => [r.component, r]));
}

function depsApproved(dep, state, manifest) {
  if (!dep || dep.toLowerCase() === 'none') return true;
  const m = dep.match(/Order\s+(\d+)/i);
  if (!m) return true;
  const order = Number(m[1]);
  const row = manifest.find((r) => r.order === order);
  if (!row) return true;
  return state.get(row.scope)?.status === 'APPROVED';
}

function columnFor(scope, manifest, state, reviews) {
  const st = state.get(scope);
  if (st?.status === 'APPROVED') return 'SHIPPED';
  if (st?.status === 'ESCALATED') return 'ESCALATED';

  const row = manifest.find((r) => r.scope === scope);
  if (row && !depsApproved(row.dependencies, state, manifest)) return 'BACKLOG';

  const rev = reviews.get(scope) ?? {};
  if (rev.reviewer?.verdict === 'CHANGES_REQUIRED') return 'IN_REVIEW';
  if (rev.builder && !rev.reviewer) return 'IN_REVIEW';
  if (rev.builder && rev.reviewer && rev.builder.iteration !== rev.reviewer.iteration) {
    return 'IN_REVIEW';
  }
  if (rev.builder) return 'IN_REVIEW';

  return 'BACKLOG';
}

function renderKanban(buckets) {
  const cols = ['BACKLOG', 'BUILDING', 'IN_REVIEW', 'SHIPPED'];
  const W = 11;
  const lines = [];
  lines.push('┌─────────────┬────────────┬────────────┬───────────┐');
  lines.push('│   BACKLOG   │  BUILDING  │  IN REVIEW │  SHIPPED  │');
  lines.push('├─────────────┼────────────┼────────────┼───────────┤');

  const maxRows = Math.max(...cols.map((col) => buckets[col].length), 1);
  for (let i = 0; i < maxRows; i++) {
    const cells = cols.map((col) => {
      const label = buckets[col][i] ?? '';
      return ` ${label.padEnd(W)} `;
    });
    lines.push(`│${cells[0]}│${cells[1]}│${cells[2]}│${cells[3]}│`);
  }
  lines.push('└─────────────┴────────────┴────────────┴───────────┘');
  return lines.join('\n');
}

function main() {
  const manifest = parseManifest();
  const state = manifestState();
  const reviews = latestReviewsByComponent();

  const buckets = {
    BACKLOG: [],
    BUILDING: [],
    IN_REVIEW: [],
    SHIPPED: [],
    ESCALATED: [],
  };
  let shippedN = 0;
  let escalatedN = 0;

  for (const { scope } of manifest) {
    const st = state.get(scope);
    const iter = st?.iteration ?? reviews.get(scope)?.builder?.iteration ?? 1;
    const label = shortLabel(scope, iter);
    const col = columnFor(scope, manifest, state, reviews);

    if (col === 'SHIPPED') {
      shippedN++;
      buckets.SHIPPED.push(label);
      continue;
    }
    if (col === 'ESCALATED') {
      escalatedN++;
      buckets.BACKLOG.push(`${label}!`);
      continue;
    }
    buckets[col].push(label);
  }

  const inFlight = [...buckets.BUILDING, ...buckets.IN_REVIEW];
  const inFlightStr = inFlight.length ? inFlight.join(', ') : '—';

  let project = 'Agentic TODO';
  try {
    const spec = readFileSync(SPEC, 'utf8');
    const m = spec.match(/## 2\. Overview[\s\S]*?^A (.+?)\./m);
    if (m) project = m[1].trim();
  } catch {
    /* ignore */
  }

  console.log('');
  console.log(`${c.bold}${c.cyan}SHIPIT PROGRESS${c.reset}  ${c.dim}${new Date().toISOString()}${c.reset}`);
  console.log(`${c.dim}Source: review_history.db · Gates: SQLite only${c.reset}`);
  console.log(`${project} · ${shippedN}/${manifest.length} shipped`);
  console.log('');
  console.log(`${c.bold}SHIPPED SUMMARY${c.reset}`);
  console.log('');
  console.log(renderKanban(buckets));
  console.log('');
  console.log(
    `${c.green}SHIPPED:${c.reset} ${shippedN}/${manifest.length}` +
      `   ${c.yellow}IN FLIGHT:${c.reset} ${inFlightStr}` +
      `   ${c.bold}ESCALATED:${c.reset} ${escalatedN}`,
  );
  console.log('');
}

main();
