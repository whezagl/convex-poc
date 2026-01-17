/**
 * AgentFactory tests
 *
 * Tests the factory pattern for creating agents based on BASE_AGENT environment variable.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AgentFactory } from "./AgentFactory.js";
import { CoderAgent } from "./CoderAgent.js";
import { GLMCoderAgent } from "./GLMCoderAgent.js";
import { PlannerAgent } from "./PlannerAgent.js";
import { GLMPlannerAgent } from "./GLMPlannerAgent.js";
import { ReviewerAgent } from "./ReviewerAgent.js";
import { GLMReviewerAgent } from "./GLMReviewerAgent.js";

describe("AgentFactory", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Save original BASE_AGENT value
    originalEnv = process.env.BASE_AGENT;
  });

  afterEach(() => {
    // Restore original BASE_AGENT value
    if (originalEnv !== undefined) {
      process.env.BASE_AGENT = originalEnv;
    } else {
      delete process.env.BASE_AGENT;
    }
  });

  describe("getDefaultProvider", () => {
    it("defaults to 'claude' when BASE_AGENT is not set", () => {
      delete process.env.BASE_AGENT;
      expect(AgentFactory.getCurrentProvider()).toBe("claude");
    });

    it("returns 'claude' when BASE_AGENT is 'claude'", () => {
      process.env.BASE_AGENT = "claude";
      expect(AgentFactory.getCurrentProvider()).toBe("claude");
    });

    it("returns 'glm' when BASE_AGENT is 'glm'", () => {
      process.env.BASE_AGENT = "glm";
      expect(AgentFactory.getCurrentProvider()).toBe("glm");
    });

    it("defaults to 'claude' when BASE_AGENT is invalid", () => {
      process.env.BASE_AGENT = "invalid" as any;
      expect(AgentFactory.getCurrentProvider()).toBe("claude");
    });
  });

  describe("createCoder", () => {
    it("creates CoderAgent when BASE_AGENT is 'claude'", () => {
      process.env.BASE_AGENT = "claude";
      const coder = AgentFactory.createCoder({ agentType: "coder" });
      expect(coder).toBeInstanceOf(CoderAgent);
    });

    it("creates CoderAgent when BASE_AGENT is not set", () => {
      delete process.env.BASE_AGENT;
      const coder = AgentFactory.createCoder({ agentType: "coder" });
      expect(coder).toBeInstanceOf(CoderAgent);
    });

    it("creates GLMCoderAgent when BASE_AGENT is 'glm'", () => {
      process.env.BASE_AGENT = "glm";
      // Note: GLMCoderAgent requires ZAI_API_KEY, so we mock it
      process.env.ZAI_API_KEY = "test-key";
      const coder = AgentFactory.createCoder({ agentType: "coder" });
      expect(coder).toBeInstanceOf(GLMCoderAgent);
    });

    it("respects provider override to 'glm'", () => {
      process.env.BASE_AGENT = "claude";
      process.env.ZAI_API_KEY = "test-key";
      const coder = AgentFactory.createCoder({
        agentType: "coder",
        provider: "glm",
      });
      expect(coder).toBeInstanceOf(GLMCoderAgent);
    });

    it("respects provider override to 'claude'", () => {
      process.env.BASE_AGENT = "glm";
      const coder = AgentFactory.createCoder({
        agentType: "coder",
        provider: "claude",
      });
      expect(coder).toBeInstanceOf(CoderAgent);
    });

    it("passes configuration to the agent", () => {
      process.env.BASE_AGENT = "claude";
      const coder = AgentFactory.createCoder({
        agentType: "coder",
        maxChanges: 5,
      });
      expect(coder).toBeInstanceOf(CoderAgent);
      // The maxChanges should be passed through
    });
  });

  describe("createPlanner", () => {
    it("creates PlannerAgent when BASE_AGENT is 'claude'", () => {
      process.env.BASE_AGENT = "claude";
      const planner = AgentFactory.createPlanner({ agentType: "planner" });
      expect(planner).toBeInstanceOf(PlannerAgent);
    });

    it("creates PlannerAgent when BASE_AGENT is not set", () => {
      delete process.env.BASE_AGENT;
      const planner = AgentFactory.createPlanner({ agentType: "planner" });
      expect(planner).toBeInstanceOf(PlannerAgent);
    });

    it("creates GLMPlannerAgent when BASE_AGENT is 'glm'", () => {
      process.env.BASE_AGENT = "glm";
      process.env.ZAI_API_KEY = "test-key";
      const planner = AgentFactory.createPlanner({ agentType: "planner" });
      expect(planner).toBeInstanceOf(GLMPlannerAgent);
    });

    it("respects provider override to 'glm'", () => {
      process.env.BASE_AGENT = "claude";
      process.env.ZAI_API_KEY = "test-key";
      const planner = AgentFactory.createPlanner({
        agentType: "planner",
        provider: "glm",
      });
      expect(planner).toBeInstanceOf(GLMPlannerAgent);
    });

    it("respects provider override to 'claude'", () => {
      process.env.BASE_AGENT = "glm";
      const planner = AgentFactory.createPlanner({
        agentType: "planner",
        provider: "claude",
      });
      expect(planner).toBeInstanceOf(PlannerAgent);
    });

    it("passes configuration to the agent", () => {
      process.env.BASE_AGENT = "claude";
      const planner = AgentFactory.createPlanner({
        agentType: "planner",
        detailLevel: "detailed",
      });
      expect(planner).toBeInstanceOf(PlannerAgent);
    });
  });

  describe("createReviewer", () => {
    it("creates ReviewerAgent when BASE_AGENT is 'claude'", () => {
      process.env.BASE_AGENT = "claude";
      const reviewer = AgentFactory.createReviewer({ agentType: "reviewer" });
      expect(reviewer).toBeInstanceOf(ReviewerAgent);
    });

    it("creates ReviewerAgent when BASE_AGENT is not set", () => {
      delete process.env.BASE_AGENT;
      const reviewer = AgentFactory.createReviewer({ agentType: "reviewer" });
      expect(reviewer).toBeInstanceOf(ReviewerAgent);
    });

    it("creates GLMReviewerAgent when BASE_AGENT is 'glm'", () => {
      process.env.BASE_AGENT = "glm";
      process.env.ZAI_API_KEY = "test-key";
      const reviewer = AgentFactory.createReviewer({ agentType: "reviewer" });
      expect(reviewer).toBeInstanceOf(GLMReviewerAgent);
    });

    it("respects provider override to 'glm'", () => {
      process.env.BASE_AGENT = "claude";
      process.env.ZAI_API_KEY = "test-key";
      const reviewer = AgentFactory.createReviewer({
        agentType: "reviewer",
        provider: "glm",
      });
      expect(reviewer).toBeInstanceOf(GLMReviewerAgent);
    });

    it("respects provider override to 'claude'", () => {
      process.env.BASE_AGENT = "glm";
      const reviewer = AgentFactory.createReviewer({
        agentType: "reviewer",
        provider: "claude",
      });
      expect(reviewer).toBeInstanceOf(ReviewerAgent);
    });

    it("passes configuration to the agent", () => {
      process.env.BASE_AGENT = "claude";
      const reviewer = AgentFactory.createReviewer({
        agentType: "reviewer",
        maxIssues: 10,
      });
      expect(reviewer).toBeInstanceOf(ReviewerAgent);
    });
  });

  describe("provider priority", () => {
    it("config provider takes precedence over BASE_AGENT env var", () => {
      process.env.BASE_AGENT = "claude";
      process.env.ZAI_API_KEY = "test-key";

      // Config provider should override env var
      const coder = AgentFactory.createCoder({
        agentType: "coder",
        provider: "glm",
      });
      expect(coder).toBeInstanceOf(GLMCoderAgent);

      const planner = AgentFactory.createPlanner({
        agentType: "planner",
        provider: "glm",
      });
      expect(planner).toBeInstanceOf(GLMPlannerAgent);

      const reviewer = AgentFactory.createReviewer({
        agentType: "reviewer",
        provider: "glm",
      });
      expect(reviewer).toBeInstanceOf(GLMReviewerAgent);
    });
  });
});
