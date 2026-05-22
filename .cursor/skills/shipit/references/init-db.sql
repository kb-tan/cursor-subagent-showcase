
-- review_history.db schema
-- Orchestrator runs this on first execution via: npm run init-db
-- All agents discover table names and columns from SPEC.md § 10

-- One record per agent per iteration
-- Written by: Builder, Reviewer, E2E Agent
CREATE TABLE IF NOT EXISTS reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  iteration   INTEGER NOT NULL,
  component   TEXT,                              -- component or scope label
  agent       TEXT NOT NULL,                     -- 'builder' | 'reviewer' | 'e2e-agent'
  verdict     TEXT,                              -- 'APPROVED' | 'CHANGES_REQUIRED' | NULL
  summary     TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- One record per AC item per iteration
-- Written by: Reviewer
CREATE TABLE IF NOT EXISTS ac_results (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  iteration   INTEGER NOT NULL,
  component   TEXT,
  ac_item     TEXT NOT NULL,                     -- e.g. 'AC-07'
  result      TEXT NOT NULL,                     -- 'PASS' | 'FAIL'
  is_regression INTEGER DEFAULT 0,              -- 1 if was PASS in previous iteration
  fix_note    TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- One record per scenario per iteration
-- Written by: E2E Agent
CREATE TABLE IF NOT EXISTS e2e_results (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  iteration           INTEGER NOT NULL,
  tac_item            TEXT NOT NULL,             -- e.g. 'TAC-E1'
  journey             TEXT,                      -- e.g. 'US1'
  result              TEXT NOT NULL,             -- 'PASS' | 'FAIL'
  failed_step         TEXT,
  suspected_component TEXT,
  suspected_zone      TEXT,                      -- annotation zone e.g. 'F'
  confidence          TEXT,                      -- 'high' | 'medium' | 'low'
  evidence            TEXT,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Summary metrics per iteration
-- Written by: Reviewer, E2E Agent
CREATE TABLE IF NOT EXISTS metrics (
  iteration       INTEGER NOT NULL,
  agent           TEXT NOT NULL,                 -- 'reviewer' | 'e2e-agent'
  ac_pass_rate    REAL,
  visual_match    REAL,
  console_errors  INTEGER,
  e2e_pass_rate   REAL,
  token_estimate  INTEGER,
  verdict         TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (iteration, agent)
);

-- Build manifest state — tracks APPROVED components across iterations
-- Written by: Orchestrator
CREATE TABLE IF NOT EXISTS build_manifest_state (
  component   TEXT PRIMARY KEY,
  status      TEXT NOT NULL DEFAULT 'PENDING',   -- 'PENDING' | 'APPROVED' | 'ESCALATED'
  iteration   INTEGER,
  approved_at DATETIME
);
