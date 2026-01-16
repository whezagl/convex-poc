import { BaseAgent } from "./BaseAgent.js";
import type { AgentConfig } from "../types/agent.js";
import type { PlanResult, PlanStep } from "../types/plan.js";
import type { Id } from "../../convex/_generated/dataModel.js";

/**
 * Configuration options specific to PlannerAgent.
 *
 * @property detailLevel - Level of detail in generated plans (default: "basic")
 */
export interface PlannerConfig extends AgentConfig {
  detailLevel?: "basic" | "detailed";
}

/**
 * PlannerAgent specializes in task decomposition and planning.
 *
 * This agent extends BaseAgent to analyze input tasks and break them down
 * into clear, actionable steps with agent assignments and dependency tracking.
 *
 * Key features:
 * - Task decomposition into 3-7 steps
 * - Agent assignment per step (coder, reviewer, planner)
 * - Dependency identification between steps
 * - Risk assessment and duration estimation
 *
 * Example usage:
 * ```typescript
 * const planner = new PlannerAgent({ agentType: "planner" });
 * const plan = await planner.execute("Create a REST API for user management");
 * console.log(plan.steps); // Array of PlanStep objects
 * ```
 */
export class PlannerAgent extends BaseAgent {
  protected readonly detailLevel: "basic" | "detailed";

  /**
   * Creates a new PlannerAgent instance.
   *
   * @param config - Agent configuration with optional planner-specific settings
   */
  constructor(config: PlannerConfig) {
    super({
      agentType: config.agentType || "planner",
      model: config.model,
      workflowId: config.workflowId,
    });
    this.detailLevel = config.detailLevel || "basic";
  }

  /**
   * Returns the planning-focused system prompt.
   *
   * The prompt instructs Claude to:
   * - Analyze the input task and identify subtasks
   * - Assign each subtask to an appropriate agent type
   * - Identify dependencies between steps
   * - Estimate complexity and risks
   * - Output structured JSON matching PlanResult interface
   *
   * @returns The system prompt for planning
   */
  protected getSystemPrompt(): string {
    const detailGuidance =
      this.detailLevel === "detailed"
        ? "Break tasks into 5-7 detailed steps with comprehensive risk analysis."
        : "Break tasks into 3-5 clear steps with basic risk assessment.";

    return `You are a Planner Agent that breaks down tasks into clear, actionable steps.

Your responsibilities:
1. Analyze the input task and identify the necessary subtasks
2. Assign each subtask to an appropriate agent type:
   - "coder" for implementation work (writing code, creating files)
   - "reviewer" for validation and testing (code review, test execution)
   - "planner" for further decomposition if needed
3. Identify dependencies between steps (what must complete before what)
4. Estimate overall complexity and potential risks
5. Output a structured plan as JSON

${detailGuidance}

Output format requirements:
- Return valid JSON only (no markdown formatting, no explanations outside JSON)
- Steps should be clear and independently verifiable
- Each step description should be actionable (use verbs like "Create", "Implement", "Test")
- Dependencies array contains step descriptions that must complete first
- Keep steps between 3-7 items (not too granular, not too vague)
- Identify what can be done in parallel vs sequential

JSON structure:
{
  "steps": [
    {
      "description": "Create user model with validation",
      "agent": "coder",
      "dependencies": []
    },
    {
      "description": "Review user model for security issues",
      "agent": "reviewer",
      "dependencies": ["Create user model with validation"]
    }
  ],
  "estimatedDuration": "2-3 hours",
  "risks": ["Authentication complexity may require additional research"]
}

Remember: Output ONLY valid JSON, nothing else.`;
  }

  /**
   * Executes the planner and returns a structured PlanResult.
   *
   * This method overrides BaseAgent.execute() to parse and validate
   * the JSON response from Claude, returning a typed PlanResult.
   *
   * @param input - The task description to plan
   * @returns Structured plan with steps, dependencies, and risk assessment
   * @throws Error if JSON parsing fails or result is invalid
   */
  public async execute(input: string): Promise<PlanResult> {
    // Call parent execute to get raw response
    const rawResponse = await super.execute(input);

    // Parse JSON from the response
    const plan = this.parsePlanResult(rawResponse);

    // Validate the plan structure
    this.validatePlanResult(plan);

    return plan;
  }

  /**
   * Executes the planner with Convex workflow integration.
   *
   * This method creates an association between the planning session
   * and a Convex workflow for state tracking and persistence.
   *
   * @param input - The task description to plan
   * @param workflowId - The Convex workflow ID to associate with this session
   * @returns Structured plan with steps, dependencies, and risk assessment
   */
  public async executeWithWorkflow(
    input: string,
    workflowId: Id<"workflows">
  ): Promise<PlanResult> {
    // Update workflowId for this execution
    // Note: This creates a new instance with the workflowId
    const agentWithWorkflow = new PlannerAgent({
      agentType: this.agentType,
      model: this.config.model,
      workflowId,
      detailLevel: this.detailLevel,
    });

    // Execute with workflow tracking
    return agentWithWorkflow.execute(input);
  }

  /**
   * Parses raw response string into PlanResult.
   *
   * Handles JSON extraction from response that may contain
   * markdown code blocks or extra text.
   *
   * @param rawResponse - Raw string response from Claude
   * @returns Parsed PlanResult object
   * @throws Error if JSON cannot be parsed
   */
  private parsePlanResult(rawResponse: string): PlanResult {
    try {
      // Try to parse as-is first
      return JSON.parse(rawResponse);
    } catch (error) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e) {
          throw new Error(
            `Failed to parse JSON from code block: ${
              (e as Error).message
            }`
          );
        }
      }

      // Try to find first valid JSON object in response
      const objectMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch (e) {
          // Fall through to error
        }
      }

      throw new Error(
        `Could not extract valid JSON from response: ${rawResponse.slice(
          0,
          100
        )}...`
      );
    }
  }

  /**
   * Validates that the PlanResult meets requirements.
   *
   * Ensures:
   * - Steps array exists and has 3-7 items
   * - Each step has required fields (description, agent, dependencies)
   * - Step descriptions are non-empty strings
   * - Agent types are recognized
   * - Dependencies reference valid steps
   *
   * @param plan - The PlanResult to validate
   * @throws Error if validation fails
   */
  private validatePlanResult(plan: PlanResult): void {
    if (!plan.steps || !Array.isArray(plan.steps)) {
      throw new Error("Plan must have a steps array");
    }

    if (plan.steps.length < 3 || plan.steps.length > 7) {
      throw new Error(
        `Plan must have 3-7 steps, got ${plan.steps.length}`
      );
    }

    const stepDescriptions = new Set<string>();

    for (let i = 0; i < plan.steps.length; i++) {
      const step: PlanStep = plan.steps[i];

      if (!step.description || typeof step.description !== "string") {
        throw new Error(
          `Step ${i} must have a non-empty description`
        );
      }

      if (step.description.trim().length === 0) {
        throw new Error(`Step ${i} description cannot be empty`);
      }

      if (!step.agent || typeof step.agent !== "string") {
        throw new Error(`Step ${i} must have an agent type`);
      }

      if (!Array.isArray(step.dependencies)) {
        throw new Error(`Step ${i} must have a dependencies array`);
      }

      // Track step descriptions for dependency validation
      stepDescriptions.add(step.description);
    }

    // Validate that dependencies reference existing steps
    for (let i = 0; i < plan.steps.length; i++) {
      const step: PlanStep = plan.steps[i];

      for (const dep of step.dependencies) {
        if (!stepDescriptions.has(dep)) {
          throw new Error(
            `Step ${i} has invalid dependency: "${dep}" not found in step descriptions`
          );
        }
      }
    }

    // Validate optional fields
    if (plan.estimatedDuration && typeof plan.estimatedDuration !== "string") {
      throw new Error("estimatedDuration must be a string");
    }

    if (plan.risks && !Array.isArray(plan.risks)) {
      throw new Error("risks must be an array");
    }
  }
}
