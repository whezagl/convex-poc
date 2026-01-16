import { describe, it, expect } from "vitest";
import { DummyAgent, BaseAgent } from "../src/agents/index.js";
import type { AgentConfig } from "../src/types/agent.js";

/**
 * Integration tests for BaseAgent and DummyAgent.
 *
 * Note: Full integration tests with Convex backend require ISS-001 resolution.
 * For now, we test instantiation, inheritance, and prompt structure without
 * making actual Claude API calls or Convex mutations.
 */

describe("BaseAgent", () => {
  describe("constructor", () => {
    it("should create an instance with correct config", () => {
      const config: AgentConfig = {
        agentType: "test-agent",
        model: "sonnet",
      };

      // Note: We can't instantiate BaseAgent directly because it's abstract
      // So we test this via DummyAgent which extends it
      const agent = new DummyAgent(config);
      expect(agent).toBeInstanceOf(BaseAgent);
      expect(agent).toBeInstanceOf(DummyAgent);
    });

    it("should store agentType from config", () => {
      const config: AgentConfig = {
        agentType: "test-agent",
      };
      const agent = new DummyAgent(config);
      // Access protected property via type assertion for testing
      expect((agent as any).agentType).toBe("test-agent");
    });

    it("should store workflowId from config", () => {
      const config: AgentConfig = {
        agentType: "test-agent",
        // Note: workflowId would be a real Convex ID in practice
        // For testing, we use a mock ID
        workflowId: "mock-workflow-id" as any,
      };
      const agent = new DummyAgent(config);
      expect((agent as any).workflowId).toBe("mock-workflow-id");
    });
  });

  describe("getModel", () => {
    it("should return 'sonnet' by default", () => {
      const config: AgentConfig = {
        agentType: "test-agent",
      };
      const agent = new DummyAgent(config);
      expect((agent as any).getModel()).toBe("sonnet");
    });

    it("should return custom model if specified", () => {
      const config: AgentConfig = {
        agentType: "test-agent",
        model: "haiku",
      };
      const agent = new DummyAgent(config);
      expect((agent as any).getModel()).toBe("haiku");
    });
  });

  describe("getSessionId", () => {
    it("should return null initially", () => {
      const config: AgentConfig = {
        agentType: "test-agent",
      };
      const agent = new DummyAgent(config);
      expect(agent.getSessionId()).toBeNull();
    });
  });
});

describe("DummyAgent", () => {
  describe("constructor", () => {
    it("should instantiate with correct config", () => {
      const config: AgentConfig = {
        agentType: "dummy",
      };
      const agent = new DummyAgent(config);
      expect(agent).toBeInstanceOf(DummyAgent);
      expect(agent).toBeInstanceOf(BaseAgent);
    });
  });

  describe("getSystemPrompt", () => {
    it("should return the expected system prompt", () => {
      const config: AgentConfig = {
        agentType: "dummy",
      };
      const agent = new DummyAgent(config);
      const prompt = (agent as any).getSystemPrompt();

      expect(prompt).toContain("simple test agent");
      expect(prompt).toContain("Dummy agent received");
    });
  });

  describe("inheritance pattern", () => {
    it("should properly extend BaseAgent", () => {
      const config: AgentConfig = {
        agentType: "dummy",
      };
      const agent = new DummyAgent(config);

      // Verify inheritance chain
      expect(agent instanceof DummyAgent).toBe(true);
      expect(agent instanceof BaseAgent).toBe(true);

      // Verify BaseAgent methods are available
      expect(typeof agent.execute).toBe("function");
      expect(typeof agent.getSessionId).toBe("function");
    });
  });
});
