# Multi-Agent Workflow Examples

This directory contains examples demonstrating the SequentialOrchestrator multi-agent workflow system.

## Overview

The SequentialOrchestrator coordinates a three-agent pipeline:

```
PlannerAgent → CoderAgent → ReviewerAgent
```

Each agent produces a JSON artifact that can be inspected for debugging and validation:

1. **plan.json** - Task decomposition with execution steps
2. **code.json** - File changes and implementation details
3. **review.json** - Validation feedback with issues and approval status

## Examples

### 1. Real-World Example: Email Validation Utility

**File:** `real-example.ts`

A complete demonstration showing how to execute a practical coding task through the multi-agent workflow.

**Task:** Create a TypeScript utility function for validating email addresses with regex

**Features demonstrated:**
- Concrete task definition with requirements
- Sequential workflow execution
- Artifact inspection and verification
- Expected output structure

**To run:**
```bash
# Step 1: Set up API credentials
export ANTHROPIC_API_KEY=your_key_here

# Step 2: Uncomment the executeWorkflow() call in real-example.ts
# (The example is commented out by default to prevent accidental API calls)

# Step 3: Run the example
npx tsx examples/real-example.ts

# Step 4: Verify the artifacts
npx tsx examples/verify-output.ts ./workspace-email-validator
```

### 2. Verification Utility

**File:** `verify-output.ts`

A utility script for validating and displaying workflow artifacts.

**Usage:**
```bash
npx tsx examples/verify-output.ts <workspace-path>
```

**What it does:**
- Validates JSON structure of plan.json, code.json, and review.json
- Displays formatted summaries of each artifact
- Shows overall workflow status and issues found
- Lists all files in the workspace directory

**Example output:**
```
╔═══════════════════════════════════════════════════════════╗
║  Workflow Artifact Verification                           ║
╚═══════════════════════════════════════════════════════════╝

Workspace: ./workspace-email-validator

Validating artifacts:
─────────────────────────────────────────────────────────────
✓ plan.json (valid)
✓ code.json (valid)
✓ review.json (valid)

┌─ Plan Artifact (plan.json)
│
│  Steps defined: 4
│
│  1. Create src/utils directory structure
│     Agent: coder
│  2. Implement validateEmail function with regex pattern
│     Agent: coder
│     Depends on: Create src/utils directory structure
│  ...

✅ Workflow completed successfully with no issues!
```

### 3. Expected Artifacts

**Directory:** `expected-artifacts/`

Contains example JSON files showing the expected structure of workflow artifacts:

- `plan.json.example` - Expected PlannerAgent output
- `code.json.example` - Expected CoderAgent output
- `review.json.example` - Expected ReviewerAgent output

Use these files to understand the artifact format and validate your own workflow outputs.

## Prerequisites

### Required

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **npm** or **yarn**
   ```bash
   npm --version
   ```

3. **Anthropic API Key**
   - Get your key from: https://console.anthropic.com/
   - Set as environment variable:
     ```bash
     export ANTHROPIC_API_KEY=your_key_here
     ```

### Optional (for Convex tracking)

4. **Convex Backend**
   ```bash
   # Install Convex CLI
   npm install -g convex

   # Start development backend
   npx convex dev
   ```

   > **Note:** Convex is optional. The workflow works without it for local development.

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd convex-poc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

## Step-by-Step Execution Guide

### Running the Email Validation Example

#### Step 1: Set up environment

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

#### Step 2: Enable execution in the example file

The example is commented out by default. Edit `examples/real-example.ts` and uncomment the executeWorkflow() call:

```typescript
// Find this section (around line 185):
// UNCOMMENT BELOW TO EXECUTE FOR REAL:
/*

// Remove the /* and */ to enable execution:
try {
  console.log("Starting workflow execution...\n");
  const result: WorkflowResult = await orchestrator.executeWorkflow(context);
  // ... rest of the code
}
```

#### Step 3: Run the example

```bash
npx tsx examples/real-example.ts
```

#### Step 4: Observe the workflow

You'll see output like:

```
=== Multi-Agent Workflow: Email Validation Utility ===

Task Definition:
─────────────────────────────────────────────────────────────
Create a TypeScript utility function for validating email addresses...
─────────────────────────────────────────────────────────────

Configuration:
  Workspace: ./workspace-email-validator
  Continue on error: false
  Convex tracking: disabled

Starting workflow execution...

[Orchestrator] Step 1: Planning...
[Orchestrator] Planning completed in 2451ms

[Orchestrator] Step 2: Coding...
[Orchestrator] Coding completed in 3827ms

[Orchestrator] Step 3: Review...
[Orchestrator] Review completed in 1923ms
```

#### Step 5: Verify the artifacts

```bash
npx tsx examples/verify-output.ts ./workspace-email-validator
```

#### Step 6: Inspect generated files

```bash
# View the plan
cat ./workspace-email-validator/plan.json

# View the code changes
cat ./workspace-email-validator/code.json

# View the review
cat ./workspace-email-validator/review.json
```

## Expected Output

### plan.json Structure

```json
{
  "steps": [
    {
      "description": "Create src/utils directory structure",
      "agent": "coder",
      "dependencies": []
    },
    {
      "description": "Implement validateEmail function with regex pattern",
      "agent": "coder",
      "dependencies": ["Create src/utils directory structure"]
    }
  ],
  "estimatedDuration": "30-45 minutes",
  "risks": ["Email regex may be too strict or too lenient"]
}
```

### code.json Structure

```json
{
  "changes": [
    {
      "path": "src/utils/emailValidator.ts",
      "content": "...",
      "operation": "create"
    }
  ],
  "summary": "Created validateEmail utility function...",
  "filesModified": ["src/utils/emailValidator.ts"]
}
```

### review.json Structure

```json
{
  "issues": [],
  "summary": "Email validation utility meets all requirements...",
  "overallStatus": "approved",
  "filesReviewed": ["src/utils/emailValidator.ts"]
}
```

## Troubleshooting

### Issue: "Invalid API key" error

**Solution:**
- Verify your API key is set correctly:
  ```bash
  echo $ANTHROPIC_API_KEY
  ```
- Ensure the key starts with `sk-ant-`
- Check that the key has available credits at: https://console.anthropic.com/

### Issue: "Failed to connect to Convex" error

**Solution:**
- Convex is optional. If you're not using it, remove `workflowId` from the WorkflowContext
- Or start the Convex backend:
  ```bash
  npx convex dev
  ```

### Issue: "Permission denied" when creating workspace

**Solution:**
- Check directory permissions:
  ```bash
  ls -la .
  ```
- Ensure the workspace directory is writable
- Try a different workspace path:
  ```typescript
  const config: ExecuteWorkflowConfig = {
    workspace: "/tmp/workspace-email-validator",
  };
  ```

### Issue: "Request timeout" during execution

**Solution:**
- The task may be too complex for a single API call
- Try breaking it into smaller, more specific tasks
- Check your network connection
- Verify API status at: https://status.anthropic.com/

### Issue: Empty or malformed artifacts

**Solution:**
- Check the agent logs in the console output
- Run the verification utility to see specific errors:
  ```bash
  npx tsx examples/verify-output.ts ./workspace-email-validator
  ```
- Compare with expected artifacts in `expected-artifacts/` directory

## How to Verify Workflow Success

A successful workflow should have:

1. **All artifacts created**
   ```bash
   ls ./workspace-email-validator/
   # Should show: plan.json, code.json, review.json
   ```

2. **Valid JSON structure**
   ```bash
   npx tsx examples/verify-output.ts ./workspace-email-validator
   # Should show: ✓ plan.json (valid), ✓ code.json (valid), ✓ review.json (valid)
   ```

3. **Review status: approved**
   ```bash
   cat ./workspace-email-validator/review.json | grep overallStatus
   # Should show: "overallStatus": "approved"
   ```

4. **No critical issues**
   ```bash
   cat ./workspace-email-validator/review.json | grep '"severity":"error"'
   # Should return empty (no errors)
   ```

## Advanced Usage

### Using continueOnError

Set `continueOnError: true` to allow the workflow to continue after non-fatal errors:

```typescript
const config: ExecuteWorkflowConfig = {
  workspace: "./workspace-resilient",
  continueOnError: true,  // Reviewer runs even if Coder fails
};
```

This is useful for:
- Getting feedback on partial work
- Debugging failures
- Understanding why a step failed

### Convex Integration

Track workflow state in Convex for persistence:

```typescript
import { v4 as uuidv4 } from "uuid";

const workflowId = uuidv4() as any; // In real app, get from Convex

const context: WorkflowContext = {
  task,
  workspace: "./workspace-convex",
  workflowId,  // Enables Convex tracking
};
```

Benefits:
- Persistent workflow state across restarts
- Queryable workflow history
- Multi-session support

## Customizing Examples

### Creating Your Own Task

1. Copy `real-example.ts` as a template
2. Modify the task description:
   ```typescript
   const task = `Create a REST API endpoint for user authentication
   Requirements:
   - Endpoint: POST /api/auth/login
   - Input: { email, password }
   - Output: { token, user }
   ...`;
   ```
3. Adjust workspace path
4. Run with your new task

### Understanding Agent Roles

- **PlannerAgent**: Decomposes tasks into actionable steps
  - Input: Task description
  - Output: plan.json (steps, dependencies, duration estimate)

- **CoderAgent**: Implements code based on the plan
  - Input: Task + plan.json
  - Output: code.json (file changes, summary)

- **ReviewerAgent**: Validates implementation
  - Input: Task + plan.json + code.json
  - Output: review.json (issues, approval status)

## Additional Resources

- **SequentialOrchestrator Documentation:** `src/orchestrator/SequentialOrchestrator.ts`
- **Type Definitions:** `src/types/workflow.ts`
- **Agent Implementations:** `src/agents/`
- **State Management:** `src/orchestrator/state.ts`

## Support

For issues or questions:
1. Check this README's troubleshooting section
2. Review the expected artifacts in `expected-artifacts/`
3. Run the verification utility to diagnose problems
4. Check the console output for error messages
