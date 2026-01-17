# Multi-Agent Coordination Patterns

This document describes the reusable patterns established in this project for building autonomous multi-agent systems with Claude Agent SDK and Convex.

## Overview

This POC demonstrates a working multi-agent orchestration system where specialized agents collaborate to complete coding tasks autonomously. The patterns below can be applied to new projects to accelerate development of agent-coordinated systems.

**Workflow:** `PlannerAgent → CoderAgent → ReviewerAgent`

Each agent produces a JSON artifact for state passing:
- `plan.json` - Task decomposition with execution steps
- `code.json` - File changes and implementation details
- `review.json` - Validation feedback with issues and approval status

---

## Pattern 1: BaseAgent Abstract Class

**Purpose:** Reusable Claude SDK + Convex integration for all agents

**Key Features:**
- Automatic session tracking via SDK hooks (SessionStart/SessionEnd)
- Manual state persistence (subclasses call execute() explicitly)
- Hook-based lifecycle for Convex integration
- Error resilience (Convex errors don't crash agents)
- Type-safe configuration with AgentConfig interface

**Location:** `src/agents/BaseAgent.ts`

### How to Extend

Create a custom agent by extending `BaseAgent` and implementing `getSystemPrompt()`:

```typescript
import { BaseAgent } from "./agents/BaseAgent.js";

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

### How It Works

1. **Session Creation**: When you call `agent.execute()`, BaseAgent automatically creates a session via `SessionStart` hook
2. **Status Tracking**: Session status set to "running" during execution
3. **Execution**: Agent executes with Claude SDK using your system prompt
4. **Completion**: Session status updated to "completed" via `SessionEnd` hook
5. **Output Storage**: Output and errors stored in Convex

### Migration to New Projects

Copy `BaseAgent.ts` and implement your agent:

```typescript
import { BaseAgent } from "./BaseAgent.js";

class DataAnalystAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a data analyst specialized in SQL queries and data visualization.

Your role is to:
- Analyze data requirements
- Generate optimized SQL queries
- Suggest visualization approaches

Output structured results as JSON.`;
  }

  // Optional: Add custom execute method for typed output
  async executeAnalysis(task: string): Promise<AnalysisResult> {
    const response = await this.execute(task);
    return JSON.parse(response);
  }
}
```

---

## Pattern 2: Sequential Orchestration

**Purpose:** Multi-agent coordination pipeline for complex tasks

**Flow:** Planner → Coder → Reviewer (three-agent pipeline)

**State Passing:** Filesystem artifacts (plan.json → code.json → review.json)

**Location:** `src/orchestrator/SequentialOrchestrator.ts`

### Basic Usage

```typescript
import { SequentialOrchestrator } from "./orchestrator/SequentialOrchestrator.js";

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
}
```

### How It Works

1. **Planning Phase**: PlannerAgent breaks task into 3-7 actionable steps
2. **Coding Phase**: CoderAgent implements code based on the plan
3. **Review Phase**: ReviewerAgent validates implementation

Each phase:
- Reads previous artifacts from filesystem
- Produces new artifact as JSON
- Saves artifact to workspace for next phase
- Tracks timing and status

### Error Handling with continueOnError

When `continueOnError` is `false` (default):
- Planner fails → Workflow stops (no plan to execute)
- Coder fails → Workflow stops (no code to review)
- Reviewer fails → Workflow completes with error status

When `continueOnError` is `true`:
- Planner fails → Workflow stops (no plan to execute)
- Coder fails → Reviewer still runs (reviews partial implementation)
- Reviewer fails → Workflow completes with error status

### Migration to New Projects

Create custom pipelines by modifying SequentialOrchestrator:

```typescript
// Example: Research → Write → Edit pipeline
class ContentOrchestrator {
  private readonly config: ExecuteWorkflowConfig;

  constructor(config: ExecuteWorkflowConfig) {
    this.config = config;
  }

  async executeWorkflow(context: WorkflowContext): Promise<WorkflowResult> {
    const { task, workspace } = context;

    // Step 1: Research
    const researcher = new ResearcherAgent({ agentType: "researcher" });
    const research = await researcher.execute(task);
    await saveArtifact(workspace, { type: "research", path: "research.json", content: research });

    // Step 2: Write
    const writer = new WriterAgent({ agentType: "writer" });
    const content = await writer.executeWithResearch(task, research);
    await saveArtifact(workspace, { type: "content", path: "content.json", content });

    // Step 3: Edit
    const editor = new EditorAgent({ agentType: "editor" });
    const review = await editor.executeWithContent(task, content);
    await saveArtifact(workspace, { type: "review", path: "review.json", content });

    return { success: true, steps: [...], artifacts: [...] };
  }
}
```

---

## Pattern 3: Agent Specialization

**Purpose:** Distinct responsibilities for different tasks

**Specializations:**
- **PlannerAgent**: Task decomposition with PlanResult
- **CoderAgent**: Implementation with CodeResult
- **ReviewerAgent**: Validation with ReviewResult

Each agent has:
- Typed interface for structured output
- Dedicated execute method (executePlan, executeCode, executeReview)
- Specific system prompt for its role

### PlannerAgent Example

```typescript
import { PlannerAgent } from "./agents/PlannerAgent.js";

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
//   }
// ]

console.log("Estimated duration:", plan.estimatedDuration);
// "2-3 hours"
```

### CoderAgent Example

```typescript
import { CoderAgent } from "./agents/CoderAgent.js";

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
```

### ReviewerAgent Example

```typescript
import { ReviewerAgent } from "./agents/ReviewerAgent.js";

const reviewer = new ReviewerAgent({
  agentType: "reviewer",
  // maxIssues: 20, // optional, limits number of issues reported
  // severity: "warning", // optional, minimum severity level
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
//     suggestion: "Add email format validation using regex"
//   }
// ]

console.log("Overall status:", review.overallStatus);
// "rejected" (because there's an error)
```

### Migration to New Projects

Create new specialized agents by extending BaseAgent:

```typescript
import { BaseAgent } from "./BaseAgent.js";

interface TestResult {
  testCases: TestCase[];
  coverage: number;
  overallStatus: "passing" | "failing" | "partial";
}

class TesterAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a QA specialist focused on test generation and validation.

Your role is to:
- Analyze code requirements
- Generate comprehensive test cases
- Estimate test coverage
- Identify edge cases

Output structured results as JSON with:
- testCases: array of test case descriptions
- coverage: estimated coverage percentage
- overallStatus: passing, failing, or partial`;
  }

  async executeTests(task: string): Promise<TestResult> {
    const response = await this.execute(task);
    return JSON.parse(response);
  }
}
```

---

## Pattern 4: Typed Result Interfaces

**Purpose:** Predictable, structured agent output for programmatic use

**Interfaces:**
- `PlanResult`: steps, dependencies, duration, risks
- `CodeResult`: changes (FileChange[]), summary, filesModified
- `ReviewResult`: issues (ReviewIssue[]), overallStatus, filesReviewed

**Locations:**
- `src/types/plan.ts`
- `src/types/code.ts`
- `src/types/review.ts`

### PlanResult Structure

```typescript
interface PlanResult {
  steps: PlanStep[];           // 3-7 actionable steps
  estimatedDuration?: string;  // e.g., "2-3 hours"
  risks?: string[];            // potential blockers
}

interface PlanStep {
  description: string;         // Clear, actionable description
  agent: string;               // "coder", "reviewer", "planner"
  dependencies: string[];      // Step descriptions that must complete first
}
```

### CodeResult Structure

```typescript
interface CodeResult {
  changes: FileChange[];      // 1-10 file operations
  summary: string;            // Human-readable description
  filesModified: string[];    // Array of modified file paths
}

interface FileChange {
  path: string;               // File path relative to project root
  content: string;            // File content (create/update)
  operation: "create" | "update" | "delete";
}
```

### ReviewResult Structure

```typescript
interface ReviewResult {
  issues: ReviewIssue[];      // 0-20 issues found
  summary: string;            // Human-readable summary
  overallStatus: "approved" | "needs-changes" | "rejected";
  filesReviewed: string[];    // Files that were reviewed
}

interface ReviewIssue {
  severity: "error" | "warning" | "info";
  file: string;
  line: number;
  message: string;
  suggestion: string;
}
```

### Migration to New Projects

Define typed interfaces for your agent outputs:

```typescript
// types/research.ts
interface ResearchResult {
  findings: Finding[];
  sources: string[];
  confidence: number;
  overallStatus: "complete" | "needs-more" | "insufficient-data";
}

interface Finding {
  category: string;
  summary: string;
  details: string;
  relevance: number;
}

// types/content.ts
interface ContentResult {
  sections: ContentSection[];
  wordCount: number;
  readingTime: number;
  overallStatus: "draft" | "review-ready" | "final";
}

interface ContentSection {
  heading: string;
  content: string;
  wordCount: number;
}
```

---

## Pattern 5: Filesystem State Management

**Purpose:** Artifact inspection and debugging without database dependency

**Artifacts:**
- JSON files in workspace directory
- Each artifact validated by verify-output.ts
- Enables workflow inspection without Convex

**Location:** `src/orchestrator/state.ts`

### Artifact Structure

```
workspace/
├── plan.json      # PlannerAgent output
├── code.json      # CoderAgent output
└── review.json    # ReviewerAgent output
```

### Saving Artifacts

```typescript
import { saveArtifact, planToJson } from "./orchestrator/state.js";

// After agent execution
const plan = await planner.executePlan(task);

// Convert to JSON
const planJson = planToJson(plan);

// Save to workspace
await saveArtifact("./workspace", {
  type: "plan",
  path: "plan.json",
  content: planJson,
});
```

### Loading Artifacts

```typescript
import { loadArtifact } from "./orchestrator/state.js";

// Load plan for next agent
const planJson = await loadArtifact("./workspace", "plan.json");
const plan = JSON.parse(planJson) as PlanResult;

// Use as context for next agent
const coderInput = `Task: ${task}\n\nPlan:\n${planJson}`;
const code = await coder.executeCode(coderInput);
```

### Artifact Validation

```typescript
import { validateCodeResult } from "./types/code.js";

// Load and validate artifact
const codeJson = await loadArtifact("./workspace", "code.json");
const code = JSON.parse(codeJson) as CodeResult;

// Validate structure
try {
  validateCodeResult(code);
  console.log("✓ code.json is valid");
} catch (error) {
  console.error("✗ code.json validation failed:", error);
}
```

### Migration to New Projects

Create custom artifact types and validators:

```typescript
// types/artifacts.ts
interface Artifact {
  type: string;
  path: string;
  content: string;
}

// Custom artifact types
interface ResearchArtifact extends Artifact {
  type: "research";
  content: string; // JSON string of ResearchResult
}

interface ContentArtifact extends Artifact {
  type: "content";
  content: string; // JSON string of ContentResult
}

// Validation functions
export function validateResearchArtifact(artifact: ResearchArtifact): void {
  const result = JSON.parse(artifact.content) as ResearchResult;

  if (!result.findings || result.findings.length === 0) {
    throw new Error("Research artifact must have findings");
  }

  if (!result.sources || result.sources.length === 0) {
    throw new Error("Research artifact must have sources");
  }

  if (result.confidence < 0 || result.confidence > 1) {
    throw new Error("Confidence must be between 0 and 1");
  }
}

// Save with validation
export async function saveValidatedArtifact(
  workspace: string,
  artifact: ResearchArtifact
): Promise<void> {
  validateResearchArtifact(artifact);
  await saveArtifact(workspace, artifact);
}
```

---

## Pattern 6: Model-Agnostic Body (Alternative LLMs)

**Purpose:** Swap underlying model "brain" while keeping agent framework "body"

The Claude Agent SDK's `env` option enables routing requests to alternative LLM providers (like GLM-4.7) that offer API-compatible endpoints. This allows BaseAgent to use different models without code changes by passing environment variables to the spawned Claude Code process.

### Concept: "Body" vs "Brain"

- **Body** = Agent Framework (Claude Agent SDK, BaseAgent, orchestrators)
- **Brain** = AI Model (Claude, GPT-4, GLM-4.7)

The body handles: tool use, memory management, task planning, state persistence.
The brain handles: reasoning, understanding, generation.

### How It Works

BaseAgent.buildOptions() detects GLM environment variables and passes them to the agent SDK:

```typescript
// From BaseAgent.buildOptions()
const glmApiKey = process.env.GLM_API_KEY;
const glmBaseUrl = process.env.GLM_BASE_URL;

if (glmApiKey) {
  options.env = {
    ANTHROPIC_API_KEY: glmApiKey,
    ...(glmBaseUrl && { ANTHROPIC_BASE_URL: glmBaseUrl }),
  };

  // Default model to glm-4.7 when GLM is configured
  if (!this.config.model) {
    options.model = "glm-4.7";
  }
}
```

**The Flow:**
1. BaseAgent detects `GLM_API_KEY` environment variable
2. buildOptions() adds `env` object with `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` to SDK options
3. Agent SDK spawns Claude Code process with these environment variables
4. Claude Code process routes requests to GLM's compatible endpoint instead of Anthropic
5. Model automatically defaults to 'glm-4.7' when GLM is configured

### Environment Variables

For development and production flexibility, use environment variables:

```bash
# .env file (optional - when not set, uses Anthropic defaults)
GLM_API_KEY=your-glm-api-key
GLM_BASE_URL=https://api.z.ai/api/coding/paas/v4
```

**Important:** These variables are **optional**. When not set, BaseAgent uses default Anthropic models with no configuration needed.

### Using with BaseAgent

BaseAgent handles GLM configuration automatically. No code changes needed:

```typescript
import { BaseAgent } from "./agents/BaseAgent.js";

class MyAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return "You are a helpful assistant...";
  }
}

// With GLM_API_KEY set in environment:
// - Automatically uses GLM-4.7 via compatible endpoint
// - Model defaults to 'glm-4.7'
const agent = new MyAgent({ agentType: "my-agent" });
const result = await agent.execute("Help me write TypeScript code");

// Without GLM_API_KEY:
// - Uses default Anthropic models
// - Model defaults to 'sonnet'
const agent2 = new MyAgent({ agentType: "my-agent" });
const result2 = await agent2.execute("Help me write TypeScript code");
```

### Implementation Notes

**Why Agent SDK's `env` Option?**

The agent SDK's `env` option was chosen over direct @anthropic-ai/sdk instantiation because:

1. **No New Dependencies**: Uses existing @anthropic-ai/claude-agent-sdk (v0.2.7) with `env` option
2. **Clean Architecture**: BaseAgent continues to use agent SDK's `query()` function; model selection happens at SDK level
3. **Separation of Concerns**: BaseAgent handles orchestration; SDK handles model routing
4. **Backward Compatible**: Existing code works without GLM configuration

**Not Using Low-Level SDK Directly**

The plan intentionally does **NOT** add @anthropic-ai/sdk as a dependency. Instead, it leverages the agent SDK's ability to pass environment variables to the spawned Claude Code process. This maintains the existing architecture where BaseAgent uses the agent SDK's high-level `query()` function.

### Comparison: Claude vs GLM

| Feature | Claude (Native) | GLM-4.7 (Compatible) |
|---------|-----------------|----------------------|
| Setup | No configuration needed | Set GLM_API_KEY and GLM_BASE_URL |
| Model | Claude 3.5 Sonnet (default: "sonnet") | GLM-4.7 (default: "glm-4.7") |
| Cost | Higher per token | Often more cost-effective |
| Data processed | Anthropic servers | 智谱AI servers |
| Best for | Best-in-class reasoning | Cost-effective alternative |
| Code changes | None | None (automatic via env) |

### Key Considerations

1. **API Compatibility**: This only works because GLM-4.7 provides an Anthropic-compatible endpoint. Not all providers do this.

2. **Feature Parity**: Compatible endpoints may not support all features. Test thoroughly.

3. **Debugging**: Issues could be in the body (agent code), brain (model), or integration layer.

4. **Environment Variables**: GLM configuration is entirely optional. BaseAgent works without any GLM vars set.

### Research Reference

See `docs/GLM-4.7_INTEGRATION_RESEARCH2.md` for complete research on GLM-4.7 integration with Claude Code CLI and Agent SDK.

---

## Applying These Patterns

### Quick Start for New Projects

1. **Copy Base Pattern**: Start with `BaseAgent` for all agents
2. **Define Interfaces**: Create typed result interfaces for your domain
3. **Implement Agents**: Extend BaseAgent with specialized execute methods
4. **Create Orchestrator**: Build SequentialOrchestrator for your workflow
5. **Add State Management**: Use filesystem artifacts for state passing

### Example: Data Pipeline Orchestrator

```typescript
// agents/DataAgent.ts
class DataExtractorAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return "You are a data extraction specialist...";
  }
  async executeExtraction(source: string): Promise<ExtractionResult> {
    const response = await this.execute(`Extract data from: ${source}`);
    return JSON.parse(response);
  }
}

class DataTransformerAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return "You are a data transformation specialist...";
  }
  async executeTransform(data: string): Promise<TransformResult> {
    const response = await this.execute(`Transform data: ${data}`);
    return JSON.parse(response);
  }
}

class DataLoaderAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return "You are a data loading specialist...";
  }
  async executeLoad(transformed: string): Promise<LoadResult> {
    const response = await this.execute(`Load data: ${transformed}`);
    return JSON.parse(response);
  }
}

// orchestrator/DataPipelineOrchestrator.ts
class DataPipelineOrchestrator {
  async executePipeline(context: PipelineContext): Promise<PipelineResult> {
    // Extract
    const extractor = new DataExtractorAgent({ agentType: "extractor" });
    const extraction = await extractor.executeExtraction(context.source);
    await saveArtifact(context.workspace, {
      type: "extraction",
      path: "extraction.json",
      content: JSON.stringify(extraction),
    });

    // Transform
    const transformer = new DataTransformerAgent({ agentType: "transformer" });
    const transformed = await transformer.executeTransform(
      JSON.stringify(extraction)
    );
    await saveArtifact(context.workspace, {
      type: "transformed",
      path: "transformed.json",
      content: JSON.stringify(transformed),
    });

    // Load
    const loader = new DataLoaderAgent({ agentType: "loader" });
    const loaded = await loader.executeLoad(JSON.stringify(transformed));
    await saveArtifact(context.workspace, {
      type: "loaded",
      path: "loaded.json",
      content: JSON.stringify(loaded),
    });

    return { success: true, stages: [extraction, transformed, loaded] };
  }
}
```

---

## Key Decisions and Rationale

### Sequential vs Parallel Execution

**Decision:** Sequential orchestration (Planner → Coder → Reviewer)

**Rationale:**
- Simpler state management at POC scale
- Clear dependencies between stages
- Easier to debug and inspect
- Can be extended to parallel execution later

### Filesystem vs Database State

**Decision:** Filesystem artifacts with optional Convex tracking

**Rationale:**
- Artifacts visible and inspectable without database
- Local development doesn't require Convex backend
- JSON artifacts can be version controlled
- Convex tracking optional for multi-session workflows

### Hook-Based vs Wrapper Integration

**Decision:** SDK hooks (SessionStart/SessionEnd) instead of wrapping execute()

**Rationale:**
- Cleaner separation of concerns
- BaseAgent handles Convex, subclasses focus on domain logic
- Automatic state tracking without manual calls
- Error resilience (Convex errors don't crash agents)

---

## Future Enhancements

These patterns can be extended with:

- **Parallel subagent execution**: Execute independent steps concurrently
- **Workflow resumption**: Resume from checkpoints after interruption
- **Custom agent pipelines**: Not just Planner→Coder→Reviewer
- **Artifact versioning**: Track history of workflow runs
- **Workflow visualization UI**: Real-time pipeline monitoring
- **Dynamic agent selection**: Choose agents based on task characteristics

---

## See Also

- **Agent Framework:** `src/agents/README.md`
- **Orchestration:** `src/orchestrator/SequentialOrchestrator.ts`
- **Examples:** `examples/README.md`
- **Type Definitions:** `src/types/`
- **Project Context:** `.planning/PROJECT.md`
