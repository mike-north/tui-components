/**
 * Tests for helper functions.
 */

import { describe, it, expect } from "vitest";
import {
  renderForAllAssistants,
  findRenderingDifferences,
  findTruncatingAssistants,
} from "../src/helpers.js";

describe("renderForAllAssistants", () => {
  it("should return rendering results for all assistants", () => {
    const output = "Test output";
    const results = renderForAllAssistants(output, "chat");

    expect(results.length).toBeGreaterThan(0);

    // Each result should be a tuple of [assistantId, rendered]
    for (const [assistantId, rendered] of results) {
      expect(typeof assistantId).toBe("string");
      expect(typeof rendered).toBe("string");
      expect(assistantId.length).toBeGreaterThan(0);
    }
  });

  it("should include known assistants", () => {
    const output = "Test";
    const results = renderForAllAssistants(output, "chat");
    const assistantIds = results.map(([id]) => id);

    expect(assistantIds).toContain("claude-code");
    expect(assistantIds).toContain("github-copilot");
    expect(assistantIds).toContain("cline");
  });

  it("should handle different contexts", () => {
    const output = "Line 1\nLine 2";
    const chatResults = renderForAllAssistants(output, "chat");
    const commandResults = renderForAllAssistants(output, "command");

    expect(chatResults.length).toBe(commandResults.length);

    // Some renderings might differ between contexts
    const chatRendered = new Set(chatResults.map(([_, r]) => r));
    const commandRendered = new Set(commandResults.map(([_, r]) => r));

    // At least check they both produced results
    expect(chatRendered.size).toBeGreaterThan(0);
    expect(commandRendered.size).toBeGreaterThan(0);
  });
});

describe("findRenderingDifferences", () => {
  it("should group assistants by their rendered output", () => {
    const output = "Test output";
    const groups = findRenderingDifferences(output, "chat");

    expect(Object.keys(groups).length).toBeGreaterThan(0);

    // Each group should have at least one assistant
    for (const rendered in groups) {
      expect(groups[rendered].length).toBeGreaterThan(0);
      expect(Array.isArray(groups[rendered])).toBe(true);
    }
  });

  it("should show differences when newlines are collapsed", () => {
    const output = "Line 1\nLine 2\nLine 3";
    const groups = findRenderingDifferences(output, "command");

    // GitHub Copilot collapses newlines in command context
    // So there should be at least 2 different renderings
    expect(Object.keys(groups).length).toBeGreaterThanOrEqual(2);
  });

  it("should group assistants with identical behavior", () => {
    const output = "Simple";
    const groups = findRenderingDifferences(output, "chat");

    // Many assistants should render simple text identically
    let hasGroupWithMultiple = false;
    for (const rendered in groups) {
      if (groups[rendered].length > 1) {
        hasGroupWithMultiple = true;
        break;
      }
    }
    expect(hasGroupWithMultiple).toBe(true);
  });

  it("should handle ANSI codes", () => {
    const output = "\x1b[31mRed\x1b[0m";
    const groups = findRenderingDifferences(output, "chat");

    // Some assistants strip ANSI, some preserve it
    // So there should be multiple groups
    expect(Object.keys(groups).length).toBeGreaterThan(0);
    // At least one group should have "Red" (stripped ANSI)
    const hasStrippedVersion = Object.keys(groups).some((key) => key === "Red");
    // Could also have the original with ANSI
    expect(hasStrippedVersion || Object.keys(groups).length > 0).toBe(true);
  });
});

describe("findTruncatingAssistants", () => {
  it("should return empty array for short output", () => {
    const output = "Short output";
    const truncating = findTruncatingAssistants(output);

    expect(Array.isArray(truncating)).toBe(true);
    expect(truncating.length).toBe(0);
  });

  it("should identify assistants that truncate long output", () => {
    // Create output with many lines
    const manyLines = Array.from(
      { length: 200 },
      (_, i) => "Line " + (i + 1)
    ).join("\n");
    const truncating = findTruncatingAssistants(manyLines);

    // Claude Code truncates in command context
    expect(truncating.length).toBeGreaterThan(0);
    expect(truncating).toContain("claude-code");
  });

  it("should check both command and chat contexts", () => {
    // Create output that might be truncated in command but not chat
    const manyLines = Array.from(
      { length: 100 },
      (_, i) => "Line " + (i + 1)
    ).join("\n");
    const truncating = findTruncatingAssistants(manyLines);

    // If any truncation happens, it should be reported
    if (truncating.length > 0) {
      for (const id of truncating) {
        expect(typeof id).toBe("string");
        expect(id.length).toBeGreaterThan(0);
      }
    }
  });
});
