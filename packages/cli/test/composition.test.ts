import { describe, it, expect } from "vitest";
import { createSparkline } from "@tuicomponents/sparkline";
import { createTable } from "@tuicomponents/table";
import {
  createStyleFunctions,
  getMarkdownRenderedWidth,
  type RenderContext,
} from "@tuicomponents/core";

/**
 * Composition stress tests for the unified semantic styling architecture.
 *
 * These tests validate that styled components compose correctly when nested,
 * particularly verifying that markdown styling (backticks) doesn't break
 * table alignment.
 *
 * Key test case: styled sparklines inside table cells
 * - Backticks wrap the sparkline blocks
 * - Table calculates visual width correctly (backticks are invisible when rendered)
 * - Column alignment is preserved
 */
describe("styled composition", () => {
  const markdownContext: RenderContext = {
    width: 80,
    isTTY: false,
    colorLevel: 0,
    renderMode: "markdown",
    style: createStyleFunctions("markdown"),
  };

  const ansiContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  describe("styled sparklines in table cells", () => {
    it("should align correctly with secondary-styled sparkline in markdown mode", () => {
      const sparkline = createSparkline();
      const table = createTable();

      // Render sparklines in markdown mode (they get backticks)
      const cpuSparkResult = sparkline.render(
        { values: [1, 2, 3, 4, 5, 6, 7, 8] },
        markdownContext
      );
      const memSparkResult = sparkline.render(
        { values: [4, 4, 5, 5, 6, 6, 7, 7] },
        markdownContext
      );

      // The sparkline output should be styled with backticks
      expect(cpuSparkResult.output).toContain("`");
      expect(memSparkResult.output).toContain("`");

      // Remove the anchor from sparkline output for table cell content
      const cpuTrend = cpuSparkResult.output.slice(1); // Remove leading │
      const memTrend = memSparkResult.output.slice(1);

      // Put them in a table
      const tableResult = table.render(
        {
          columns: [
            { header: "Metric", key: "metric" },
            { header: "Current", key: "current" },
            { header: "Trend", key: "trend" },
          ],
          rows: [
            { metric: "CPU Usage", current: "73%", trend: cpuTrend },
            { metric: "Memory", current: "4.2 GB", trend: memTrend },
          ],
          borderStyle: "rounded",
        },
        markdownContext
      );

      // Verify alignment - all rows should have same visual width
      const lines = tableResult.output.split("\n").filter((l) => l.length > 0);
      const visualWidths = lines.map((line) => getMarkdownRenderedWidth(line));

      // All lines should have the same visual width (accounting for markdown)
      const uniqueWidths = new Set(visualWidths);
      expect(uniqueWidths.size).toBe(1);
    });

    it("should handle manually pre-styled sparkline content", () => {
      const table = createTable();

      // Simulate manually styled content (user provides backtick-wrapped sparklines)
      const tableResult = table.render(
        {
          columns: [
            { header: "Metric", key: "metric" },
            { header: "Trend", key: "trend" },
          ],
          rows: [
            { metric: "CPU", trend: " `▂▃▄▅▆▇▆▅`" },
            { metric: "Memory", trend: " `▄▄▅▅▆▆▇▇`" },
          ],
          borderStyle: "rounded",
        },
        markdownContext
      );

      const lines = tableResult.output.split("\n").filter((l) => l.length > 0);
      const visualWidths = lines.map((line) => getMarkdownRenderedWidth(line));

      // All lines should have the same visual width
      const uniqueWidths = new Set(visualWidths);
      expect(uniqueWidths.size).toBe(1);

      // Verify backticks are preserved in output
      expect(tableResult.output).toContain("`▂▃▄▅▆▇▆▅`");
      expect(tableResult.output).toContain("`▄▄▅▅▆▆▇▇`");
    });

    it("should maintain alignment with mixed styled and unstyled content", () => {
      const table = createTable();

      const tableResult = table.render(
        {
          columns: [
            { header: "Metric", key: "metric" },
            { header: "Value", key: "value" },
            { header: "Status", key: "status" },
          ],
          rows: [
            { metric: "CPU", value: "73%", status: " `▂▃▄▅▆▇`" }, // Styled
            { metric: "Disk", value: "45%", status: "Healthy" }, // Unstyled
            { metric: "Memory", value: "4.2 GB", status: " `▅▅▆▆▇▇`" }, // Styled
          ],
          borderStyle: "single",
        },
        markdownContext
      );

      const lines = tableResult.output.split("\n").filter((l) => l.length > 0);
      const visualWidths = lines.map((line) => getMarkdownRenderedWidth(line));

      // All lines should have the same visual width
      const uniqueWidths = new Set(visualWidths);
      expect(uniqueWidths.size).toBe(1);
    });

    it("should work identically in ANSI mode without backticks", () => {
      const sparkline = createSparkline();
      const table = createTable();

      // Render sparklines in ANSI mode (no backticks)
      const cpuSparkResult = sparkline.render(
        { values: [1, 2, 3, 4, 5] },
        ansiContext
      );

      // ANSI output should NOT have backticks
      expect(cpuSparkResult.output).not.toContain("`");

      // Put in table
      const tableResult = table.render(
        {
          columns: [
            { header: "Metric", key: "metric" },
            { header: "Trend", key: "trend" },
          ],
          rows: [{ metric: "CPU", trend: cpuSparkResult.output }],
          borderStyle: "single",
        },
        ansiContext
      );

      // Verify the sparkline blocks are in the output
      expect(tableResult.output).toContain("▁");
      expect(tableResult.output).toContain("█");
    });
  });

  describe("context.style function behavior", () => {
    it("should apply secondary styling correctly in markdown mode", () => {
      const text = "data";
      const styled = markdownContext.style.secondary(text);

      expect(styled).toContain("`");
      expect(styled).toContain("data");
    });

    it("should pass through secondary styling in ANSI mode without theme", () => {
      const text = "data";
      const styled = ansiContext.style.secondary(text);

      // Without theme, should be passthrough
      expect(styled).toBe(text);
      expect(styled).not.toContain("`");
    });

    it("should handle empty strings correctly", () => {
      const styled = markdownContext.style.secondary("");

      // Empty string should not produce backticks
      expect(styled).toBe("");
    });

    it("should apply header styling in markdown mode", () => {
      const text = "Title";
      const styled = markdownContext.style.header(text);

      expect(styled).toContain("**");
      expect(styled).toContain("Title");
    });

    it("should maintain consistent styling across multiple calls", () => {
      const text = "test";
      const styled1 = markdownContext.style.secondary(text);
      const styled2 = markdownContext.style.secondary(text);

      expect(styled1).toBe(styled2);
    });
  });
});
