/**
 * Tests for snapshot utilities.
 */

import { describe, it, expect } from "vitest";
import {
  generateAllAssistantsSnapshot,
  compareAssistantRenderings,
  generateComparisonTable,
} from "../src/snapshots.js";

describe("generateAllAssistantsSnapshot", () => {
  it("should generate snapshots for all assistants", () => {
    const output = "Test output\nLine 2";
    const snapshot = generateAllAssistantsSnapshot(output);

    expect(snapshot).toBeDefined();
    expect(snapshot["claude-code"]).toBeDefined();
    expect(snapshot["github-copilot"]).toBeDefined();
    expect(snapshot["cline"]).toBeDefined();

    // Verify all returned assistants have both contexts
    const assistantIds = Object.keys(snapshot);
    expect(assistantIds.length).toBeGreaterThan(0);
  });

  it("should include both command and chat contexts", () => {
    const output = "Test output";
    const snapshot = generateAllAssistantsSnapshot(output);

    for (const assistantId in snapshot) {
      expect(snapshot[assistantId]).toHaveProperty("command");
      expect(snapshot[assistantId]).toHaveProperty("chat");
      expect(typeof snapshot[assistantId].command).toBe("string");
      expect(typeof snapshot[assistantId].chat).toBe("string");
    }
  });

  it("should handle ANSI codes according to assistant config", () => {
    const output = "\x1b[31mRed text\x1b[0m";
    const snapshot = generateAllAssistantsSnapshot(output);

    // Some assistants strip ANSI (none support), some preserve it (256/truecolor support)
    // Just verify we got results for each assistant
    for (const assistantId in snapshot) {
      expect(snapshot[assistantId].chat).toBeDefined();
      expect(snapshot[assistantId].command).toBeDefined();
      expect(typeof snapshot[assistantId].chat).toBe("string");
      expect(typeof snapshot[assistantId].command).toBe("string");
    }
  });
});

describe("compareAssistantRenderings", () => {
  it("should group assistants with identical renderings", () => {
    const output = "Simple text";
    const groups = compareAssistantRenderings(output);

    expect(groups.size).toBeGreaterThan(0);
    
    // At least some assistants should render identically
    let hasGroupWithMultiple = false;
    for (const [_, assistants] of groups) {
      if (assistants.length > 1) {
        hasGroupWithMultiple = true;
        break;
      }
    }
    expect(hasGroupWithMultiple).toBe(true);
  });

  it("should respect assistant filter", () => {
    const output = "Test output";
    const groups = compareAssistantRenderings(output, {
      assistants: ["claude-code", "github-copilot"],
    });

    const allLabels: string[] = [];
    for (const labels of groups.values()) {
      allLabels.push(...labels);
    }

    // Should only include filtered assistants
    for (const label of allLabels) {
      const assistantId = label.split(":")[0];
      expect(["claude-code", "github-copilot"]).toContain(assistantId);
    }
  });

  it("should respect context filter", () => {
    const output = "Test output";
    const groups = compareAssistantRenderings(output, {
      contexts: ["chat"],
    });

    const allLabels: string[] = [];
    for (const labels of groups.values()) {
      allLabels.push(...labels);
    }

    // All labels should be for chat context
    for (const label of allLabels) {
      expect(label).toContain(":chat");
      expect(label).not.toContain(":command");
    }
  });

  it("should show differences when newlines are collapsed", () => {
    const output = "Line 1\nLine 2";
    const groups = compareAssistantRenderings(output, {
      contexts: ["command"],
    });

    // GitHub Copilot collapses newlines in command context
    // So there should be at least 2 groups
    expect(groups.size).toBeGreaterThanOrEqual(2);
  });
});

describe("generateComparisonTable", () => {
  it("should generate a valid markdown table", () => {
    const output = "Test output";
    const table = generateComparisonTable(output, "chat");

    expect(table).toContain("| Assistant | Rendered Output |");
    expect(table).toContain("|-----------|-----------------|");
    expect(table).toContain("| Claude Code |");
    expect(table).toContain("| GitHub Copilot |");
  });

  it("should escape pipe characters", () => {
    const output = "Value | Other";
    const table = generateComparisonTable(output, "chat");

    // The pipe in the output should be escaped
    expect(table).toContain("\\|");
  });

  it("should handle newlines with <br> tags", () => {
    const output = "Line 1\nLine 2";
    const table = generateComparisonTable(output, "chat");

    // For assistants that preserve newlines, should use <br>
    expect(table).toContain("<br>");
  });

  it("should handle different contexts", () => {
    const output = "Test";
    const chatTable = generateComparisonTable(output, "chat");
    const commandTable = generateComparisonTable(output, "command");

    expect(chatTable).toBeDefined();
    expect(commandTable).toBeDefined();
    expect(chatTable.length).toBeGreaterThan(0);
    expect(commandTable.length).toBeGreaterThan(0);
  });
});
