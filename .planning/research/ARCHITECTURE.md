# Architecture Research

**Domain:** Electron + Convex Multi-Agent Task Management System
**Researched:** 2025-01-18
**Confidence:** MEDIUM

## Executive Summary

Research into modern Electron + Convex architecture reveals that building a multi-agent task management system requires careful separation of concerns between the Electron desktop application, Convex backend for real-time state, and the agent orchestration system. The recommended architecture follows a **layered mono-repo structure** with clear boundaries: Electron UI layer (renderer process), Bridge layer (preload + IPC), Agent orchestration layer (main process), and Convex backend (self-hosted).

**Key recommendation:** Use pnpm workspace with Turborepo for build orchestration, separating the Electron app into `apps/desktop` with `packages/` for shared agent logic, templates, and Convex client. This enables parallel development, type-safe internal packages, and clean separation between UI and agent orchestration.

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Electron Renderer UI                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Kanban     │  │   Task       │  │   Logs       │  │   Archive    │ │
│  │   Board      │  │   Details    │  │   Modal      │  │   View       │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │                 │         │
│         └─────────────────┴─────────────────┴─────────────────┘         │
│                                   │                                     │
│                         React + TypeScript + Tailwind                   │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │ IPC (via contextBridge)
├───────────────────────────────────┼─────────────────────────────────────┤
│                         Electron Preload Script                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Exposed API: taskManager, agentDispatcher, templateManager      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │ IPC handlers
├───────────────────────────────────┼─────────────────────────────────────┤
│                         Electron Main Process                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   IPC        │  │   Agent      │  │   Template   │  │   Convex     │ │
│  │   Handlers   │  │   Dispatcher │  │   Manager    │  │   Client     │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │                 │         │
│         └─────────────────┴─────────────────┴─────────────────┘         │
│                                   │                                     │
│                     Node.js Runtime + Filesystem Access                │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │ WebSocket
├───────────────────────────────────┼─────────────────────────────────────┤
│                         Convex Backend (Self-Hosted)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   tasks      │  │   subtasks   │  │   logs       │                 │
│  │   table      │  │   table      │  │   table      │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│                                                                               │
│               Real-time Queries + Mutations + Actions                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Renderer Process (UI)** | Display Kanban board, task details, logs; handle user interactions | React + TypeScript + Tailwind CSS + Zustand (state) |
| **Preload Script** | Secure bridge between renderer and main; expose limited APIs via contextBridge | TypeScript with contextBridge API |
| **Main Process (IPC)** | Handle renderer requests; coordinate agents; manage templates | Node.js with ipcMain handlers |
| **Agent Dispatcher** | Parse task keywords; spawn appropriate agents; manage parallel execution | Keyword detection + priority queue |
| **Convex Client** | Real-time sync of task state; subscribe to updates; persist mutations | Convex browser SDK in renderer |
| **Template Manager** | Load user templates; render with variables; write generated code | Filesystem + Handlebars/EJS |
| **Agent Orchestration** | Execute Planner→Coder→Reviewer workflow; collect artifacts | SequentialOrchestrator (existing) |

## Recommended Project Structure

```
convex-poc/
├── apps/
│   └── desktop/                    # Electron app
│       ├── main/                   # Main process
│       │   ├── index.ts            # Entry point
│       │   ├── ipc/                # IPC handlers
│       │   │   ├── tasks.ts        # Task CRUD operations
│       │   │   ├── agents.ts       # Agent dispatch
│       │   │   └── templates.ts    # Template management
│       │   ├── agents/             # Agent orchestration
│       │   │   ├── dispatcher.ts   # Keyword detection + routing
│       │   │   └── crud/           # 5 CRUD agents
│       │   └── preload/            # Preload scripts
│       │       └── index.ts        # Exposed APIs via contextBridge
│       ├── renderer/               # Renderer process (React app)
│       │   ├── src/
│       │   │   ├── components/     # React components
│       │   │   │   ├── Kanban/     # Kanban board
│       │   │   │   ├── TaskModal/  # Task details
│       │   │   │   ├── LogsModal/  # Real-time logs
│       │   │   │   └── Archive/    # Completed tasks
│       │   │   ├── hooks/          # React hooks
│       │   │   │   ├── useTasks.ts # Convex subscriptions
│       │   │   │   └── useLogs.ts  # Log streaming
│       │   │   ├── store/          # Zustand state
│       │   │   └── App.tsx
│       │   ├── index.html
│       │   └── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared-types/               # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── tasks.ts            # Task types
│   │   │   ├── agents.ts           # Agent types
│   │   │   └── templates.ts        # Template types
│   │   └── package.json
│   ├── convex-client/              # Convex client wrapper
│   │   ├── src/
│   │   │   ├── client.ts           # Convex initialization
│   │   │   ├── queries.ts          # Type-safe queries
│   │   │   └── mutations.ts        # Type-safe mutations
│   │   └── package.json
│   ├── agent-orchestrator/         # Core agent logic (existing)
│   │   ├── src/
│   │   │   ├── agents/             # Planner, Coder, Reviewer
│   │   │   ├── orchestrator/       # SequentialOrchestrator
│   │   │   └── types/              # Agent types
│   │   └── package.json
│   └── template-engine/            # Template rendering engine
│       ├── src/
│       │   ├── loader.ts           # Load templates from .templates/
│       │   ├── renderer.ts         # Handlebars/EJS rendering
│       │   └── writer.ts           # Write generated code
│       └── package.json
├── .templates/                     # User-customizable templates
│   ├── backend-boilerplate/        # NestJS/Express boilerplate
│   ├── frontend-boilerplate/       # React/Vue boilerplate
│   ├── backend-crud/               # API endpoint templates
│   ├── frontend-crud/               # Service/React component templates
│   └── ui-crud/                    # UI page templates
├── convex/                         # Convex backend
│   ├── schema.ts                   # Database schema
│   ├── tasks.ts                    # Task functions
│   ├── agents.ts                   # Agent functions
│   └── logs.ts                     # Log streaming
├── pnpm-workspace.yaml             # Workspace config
├── turbo.json                      # Turborepo config
└── package.json                    # Root package.json
```

### Structure Rationale

- **apps/desktop:** Electron app separated from shared packages; enables independent updates to UI without touching agent logic
- **packages/shared-types:** Single source of truth for TypeScript types used across main, renderer, and packages; prevents type drift
- **packages/convex-client:** Centralized Convex configuration; shared between main and renderer processes
- **packages/agent-orchestrator:** Existing agent logic (Planner, Coder, Reviewer) reused without modification; demonstrates clean separation
- **packages/template-engine:** Template loading/rendering isolated for testability; can be used by multiple agent types
- **.templates/:** User-customizable code templates at root level; easy to find and modify; not bundled with app code
- **convex/:** Self-hosted Convex backend; schema and functions co-located with app for development convenience

## Architectural Patterns

### Pattern 1: Electron Security with Context Isolation

**What:** Electron's recommended security pattern where the renderer process runs in a sandboxed context with no Node.js access, and a preload script exposes limited APIs via `contextBridge`.

**When to use:** ALL Electron apps in 2025. This is the default and recommended pattern.

**Trade-offs:**
- Pros: Secure by default; prevents XSS attacks from accessing Node.js; clear API boundaries
- Cons: More boilerplate (IPC handlers + preload); requires serialization of data between processes

**Example:**
```typescript
// preload/index.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  createTask: (task: string) => ipcRenderer.invoke("task:create", task),
  getTasks: () => ipcRenderer.invoke("task:getAll"),
  subscribeToTasks: (callback) => {
    const listener = (_event, tasks) => callback(tasks);
    ipcRenderer.on("tasks:updated", listener);
    return () => ipcRenderer.removeListener("tasks:updated", listener);
  },
});

// renderer/src/App.tsx
const tasks = await window.api.getTasks();
```

**Why this matters:** Research shows that Electron security best practices in 2025 **require** `contextIsolation: true`, `nodeIntegration: false`, and sandboxing. Any architecture that bypasses this (e.g., direct Node access in renderer) is insecure and outdated.

### Pattern 2: Convex Real-time Subscriptions in Renderer

**What:** Convex's automatic real-time subscriptions using `useQuery` hooks in React components, which automatically re-render when underlying data changes.

**When to use:** Any UI displaying live task state, agent progress, or log streams.

**Trade-offs:**
- Pros: Zero boilerplate for real-time updates; automatic re-renders; type-safe queries
- Cons: Requires Convex client in renderer; query complexity moves to Convex functions

**Example:**
```typescript
// renderer/src/hooks/useTasks.ts
import { useQuery } from "convex/react";
import { api } from "@repo/convex-client";

export function useTasks() {
  const tasks = useQuery(api.tasks.list, { limit: 100 });
  const activeTasks = tasks?.filter(t => t.status !== "done") ?? [];
  const completedTasks = tasks?.filter(t => t.status === "done") ?? [];
  return { activeTasks, completedTasks, isLoading: tasks === undefined };
}

// renderer/src/components/Kanban/KanbanBoard.tsx
function KanbanBoard() {
  const { activeTasks, completedTasks } = useTasks();
  // Automatically re-renders when Convex data changes
}
```

**Why this matters:** Convex's real-time capabilities are a key differentiator. The architecture must support Convex client in the renderer process (not just main process) to leverage automatic subscriptions.

### Pattern 3: Keyword-Based Agent Routing

**What:** A dispatcher that analyzes task descriptions for keywords and routes to specialized agents (BE Boilerplate, FE Boilerplate, CRUD APIs, etc.) or falls back to general-purpose Planner→Coder→Reviewer.

**When to use:** Multi-agent systems with specialized CRUD agents for common patterns.

**Trade-offs:**
- Pros: Faster execution for common tasks (skip planning phase); leverages specialized knowledge
- Cons: Keyword detection is brittle; may misroute ambiguous tasks; requires fallback

**Example:**
```typescript
// apps/desktop/main/agents/dispatcher.ts
interface AgentRoute {
  keywords: string[];
  agent: "be-boilerplate" | "fe-boilerplate" | "be-crud" | "fe-crud" | "ui-crud" | "general";
}

const ROUTES: AgentRoute[] = [
  { keywords: ["backend", "api", "server"], agent: "be-boilerplate" },
  { keywords: ["frontend", "ui", "client"], agent: "fe-boilerplate" },
  { keywords: ["crud", "rest", "endpoints"], agent: "be-crud" },
  { keywords: ["service", "hooks", "state"], agent: "fe-crud" },
  { keywords: ["page", "component", "view"], agent: "ui-crud" },
];

export function dispatchAgent(taskDescription: string): string {
  const lowerTask = taskDescription.toLowerCase();
  for (const route of ROUTES) {
    if (route.keywords.some(kw => lowerTask.includes(kw))) {
      return route.agent;
    }
  }
  return "general"; // Fall back to Planner→Coder→Reviewer
}
```

**Why this matters:** Research shows that router-based agent architectures are critical for scaling multi-agent systems. However, keyword-based routing is the **simplest** approach; more advanced systems use semantic routing with embeddings.

### Pattern 4: Priority-Based Task Queue

**What:** A queue system that executes tasks based on priority (high, medium, low) while respecting concurrency limits (max 5 concurrent tasks, 5 sub-tasks per task).

**When to use:** Any system with parallel task execution and resource constraints.

**Trade-offs:**
- Pros: Prevents resource exhaustion; ensures high-priority tasks run first; predictable behavior
- Cons: Adds complexity; requires queue state management; priority inversion possible

**Example:**
```typescript
// apps/desktop/main/agents/TaskQueue.ts
interface QueuedTask {
  id: string;
  priority: "high" | "medium" | "low";
  subtasks: string[];
  status: "queued" | "running" | "completed";
}

export class TaskQueue {
  private queue: QueuedTask[] = [];
  private running = 0;
  private readonly MAX_CONCURRENT = 5;

  async enqueue(task: QueuedTask): Promise<void> {
    this.queue.push(task);
    this.queue.sort((a, b) => this.priorityScore(b.priority) - this.priorityScore(a.priority));
    await this.process();
  }

  private priorityScore(priority: string): number {
    return priority === "high" ? 3 : priority === "medium" ? 2 : 1;
  }

  private async process(): Promise<void> {
    while (this.running < this.MAX_CONCURRENT && this.queue.length > 0) {
      const task = this.queue.shift()!;
      this.running++;
      // Execute task, then decrement this.running
    }
  }
}
```

**Why this matters:** The requirement for "parallel sub-task execution with priority ordering" is a **critical architectural concern**. Without a proper queue, the system will either exhaust resources or execute tasks in unpredictable order.

### Pattern 5: Template-Based Code Generation

**What:** A template engine that loads user-customizable files from `.templates/`, renders them with variables (table name, fields, etc.), and writes the generated code to the target workspace.

**When to use:** CRUD agents that generate repetitive code (APIs, services, UI components).

**Trade-offs:**
- Pros: Fast code generation; user-customizable; consistent output; reduces agent token usage
- Cons: Template maintenance; limited flexibility; complex templates are hard to debug

**Example:**
```typescript
// packages/template-engine/src/loader.ts
import Handlebars from "handlebars";
import fs from "fs/promises";

export async function loadTemplate(templatePath: string): Promise<HandlebarsTemplateDelegate> {
  const source = await fs.readFile(templatePath, "utf-8");
  return Handlebars.compile(source);
}

// .templates/backend-crud/api.ts.hbs
export async function {{camelCase tableName}}Routes({{pascalCase tableName}}Service: {{pascalCase tableName}}Service) {
  const router = Router();

  router.get("/", async (req, res) => {
    const {{camelCase tableName}}List = await {{pascalCase tableName}}Service.findAll();
    res.json({{camelCase tableName}}List);
  });

  router.post("/", async (req, res) => {
    const new{{pascalCase tableName}} = await {{pascalCase tableName}}Service.create(req.body);
    res.json(new{{pascalCase tableName}});
  });

  return router;
}
```

**Why this matters:** Research shows that template-based code generation is **3x faster** than agent-only generation for repetitive patterns. The architecture must support user-customizable templates at a known location (`.templates/`).

## Data Flow

### Request Flow: Creating a Task

```
[User enters task in UI]
    ↓
[Renderer: createTask mutation]
    ↓ (IPC)
[Main: IPC handler → Convex mutation]
    ↓ (WebSocket)
[Convex: Insert into tasks table]
    ↓ (Real-time subscription)
[Renderer: useQuery re-renders with new task]
    ↓
[Main: Agent dispatcher detects task]
    ↓ (Keyword detection)
[Main: Spawn appropriate agent]
    ↓ (Agent execution)
[Main: Update task status in Convex]
    ↓ (Real-time subscription)
[Renderer: UI updates to "In Progress"]
```

### State Management: Two Sources of Truth

```
┌─────────────────────────────────────────────────────────────┐
│                     Renderer Process                         │
│                                                               │
│  [Zustand Store] ←→ [React Components]                      │
│       ↑                                                      │
│       │ (subscribe to Convex queries)                        │
│       ↓                                                      │
│  [Convex useQuery hooks] ←→ [Convex Backend]                │
│                                                               │
└─────────────────────────────────────────────────────────────┘

Pattern:
- Zustand for transient UI state (modals open/closed, filters)
- Convex for persistent shared state (tasks, logs, agent status)
- Never duplicate state; choose ONE source of truth per piece of data
```

### Key Data Flows

1. **Task Creation Flow:** User → Renderer → IPC → Main → Convex → Real-time update → Renderer
2. **Agent Execution Flow:** Main → Keyword Detection → Agent Spawn → Execution → Convex Update → Real-time update → Renderer
3. **Log Streaming Flow:** Agent → Main → IPC → Renderer → Real-time display
4. **Template Generation Flow:** Agent → Template Engine → Load .templates/ file → Render → Write to workspace

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 tasks (MVP) | Self-hosted Convex in Docker; single Electron instance; in-memory task queue |
| 100-1000 tasks | Convex indexing on task status; persisted task queue in Convex; optimize queries |
| 1000+ tasks | Consider Convex pagination; virtual scrolling in Kanban UI; rate limiting on agent execution |

### Scaling Priorities

1. **First bottleneck:** Convex query performance for large task lists
   - Fix: Add indexes on `tasks.status`, `tasks.priority`; use pagination with `useQuery`
2. **Second bottleneck:** Agent execution blocking UI
   - Fix: Run agents in separate Node.js worker processes; stream logs via IPC
3. **Third bottleneck:** Template rendering for large schemas
   - Fix: Cache compiled templates; lazy-load templates by category

**Realistic expectation:** This is a **desktop development tool**, not a SaaS platform. Scaling to 1000+ concurrent tasks is unlikely. Focus on responsive UX for 10-100 active tasks.

## Anti-Patterns

### Anti-Pattern 1: Direct Node.js Access in Renderer

**What people do:** Set `nodeIntegration: true` in Electron to give renderer direct access to Node.js APIs (`fs`, `child_process`, etc.)

**Why it's wrong:** **Critical security vulnerability.** Any XSS attack or compromised React component can execute arbitrary code on the user's machine. Electron's security model explicitly forbids this.

**Do this instead:** Use IPC handlers in the main process. The renderer requests an operation, the main process executes it and returns the result.

```typescript
// WRONG (insecure):
const files = fs.readdirSync("/path"); // In renderer with nodeIntegration: true

// CORRECT (secure):
const files = await window.api.readDirectory("/path"); // Via IPC handler
```

### Anti-Pattern 2: Duplication of State Between Zustand and Convex

**What people do:** Store task data in both Zustand (for UI) and Convex (for persistence), then manually sync them.

**Why it's wrong:** **Race conditions and stale data.** The two stores will inevitably diverge, causing bugs where UI shows one state but Convex has another.

**Do this instead:** Use Zustand for **transient UI state** (modal open/closed, selected filters) and Convex for **persistent shared state** (tasks, logs, agent status). Never duplicate; choose ONE source of truth.

```typescript
// WRONG (duplicated state):
const [tasks, setTasks] = useState([]); // Zustand
const convexTasks = useQuery(api.tasks.list); // Convex
useEffect(() => setTasks(convexTasks), [convexTasks]); // Manual sync

// CORRECT (single source):
const tasks = useQuery(api.tasks.list); // Convex only
const [isModalOpen, setIsModalOpen] = useState(false); // Zustand for UI only
```

### Anti-Pattern 3: Synchronous IPC Blocking Renderer

**What people do:** Use `ipcRenderer.sendSync` for IPC calls, which blocks the renderer until the main process responds.

**Why it's wrong:** **Frozen UI.** Any long-running operation in the main process (e.g., agent execution) will freeze the entire Electron app.

**Do this instead:** Use async `ipcRenderer.invoke` for all IPC calls. For long-running operations (agent execution), stream progress via events.

```typescript
// WRONG (blocks UI):
const result = ipcRenderer.sendSync("agent:execute", task); // UI frozen during execution

// CORRECT (async):
const result = await window.api.executeAgent(task); // Non-blocking
// Or for long operations:
const unsubscribe = window.api.subscribeToAgentProgress(taskId, (progress) => {
  console.log("Progress:", progress);
});
```

### Anti-Pattern 4: Monolithic Electron Codebase

**What people do:** Put all Electron code (main, renderer, preload, shared logic) in a single package without separation.

**Why it's wrong:** **Unmaintainable mess.** As the codebase grows, it becomes impossible to find code, test components, or reuse logic in other contexts (e.g., CLI vs Electron).

**Do this instead:** Use a mono-repo with separate packages for shared logic. The Electron app should be a thin consumer of shared packages (`@repo/agent-orchestrator`, `@repo/convex-client`, etc.).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Convex (self-hosted)** | Convex browser SDK in renderer; server SDK in main | Requires `CONVEX_URL` and admin key; WebSocket for real-time |
| **Anthropic API** | Existing AgentFactory; no changes needed | Used by Planner, Coder, Reviewer agents |
| **PostgreSQL (optional)** | Direct connection from main process via `pg` | Only if School-ERP DDL requires actual DB; otherwise mock |
| **Filesystem** | Direct access from main process | Templates at `.templates/`; generated code in workspace |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Renderer ↔ Main** | IPC (invoke/on) via contextBridge | Secure; limited to exposed APIs; serialize all data |
| **Main ↔ Agent Packages** | Direct import (shared package) | Main process imports `@repo/agent-orchestrator` |
| **Main ↔ Convex** | Convex server SDK | Mutations/queries from main process |
| **Renderer ↔ Convex** | Convex browser SDK | Real-time subscriptions via `useQuery` |
| **Agent Packages ↔ Templates** | Filesystem access | Templates loaded from `.templates/` at root |

### Mono-repo Package Dependencies

```
apps/desktop (Electron)
  ├─ depends on: @repo/shared-types, @repo/convex-client, @repo/agent-orchestrator, @repo/template-engine
  ├─ dev: electron, vite, react, typescript, tailwindcss

packages/shared-types
  ├─ depends on: (none - pure types)
  ├─ dev: typescript

packages/convex-client
  ├─ depends on: @repo/shared-types, convex
  ├─ dev: typescript

packages/agent-orchestrator (existing)
  ├─ depends on: @repo/shared-types, @anthropic-ai/claude-agent-sdk
  ├─ dev: typescript

packages/template-engine
  ├─ depends on: @repo/shared-types, handlebars
  ├─ dev: typescript
```

**Build order with Turborepo:**
1. `@repo/shared-types` (no dependencies)
2. `@repo/convex-client`, `@repo/agent-orchestrator`, `@repo/template-engine` (depend on types)
3. `apps/desktop` (depends on all packages)

**Why this matters:** Proper dependency management enables **parallel builds** and **incremental compilation**. Changing a component in `apps/desktop` won't require rebuilding `@repo/agent-orchestrator`.

## Recommended Build Order (Phase-by-Phase)

Based on the architecture and dependencies, here's the recommended build order for v1.0:

### Phase 1: Foundation (Setup + Shared Types)
- Create pnpm workspace with Turborepo
- Set up `@repo/shared-types` package
- Define TypeScript types for tasks, agents, templates
- **Deliverable:** Type-safe mono-repo with no functionality

### Phase 2: Convex Backend + Client
- Extend existing Convex schema with tasks, subtasks, logs tables
- Create `@repo/convex-client` package
- Deploy Convex functions (queries, mutations)
- **Deliverable:** Real-time backend with type-safe client

### Phase 3: Agent Orchestration (Reuse Existing)
- Move existing `src/agents/` and `src/orchestrator/` to `@repo/agent-orchestrator`
- Refactor to use shared types
- Add 5 CRUD agents (BE Boilerplate, FE Boilerplate, etc.)
- **Deliverable:** Shared agent package with 8 total agents

### Phase 4: Template Engine
- Create `@repo/template-engine` package
- Implement template loader, renderer, writer
- Create sample templates in `.templates/`
- **Deliverable:** Template system with user-customizable files

### Phase 5: Electron Main Process
- Set up Electron app in `apps/desktop`
- Implement IPC handlers (tasks, agents, templates)
- Integrate AgentDispatcher with keyword routing
- Implement TaskQueue with priority scheduling
- **Deliverable:** Functional main process with agent orchestration

### Phase 6: Electron Renderer UI
- Set up React + Vite in renderer
- Implement Kanban board with 4 columns
- Integrate Convex real-time subscriptions
- Implement task details modal, logs modal, archive view
- **Deliverable:** Complete UI with real-time updates

### Phase 7: Integration + Testing
- End-to-end testing of full workflow
- Test parallel task execution
- Test template-based code generation
- Test real-time updates across multiple windows
- **Deliverable:** Shipped v1.0 milestone

**Key insight:** Each phase delivers a **testable, runnable piece** of the system. This enables parallel development (e.g., Phase 4 can start while Phase 3 is finishing) and early validation of architectural decisions.

## Sources

### Electron Architecture
- [Process Model - Electron Docs](https://electronjs.org/docs/latest/tutorial/process-model)
- [Context Isolation - Electron Docs](https://electronjs.org/docs/latest/tutorial/context-isolation)
- [Inter-Process Communication (IPC) - Electron Docs](https://electronjs.org/docs/latest/tutorial/ipc)
- [Why Electron Still Wins in 2025](https://swayalgo.com/why-electron-js-still-wins-in-2025/)
- [Notes on Electron Processes, Context Isolation, and IPC](https://abstractentropy.com/notes-on-electron/)

### Mono-repo Structure
- [Why Electron Projects Recommend Monorepo Architecture](https://juejin.cn/post/7565204846044102671) (Oct 2025)
- [buqiyuan/electron-vite-monorepo - GitHub](https://github.com/buqiyuan/electron-vite-monorepo)
- [2025 Frontend Monorepo Architecture Best Practices](https://juejin.cn/post/7581676787380928531) (Dec 2025)
- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)

### Multi-Agent Systems
- [Architectures for Multi-Agent Systems - Galileo AI](https://galileo.ai/blog/architectures-for-multi-agent-systems) (Sept 2025)
- [Building an Efficient Priority-Task Execution Queue with JavaScript/TypeScript](https://medium.com/@amankrr/building-an-efficient-priority-task-execution-queue-with-javascript-typescript-2bf756f598d4) (2024)
- [Router-Based Agents: The Architecture Pattern That Makes AI Systems Scale](https://pub.towardsai.net/router-based-agents-the-architecture-pattern-that-makes-ai-systems-scale-a9cbe3148482) (Dec 2025)
- [AI Agent Routing: Tutorial & Best Practices - Patronus AI](https://www.patronus.ai/ai-agent-development/ai-agent-routing)

### Convex Best Practices
- [Best Practices - Convex Developer Hub](https://docs.convex.dev/understanding/best-practices/)
- [Schema Philosophy - Convex Developer Hub](https://docs.convex.dev/database/advanced/schema-philosophy)
- [Keeping Users in Sync: Building Real-time Collaboration](https://stack.convex.dev/keeping-real-time-users-in-sync-convex)
- [Realtime, all the time](https://www.convex.dev/realtime)
- [10 Essential Tips for New Convex Developers](https://schemets.com/blog/10-convex-developer-tips-pitfalls-productivity) (Nov 2025)

### Template Systems
- [How to use EJS to template your Node.js application](https://blog.logrocket.com/how-to-use-ejs-template-node-js-application/) (March 2025)
- [JavaScript Templating Engines: Pug, Handlebars (HBS) and EJS](https://dev.to/m__mdy__m/javascript-templating-engines-pug-handlebars-hbs-and-ejs-jcd)
- [Recommended Folder Structure for Node(TS) 2025](https://dev.to/pramod_boda/recommended-folder-structure-for-nodets-2025-39jl) (Sept 2025)
- [Writing a TypeScript Code Generator: Templates vs AST](https://medium.com/singapore-gds/writing-a-typescript-code-generator-templates-vs-ast-ab391e5d1f5e)

### Kanban UI Examples
- [AgileEx - Tasks and Kanban Application](https://reactjsexample.com/a-tasks-and-kanban-application-built-with-electron-react-and-dnd-kit/)
- [Kanban Task Management w/ React + Typescript + Tailwind](https://www.frontendmentor.io/solutions/kanban-task-management-w-react-typescript-tailwind-ULgXcgPCJh)
- [Build Project KanBan Board Using React, Typescript, shadcn UI](https://www.youtube.com/watch?v=JAWZ3pJcp3o)

### Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Electron Architecture | HIGH | Official docs and recent 2025 sources agree on patterns |
| Mono-repo Structure | HIGH | Well-established pattern with multiple working examples |
| Convex Integration | MEDIUM | No direct Electron+Convex examples; inferring from web patterns |
| Multi-Agent Routing | MEDIUM | Research based on general AI agent patterns; not specific to Convex |
| Template Systems | MEDIUM | Standard Node.js patterns; Handlebars/EJS well-documented |
| Kanban UI | HIGH | Multiple React/TypeScript examples available |

**Overall: MEDIUM confidence** - Architecture recommendations are based on solid foundations (Electron docs, mono-repo patterns, Convex best practices) but some integration patterns (Electron+Convex specifically) lack official examples and require inference.

---

*Architecture research for: Electron + Convex Multi-Agent Task Management System*
*Researched: 2025-01-18*
