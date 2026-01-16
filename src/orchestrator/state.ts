/**
 * Filesystem state management utilities for workflow orchestration.
 *
 * These utilities handle persisting and loading workflow artifacts
 * to/from the filesystem, using JSON format for structured data.
 */

import { mkdir, writeFile, readFile, rm } from "fs/promises";
import { join } from "path";
import type { PlanResult } from "../types/plan.js";
import type { CodeResult } from "../types/code.js";
import type { ReviewResult } from "../types/review.js";
import type { Artifact } from "../types/workflow.js";

/**
 * Creates the workspace directory if it doesn't exist.
 *
 * @param workspace - Path to the workspace directory
 * @throws Error if directory creation fails
 */
export async function createWorkspace(workspace: string): Promise<void> {
  try {
    await mkdir(workspace, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create workspace directory at ${workspace}: ${error}`);
  }
}

/**
 * Removes all files from the workspace directory.
 *
 * @param workspace - Path to the workspace directory
 * @throws Error if clearing fails
 */
export async function clearWorkspace(workspace: string): Promise<void> {
  try {
    await rm(workspace, { recursive: true, force: true });
    await mkdir(workspace, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to clear workspace directory at ${workspace}: ${error}`);
  }
}

/**
 * Saves an artifact to a JSON file in the workspace directory.
 *
 * @param workspace - Path to the workspace directory
 * @param artifact - Artifact to save
 * @throws Error if write fails
 */
export async function saveArtifact(
  workspace: string,
  artifact: Artifact
): Promise<void> {
  const filePath = join(workspace, artifact.path);
  try {
    await writeFile(filePath, artifact.content, "utf-8");
  } catch (error) {
    throw new Error(`Failed to save artifact to ${filePath}: ${error}`);
  }
}

/**
 * Loads an artifact from a JSON file in the workspace directory.
 *
 * @param workspace - Path to the workspace directory
 * @param filename - Name of the file to load
 * @returns The file content as a string
 * @throws Error if read fails
 */
export async function loadArtifact(
  workspace: string,
  filename: string
): Promise<string> {
  const filePath = join(workspace, filename);
  try {
    const content = await readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    throw new Error(`Failed to load artifact from ${filePath}: ${error}`);
  }
}

/**
 * Converts a PlanResult to JSON string.
 *
 * @param plan - PlanResult to convert
 * @returns JSON string representation
 */
export function planToJson(plan: PlanResult): string {
  return JSON.stringify(plan, null, 2);
}

/**
 * Converts a JSON string to PlanResult.
 *
 * @param json - JSON string to parse
 * @returns Parsed PlanResult
 * @throws Error if JSON is invalid
 */
export function planFromJson(json: string): PlanResult {
  try {
    return JSON.parse(json) as PlanResult;
  } catch (error) {
    throw new Error(`Failed to parse PlanResult from JSON: ${error}`);
  }
}

/**
 * Converts a CodeResult to JSON string.
 *
 * @param code - CodeResult to convert
 * @returns JSON string representation
 */
export function codeToJson(code: CodeResult): string {
  return JSON.stringify(code, null, 2);
}

/**
 * Converts a JSON string to CodeResult.
 *
 * @param json - JSON string to parse
 * @returns Parsed CodeResult
 * @throws Error if JSON is invalid
 */
export function codeFromJson(json: string): CodeResult {
  try {
    return JSON.parse(json) as CodeResult;
  } catch (error) {
    throw new Error(`Failed to parse CodeResult from JSON: ${error}`);
  }
}

/**
 * Converts a ReviewResult to JSON string.
 *
 * @param review - ReviewResult to convert
 * @returns JSON string representation
 */
export function reviewToJson(review: ReviewResult): string {
  return JSON.stringify(review, null, 2);
}

/**
 * Converts a JSON string to ReviewResult.
 *
 * @param json - JSON string to parse
 * @returns Parsed ReviewResult
 * @throws Error if JSON is invalid
 */
export function reviewFromJson(json: string): ReviewResult {
  try {
    return JSON.parse(json) as ReviewResult;
  } catch (error) {
    throw new Error(`Failed to parse ReviewResult from JSON: ${error}`);
  }
}
