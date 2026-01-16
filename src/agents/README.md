# Agent Framework

Base class for Claude Agent SDK + Convex integration.

## Overview

The agent framework provides a reusable `BaseAgent` abstract class that integrates the Claude Agent SDK with Convex state management. Specialized agents (Planner, Coder, Reviewer) extend this base class to get automatic access to Convex session storage.

## Key Features

- **Automatic Session Tracking**: Sessions are automatically created and tracked in Convex via SDK hooks
- **Manual State Persistence**: Subclasses explicitly call `execute()` for state persistence (no magic)
- **Hook-Based Lifecycle**: SessionStart/SessionEnd hooks handle Convex integration
- **Type-Safe Configuration**: Strongly-typed `AgentConfig` interface
- **Error Handling**: Hooks catch errors and update session status without crashing the agent

## Extending BaseAgent

To create a custom agent, extend `BaseAgent` and implement the `getSystemPrompt()` method:

```typescript
import { BaseAgent } from "./agents/index.js";

class MyAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return "You are a helpful assistant specializing in TypeScript.";
  }
}

// Create agent instance
const agent = new MyAgent({
  agentType: "my-agent",
  model: "sonnet", // optional, defaults to "sonnet"
  workflowId: workflowId, // optional Convex workflow ID
});

// Execute agent
const result = await agent.execute("Help me write TypeScript code");
```

## Configuration

The `AgentConfig` interface accepts:

- **agentType** (required): Type identifier for the agent (e.g., "planner", "coder", "reviewer")
- **model** (optional): Model name to use (defaults to "sonnet")
- **workflowId** (optional): Associated Convex workflow ID for session tracking

## Session Management

### Automatic Session Creation

When you call `agent.execute()`, the BaseAgent automatically:

1. Creates a new session in Convex via `SessionStart` hook
2. Sets session status to "running"
3. Executes the agent with the Claude SDK
4. Updates session status to "completed" via `SessionEnd` hook
5. Stores output and any errors

### Session Resumption

To resume an existing session, store the `sessionId` from execution:

```typescript
// Execute agent and get session ID
const result = await agent.execute("Initial input");
const sessionId = agent.getSessionId();

// Later, resume the session (feature to be implemented with SDK resume options)
// const resumedResult = await agent.execute("Additional input", { resume: sessionId });
```

## Error Handling

The agent framework handles errors at two levels:

1. **Hook Level**: Errors in Convex operations are caught and logged, but don't crash the agent
2. **Execution Level**: Errors from the Claude SDK are rethrown for the caller to handle

```typescript
try {
  const result = await agent.execute("Help me");
} catch (error) {
  // Handle Claude SDK errors
  console.error("Agent execution failed:", error);
}
```

## Convex Integration

The BaseAgent uses existing Convex functions from Phase 2:

- `convex.mutations.agents.createAgentSession`: Creates a new session
- `convex.mutations.agents.updateAgentSession`: Updates session state
- `convex.queries.agents.getAgentSession`: Retrieves session data

**Note**: Full Convex integration requires the Convex backend to be deployed (tracked in ISS-001). Currently, the Convex client is a placeholder that logs operations.

## Example: DummyAgent

The included `DummyAgent` demonstrates the extension pattern:

```typescript
import { DummyAgent } from "./agents/index.js";

const agent = new DummyAgent({ agentType: "dummy" });
const result = await agent.execute("Hello, world!");
// Result: "Dummy agent received: Hello, world!"
```

## Protected Methods

Subclasses can access these protected methods:

- **getModel()**: Returns the configured model name
- **buildConvexContext()**: Returns Convex context for mutations/queries
- **extractOutput(input)**: Extracts output from hook input

## Architecture Decisions

1. **Abstract Class Pattern**: Chosen over functional composition for clearer inheritance
2. **Manual Persistence**: Subclasses call `execute()` explicitly (no automatic state tracking)
3. **Hook-Based Integration**: Uses SDK hooks rather than wrapping the query function
4. **Error Resilience**: Hooks catch errors to prevent Convex issues from crashing agents

## Future Enhancements

- [ ] Session resumption with SDK `resume` option
- [ ] Streaming response handling
- [ ] Subagent orchestration support
- [ ] Tool definition and execution
- [ ] Full Convex backend integration (ISS-001)

## See Also

- [Claude Agent SDK Documentation](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Convex Documentation](https://docs.convex.dev/)
- Phase 2: Convex schema and agent session management
