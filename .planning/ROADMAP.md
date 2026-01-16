# Roadmap: AI Agents POC

## Overview

A journey from blank TypeScript project to a working multi-agent autonomous coding system with self-hosted Convex as the real-time state backend via Docker Compose. We'll build a clean implementation of the Planner → Coder → Reviewer pattern using Claude Agent SDK + Convex actions, demonstrating agent coordination with reusable patterns for future projects.

## Domain Expertise

None - Claude Agent SDK patterns are the focus, and this is a learning POC to establish those patterns. Convex provides the persistent state layer. Docker Compose enables reproducible local development.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Setup** - TypeScript project with Convex (Docker Compose) and Claude SDK
- [x] **Phase 2: Convex Schema** - Define data models for sessions, workflows, agents
- [x] **Phase 3: Agent Foundation** - Base agent class with Convex state storage
- [x] **Phase 4: Planner Agent** - Task decomposition with Convex integration
- [x] **Phase 5: Coder Agent** - Code implementation with file operations
- [x] **Phase 6: Reviewer Agent** - Validation with Convex state tracking
- [x] **Phase 7: Orchestration** - Workflow coordination via Convex
- [x] **Phase 8: Example Task** - End-to-end demonstration
- [x] **Phase 9: Documentation** - Pattern documentation and cleanup
- [x] **Phase 10: Convex Deployment** - Self-hosted Convex backend deployment (post-project: ISS-001)
## Phase Details

### Phase 1: Project Setup
**Goal**: TypeScript project with self-hosted Convex (Docker Compose) configured and Claude SDK integrated
**Depends on**: Nothing (first phase)
**Research**: ✅ Complete (01-RESEARCH.md)
**Research topics**: @anthropic-ai/claude-agent-sdk current API, TypeScript project structure, Convex Docker setup
**Plans**: 2/2 Complete ✅

### Phase 2: Convex Schema & State Model
**Goal**: Define Convex schema for agent sessions, orchestration state, and workflow progress
**Depends on**: Phase 1
**Research**: ✅ Complete (02-RESEARCH.md)
**Research topics**: Convex schema best practices, state synchronization patterns, document modeling
**Plans**: 2/2 Complete ✅

### Phase 3: Agent Foundation with Convex
**Goal**: Base agent class that integrates Claude SDK with Convex state storage
**Depends on**: Phase 2
**Research**: ✅ Complete (03-RESEARCH.md)
**Research topics**: SDK session creation, agent lifecycle, Convex mutation patterns
**Plans**: 1/1 Complete ✅

### Phase 4: Planner Agent
**Goal**: Agent that decomposes tasks and stores plans in Convex
**Depends on**: Phase 3
**Research**: Unlikely (internal prompt engineering, established planning patterns)
**Plans**: 1/1 Complete ✅

### Phase 5: Coder Agent
**Goal**: Agent that implements code based on plans; tracks state in Convex; uses filesystem for artifacts
**Depends on**: Phase 3
**Research**: Unlikely (file I/O patterns, established in foundation)
**Plans**: TBD

### Phase 6: Reviewer Agent
**Goal**: Agent that validates implementations; stores reviews in Convex
**Depends on**: Phase 3
**Research**: Unlikely (validation logic, established patterns)
**Plans**: 1/1 Complete ✅

### Phase 7: Orchestration
**Goal**: Workflow coordination using Convex for state management and real-time sync
**Depends on**: Phases 4, 5, 6
**Research**: ✅ Complete (07-RESEARCH.md)
**Research topics**: Multi-agent patterns with Convex, handoff protocols, error handling, real-time orchestration
**Plans**: 1/1 Complete ✅

### Phase 8: Example Task
**Goal**: End-to-end demonstration with a simple coding task
**Depends on**: Phase 7
**Research**: Unlikely (applying established patterns)
**Plans**: 1/1 Complete ✅

### Phase 9: Documentation
**Goal**: Pattern documentation and code cleanup
**Depends on**: Phase 8
**Research**: Unlikely (documentation and cleanup)
**Plans**: 1/1 Complete ✅

### Phase 10: Convex Deployment (Post-Project)
**Goal**: Deploy self-hosted Convex backend and resolve ISS-001
**Depends on**: Phase 9
**Research**: Unlikely (follow SELF_HOSTED_SETUP_GUIDE.md)
**Plans**: 1 plan pending

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Setup | 2/2 | Complete | 2026-01-15 |
| 2. Convex Schema | 2/2 | Complete | 2026-01-16 |
| 3. Agent Foundation | 1/1 | Complete | 2026-01-16 |
| 4. Planner Agent | 1/1 | Complete | 2026-01-16 |
| 5. Coder Agent | 1/1 | Complete | 2026-01-16 |
| 6. Reviewer Agent | 1/1 | Complete | 2026-01-16 |
| 7. Orchestration | 1/1 | Complete | 2026-01-16 |
| 8. Example Task | 1/1 | Complete | 2026-01-16 |
| 9. Documentation | 1/1 | Complete | 2026-01-16 |
| 10. Convex Deployment | 1/1 | Complete | 2026-01-16 |

**Overall Progress: 10/10 phases complete (100%)**
**Total Plans: 12/12 complete**
**Total Execution Time: 164 min (2h 44m)**
