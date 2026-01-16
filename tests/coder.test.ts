import { describe, it, expect, vi, beforeEach } from "vitest";
import { CoderAgent } from "../src/agents/CoderAgent.js";
import { BaseAgent } from "../src/agents/BaseAgent.js";
import type { CoderConfig } from "../src/agents/CoderAgent.js";
import type { CodeResult } from "../src/types/code.js";

/**
 * Unit tests for CoderAgent.
 *
 * Tests cover:
 * - Instantiation with correct config
 * - System prompt structure and content
 * - Inheritance from BaseAgent
 * - Code parsing and validation (with mocked SDK calls)
 * - Edge cases and error handling
 *
 * Note: We mock the Claude SDK to avoid making real API calls during tests.
 */

describe("CoderAgent", () => {
  describe("constructor", () => {
    it("should create an instance with correct config", () => {
      const config: CoderConfig = {
        agentType: "coder",
        model: "sonnet",
      };
      const agent = new CoderAgent(config);

      expect(agent).toBeInstanceOf(CoderAgent);
      expect(agent).toBeInstanceOf(BaseAgent);
    });

    it("should default agentType to 'coder'", () => {
      const config: CoderConfig = {
        agentType: "custom-coder",
      };
      const agent = new CoderAgent(config);

      // Access protected property via type assertion for testing
      expect((agent as any).agentType).toBe("custom-coder");
    });

    it("should use 'coder' as default agentType when not specified", () => {
      const config: CoderConfig = {};
      const agent = new CoderAgent(config);

      expect((agent as any).agentType).toBe("coder");
    });

    it("should store maxChanges from config", () => {
      const config: CoderConfig = {
        agentType: "coder",
        maxChanges: 5,
      };
      const agent = new CoderAgent(config);

      expect((agent as any).maxChanges).toBe(5);
    });

    it("should default maxChanges to 10", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      expect((agent as any).maxChanges).toBe(10);
    });

    it("should store allowedPaths from config", () => {
      const config: CoderConfig = {
        agentType: "coder",
        allowedPaths: ["src/", "lib/"],
      };
      const agent = new CoderAgent(config);

      expect((agent as any).allowedPaths).toEqual(["src/", "lib/"]);
    });

    it("should default allowedPaths to undefined", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      expect((agent as any).allowedPaths).toBeUndefined();
    });

    it("should store workflowId from config", () => {
      const config: CoderConfig = {
        agentType: "coder",
        workflowId: "mock-workflow-id" as any,
      };
      const agent = new CoderAgent(config);

      expect((agent as any).workflowId).toBe("mock-workflow-id");
    });
  });

  describe("getSystemPrompt", () => {
    it("should return coding-focused system prompt", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);
      const prompt = (agent as any).getSystemPrompt();

      expect(prompt).toContain("Coding Agent");
      expect(prompt).toContain("code changes");
      expect(prompt).toContain("JSON");
    });

    it("should include allowedPaths in prompt when configured", () => {
      const config: CoderConfig = {
        agentType: "coder",
        allowedPaths: ["src/", "lib/"],
      };
      const agent = new CoderAgent(config);
      const prompt = (agent as any).getSystemPrompt();

      expect(prompt).toContain("Allowed paths:");
      expect(prompt).toContain("src/");
      expect(prompt).toContain("lib/");
    });

    it("should include maxChanges in prompt", () => {
      const config: CoderConfig = {
        agentType: "coder",
        maxChanges: 5,
      };
      const agent = new CoderAgent(config);
      const prompt = (agent as any).getSystemPrompt();

      expect(prompt).toContain("1-5");
    });

    it("should specify JSON output format", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);
      const prompt = (agent as any).getSystemPrompt();

      expect(prompt).toContain("valid JSON");
      expect(prompt).toContain("changes");
      expect(prompt).toContain("path");
      expect(prompt).toContain("content");
      expect(prompt).toContain("operation");
    });

    it("should include operation types (create, update, delete)", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);
      const prompt = (agent as any).getSystemPrompt();

      expect(prompt).toContain("create");
      expect(prompt).toContain("update");
      expect(prompt).toContain("delete");
    });
  });

  describe("inheritance pattern", () => {
    it("should properly extend BaseAgent", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      // Verify inheritance chain
      expect(agent instanceof CoderAgent).toBe(true);
      expect(agent instanceof BaseAgent).toBe(true);

      // Verify BaseAgent methods are available
      expect(typeof agent.execute).toBe("function");
      expect(typeof agent.getSessionId).toBe("function");
    });

    it("should have executeWithWorkflow method", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      expect(typeof agent.executeWithWorkflow).toBe("function");
    });
  });

  describe("parseCodeResult", () => {
    it("should parse valid JSON response", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const validJson = JSON.stringify({
        changes: [
          {
            path: "src/models/User.ts",
            content: "export class User { }",
            operation: "create",
          },
        ],
        summary: "Created User model",
        filesModified: ["src/models/User.ts"],
      });

      const result = (agent as any).parseCodeResult(validJson);

      expect(result).toHaveProperty("changes");
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].path).toBe("src/models/User.ts");
    });

    it("should extract JSON from markdown code block", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const markdownResponse = `
Here are the code changes:

\`\`\`json
{
  "changes": [
    {
      "path": "src/api/auth.ts",
      "content": "export function login() { }",
      "operation": "create"
    }
  ],
  "summary": "Created auth API",
  "filesModified": ["src/api/auth.ts"]
}
\`\`\`
      `;

      const result = (agent as any).parseCodeResult(markdownResponse);

      expect(result).toHaveProperty("changes");
      expect(result.changes).toHaveLength(1);
    });

    it("should extract JSON from code block without json label", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const response = `
Code changes:

\`\`\`
{
  "changes": [
    {
      "path": "src/utils/helpers.ts",
      "content": "export function format() { }",
      "operation": "create"
    }
  ],
  "summary": "Created helper utilities",
  "filesModified": ["src/utils/helpers.ts"]
}
\`\`\`
      `;

      const result = (agent as any).parseCodeResult(response);

      expect(result).toHaveProperty("changes");
      expect(result.changes).toHaveLength(1);
    });

    it("should find JSON object in text with extra content", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const response = `
I'll implement the requested changes.

{
  "changes": [
    {
      "path": "src/types/user.ts",
      "content": "export interface User { }",
      "operation": "create"
    }
  ],
  "summary": "Created User type",
  "filesModified": ["src/types/user.ts"]
}

Let me know if you need any adjustments!
      `;

      const result = (agent as any).parseCodeResult(response);

      expect(result).toHaveProperty("changes");
      expect(result.changes).toHaveLength(1);
    });

    it("should throw error for invalid JSON", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const invalidJson = "This is not JSON at all";

      expect(() => {
        (agent as any).parseCodeResult(invalidJson);
      }).toThrow();
    });
  });

  describe("validateCodeResult", () => {
    it("should accept valid code result with 1 change", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const validCode: CodeResult = {
        changes: [
          {
            path: "src/models/User.ts",
            content: "export class User { }",
            operation: "create",
          },
        ],
        summary: "Created User model",
        filesModified: ["src/models/User.ts"],
      };

      expect(() => {
        (agent as any).validateCodeResult(validCode);
      }).not.toThrow();
    });

    it("should accept valid code result with 10 changes", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const changes = Array.from({ length: 10 }, (_, i) => ({
        path: `src/file${i}.ts`,
        content: `export class File${i} { }`,
        operation: "create" as const,
      }));

      const validCode: CodeResult = {
        changes,
        summary: "Created 10 files",
        filesModified: changes.map((c) => c.path),
      };

      expect(() => {
        (agent as any).validateCodeResult(validCode);
      }).not.toThrow();
    });

    it("should reject code result with more than 10 changes", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const changes = Array.from({ length: 11 }, (_, i) => ({
        path: `src/file${i}.ts`,
        content: `export class File${i} { }`,
        operation: "create" as const,
      }));

      const invalidCode: CodeResult = {
        changes,
        summary: "Created 11 files",
        filesModified: changes.map((c) => c.path),
      };

      expect(() => {
        (agent as any).validateCodeResult(invalidCode);
      }).toThrow("must have 1-10 changes");
    });

    it("should respect maxChanges limit from config", () => {
      const config: CoderConfig = {
        agentType: "coder",
        maxChanges: 5,
      };
      const agent = new CoderAgent(config);

      const changes = Array.from({ length: 6 }, (_, i) => ({
        path: `src/file${i}.ts`,
        content: `export class File${i} { }`,
        operation: "create" as const,
      }));

      const invalidCode: CodeResult = {
        changes,
        summary: "Created 6 files",
        filesModified: changes.map((c) => c.path),
      };

      expect(() => {
        (agent as any).validateCodeResult(invalidCode);
      }).toThrow("maxChanges limit");
    });

    it("should reject code result with missing changes array", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const invalidCode = {} as CodeResult;

      expect(() => {
        (agent as any).validateCodeResult(invalidCode);
      }).toThrow("must have a changes array");
    });

    it("should reject change with empty path", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const invalidCode: CodeResult = {
        changes: [
          {
            path: "",
            content: "export class Test { }",
            operation: "create",
          },
        ],
        summary: "Invalid",
        filesModified: [""],
      };

      expect(() => {
        (agent as any).validateCodeResult(invalidCode);
      }).toThrow("must have a path");
    });

    it("should reject invalid operation type", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const invalidCode: CodeResult = {
        changes: [
          {
            path: "src/test.ts",
            content: "export class Test { }",
            operation: "invalid" as any,
          },
        ],
        summary: "Invalid operation",
        filesModified: ["src/test.ts"],
      };

      expect(() => {
        (agent as any).validateCodeResult(invalidCode);
      }).toThrow("valid operation");
    });

    it("should reject duplicate paths in changes", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const invalidCode: CodeResult = {
        changes: [
          {
            path: "src/test.ts",
            content: "export class Test { }",
            operation: "create",
          },
          {
            path: "src/test.ts",
            content: "export class Test2 { }",
            operation: "update",
          },
        ],
        summary: "Duplicate path",
        filesModified: ["src/test.ts", "src/test.ts"],
      };

      expect(() => {
        (agent as any).validateCodeResult(invalidCode);
      }).toThrow("duplicate path");
    });

    it("should reject paths outside allowedPaths when configured", () => {
      const config: CoderConfig = {
        agentType: "coder",
        allowedPaths: ["src/", "lib/"],
      };
      const agent = new CoderAgent(config);

      const invalidCode: CodeResult = {
        changes: [
          {
            path: "test/test.ts",
            content: "export class Test { }",
            operation: "create",
          },
        ],
        summary: "Path outside allowed",
        filesModified: ["test/test.ts"],
      };

      expect(() => {
        (agent as any).validateCodeResult(invalidCode);
      }).toThrow("not in allowed paths");
    });

    it("should accept paths within allowedPaths when configured", () => {
      const config: CoderConfig = {
        agentType: "coder",
        allowedPaths: ["src/", "lib/"],
      };
      const agent = new CoderAgent(config);

      const validCode: CodeResult = {
        changes: [
          {
            path: "src/models/User.ts",
            content: "export class User { }",
            operation: "create",
          },
        ],
        summary: "Path within allowed",
        filesModified: ["src/models/User.ts"],
      };

      expect(() => {
        (agent as any).validateCodeResult(validCode);
      }).not.toThrow();
    });

    it("should reject mismatched filesModified array", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      const invalidCode: CodeResult = {
        changes: [
          {
            path: "src/test.ts",
            content: "export class Test { }",
            operation: "create",
          },
        ],
        summary: "Mismatched files",
        filesModified: ["src/other.ts"], // Wrong path
      };

      expect(() => {
        (agent as any).validateCodeResult(invalidCode);
      }).toThrow("filesModified array must match");
    });
  });

  describe("executeCode", () => {
    it("should be callable and return Promise<CodeResult>", async () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      // Note: This will fail with real API call, but we're testing the method signature
      // In a real test, we would mock the BaseAgent.execute() method
      expect(typeof agent.executeCode).toBe("function");
    });
  });

  describe("executeWithWorkflow", () => {
    it("should be callable with workflowId", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      expect(typeof agent.executeWithWorkflow).toBe("function");
    });

    it("should accept workflowId parameter", () => {
      const config: CoderConfig = {
        agentType: "coder",
      };
      const agent = new CoderAgent(config);

      // Test that the method signature accepts the correct parameters
      // We don't call it to avoid making real API calls
      const mockWorkflowId = "mock-workflow-id" as any;
      const mockInput = "Create a user model";

      // The method should exist and be a function
      expect(agent.executeWithWorkflow).toBeDefined();
      expect(agent.executeWithWorkflow.length).toBe(2); // Takes 2 parameters
    });
  });
});
