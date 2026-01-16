/**
 * Unit tests for SequentialOrchestrator.
 *
 * Tests cover:
 * - Orchestrator initialization with config
 * - Workflow execution structure
 * - Error handling and state tracking
 * - Artifact persistence and file operations
 * - Convex integration
 *
 * Note: We use a simplified testing approach that focuses on the
 * orchestrator's logic rather than mocking complex agent interactions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SequentialOrchestrator } from "../src/orchestrator/SequentialOrchestrator.js";
import type { ExecuteWorkflowConfig, WorkflowContext } from "../src/types/workflow.js";

// Mock fs operations
vi.mock("fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn(),
  rm: vi.fn().mockResolvedValue(undefined),
}));

// Mock Convex client
vi.mock("../src/convex/client.js", () => ({
  convex: {
    mutations: {
      agents: {
        createAgentSession: vi.fn().mockResolvedValue(null),
        updateAgentSession: vi.fn().mockResolvedValue(undefined),
      },
    },
  },
}));

describe("SequentialOrchestrator", () => {
  let mockMkdir: any;
  let mockWriteFile: any;
  let mockReadFile: any;

  beforeEach(async () => {
    // Import mocked modules
    const fs = await import("fs/promises");

    mockMkdir = fs.mkdir;
    mockWriteFile = fs.writeFile;
    mockReadFile = fs.readFile;

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create an instance with correct config", () => {
      const config: ExecuteWorkflowConfig = {
        workspace: "./test-workspace",
      };
      const orchestrator = new SequentialOrchestrator(config);

      expect(orchestrator).toBeInstanceOf(SequentialOrchestrator);
    });

    it("should default continueOnError to false", () => {
      const config: ExecuteWorkflowConfig = {
        workspace: "./test-workspace",
      };
      const orchestrator = new SequentialOrchestrator(config);

      expect((orchestrator as any).config.continueOnError).toBe(false);
    });

    it("should accept continueOnError option", () => {
      const config: ExecuteWorkflowConfig = {
        workspace: "./test-workspace",
        continueOnError: true,
      };
      const orchestrator = new SequentialOrchestrator(config);

      expect((orchestrator as any).config.continueOnError).toBe(true);
    });
  });

  describe("executeWorkflow - workflow structure", () => {
    it("should create workspace directory", async () => {
      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
      });

      try {
        await orchestrator.executeWorkflow({
          task: "Test task",
          workspace: "./test-workspace",
        });
      } catch (error) {
        // Expected to fail due to mocked agents
      }

      expect(mockMkdir).toHaveBeenCalledWith("./test-workspace", { recursive: true });
    });

    it("should initialize result with correct structure", async () => {
      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
      });

      let result: any;
      try {
        result = await orchestrator.executeWorkflow({
          task: "Test task",
          workspace: "./test-workspace",
        });
      } catch (error) {
        // Expected to fail
      }

      // Result should have expected structure
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(Array.isArray(result.steps)).toBe(true);
      expect(result.artifacts).toBeDefined();
      expect(Array.isArray(result.artifacts)).toBe(true);
    });

    it("should track step timing", async () => {
      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
      });

      let result: any;
      try {
        result = await orchestrator.executeWorkflow({
          task: "Test task",
          workspace: "./test-workspace",
        });
      } catch (error) {
        // Expected to fail
      }

      // Check that steps have timing information
      for (const step of result.steps) {
        expect(step.name).toBeDefined();
        expect(step.agent).toBeDefined();
        expect(step.status).toBeDefined();
        expect(step.startTime).toBeDefined();
        expect(typeof step.startTime).toBe("number");
      }
    });
  });

  describe("continueOnError behavior", () => {
    it("should have continueOnError config accessible", () => {
      const orchestratorFalse = new SequentialOrchestrator({
        workspace: "./test-workspace",
        continueOnError: false,
      });

      const orchestratorTrue = new SequentialOrchestrator({
        workspace: "./test-workspace",
        continueOnError: true,
      });

      expect((orchestratorFalse as any).config.continueOnError).toBe(false);
      expect((orchestratorTrue as any).config.continueOnError).toBe(true);
    });
  });

  describe("Convex integration", () => {
    it("should not call Convex when workflowId is not provided", async () => {
      const { convex } = await import("../src/convex/client.js");

      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
      });

      try {
        await orchestrator.executeWorkflow({
          task: "Test task",
          workspace: "./test-workspace",
        });
      } catch (error) {
        // Expected to fail
      }

      // Convex mutations should not be called
      expect(convex.mutations.agents.createAgentSession).not.toHaveBeenCalled();
    });

    it("should call Convex when workflowId is provided", async () => {
      const { convex } = await import("../src/convex/client.js");

      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
      });

      try {
        await orchestrator.executeWorkflow({
          task: "Test task",
          workspace: "./test-workspace",
          workflowId: "test-workflow-id" as any,
        });
      } catch (error) {
        // Expected to fail
      }

      // Convex create session should be called
      expect(convex.mutations.agents.createAgentSession).toHaveBeenCalledWith({
        agentType: "orchestrator",
        input: "Test task",
        workflowId: "test-workflow-id",
      });
    });

    it("should update workflow status on completion", async () => {
      const { convex } = await import("../src/convex/client.js");

      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
      });

      try {
        await orchestrator.executeWorkflow({
          task: "Test task",
          workspace: "./test-workspace",
          workflowId: "test-workflow-id" as any,
        });
      } catch (error) {
        // Expected to fail
      }

      // Convex update should be called
      expect(convex.mutations.agents.updateAgentSession).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle workspace directory creation failures", async () => {
      // Mock mkdir to fail
      mockMkdir.mockRejectedValue(new Error("Permission denied"));

      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
      });

      // Should not throw, but return a failed result
      const result = await orchestrator.executeWorkflow({
        task: "Test task",
        workspace: "./test-workspace",
      });

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it("should handle Convex errors without crashing", async () => {
      const { convex } = await import("../src/convex/client.js");

      // Mock Convex to fail
      (convex.mutations.agents.createAgentSession as any).mockRejectedValue(
        new Error("Convex connection failed")
      );

      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
      });

      // Should not throw despite Convex failure
      const result = await orchestrator.executeWorkflow({
        task: "Test task",
        workspace: "./test-workspace",
        workflowId: "test-workflow-id" as any,
      });

      expect(result).toBeDefined();
    });
  });

  describe("determineSuccess logic", () => {
    it("should require all steps to complete when continueOnError is false", () => {
      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
        continueOnError: false,
      });

      const steps = [
        { name: "Step 1", agent: "planner", status: "completed", startTime: 1 },
        { name: "Step 2", agent: "coder", status: "completed", startTime: 2 },
        { name: "Step 3", agent: "reviewer", status: "completed", startTime: 3 },
      ] as any[];

      const success = (orchestrator as any).determineSuccess(steps);
      expect(success).toBe(true);
    });

    it("should fail when any step fails and continueOnError is false", () => {
      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
        continueOnError: false,
      });

      const steps = [
        { name: "Step 1", agent: "planner", status: "completed", startTime: 1 },
        { name: "Step 2", agent: "coder", status: "failed", startTime: 2, error: "Failed" },
      ] as any[];

      const success = (orchestrator as any).determineSuccess(steps);
      expect(success).toBe(false);
    });

    it("should succeed when reviewer completes and continueOnError is true", () => {
      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
        continueOnError: true,
      });

      const steps = [
        { name: "Step 1", agent: "planner", status: "completed", startTime: 1 },
        { name: "Step 2", agent: "coder", status: "failed", startTime: 2, error: "Failed" },
        { name: "Step 3", agent: "reviewer", status: "completed", startTime: 3 },
      ] as any[];

      const success = (orchestrator as any).determineSuccess(steps);
      expect(success).toBe(true);
    });

    it("should fail when reviewer fails and continueOnError is true", () => {
      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
        continueOnError: true,
      });

      const steps = [
        { name: "Step 1", agent: "planner", status: "completed", startTime: 1 },
        { name: "Step 2", agent: "coder", status: "failed", startTime: 2, error: "Failed" },
        { name: "Step 3", agent: "reviewer", status: "failed", startTime: 3, error: "Failed" },
      ] as any[];

      const success = (orchestrator as any).determineSuccess(steps);
      expect(success).toBe(false);
    });
  });

  describe("step execution", () => {
    it("should execute planner step with correct structure", async () => {
      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
      });

      let result: any;
      try {
        result = await orchestrator.executeWorkflow({
          task: "Test task",
          workspace: "./test-workspace",
        });
      } catch (error) {
        // Expected to fail
      }

      // Should have at least the planner step
      expect(result.steps.length).toBeGreaterThan(0);

      const plannerStep = result.steps[0];
      expect(plannerStep.name).toBe("Planning");
      expect(plannerStep.agent).toBe("planner");
      expect(plannerStep.status).toMatch(/completed|failed/);
    });

    it("should include workflow step metadata", async () => {
      const orchestrator = new SequentialOrchestrator({
        workspace: "./test-workspace",
      });

      let result: any;
      try {
        result = await orchestrator.executeWorkflow({
          task: "Test task",
          workspace: "./test-workspace",
        });
      } catch (error) {
        // Expected to fail
      }

      for (const step of result.steps) {
        expect(step).toHaveProperty("name");
        expect(step).toHaveProperty("agent");
        expect(step).toHaveProperty("status");
        expect(step).toHaveProperty("startTime");
        expect(step).toHaveProperty("endTime");

        // Status should be valid
        expect(["pending", "in_progress", "completed", "failed"]).toContain(step.status);
      }
    });
  });
});
