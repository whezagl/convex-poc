// @convex-poc/agent-orchestrator/dispatcher/AgentDispatcher - Agent dispatcher with routing

import Client from "@anthropic-ai/sdk";
import type { AgentType } from "@convex-poc/shared-types/agent";
import type {
  AgentClassification,
  KeywordPatterns,
  LLMClassifierConfig,
  DispatcherConfig,
} from "./types.js";

/**
 * AgentDispatcher routes tasks to appropriate CRUD agents.
 *
 * Hybrid approach:
 * 1. Keyword extraction (fast path for ~80% of tasks)
 * 2. LLM classification (fallback for ambiguous descriptions)
 *
 * Classification results are stored in Convex for debugging and transparency.
 */
export class AgentDispatcher {
  private readonly keywordPatterns: KeywordPatterns;
  private readonly llmClient?: Client;
  private readonly llmModel: string;
  private readonly enableLLM: boolean;

  constructor(config: DispatcherConfig = {}) {
    // Default keyword patterns from ROADMAP.md
    this.keywordPatterns = {
      "BE Boilerplate": config.keywordPatterns?.["BE Boilerplate"] || [
        "be setup",
        "backend setup",
        "backend boilerplate",
        "create backend",
        "setup backend project",
      ],
      "FE Boilerplate": config.keywordPatterns?.["FE Boilerplate"] || [
        "fe setup",
        "frontend setup",
        "frontend boilerplate",
        "create frontend",
        "setup frontend project",
      ],
      "BE CRUD APIs": config.keywordPatterns?.["BE CRUD APIs"] || [
        "be crud apis",
        "backend crud",
        "api generation",
        "generate backend apis",
        "create crud apis",
      ],
      "FE CRUD Services": config.keywordPatterns?.["FE CRUD Services"] || [
        "fe crud services",
        "frontend services",
        "service generation",
        "generate frontend services",
        "create crud services",
      ],
      "UI CRUD Pages": config.keywordPatterns?.["UI CRUD Pages"] || [
        "ui crud pages",
        "ui pages",
        "page generation",
        "generate ui pages",
        "create crud pages",
      ],
    };

    // Configure LLM client
    this.enableLLM = config.enableLLM ?? true;
    if (this.enableLLM && config.llmConfig?.apiKey) {
      this.llmClient = new Client({
        apiKey: config.llmConfig.apiKey,
      });
      this.llmModel = config.llmConfig.model || "claude-3-haiku-20240307";
    } else {
      this.llmClient = undefined;
      this.llmModel = "";
    }
  }

  /**
   * Classifies a task description and routes to appropriate agent.
   *
   * Workflow:
   * 1. Try keyword extraction (fast, high confidence if match)
   * 2. If no match, use LLM classifier (handles ambiguity)
   * 3. Store classification in Convex for debugging
   *
   * @param description - Task description from user
   * @param taskId - Optional task ID for Convex storage
   * @returns Agent classification with confidence and keywords
   */
  async classifyTask(
    description: string,
    taskId?: string
  ): Promise<AgentClassification> {
    // Step 1: Try keyword extraction (fast path)
    const keywordResult = this.extractKeywords(description);
    if (keywordResult && keywordResult.confidence > 0.8) {
      // High confidence keyword match - skip LLM
      await this.storeClassification(taskId, keywordResult);
      return keywordResult;
    }

    // Step 2: Use LLM classifier (fallback for ambiguous cases)
    if (this.enableLLM && this.llmClient) {
      try {
        const llmResult = await this.llmClassify(description);
        await this.storeClassification(taskId, llmResult);
        return llmResult;
      } catch (error) {
        console.error(`[AgentDispatcher] LLM classification failed: ${error}`);
        // Fall back to keyword result even if low confidence
        if (keywordResult) {
          await this.storeClassification(taskId, keywordResult);
          return keywordResult;
        }
      }
    }

    // Step 3: Default to first keyword match if available
    if (keywordResult) {
      await this.storeClassification(taskId, keywordResult);
      return keywordResult;
    }

    // Step 4: No match found - return default (BE Boilerplate)
    const defaultResult: AgentClassification = {
      agentType: "BE Boilerplate",
      confidence: 0.1,
      keywords: [],
      method: "keyword",
      reasoning: "No keywords matched, defaulting to BE Boilerplate",
    };
    await this.storeClassification(taskId, defaultResult);
    return defaultResult;
  }

  /**
   * Extracts keywords from task description.
   * Returns classification if keywords match an agent type.
   *
   * @param description - Task description
   * @returns Classification or null if no match
   */
  private extractKeywords(description: string): AgentClassification | null {
    const normalized = description.toLowerCase();
    const matchedKeywords: string[] = [];

    // Check each agent's keyword patterns
    for (const [agentType, patterns] of Object.entries(this.keywordPatterns)) {
      for (const pattern of patterns) {
        if (normalized.includes(pattern.toLowerCase())) {
          matchedKeywords.push(pattern);
        }
      }

      // If we found matches for this agent type
      if (matchedKeywords.length > 0) {
        return {
          agentType: agentType as AgentType,
          confidence: 0.9, // High confidence for keyword matches
          keywords: matchedKeywords,
          method: "keyword",
        };
      }
    }

    return null;
  }

  /**
   * Uses LLM to classify ambiguous task descriptions.
   *
   * @param description - Task description
   * @returns Classification from LLM
   */
  private async llmClassify(description: string): Promise<AgentClassification> {
    if (!this.llmClient) {
      throw new Error("LLM client not configured");
    }

    const prompt = this.buildClassificationPrompt(description);

    const response = await this.llmClient.messages.create({
      model: this.llmModel,
      max_tokens: 200,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Parse LLM response (expecting JSON)
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected LLM response type");
    }

    let parsed: {
      agentType: AgentType;
      confidence: number;
      reasoning: string;
      keywords: string[];
    };

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.text.match(/```json\s*([\s\S]*?)\s*```/) ||
                       content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in LLM response");
      }

      parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } catch (error) {
      console.error(`[AgentDispatcher] Failed to parse LLM response: ${content.text}`);
      throw new Error("LLM response parsing failed");
    }

    return {
      agentType: parsed.agentType,
      confidence: parsed.confidence,
      keywords: parsed.keywords || [],
      method: "llm",
      reasoning: parsed.reasoning,
    };
  }

  /**
   * Builds classification prompt for LLM.
   *
   * @param description - Task description
   * @returns Prompt string
   */
  private buildClassificationPrompt(description: string): string {
    return `You are a task classifier for a code generation system. Classify the following task into one of these categories:

- "BE Boilerplate": Backend project setup (package.json, tsconfig.json, Express server)
- "FE Boilerplate": Frontend project setup (Vite, React, TypeScript)
- "BE CRUD APIs": Backend CRUD code generation (repositories, SQL queries, API endpoints)
- "FE CRUD Services": Frontend service code generation (API clients, TanStack Query hooks)
- "UI CRUD Pages": UI component generation (React forms, tables, pages)

Task: "${description}"

Respond with JSON in this format:
\`\`\`json
{
  "agentType": "BE Boilerplate" | "FE Boilerplate" | "BE CRUD APIs" | "FE CRUD Services" | "UI CRUD Pages",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this category fits",
  "keywords": ["extracted", "keywords", "from", "task"]
}
\`\`\``;
  }

  /**
   * Stores classification result in Convex.
   * Uses fire-and-forget pattern to avoid blocking.
   *
   * Note: The updateClassification mutation is created in plan 15-06 task 1
   * alongside the schema updates for classification fields.
   *
   * @param taskId - Optional task ID
   * @param classification - Classification result
   */
  private async storeClassification(
    taskId: string | undefined,
    classification: AgentClassification
  ): Promise<void> {
    if (!taskId) return;

    // TODO: This will be available after plan 15-06 completes
    // For now, we'll log to console
    console.log(`[AgentDispatcher] Classification for task ${taskId}:`, {
      agentType: classification.agentType,
      confidence: classification.confidence,
      method: classification.method,
      keywords: classification.keywords,
      reasoning: classification.reasoning,
    });

    // Non-blocking Convex update (will be implemented in plan 15-06)
    // convex.mutations.tasks.updateClassification({
    //   taskId,
    //   agentType: classification.agentType,
    //   confidence: classification.confidence,
    //   method: classification.method,
    //   keywords: classification.keywords,
    //   reasoning: classification.reasoning,
    //   timestamp: Date.now(),
    // }).catch(err => {
    //   console.error(`[AgentDispatcher] Failed to store classification: ${err}`);
    // });
  }

  /**
   * Gets all keyword patterns.
   * Useful for debugging and UI display.
   */
  getKeywordPatterns(): KeywordPatterns {
    return { ...this.keywordPatterns };
  }

  /**
   * Checks if LLM classifier is enabled.
   */
  isLLMEnabled(): boolean {
    return this.enableLLM && !!this.llmClient;
  }
}
