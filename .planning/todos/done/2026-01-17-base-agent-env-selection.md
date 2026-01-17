---
created: 2026-01-17T04:16
title: Add BASE_AGENT env var for SDK selection (Claude vs GLM)
area: api
files:
  - src/agents/BaseAgent.ts
  - src/agents/GLMBaseAgent.ts
  - src/agents/CoderAgent.ts
  - src/agents/PlannerAgent.ts
  - src/agents/ReviewerAgent.ts
  - src/agents/index.ts
  - src/types/agent.ts
  - docs/GLM-4.7_INTEGRATION_RESEARCH.md
---

## Problem

Current architecture hardcodes agent SDK inheritance:
- All agents (`CoderAgent`, `PlannerAgent`, `ReviewerAgent`) directly extend `BaseAgent` (Claude SDK)
- `GLMBaseAgent.ts` exists but is unused by concrete agents
- No runtime mechanism to switch between Claude SDK and OpenAI/GLM SDK based on environment

This forces users to modify code to change LLM providers rather than using configuration.

## Solution

Implement environment-based SDK selection via `BASE_AGENT` variable:

1. **Create shared interface**: Extract `AgentInterface` that both BaseAgent and GLMBaseAgent implement
2. **Factory pattern**: Create `AgentFactory` that returns appropriate base class based on `BASE_AGENT` env var:
   - `BASE_AGENT=claude` (or unset) → uses `BaseAgent` (Claude SDK)
   - `BASE_AGENT=glm` → uses `GLMBaseAgent` (OpenAI SDK + GLM-4.7)
3. **Update concrete agents**: Refactor `CoderAgent`, `PlannerAgent`, `ReviewerAgent` to use factory:
   ```typescript
   class CoderAgent extends AgentFactory.createBase() { ... }
   ```
   Or use composition instead of inheritance
4. **Environment documentation**: Update docs with new env var and migration guide

**Key files to modify:**
- `src/types/agent.ts` - Add `AgentInterface` and update `AgentConfig`
- `src/agents/BaseAgent.ts` - Ensure implements `AgentInterface`
- `src/agents/GLMBaseAgent.ts` - Ensure implements `AgentInterface`
- `src/agents/AgentFactory.ts` - NEW factory for SDK selection
- `src/agents/CoderAgent.ts`, `PlannerAgent.ts`, `ReviewerAgent.ts` - Use factory
- `docs/SETUP_GUIDE.md` - Document BASE_AGENT env var
- `docs/GLM-4.7_INTEGRATION_RESEARCH.md` - Update implementation status

**Alternative approach if inheritance is problematic:**
- Use composition: agents delegate to `baseProvider` instance
- Factory creates and injects appropriate provider at runtime
