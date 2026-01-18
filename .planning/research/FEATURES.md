# Feature Research

**Domain:** Multi-Agent Workflow Kanban UI
**Researched:** 2025-01-18
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Drag-and-drop task cards** | Standard Kanban interaction pattern | LOW | Touch-friendly critical for modern UX [1][2] |
| **4-column board layout** | Project requirement; visualizes workflow stages | LOW | Tasks → In Progress → Sub-tasks → Done [3] |
| **Task creation form** | Primary user entry point | MEDIUM | Description field + file upload + workspace path fields [4] |
| **Task state indicators** | Visual feedback for system status | MEDIUM | Pending, running, auto-paused, user-paused, done, cancelled [5] |
| **Real-time progress updates** | Users expect live sync across devices | HIGH | WebSocket-based streaming for in-progress icons [1][6] |
| **Dark mode toggle** | Accessibility and user preference standard | MEDIUM | Must meet WCAG contrast ratios (4.5:1) [7][8] |
| **Task details modal** | View full task info + logs | MEDIUM | Standard pattern for expanding card content [9] |
| **Archive view** | Recover deleted/completed tasks | MEDIUM | Search + restore + delete permanently [10] |
| **WIP limit indicators** | Visual warning when limits approached | LOW | Max 5 concurrent tasks, 5 sub-tasks per task [11] |
| **Responsive layout** | Works on different screen sizes | MEDIUM | Electron app but window size varies [2] |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Two-pause state distinction** | Unique to agent workflows (auto vs user intent) | MEDIUM | Different colors for auto-paused (system) vs user-paused (manual) [12] |
| **Real-time logs streaming** | Live terminal output in modal window | HIGH | Color-coded by level (info/warn/error) with timestamps [13] |
| **Parallel sub-task visualization** | See concurrent agent execution on parent card | MEDIUM | Sub-column swimlanes or expandable card sections [14] |
| **Agent-specific progress tracking** | Know which agent is doing what | MEDIUM | Planner → Coder → Reviewer flow visualization [15] |
| **Template-based task hints** | Show which templates will be used | LOW | Display detected templates on card (e.g., "BE CRUD + UI Page") [16] |
| **Keyword-based agent detection** | Auto-parse task description for agents | HIGH | "Generate BE API for Users" → BE CRUD agent [17] |
| **Priority-based sub-task ordering** | Execute critical path first | MEDIUM | Dependencies determine parallel execution order [18] |
| **Copy logs to clipboard** | Quick sharing/debugging | LOW | Single log entry or bulk export [19] |
| **Keyboard shortcuts** | Power user efficiency | MEDIUM | 'n' for new task, 'space' to pause, etc. [20] |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time collaborative editing** | "Like Trello, we should see others' changes" | Adds WebSocket complexity; POC is single-user | Real-time sync within same app instance only |
| **Customizable column layouts** | "Users might want different workflows" | Breaks 4-column assumption; adds state management | Fixed columns for MVP; customize later if validated |
| **Task dependencies visualization** | "Show which tasks block others" | Complex graph rendering; sub-tasks already handle this | Sub-task column shows parent-child relationships |
| **Advanced filtering/search** | "Find tasks by agent, date, etc." | Over-engineering for POC; simple archive search sufficient | Archive search by task name only |
| **Task assignees/team features** | "Show who's working on what" | Single-user POC; no authentication system | Single-user focused; team features in v2+ |
| **Time tracking on tasks** | "How long did this task take?" | Agents run async; duration already in logs | Log timestamps show execution timeline |
| **Mobile app** | "Use on phone" | Electron = desktop only; mobile adds complexity | Desktop-first; responsive Electron window |
| **Task labels/tags** | "Organize by feature area" | Adds UI complexity; agent detection already categorizes | Agent type is implicit categorization |
| **Drag files directly to cards** | "Quick upload to existing task" | File upload on creation is sufficient for POC | File upload field in creation form only |

## Feature Dependencies

```
[4-column Kanban board]
    ├──requires──> [Task state management system]
    ├──requires──> [Convex real-time sync]
    └──enhances──> [Task creation form]

[Task creation form]
    ├──requires──> [File upload handling]
    ├──requires──> [Workspace path validation]
    └──requires──> [Keyword-based agent detection]

[Real-time progress tracking]
    ├──requires──> [WebSocket/Convex subscription]
    ├──requires──> [Task state indicators]
    └──enhances──> [In-progress icons]

[Logs modal]
    ├──requires──> [Real-time log streaming]
    ├──requires──> [Color-coded log levels]
    └──enhances──> [Task details modal]

[Archive view]
    ├──requires──> [Soft-delete task state]
    ├──requires──> [Search functionality]
    └──requires──> [Restore/delete actions]

[Dark mode]
    └──requires──> [WCAG-compliant color tokens]

[Keyboard shortcuts]
    └──enhances──> [All features]
```

### Dependency Notes

- **4-column Kanban board requires Task state management:** Can't display tasks without tracking their state (pending/running/paused/done/cancelled)
- **Task creation form requires Keyword-based agent detection:** Auto-detection happens on form submit to assign agents
- **Real-time progress tracking requires Task state indicators:** Can't show progress without state changes driving the UI
- **Logs modal requires Real-time log streaming:** Modal displays streaming logs; no streaming = static logs only
- **Archive view requires Soft-delete task state:** Need to preserve deleted tasks, not hard-delete them
- **Dark mode requires WCAG-compliant color tokens:** Must design color system with accessibility from the start
- **Keyboard shortcuts enhance All features:** Cross-cutting concern that improves efficiency across the board

## MVP Definition

### Launch With (v1.0)

Minimum viable product — what's needed to validate the concept.

- [x] **4-column Kanban board** — Core visual workflow; can't demonstrate agent coordination without it
- [x] **Task creation form** — User entry point for creating agent tasks
- [x] **Task state management** — Track pending, running, paused (2 types), done, cancelled
- [x] **Real-time progress updates** — See tasks move and update live via Convex
- [x] **Task details modal** — View full task information and logs
- [x] **Logs modal with streaming** — Watch agent execution in real-time
- [x] **Archive view** — Soft-delete and recovery system
- [x] **Dark mode** — Accessibility and user preference baseline
- [ ] **WIP limit indicators** — Visual warning at 5 concurrent tasks
- [ ] **Two-pause state distinction** — Different colors for auto vs user pause
- [ ] **Parallel sub-task visualization** — See sub-tasks under parent tasks
- [ ] **Copy logs to clipboard** — Basic debugging utility

### Add After Validation (v1.1+)

Features to add once core is working.

- [ ] **Keyboard shortcuts** — Add when users request faster interaction
- [ ] **Priority-based sub-task ordering** — Add when sub-task execution needs optimization
- [ ] **Agent-specific progress tracking** — Add when users need to know which agent is stuck
- [ ] **Template-based task hints** — Add when users want to know what templates will be used
- [ ] **Bulk task operations** — Add when users manage many tasks
- [ ] **Task filtering** — Add when board becomes cluttered

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Customizable column layouts** — Defer until users request different workflows
- [ ] **Task dependencies visualization** — Defer until complex workflows emerge
- [ ] **Advanced filtering/search** — Defer until archive has many items
- [ ] **Task labels/tags** — Defer until agent detection isn't sufficient
- [ ] **Time tracking dashboard** — Defer until performance optimization is needed
- [ ] **Multi-user support** — Defer until single-user flow is validated
- [ ] **Mobile app** — Defer until desktop UX is mature

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 4-column Kanban board | HIGH | MEDIUM | P1 |
| Task creation form | HIGH | MEDIUM | P1 |
| Task state management | HIGH | MEDIUM | P1 |
| Real-time progress updates | HIGH | HIGH | P1 |
| Task details modal | HIGH | LOW | P1 |
| Logs modal with streaming | HIGH | HIGH | P1 |
| Archive view | MEDIUM | MEDIUM | P1 |
| Dark mode | MEDIUM | MEDIUM | P1 |
| Two-pause state distinction | MEDIUM | MEDIUM | P1 |
| WIP limit indicators | MEDIUM | LOW | P1 |
| Parallel sub-task visualization | HIGH | MEDIUM | P2 |
| Copy logs to clipboard | MEDIUM | LOW | P2 |
| Keyboard shortcuts | LOW | MEDIUM | P2 |
| Agent-specific progress tracking | MEDIUM | HIGH | P2 |
| Template-based task hints | LOW | MEDIUM | P3 |
| Priority-based sub-task ordering | LOW | HIGH | P3 |
| Customizable column layouts | LOW | HIGH | P3 |
| Task dependencies visualization | MEDIUM | HIGH | P3 |
| Advanced filtering/search | LOW | MEDIUM | P3 |
| Task labels/tags | LOW | MEDIUM | P3 |
| Multi-user support | HIGH | VERY HIGH | P3 |

**Priority key:**
- P1: Must have for v1.0 launch
- P2: Should have, add when possible (v1.1+)
- P3: Nice to have, future consideration (v2+)

## Competitor Feature Analysis

| Feature | Trello/Jira | Auto-Claude (CLI) | Our Approach |
|---------|-------------|-------------------|--------------|
| **Board layout** | Customizable columns | N/A (CLI) | Fixed 4-column (Tasks → In Progress → Sub-tasks → Done) |
| **Task cards** | Rich metadata, labels | Plain text in CLI | Medium-rich: description + file + workspace + state |
| **Real-time updates** | Yes (collaborative) | No (polling) | Yes (Convex real-time sync) |
| **State management** | Manual drag-to-move | Automatic via agent | Automatic state transitions driven by agents |
| **Pause states** | Single pause state | Single pause state | Two states (auto-paused vs user-paused) |
| **Logs/output** | Comments/activity log | Terminal streaming in CLI | Modal with color-coded streaming logs |
| **Archive** | Archive board | No archive | Dedicated archive view with search/restore/delete |
| **Dark mode** | Yes | Terminal-dependent | Yes with WCAG compliance |
| **Sub-task visualization** | Sub-tasks hidden in card | Sub-tasks as separate items | Dedicated Sub-tasks column with parent linking |
| **Keyboard shortcuts** | Extensive | CLI-native | Basic shortcuts for power users |

**Key differentiator:** Our board is **agent-aware** — it doesn't just track manual task movement, but visually represents autonomous agent execution with real-time logs streaming, two-pause states, and parallel sub-task execution visibility.

## Agent-Specific UI Patterns

Based on research into multi-agent workflow visualization [15][17][18]:

### Progress Indicators by Agent Type

| Agent | Visual Pattern | What User Sees |
|-------|----------------|----------------|
| **Planner** | 📋 Planning phase | Task shows "Planning..." with step count (e.g., "Step 3/12") |
| **Coder** | 💻 Implementation | Task shows "Coding..." with file count (e.g., "Writing 3 files") |
| **Reviewer** | 🔍 Validation | Task shows "Reviewing..." with check marks (e.g., "✓ Reading src/app.ts") |
| **CRUD Agents** | 📦 Template generation | Task shows agent name (e.g., "BE CRUD API") + progress |

### Parallel Execution Visualization

From research on Kanban sub-column patterns [14]:
- **Swimlane approach:** Sub-tasks shown as mini-cards under parent task
- **Expandable card:** Parent card expands to show running sub-tasks
- **Sub-column split:** "Sub-tasks" column has "Waiting" and "Running" sub-columns

**Recommended approach:** Expandable parent card + dedicated Sub-tasks column. Parent card shows count badge (e.g., "3 sub-tasks"), clicking expands to show parallel execution with individual progress bars.

### State Color Coding

From Carbon Design System and accessibility research [5][7][8]:

| State | Color (Light) | Color (Dark) | Contrast | Rationale |
|-------|---------------|--------------|----------|-----------|
| **Pending** | Gray (#B0B0B0) | Gray-400 (#9CA3AF) | 4.5:1 | Neutral, waiting to start |
| **Running** | Blue (#0066CC) | Blue-400 (#60A5FA) | 4.5:1 | Active work in progress |
| **Auto-paused** | Yellow-Orange (#FF9500) | Yellow-500 (#F59E0B) | 4.5:1 | System intervention, warning |
| **User-paused** | Purple (#9333EA) | Purple-400 (#C084FC) | 4.5:1 | User action, different from auto |
| **Done** | Green (#10B981) | Green-400 (#34D399) | 4.5:1 | Success, completion |
| **Cancelled** | Red (#EF4444) | Red-400 (#F87171) | 4.5:1 | Stopped, failure |

**Note:** All colors meet WCAG AA standard (4.5:1 contrast ratio) for accessibility.

## Sources

### Kanban Board Best Practices
- [1] [The 13 Best Kanban Boards in 2025](https://kanbanzone.com/2025/best-kanban-board/) - Real-time updates and touch-friendly interactions
- [2] [Best Kanban Board of 2025](https://www.larksuite.com/en_us/blog/best-kanban-board) - Mobile-responsive design and WIP limits
- [3] [Kanban board software guide 2025](https://www.meistertask.com/blog/kanban-board-software-how-to-find-the-right-solution/) - Centralized task information

### Multi-Agent Workflow Visualization
- [15] [Visualizing Agentic UX: FlowZap Blueprint](https://flowzap.xyz/blog/visualizing-agentic-ux) - Three-layer pattern for multi-agent systems
- [16] [5 Most Popular Agentic AI Design Patterns in 2025](https://www.azilen.com/blog/agentic-ai-design-patterns/) - Task-oriented and multi-agent collaboration patterns
- [17] [Top 10 Agentic AI Design Patterns](https://www.aufaitux.com/blog/agentic-ai-design-patterns-enterprise-guide/) - Transparency and control patterns
- [18] [The 2026 Guide to AI Agent Workflows](https://www.vellum.ai/blog/agentic-workflows-emerging-architectures-and-design-patterns) - Emerging architectures for agent workflows

### Real-Time Progress & Logs
- [6] [Task Management Dashboard - DevBoard](https://github.com/yousufali156/Dev-Board-Asg-5) - Real-time task progress tracking
- [13] [Gonzo - Real-Time Log Analysis TUI](https://github.com/control-theory/gonzo) - Color-coded log levels, timestamp alignment
- [19] [Flutter Logger Package v3.0.3](https://pub.dev/packages/logger) - Copy individual logs or bulk export

### Task State Management
- [5] [Designing Task Status UI](https://www.youtube.com/watch?v=kqbJZTSZoEY) - Pending, Running, Succeeded & Failed states
- [12] [Colours for project status](https://ux.stackexchange.com/questions/88528/colours-for-project-status) - Color choices for different states
- [5] [Day 22: Designing for Task Statuses](https://javatsc.substack.com/p/day-22-designing-for-task-statuses) - State transitions and retry logic

### Archive & Task Management
- [10] [How to make your Miro boards more accessible](https://help.miro.com/hc/en-us/articles/4403828924306-How-to-make-your-Miro-boards-more-accessible) - Archive and restore patterns
- [10] [KanbanTool - Restore Tasks from Archive](https://kanbantool.com/support/features/how-can-i-put-a-task-from-archive-back-to-the-board) - Right-click context menu restore
- [10] [GitLab - Soft-Delete (Archive) Issues](https://gitlab.com/gitlab-org/gitlab/-/issues/202180) - Soft-delete with restore UI

### Dark Mode & Accessibility
- [7] [Designing Accessible Dark Mode Interfaces](https://dev.to/henry_messiahtmt_099ca84/designing-accessible-dark-mode-interfaces-a-step-by-step-guide-for-modern-web-designers-45ao) - WCAG compliance for dark mode
- [8] [Dark Mode: Best Practices for Accessibility](https://dubbot.com/dubblog/2023/dark-mode-a11y.html) - Color contrast requirements
- [8] [The Designer's Guide to Dark Mode Accessibility](https://www.accessibilitychecker.org/blog/dark-mode-accessibility/) - Avoid pure black, test contrast

### WIP Limits & Kanban Patterns
- [11] [Working with WIP limits for kanban - Atlassian](https://www.atlassian.com/agile/kanban/wip-limits) - Visual indicators and blocker visibility
- [11] [Understanding Work-in-Progress (WIP) Limits in Kanban](https://www.multiboard.dev/posts/understanding-wip-limits-kanban) - Concurrent task limits

### Keyboard Shortcuts
- [20] [Keyboard Navigation Patterns for Complex Widgets](https://www.uxpin.com/studio/blog/keyboard-navigation-patterns-for-complex-widgets/) - Tab/Shift+Tab, arrow keys, Enter/Space/Esc
- [20] [20 Principles Modern Dashboard UI/UX Design for 2025](https://medium.com/@allclonescript/20-best-dashboard-ui-ux-design-principles-you-need-in-2025-30b661f2f795) - Modern keyboard navigation

### Sub-Task Visualization
- [14] [Kanban Boards: Visual Work Management Guide](https://teachingagile.com/kanban/introduction/kanban-boards) - Sub-columns for parallel activities
- [14] [Mastering Flow as the Key to a Smoother Kanban System](https://kanbantool.com/blog/mastering-flow-for-a-smoother-kanban) - Waiting vs Doing sub-stages
- [14] [Autonomous Framework with Kanban Board Workflow](https://medium.com/@joe.njenga/i-tested-this-autonomous-framework-that-turns-claude-code-into-a-virtual-dev-team-a030ab702630) - Parallel agent execution visualization

---
*Feature research for: Multi-Agent Workflow Kanban UI*
*Researched: 2025-01-18*
