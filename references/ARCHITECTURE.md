
# ARCHITECTURE.md

> Referenced by SPEC.md. Defines the backend contract the Builder must implement
> and the Reviewer must validate against.

## System Overview

```
Browser (React)
    │
    │  POST /api/chat  { message, sessionId, context }
    ▼
Express — Inbound Route
    │  mints jobId, enqueues job, returns { jobId }
    ▼
p-queue (in-memory, concurrency: 1 per session)
    │  dequeues job
    ▼
LangGraph Agent
    ├── reads conversation history from SQLite
    ├── calls tools: create_plan / create_task / update_task / delete_task / query_tasks
    │       │
    │       ▼
    │   SQLite (plans + tasks + jobs + conversation_history)
    │
    └── emits typed events → InMemoryEventBus
                                    │
                              SSE stream per sessionId
                                    │
                              GET /api/events?sessionId=
                                    │
                              Browser Dispatch Layer
                                    │
                         routes by eventType → correct React component
```

---

## API Endpoints

### `POST /api/chat`
```typescript
// Request
{ message: string; sessionId: string; context?: { highlightedTaskId?: string } }
// Response
{ jobId: string }
```
Creates job (QUEUED), enqueues to p-queue, returns immediately.

### `GET /api/events?sessionId=`
SSE stream (`text/event-stream`). Keep-alive ping every 15 seconds.
Delivers all events published to eventBus for this sessionId.

### `POST /api/tasks`
```typescript
// Request
{ planId?: string; title: string; date: string; labels?: string[] }
// Response — created task object
```
Manual task creation. No agent involvement.

### `PATCH /api/tasks/:id`
Partial task update. Returns updated task.

### `DELETE /api/tasks/:id`
Returns `{ success: true }`.

---

## Event Envelope — `src/types/events.ts`

This file is the single source of truth for all event types.
Both frontend and backend import from here. Never duplicate or redefine.

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
      id: string;
      title: string;
      date: string;
      status: 'TODO' | 'IN_PROGRESS' | 'DONE';
      labels: string[];   // min 1, max 3
      week?: number;
      day?: number;
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

## p-queue Configuration

```typescript
// server/queue/jobQueue.ts
// One queue per sessionId — concurrency 1 ensures ordered processing per user
import PQueue from 'p-queue';

const queues = new Map<string, PQueue>();

export function getQueue(sessionId: string): PQueue {
  if (!queues.has(sessionId)) {
    queues.set(sessionId, new PQueue({ concurrency: 1 }));
  }
  return queues.get(sessionId)!;
}
```

---

## InMemoryEventBus

```typescript
// server/sse/eventBus.ts
// SWAP: replace publish/subscribe with Redis Pub/Sub for multi-instance production

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
    const subs = this.subscribers.get(sessionId) ?? [];
    subs.forEach(fn => fn(event));
  }
}

export const eventBus = new InMemoryEventBus();
```

---

## LangGraph Agent Design

```
Nodes:
  understand_intent  → classifies message into intent type
  plan_action        → decides which tools to call
  execute_tools      → calls MCP-style tools
  emit_events        → publishes typed events to eventBus after each tool call
  compose_reply      → generates final CHAT_REPLY
  handle_error       → emits JOB_FAILED on unrecoverable error

Edges:
  understand_intent → plan_action
  plan_action → execute_tools
  execute_tools → emit_events
  emit_events → execute_tools   (loop: more tools to call)
  emit_events → compose_reply   (terminal: all tools done)
  compose_reply → END
  any node → handle_error       (on exception)
```

---

## MCP-Style Tools

Functions in `server/agent/tools/`. Interface designed to be swappable with a real
MCP client — replace the function body with an MCP client call, keep the signature.

```typescript
// server/agent/tools/planTools.ts
// SWAP: replace function body with MCP client call for production

create_plan(args: { name: string; type: string; sessionId: string }): Promise<Plan>
get_plans(args: { sessionId: string }): Promise<Plan[]>

// server/agent/tools/taskTools.ts
// SWAP: replace function body with MCP client call for production

create_task(args: { planId: string; title: string; date: string; labels: string[]; week?: number; day?: number }): Promise<Task>
update_task(args: { taskId: string; fields: Partial<Task> }): Promise<Task>
delete_task(args: { taskId: string }): Promise<{ success: true }>
query_tasks(args: { sessionId: string; planId?: string; status?: string; sortBy?: 'date_asc' | 'date_desc'; limit?: number }): Promise<Task[]>
```

---

## Conversation Memory

```typescript
// server/agent/memory.ts
// SQLite-persisted. Survives server restarts.
// Load last N messages for sessionId before invoking graph.
// Append user message before graph run.
// Append assistant reply after graph completes.
```

---

## Dispatch Layer (Frontend)

```typescript
// src/dispatch/dispatchLayer.ts
// Singleton. Components register via on(eventType, handler).
// SSE listener calls dispatch(event) on every received event.
// Routes by eventType. Components filter further by planId if needed.
```
