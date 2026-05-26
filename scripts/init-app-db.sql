-- agentic-todo.db — application database (runtime)
-- Created by: npm run init-db (second step; see references/FOUNDATION.md)
-- Builder implements full schema when Backend manifest row is built.

CREATE TABLE IF NOT EXISTS plans (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  plan_id     TEXT,
  title       TEXT NOT NULL,
  completed   INTEGER NOT NULL DEFAULT 0,
  label       TEXT,
  due_date    TEXT,
  highlighted INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  state       TEXT NOT NULL,
  payload     TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);
