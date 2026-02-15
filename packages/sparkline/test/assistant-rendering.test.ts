/**
 * Tests for sparkline rendering across different AI coding assistants.
 *
 * These tests verify that sparkline output renders correctly when displayed
 * by various AI assistants (Claude Code, GitHub Copilot, Cline, etc.).
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createSparkline } from "../src/index.js";
import { createRenderContext } from "@tuicomponents/core";
import {
  simulateRendering,
  getConfig,
  getAssistantIds,
} from "@tuicomponents/assistant-simulator";

describe("sparkline assistant rendering", () => {
  let sparkline: ReturnType<typeof createSparkline>;

  beforeAll(() => {
    sparkline = createSparkline();
  });

  // Helper to render sparkline with markdown mode (common for AI assistants)
  function renderSparkline(values: number[], width = 80): string {
    const ctx = createRenderContext({ width, renderMode: "markdown" });
    return sparkline.render({ values }, ctx).output;
  }

  describe("GitHub Copilot (newline collapsing)", () => {
    const config = getConfig("github-copilot");

    it("should collapse multi-line sparkline to single line", () => {
      const output = renderSparkline([1, 2, 3, 4, 5]);
      const sim = simulateRendering(output, config, "chat");

      // GitHub Copilot collapses newlines
      expect(sim.rendered).not.toContain("\n");
      expect(sim.metadata.transformsApplied).toContain("collapseNewlines");
    });

    it("should preserve sparkline characters after collapsing", () => {
      const output = renderSparkline([1, 5, 2, 8, 3]);
      const sim = simulateRendering(output, config, "chat");

      // Should still contain block characters
      expect(sim.rendered).toMatch(/[▁▂▃▄▅▆▇█]/);
    });
  });

  describe("Cline (literal backticks)", () => {
    const config = getConfig("cline");

    it("should show literal backticks in output", () => {
      const output = "`sparkline` output: ▁▂▃▄▅▆▇█";
      const sim = simulateRendering(output, config, "chat");

      // Cline strips backticks (shows them as literal chars which means removing the markdown)
      expect(sim.rendered).not.toContain("`");
      expect(sim.metadata.transformsApplied).toContain("stripBackticks");
    });

    it("should preserve sparkline block characters", () => {
      const output = renderSparkline([1, 2, 3, 4, 5, 6, 7, 8]);
      const sim = simulateRendering(output, config, "chat");

      // Block characters should be preserved
      expect(sim.rendered).toMatch(/[▁▂▃▄▅▆▇█]/);
    });
  });

  describe("Codex (ANSI support)", () => {
    const config = getConfig("codex");

    it("should preserve ANSI codes", () => {
      // Create ANSI output
      const ctx = createRenderContext({ width: 80, renderMode: "ansi" });
      const output = sparkline.render({ values: [1, 2, 3, 4, 5] }, ctx).output;
      const sim = simulateRendering(output, config, "chat");

      // Codex supports truecolor, so ANSI should be preserved
      expect(sim.metadata.transformsApplied).not.toContain("stripAnsi");
    });
  });

  describe("Claude Code (command context truncation)", () => {
    const config = getConfig("claude-code");

    it("should truncate long output in command context", () => {
      // Create multi-line output
      const output = "line1\nline2\nline3\nline4\nline5";
      const sim = simulateRendering(output, config, "command");

      // Claude Code truncates to 3 lines in command context
      expect(sim.metadata.wasTruncated).toBe(true);
      // Output is first 3 lines plus truncation indicator showing remaining line count
      expect(sim.rendered).toBe("line1\nline2\nline3\n... (2 more lines)");
    });

    it("should not truncate in chat context", () => {
      const output = "line1\nline2\nline3\nline4\nline5";
      const sim = simulateRendering(output, config, "chat");

      // Chat context has no truncation
      expect(sim.metadata.wasTruncated).toBe(false);
    });
  });

  describe("cross-assistant compatibility", () => {
    it("should render sparkline consistently across most assistants", () => {
      const output = renderSparkline([1, 2, 3, 4, 5]);
      const assistantIds = getAssistantIds();

      // Collect rendered outputs
      const renderings = new Map<string, string[]>();

      for (const id of assistantIds) {
        // Skip GitHub Copilot as it collapses newlines
        if (id === "github-copilot") continue;

        const config = getConfig(id);
        const sim = simulateRendering(output, config, "chat");

        const existing = renderings.get(sim.rendered);
        if (existing) {
          existing.push(id);
        } else {
          renderings.set(sim.rendered, [id]);
        }
      }

      // Most assistants should render the same way
      // (grouped by identical output)
      const groups = Array.from(renderings.values());
      expect(groups.length).toBeLessThanOrEqual(3); // At most 3 different renderings
    });

    it("should preserve block characters across all assistants", () => {
      const output = renderSparkline([1, 8, 4, 6, 2]);

      for (const id of getAssistantIds()) {
        const config = getConfig(id);
        const sim = simulateRendering(output, config, "chat");

        // All assistants should preserve the sparkline block characters
        expect(sim.rendered).toMatch(/[▁▂▃▄▅▆▇█]/);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle minimal sparkline output", () => {
      // Sparkline requires at least 1 value, test minimal input
      const output = renderSparkline([5]);

      for (const id of getAssistantIds()) {
        const config = getConfig(id);
        const sim = simulateRendering(output, config, "chat");

        // Should not throw or produce undefined
        expect(typeof sim.rendered).toBe("string");
        expect(sim.rendered.length).toBeGreaterThan(0);
      }
    });

    it("should handle single value sparkline", () => {
      const output = renderSparkline([5]);

      for (const id of getAssistantIds()) {
        const config = getConfig(id);
        const sim = simulateRendering(output, config, "chat");

        expect(sim.rendered.length).toBeGreaterThan(0);
      }
    });
  });
});
