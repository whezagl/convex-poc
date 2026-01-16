# Plan: Test Convex Integration with GLM-4.7 from z.ai

**Purpose:** Verify Phase 10 Convex deployment works end-to-end using GLM-4.7 instead of Anthropic API

**Research Summary:**

## GLM-4.7 / z.ai Integration

### Key Findings

**z.ai API is OpenAI-Compatible:**
- Base URL: `https://api.z.ai/api/paas/v4/`
- Model: `glm-4.7`
- Authentication: `Authorization: Bearer YOUR_API_KEY`
- **Can use standard `openai` npm package with custom baseURL**

### Configuration for Node.js/TypeScript

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.ZAI_API_KEY,  // z.ai API key
  baseURL: "https://api.z.ai/api/paas/v4/"
});

const completion = await client.chat.completions.create({
  model: "glm-4.7",
  messages: [
    { role: "system", content: "You are a helpful AI assistant." },
    { role: "user", content: "Hello!" }
  ]
});
```

### Current Architecture Challenge

**Current Setup:**
- Uses `@anthropic-ai/claude-agent-sdk` (Anthropic-specific)
- BaseAgent extends Claude Agent SDK hooks
- SequentialOrchestrator uses Anthropic SDK patterns

**Integration Options:**

## Option 1: Adapter Pattern (Recommended for Testing)
Create a lightweight adapter to use OpenAI SDK with z.ai while keeping current architecture:

**New File:** `src/llm/zai-adapter.ts`
```typescript
import OpenAI from "openai";

export class ZAIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.ZAI_API_KEY || "",
      baseURL: "https://api.z.ai/api/paas/v4/"
    });
  }

  async query(prompt: string, systemPrompt?: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: "glm-4.7",
      messages: [
        { role: "system", content: systemPrompt || "You are a helpful assistant." },
        { role: "user", content: prompt }
      ]
    });
    return completion.choices[0].message.content || "";
  }
}
```

**New Test File:** `examples/test-with-zai.ts`
- Simple test that uses ZAIClient directly
- Creates workflow and sessions in Convex
- Verifies end-to-end integration

## Option 2: Minimal Integration Test
Create a standalone test that verifies Convex works without agents:

**Test:** Direct Convex mutations
```typescript
import { convex } from "./src/convex/client.js";

async function testConvexWithZAI() {
  // 1. Create workflow
  const workflow = await convex.mutations.workflows.createWorkflow({
    task: "Test GLM-4.7 integration",
    status: "in-progress",
  });

  // 2. Simulate agent session
  const session = await convex.mutations.agents.createAgentSession({
    agentType: "planner",
    input: "Create email validation function",
    workflowId: workflow,
  });

  // 3. Call z.ai API (outside of Convex for now)
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({
    apiKey: process.env.ZAI_API_KEY,
    baseURL: "https://api.z.ai/api/paas/v4/"
  });

  const response = await client.chat.completions.create({
    model: "glm-4.7",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Create a simple email validation function in TypeScript" }
    ]
  });

  // 4. Update session with result
  await convex.mutations.agents.updateAgentSession({
    sessionId: session,
    status: "completed",
    output: response.choices[0].message.content || "",
  });

  // 5. Update workflow
  await convex.mutations.workflows.updateWorkflowStatus({
    workflowId: workflow,
    status: "completed",
  });

  console.log("✓ Test complete!");
  console.log("  Workflow:", workflow);
  console.log("  Session:", session);
  console.log("  Z.AI Response:", response.choices[0].message.content?.slice(0, 100));
}
```

## Option 3: Full SDK Replacement (Future Work)
Replace `@anthropic-ai/claude-agent-sdk` with OpenAI SDK:
- Requires rewriting BaseAgent hooks
- Requires rewriting SequentialOrchestrator
- Out of scope for this test

---

# Execution Plan

## Pre-Execution Setup

### 1. Install Dependencies
```bash
npm install openai
```

### 2. Set Environment Variable
```bash
# Get API key from https://platform.z.ai/
export ZAI_API_KEY="your-zai-api-key"
```

### 3. Verify Convex Backend
```bash
docker compose ps
# Expected: convex-backend and convex-dashboard running
```

## Test Execution

### Step 1: Create Test File
Create `examples/test-convex-zai.ts` with Option 2 code above

### Step 2: Run Test
```bash
npx tsx examples/test-convex-zai.ts
```

### Step 3: Verify Results

**Console Output:**
```
✓ Test complete!
  Workflow: <workflow-id>
  Session: <session-id>
  Z.AI Response: Here's a TypeScript email validation...
```

**Dashboard Verification:**
- Visit http://localhost:6791
- Check `agentSessions` table for the session
- Check `workflows` table for the workflow
- Verify output contains Z.AI response

**Convex CLI Verification:**
```bash
export CONVEX_SELF_HOSTED_URL="http://127.0.0.1:3210"
export CONVEX_SELF_HOSTED_ADMIN_KEY="convex-self-hosted|..."

# Query the workflow (if Convex supports querying)
npx convex dashboard
```

## Success Criteria

- [ ] `openai` package installed
- [ ] `ZAI_API_KEY` set
- [ ] Test runs without errors
- [ ] Workflow created in Convex
- [ ] Agent session created and linked to workflow
- [ ] Z.AI API returns response
- [ ] Session updated with Z.AI response
- [ ] Dashboard shows workflow and session records
- [ ] Output contains actual GLM-4.7 response content

---

# Architecture Decision Point

**For Future:** If GLM-4.7 integration becomes permanent, consider:

1. **Create abstraction layer:** `LLMProvider` interface with implementations for Anthropic and z.ai
2. **Use OpenAI SDK as base:** Since z.ai is OpenAI-compatible, easier to maintain
3. **Feature parity:** Ensure hooks and state management work the same way

**For Now:** This test verifies Convex works regardless of which LLM provider we use.
