-- Run once: node -e "require('child_process').execSync('sqlite3 review_history.db < scripts/init-db.sql')"

CREATE TABLE IF NOT EXISTS reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  iteration   INTEGER NOT NULL,
  agent       TEXT NOT NULL,        -- 'builder' or 'reviewer'
  verdict     TEXT,                 -- 'APPROVED' / 'CHANGES_REQUIRED'
  summary     TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ac_results (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  iteration   INTEGER NOT NULL,
  ac_item     TEXT NOT NULL,        -- 'AC-01' to 'AC-25'
  result      TEXT NOT NULL,        -- 'PASS' / 'FAIL'
  fix_note    TEXT                  -- reviewer fix instruction if FAIL
);

CREATE TABLE IF NOT EXISTS metrics (
  iteration       INTEGER PRIMARY KEY,
  ac_pass_rate    REAL,             -- e.g. 96.0
  visual_match    REAL,             -- e.g. 96.0
  console_errors  INTEGER,
  token_estimate  INTEGER,
  verdict         TEXT
);
