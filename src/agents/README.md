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

## Example: PlannerAgent

`PlannerAgent` is a specialized agent for task decomposition and planning:

```typescript
import { PlannerAgent } from "./agents/index.js";

// Create planner with basic detail level
const planner = new PlannerAgent({
  agentType: "planner",
  detailLevel: "basic", // or "detailed" for more comprehensive plans
});

// Generate a plan for a task
const plan = await planner.executePlan("Create a REST API for user management");

console.log("Steps:", plan.steps);
// [
//   {
//     description: "Design database schema for users",
//     agent: "coder",
//     dependencies: []
//   },
//   {
//     description: "Implement user CRUD endpoints",
//     agent: "coder",
//     dependencies: ["Design database schema for users"]
//   },
//   {
//     description: "Review API implementation for security",
//     agent: "reviewer",
//     dependencies: ["Implement user CRUD endpoints"]
//   }
// ]

console.log("Estimated duration:", plan.estimatedDuration);
// "2-3 hours"

console.log("Risks:", plan.risks);
// ["Authentication complexity may require additional research"]

// Execute with Convex workflow tracking
const planWithWorkflow = await planner.executeWithWorkflow(
  "Create a REST API for user management",
  workflowId
);
```

### PlannerAgent Features

- **Task Decomposition**: Breaks complex tasks into 3-7 actionable steps
- **Agent Assignment**: Assigns each step to appropriate agent types:
  - `coder`: Implementation work (writing code, creating files)
  - `reviewer`: Validation and testing (code review, test execution)
  - `planner`: Further decomposition if needed
- **Dependency Tracking**: Identifies sequential vs parallel work
- **Risk Assessment**: Estimates duration and identifies potential blockers
- **Structured Output**: Returns typed `PlanResult` interface for programmatic use

### PlannerAgent vs Other Agents

| Agent | Purpose | Output | Phase |
|-------|---------|--------|-------|
| **PlannerAgent** | Task decomposition and planning | `PlanResult` with steps, dependencies | 4 |
| **CoderAgent** | Implementation work | `CodeResult` with file changes | 5 |
| **ReviewerAgent** | Validation and testing | Review results (Phase 6) | 6 |

## Example: CoderAgent

`CoderAgent` is a specialized agent for code implementation and file operations:

```typescript
import { CoderAgent } from "./agents/index.js";

// Create coder with default settings
const coder = new CoderAgent({
  agentType: "coder",
  // maxChanges: 10, // optional, limits number of file changes
  // allowedPaths: ["src/", "lib/"], // optional, restricts where files can be written
});

// Generate code changes for a task
const code = await coder.executeCode("Create a User model with email and password fields");

console.log("Changes:", code.changes);
// [
//   {
//     path: "src/models/User.ts",
//     content: "export class User { ... }",
//     operation: "create"
//   }
// ]

console.log("Summary:", code.summary);
// "Created User model with email and password fields"

console.log("Files modified:", code.filesModified);
// ["src/models/User.ts"]

// Execute with Convex workflow tracking
const codeWithWorkflow = await coder.executeWithWorkflow(
  "Create a User model with email and password fields",
  workflowId
);
```

### CoderAgent Features

- **Code Implementation**: Generates complete, working code based on plan descriptions
- **File Operations**: Supports three operation types:
  - `create`: Create new files
  - `update`: Modify existing files
  - `delete`: Remove files
- **Path Restriction**: Optional `allowedPaths` for safety (limits where agent can write)
- **Change Limits**: Optional `maxChanges` to control scope (default: 10)
- **Structured Output**: Returns typed `CodeResult` interface for programmatic use

### CoderConfig Options

The `CoderConfig` interface extends `AgentConfig` with:

- **agentType** (inherited): Type identifier for the agent (defaults to "coder")
- **model** (inherited): Model name to use (defaults to "sonnet")
- **workflowId** (inherited): Associated Convex workflow ID for session tracking
- **maxChanges** (coder-specific): Maximum number of file changes (default: 10)
- **allowedPaths** (coder-specific): Optional array of allowed file paths for safety

### CodeResult Structure

```typescript
interface CodeResult {
  changes: FileChange[];      // Array of file change operations (1-10 items)
  summary: string;            // Human-readable description of changes
  filesModified: string[];    // Array of file paths that were modified
}

interface FileChange {
  path: string;               // File path relative to project root
  content: string;            // File content (for create/update operations)
  operation: "create" | "update" | "delete";  // Type of operation
}
```

### CoderAgent vs Other Agents

| Agent | Purpose | Output | Phase |
|-------|---------|--------|-------|
| **PlannerAgent** | Task decomposition and planning | `PlanResult` with steps, dependencies | 4 |
| **CoderAgent** | Implementation work | `CodeResult` with file changes | 5 |
| **ReviewerAgent** | Validation and testing | `ReviewResult` with issues, approval | 6 |

## Example: ReviewerAgent

`ReviewerAgent` is a specialized agent for code validation and review:

```typescript
import { ReviewerAgent } from "./agents/index.js";

// Create reviewer with default settings
const reviewer = new ReviewerAgent({
  agentType: "reviewer",
  // maxIssues: 20, // optional, limits number of issues reported
  // severity: "warning", // optional, minimum severity level ("error" | "warning" | "info")
});

// Review code changes
const review = await reviewer.executeReview("Review this User model for security issues");

console.log("Issues:", review.issues);
// [
//   {
//     severity: "error",
//     file: "src/models/User.ts",
//     line: 15,
//     message: "Missing input validation on email field",
//     suggestion: "Add email format validation using a regex or validator library"
//   },
//   {
//     severity: "warning",
//     file: "src/models/User.ts",
//     line: 20,
//     message: "Password stored in plain text",
//     suggestion: "Use bcrypt or argon2 for password hashing"
//   }
// ]

console.log("Summary:", review.summary);
// "Found 1 error and 1 warning that should be addressed"

console.log("Overall status:", review.overallStatus);
// "rejected" (because there's an error)

console.log("Files reviewed:", review.filesReviewed);
// ["src/models/User.ts"]

// Execute with Convex workflow tracking
const reviewWithWorkflow = await reviewer.executeWithWorkflow(
  "Review this User model for security issues",
  workflowId
);
```

### ReviewerAgent Features

- **Code Validation**: Reviews code for correctness, security, and best practices
- **Severity Levels**: Categorizes issues by impact:
  - `error`: Blocking issues that must be fixed (security vulnerabilities, crashes, data loss)
  - `warning`: Non-blocking issues that should be addressed (code quality, performance, maintainability)
  - `info`: Observations and suggestions for improvement (style, minor optimizations)
- **Approval Status**: Determines overall status based on issues found:
  - `approved`: No issues, or only info-level issues
  - `needs-changes`: Has warnings but no errors
  - `rejected`: Has one or more errors
- **Structured Output**: Returns typed `ReviewResult` interface for programmatic use
- **Configurable Limits**: Optional `maxIssues` to control output size (default: 20)
- **Severity Filtering**: Optional `severity` setting to focus on specific issue levels

### ReviewerConfig Options

The `ReviewerConfig` interface extends `AgentConfig` with:

- **agentType** (inherited): Type identifier for the agent (defaults to "reviewer")
- **model** (inherited): Model name to use (defaults to "sonnet")
- **workflowId** (inherited): Associated Convex workflow ID for session tracking
- **maxIssues** (reviewer-specific): Maximum number of issues to report (default: 20)
- **severity** (reviewer-specific): Minimum severity level to report ("error" | "warning" | "info")

### ReviewResult Structure

```typescript
interface ReviewResult {
  issues: ReviewIssue[];      // Array of review issues (0-20 items)
  summary: string;            // Human-readable summary of the review
  overallStatus: "approved" | "needs-changes" | "rejected";  // Final decision
  filesReviewed: string[];    // Array of file paths that were reviewed
}

interface ReviewIssue {
  severity: "error" | "warning" | "info";  // Impact level
  file: string;               // File path where the issue was found
  line: number;               // Line number where the issue occurs
  message: string;            // Clear description of the issue
  suggestion: string;         // Recommended fix or improvement
}
```

### Overall Status Determination

The `overallStatus` is determined automatically based on the issues found:

| Issues Found | Overall Status |
|--------------|----------------|
| No issues, or only `info` level | `approved` |
| Has `warning` but no `error` | `needs-changes` |
| Has one or more `error` | `rejected` |

### ReviewerAgent vs Other Agents

| Agent | Purpose | Output | Phase |
|-------|---------|--------|-------|
| **PlannerAgent** | Task decomposition and planning | `PlanResult` with steps, dependencies | 4 |
| **CoderAgent** | Implementation work | `CodeResult` with file changes | 5 |
| **ReviewerAgent** | Validation and testing | `ReviewResult` with issues, approval | 6 |

## Orchestration

The `SequentialOrchestrator` coordinates multi-agent workflows by executing specialized agents in sequence: Planner → Coder → Reviewer. It manages state passing between agents via filesystem artifacts and integrates with Convex for workflow tracking.

### Basic Usage

```typescript
import { SequentialOrchestrator } from "./orchestrator/index.js";

// Configure the orchestrator
const config = {
  workspace: "./workspace",
  continueOnError: false, // optional, defaults to false
};

// Create orchestrator instance
const orchestrator = new SequentialOrchestrator(config);

// Define the workflow context
const context = {
  task: "Create a User model with authentication",
  workspace: "./workspace",
  workflowId: workflowId, // optional, for Convex tracking
};

// Execute the workflow
const result = await orchestrator.executeWorkflow(context);

// Check result
if (result.success) {
  console.log("Workflow completed successfully!");
  console.log(`Steps executed: ${result.steps.length}`);
  console.log(`Artifacts created: ${result.artifacts.length}`);

  // Access final review
  if (result.finalReview) {
    console.log(`Overall status: ${result.finalReview.overallStatus}`);
  }
} else {
  console.log("Workflow failed");
  // Check which steps failed
  for (const step of result.steps) {
    if (step.status === "failed") {
      console.log(`${step.name} failed: ${step.error}`);
    }
  }
}
```

### Workflow Flow

The orchestrator executes agents in a sequential pipeline:

1. **Planning** (`PlannerAgent`): Breaks down the task into actionable steps
2. **Coding** (`CoderAgent`): Implements code based on the plan
3. **Review** (`ReviewerAgent`): Validates the implementation

Each agent's output is saved to the workspace as a JSON artifact:
- `workspace/plan.json`: Planner output (PlanResult)
- `workspace/code.json`: Coder output (CodeResult)
- `workspace/review.json`: Reviewer output (ReviewResult)

### Configuration Options

The `ExecuteWorkflowConfig` interface accepts:

- **workspace** (required): Filesystem path for artifact storage
- **continueOnError** (optional): Whether to continue workflow after non-fatal errors (defaults to false)

### WorkflowContext

The `WorkflowContext` interface accepts:

- **task** (required): The task description to execute
- **workspace** (required): The filesystem path for artifact storage
- **workflowId** (optional): Convex workflow ID for state tracking

### WorkflowResult Structure

```typescript
interface WorkflowResult {
  success: boolean;              // Whether the workflow completed successfully
  steps: WorkflowStep[];         // All workflow steps with their results
  artifacts: Artifact[];         // Artifacts produced during execution
  finalReview?: ReviewResult;    // Final review result if available
}

interface WorkflowStep {
  name: string;                  // Human-readable name of the step
  agent: string;                 // Type of agent that executed this step
  status: "pending" | "in_progress" | "completed" | "failed";
  startTime: number;             // Timestamp when the step started
  endTime?: number;              // Timestamp when the step completed
  output?: string;               // Output from the agent execution
  error?: string;                // Error message if the step failed
}
```

### continueOnError Behavior

When `continueOnError` is `false` (default):
- Planner fails → Workflow stops (no plan to execute)
- Coder fails → Workflow stops (no code to review)
- Reviewer fails → Workflow completes with error status

When `continueOnError` is `true`:
- Planner fails → Workflow stops (no plan to execute)
- Coder fails → Reviewer still runs (reviews partial implementation)
- Reviewer fails → Workflow completes with error status

Workflow success is determined by:
- `continueOnError=false`: All steps must complete successfully
- `continueOnError=true`: Reviewer must complete (even if Coder failed)

### Convex Integration

When a `workflowId` is provided, the orchestrator integrates with Convex:

```typescript
const context = {
  task: "Create a User model",
  workspace: "./workspace",
  workflowId: workflowId, // Associates execution with Convex workflow
};

const result = await orchestrator.executeWorkflow(context);

// Convex operations performed:
// 1. Creates workflow session on start
// 2. Updates workflow status on each step
// 3. Saves final result on completion
```

Convex integration provides:
- **Session Tracking**: Each agent execution is tracked as a session
- **Persistent State**: Workflow state survives process restarts
- **Queryable History**: Query workflow status and results via Convex

### Error Handling

The orchestrator handles errors at multiple levels:

```typescript
try {
  const result = await orchestrator.executeWorkflow(context);

  if (!result.success) {
    // Find the first failed step
    const failedStep = result.steps.find(s => s.status === "failed");

    if (failedStep) {
      console.log(`Workflow failed at: ${failedStep.name}`);
      console.log(`Error: ${failedStep.error}`);

      // Handle specific agent failures
      switch (failedStep.agent) {
        case "planner":
          console.log("Task may be too vague or complex");
          break;
        case "coder":
          console.log("Plan may be ambiguous or incomplete");
          break;
        case "reviewer":
          console.log("Code output may be malformed");
          break;
      }
    }
  }
} catch (error) {
  // Handle unexpected errors
  console.error("Workflow execution error:", error);
}
```

### Inspecting Artifacts

After workflow execution, inspect artifacts to understand the workflow:

```typescript
import { readFile } from "fs/promises";
import { join } from "path";

// Read plan artifact
const planContent = await readFile(join("./workspace", "plan.json"), "utf-8");
const plan = JSON.parse(planContent);
console.log(`Plan has ${plan.steps.length} steps`);

// Read code artifact
const codeContent = await readFile(join("./workspace", "code.json"), "utf-8");
const code = JSON.parse(codeContent);
console.log(`Code has ${code.changes.length} file changes`);

// Read review artifact
const reviewContent = await readFile(join("./workspace", "review.json"), "utf-8");
const review = JSON.parse(reviewContent);
console.log(`Review status: ${review.overallStatus}`);
```

### Orchestration vs Individual Agents

| Approach | When to Use | Benefits |
|----------|------------|----------|
| **SequentialOrchestrator** | Complete task execution (plan → code → review) | Automated pipeline, state management, error handling |
| **Individual Agents** | Single-step operations or custom workflows | Fine-grained control, custom orchestration |

### Orchestrator Comparison

| Component | Purpose | Output |
|-----------|---------|--------|
| **SequentialOrchestrator** | Coordinates multi-agent workflow | `WorkflowResult` with all steps and artifacts |
| **PlannerAgent** | Task decomposition | `PlanResult` with steps and dependencies |
| **CoderAgent** | Code implementation | `CodeResult` with file changes |
| **ReviewerAgent** | Code validation | `ReviewResult` with issues and approval |

### Architecture Decisions

1. **Sequential Execution**: Chosen over parallel for simpler state management and clearer dependencies
2. **Filesystem State**: JSON artifacts enable inspection, debugging, and workflow persistence
3. **Error Boundaries**: Each step wrapped in try-catch for graceful degradation
4. **Convex Integration**: Optional workflow tracking without requiring Convex for basic operation

### Future Enhancements

- [ ] Parallel subagent execution for independent steps
- [ ] Workflow resumption from checkpoints
- [ ] Custom agent pipelines (not just Planner→Coder→Reviewer)
- [ ] Artifact versioning and history
- [ ] Workflow visualization and debugging UI

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
