# Phase 3: Agent Foundation with Convex - Context

**Gathered:** 2026-01-16
**Status:** Ready for research

<vision>
## How This Should Work

A base class pattern that provides Convex integration for agents. Specialized agents (Planner, Coder, Reviewer) will extend this base class to get automatic access to Convex session storage.

The base class should feel like a foundation — not doing the work itself, but providing the tools for subclasses to implement their specific behavior. When an agent needs to save state, it calls methods on the base class explicitly (manual persistence, not magic).

I imagine it working like: extend BaseAgent, implement your agent-specific logic, call `saveSession()` or similar when you want to persist state to Convex.

</vision>

<essential>
## What Must Be Nailed

- **Working SDK + Convex integration** — Getting an agent running, saving its state to Convex, and being able to resume it later
- **Reusable pattern** — A clean base class that Planner, Coder, and Reviewer can all extend without fighting the foundation

Both are equally important. The integration must work, and the pattern must be reusable.

</essential>

<boundaries>
## What's Out of Scope

- **Concrete agent implementations** — Not building Planner, Coder, or Reviewer agents (that's Phases 4, 5, 6)
- **Orchestration logic** — No workflow coordination, agent-to-agent handoff, or multi-agent orchestration (that's Phase 7)
- **Complex patterns** — Keep it simple. One base class, manual persistence, clear methods

</boundaries>

<specifics>
## Specific Ideas

- Include a simple test agent (like a DummyAgent) to prove the pattern works
- Manual state persistence — subclasses explicitly call save/update methods
- Use standard TypeScript patterns for class inheritance
- Base class should handle the Convex integration details so subclasses don't need to know them

</specifics>

<notes>
## Additional Context

User emphasized "more control, less magic" — preferring explicit state persistence over automatic tracking. The base class is a tool, not a black box.

Priority is establishing a pattern that will scale to three different agent types without refactoring.

</notes>

---

*Phase: 03-agent-foundation*
*Context gathered: 2026-01-16*
