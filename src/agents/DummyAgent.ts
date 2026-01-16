import { BaseAgent } from "./BaseAgent.js";
import type { AgentConfig } from "../types/agent.js";

/**
 * DummyAgent - A simple test agent that extends BaseAgent.
 *
 * Purpose: Proves that BaseAgent extension pattern works correctly.
 * Behavior: Responds with a confirmation message echoing the input.
 *
 * This agent is intentionally minimal - its only job is to demonstrate
 * that the BaseAgent foundation is solid and can be extended.
 */
export class DummyAgent extends BaseAgent {
  /**
   * Creates a new DummyAgent instance.
   *
   * @param config - Agent configuration
   */
  constructor(config: AgentConfig) {
    super(config);
  }

  /**
   * Returns the system prompt for DummyAgent.
   *
   * @returns The system prompt string
   */
  protected getSystemPrompt(): string {
    return (
      "You are a simple test agent. " +
      "When you receive input, respond with 'Dummy agent received: [input]' " +
      "where [input] is the exact input you received."
    );
  }
}
