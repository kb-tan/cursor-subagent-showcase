
> **SCHEMA CONTRACT**
> Agents locate information in this file by exact section heading and column name.
> Do not rename sections. Do not reorder columns within tables.
> Required sections: `API Endpoints`, `Event Envelope`, `Job Queue`, `Event Bus`, `Agent Design`, `Dispatch Layer`, `Logging`, `Integration Tests`
> Optional sections: any additional sections are ignored by agents unless referenced in SPEC.md.
> Phase 0 validation: SKILL.md reads this file and halts if any required section is missing.

> **`// SWAP` CONVENTION**
> Any code block annotated with `// SWAP: ...` marks an implementation that is intentionally simplified for local development.
> The comment describes what to replace it with in a production environment.
> Builder must include `// SWAP` comments exactly as shown — Reviewer checks for their presence.
> Never remove a `// SWAP` comment — it is a production readiness marker, not dead code.

# ARCHITECTURE.md

## Table of Contents
| # | Section | Purpose |
|---|---------|---------|
| 1 | System Topology | How components connect end-to-end |
| 2 | API Endpoints | Request/response contracts |
| 3 | Event Envelope | All SSE event types and payloads |
| 4 | Job Queue | p-queue configuration and job states |
| 5 | Event Bus | InMemoryEventBus implementation |
| 6 | Agent Design | LangGraph nodes, edges, tools |
| 7 | Dispatch Layer | Frontend SSE routing |
| 8 | Logging | Structured log format for frontend and backend |
| 9 | Integration Tests | Test levels, API contracts, E2E strategy |

---

## 1. System Topology
```
Browser (React)
 │
 │  POST /api/chat { message, sessionId, context }
 ▼
Express
 │  mints jobId → enqueues → returns { jobId }
 ▼
p-queue (1 per sessionId, concurrency: 1)
 ▼
LangGraph Agent
 ├── SQLite (plans, tasks, jobs, conversation_history)
 └── InMemoryEventBus
       │
       SSE stream → GET /api/events?sessionId=
       │
       Browser Dispatch Layer
       └── routes by eventType → React components
```

---

## 2. API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Submit message, returns `{ jobId }` |
| `/api/events` | GET | SSE stream (`?sessionId=`) |
| `/api/tasks` | POST | Manual task creation |
| `/api/tasks/:id` | PATCH | Partial task update |
| `/api/tasks/:id` | DELETE | Delete task |
| `/api/state` | GET | Hydrate state on refresh (`?sessionId=`) |
| `/api/health` | GET | Server health check |

### Request / Response Shapes

**POST /api/chat**
```typescript
// Request
{ message: string; sessionId: string; context?: { highlightedTaskId?: string } }
// Response
{ jobId: string }
```

**GET /api/state**
```typescript
// Response
{ plans: Plan[]; tasks: Task[] }
```

**GET /api/health**
```typescript
// Response
{ status: "ok" }
```

---

## 3. Event Envelope
> `src/types/events.ts` is the single definition of all event types.
> Both frontend and backend import from here — never redefine.

```typescript
export type EventType =
  | 'PLAN_CREATED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'TASK_HIGHLIGHTED'
  | 'TASK_HIGHLIGHT_CLEARED'
  | 'CHAT_REPLY'
  | 'JOB_PROGRESS'
  | 'JOB_COMPLETE'
  | 'JOB_FAILED';

export interface BaseEvent {
  jobId: string;
  sessionId: string;
  eventType: EventType;
  timestamp: string;
}

export interface PlanCreatedEvent extends BaseEvent {
  eventType: 'PLAN_CREATED';
  payload: { plan: { id: string; name: string; type: string } };
}

export interface TaskCreatedEvent extends BaseEvent {
  eventType: 'TASK_CREATED';
  payload: {
    planId: string;
    task: {
      id: string; title: string; date: string;
      status: 'TODO' | 'IN_PROGRESS' | 'DONE';
      labels: string[]; week?: number; day?: number;
    };
  };
}

export interface TaskUpdatedEvent extends BaseEvent {
  eventType: 'TASK_UPDATED';
  payload: {
    planId: string;
    task: Partial<TaskCreatedEvent['payload']['task']> & { id: string };
  };
}

export interface TaskDeletedEvent extends BaseEvent {
  eventType: 'TASK_DELETED';
  payload: { planId: string; taskId: string };
}

export interface TaskHighlightedEvent extends BaseEvent {
  eventType: 'TASK_HIGHLIGHTED';
  payload: { taskId: string };
}

export interface TaskHighlightClearedEvent extends BaseEvent {
  eventType: 'TASK_HIGHLIGHT_CLEARED';
  payload: { taskId: string };
}

export interface ChatReplyEvent extends BaseEvent {
  eventType: 'CHAT_REPLY';
  payload: { message: string };
}

export interface JobProgressEvent extends BaseEvent {
  eventType: 'JOB_PROGRESS';
  payload: { message: string };
}

export interface JobCompleteEvent extends BaseEvent {
  eventType: 'JOB_COMPLETE';
  payload: { summary: string };
}

export interface JobFailedEvent extends BaseEvent {
  eventType: 'JOB_FAILED';
  payload: { reason: string };
}

export type AgentEvent =
  | PlanCreatedEvent | TaskCreatedEvent | TaskUpdatedEvent
  | TaskDeletedEvent | TaskHighlightedEvent | TaskHighlightClearedEvent
  | ChatReplyEvent | JobProgressEvent | JobCompleteEvent | JobFailedEvent;
```

---

## 4. Job Queue
- One `p-queue` instance per `sessionId`, concurrency: `1`
- Job states: `QUEUED → IN_PROGRESS → DONE | FAILED`
- SSE keep-alive ping: every `15` seconds

```typescript
// server/queue/jobQueue.ts
import PQueue from 'p-queue';
const queues = new Map<string, PQueue>();
export function getQueue(sessionId: string): PQueue {
  if (!queues.has(sessionId)) queues.set(sessionId, new PQueue({ concurrency: 1 }));
  return queues.get(sessionId)!;
}
```

---

## 5. Event Bus
```typescript
// server/sse/eventBus.ts
// SWAP: replace with Redis Pub/Sub for multi-instance production
import { AgentEvent } from '../../src/types/events';
type Subscriber = (event: AgentEvent) => void;
class InMemoryEventBus {
  private subscribers = new Map<string, Subscriber[]>();
  subscribe(sessionId: string, fn: Subscriber): () => void {
    const subs = this.subscribers.get(sessionId) ?? [];
    this.subscribers.set(sessionId, [...subs, fn]);
    return () => {
      const current = this.subscribers.get(sessionId) ?? [];
      this.subscribers.set(sessionId, current.filter(s => s !== fn));
    };
  }
  publish(sessionId: string, event: AgentEvent) {
    (this.subscribers.get(sessionId) ?? []).forEach(fn => fn(event));
  }
}
export const eventBus = new InMemoryEventBus();
```

---

## 6. Agent Design

### LangGraph Graph
```
understand_intent → plan_action → execute_tools → emit_events
                                       ↑               │
                                       └───────────────┘ (loop until done)
                                                       │
                                               compose_reply → END
any node → handle_error (on exception)
```

### MCP-Style Tools
```typescript
// server/agent/tools/planTools.ts
// SWAP: replace with MCP client call for production
create_plan(args: { name: string; type: string; sessionId: string }): Promise<Plan>
get_plans(args: { sessionId: string }): Promise<Plan[]>

// server/agent/tools/taskTools.ts
// SWAP: replace with MCP client call for production
create_task(args: { planId: string; title: string; date: string; labels: string[]; week?: number; day?: number }): Promise<Task>
update_task(args: { taskId: string; fields: Partial<Task> }): Promise<Task>
delete_task(args: { taskId: string }): Promise<{ success: true }>
query_tasks(args: { sessionId: string; planId?: string; status?: string; sortBy?: 'date_asc' | 'date_desc'; limit?: number }): Promise<Task[]>
```

### Conversation Memory
```typescript
// server/agent/memory.ts
// SQLite-persisted. Load last N messages before graph run.
// Append user message before, assistant reply after.
```

---

## 7. Dispatch Layer
```typescript
// src/dispatch/dispatchLayer.ts
// Singleton. Components register via on(eventType, handler).
// SSE listener calls dispatch(event) on every received event.
// Components filter further by planId if needed.
```

---

## 8. Logging
> Both frontend and backend must implement structured logging.
> These logs are the primary debugging tool for tracing data flow issues.
> Logger function names are the authoritative names agents must use — do not rename.

### Backend Format
```
[TIMESTAMP] [LEVEL] [MODULE] message  key=value
```
Levels: `INFO` · `WARN` · `ERROR`

Expected log sequence per request:
```
[REQUEST]   POST /api/chat  sessionId=x
[QUEUE]     jobId=x  status=QUEUED
[LANGGRAPH] input={intent, context}
[TOOL]      {tool_name}  args={...}  result={...}
[SSE]       emit {eventType}  key=value
[LANGGRAPH] output={summary}
[RESPONSE]  200  duration=Xms
```

```typescript
// server/logger.ts
// Logger function name: log — use this name exactly
export const log = (level: 'INFO'|'WARN'|'ERROR', module: string, msg: string, meta?: object) =>
  console.log(`[${new Date().toISOString()}] [${level}] [${module}] ${msg}`, meta ?? '')
```

### Frontend Format
```
[MODULE] action  key=value
```

Expected log sequence per interaction:
```
[REQUEST]  POST /api/chat
[SSE]      connected
[SSE]      received {eventType}
[DISPATCH] {eventType} → {Component}
[RENDER]   {Component} updated
```

```typescript
// src/utils/logger.ts
// Logger function name: flog — use this name exactly
export const flog = (module: string, action: string, meta?: object) =>
  console.log(`[${module}] ${action}`, meta ?? '')
```

### Debugging Guide
| Symptom | Root cause |
|---------|-----------|
| `[SSE] received X` but no `[DISPATCH] X` | dispatchLayer routing bug |
| `[DISPATCH] X` but no `[RENDER]` | component subscription bug |
| `[TOOL] create_task` but no `[SSE] emit TASK_CREATED` | emit_events node bug |

---

## 9. Integration Tests

### Test Levels
| Level | Tool | Scope | When |
|-------|------|-------|------|
| Unit | Vitest + RTL | Component in isolation | Every component loop |
| API | Supertest | Endpoints, no browser | Integration pass |
| E2E | Playwright | Full stack, real browser | Integration pass |

### API Contract Coverage
One test per endpoint in § 2. API Endpoints. Each test verifies:
- Correct HTTP status
- Response shape matches contract
- Side effects (e.g. task exists in SQLite after POST)

### E2E Coverage
One test file per scenario in SPEC.md § User Scenarios.
Selectors come from SPEC.md § Testability.
TAC mapping comes from SPEC.md § Test Acceptance Criteria.
Playwright `webServer` config auto-starts both servers.
Use `reuseExistingServer: true` to reuse already-running servers.
