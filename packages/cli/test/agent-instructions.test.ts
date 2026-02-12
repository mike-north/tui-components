import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the is-agentic-tui module before importing the module under test
vi.mock("is-agentic-tui", () => ({
  isAgenticTui: vi.fn(),
  whichAgenticTui: vi.fn(),
}));

import { isAgenticTui, whichAgenticTui } from "is-agentic-tui";
import {
  AGENT_DIAGRAM_PADDING_LINES,
  AGENT_INSTRUCTIONS,
  isAgentEnvironment,
  getAgentInfo,
  getAgentDiagramPadding,
} from "../src/agent-instructions.js";

describe("agent-instructions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("AGENT_DIAGRAM_PADDING_LINES", () => {
    it("should be 5", () => {
      expect(AGENT_DIAGRAM_PADDING_LINES).toBe(5);
    });

    it("should be a positive integer", () => {
      expect(Number.isInteger(AGENT_DIAGRAM_PADDING_LINES)).toBe(true);
      expect(AGENT_DIAGRAM_PADDING_LINES).toBeGreaterThan(0);
    });
  });

  describe("AGENT_INSTRUCTIONS", () => {
    it("should contain all required sections", () => {
      const requiredSections = [
        "INSTRUCTIONS FOR AI AGENTS",
        "RENDERING DIAGRAMS:",
        "OUTPUT FORMATTING:",
        "RENDER MODES:",
        "EXAMPLE USAGE:",
      ];
      for (const section of requiredSections) {
        expect(AGENT_INSTRUCTIONS).toContain(section);
      }
    });

    it("should warn against using code blocks", () => {
      expect(AGENT_INSTRUCTIONS).toContain(
        "NEVER wrap diagram output in markdown code blocks"
      );
    });

    it("should mention the padding lines", () => {
      expect(AGENT_INSTRUCTIONS).toContain("5 leading blank lines");
    });

    it("should include example command", () => {
      expect(AGENT_INSTRUCTIONS).toContain("tui render chart");
    });

    it("should mention both render modes", () => {
      expect(AGENT_INSTRUCTIONS).toContain("--render-mode=markdown");
      expect(AGENT_INSTRUCTIONS).toContain("--render-mode=ansi");
    });

    it("should have separator lines at start and end", () => {
      const separator =
        "═══════════════════════════════════════════════════════════════════════════════";
      const occurrences = (
        AGENT_INSTRUCTIONS.match(new RegExp(separator, "g")) || []
      ).length;
      expect(occurrences).toBeGreaterThanOrEqual(2);
    });
  });

  describe("isAgentEnvironment", () => {
    it("should return true when isAgenticTui returns true", () => {
      vi.mocked(isAgenticTui).mockReturnValue(true);
      expect(isAgentEnvironment()).toBe(true);
      expect(isAgenticTui).toHaveBeenCalledWith();
      expect(isAgenticTui).toHaveBeenCalledTimes(1);
    });

    it("should return false when isAgenticTui returns false", () => {
      vi.mocked(isAgenticTui).mockReturnValue(false);
      expect(isAgentEnvironment()).toBe(false);
      expect(isAgenticTui).toHaveBeenCalledWith();
      expect(isAgenticTui).toHaveBeenCalledTimes(1);
    });

    it("should return a boolean type", () => {
      vi.mocked(isAgenticTui).mockReturnValue(true);
      expect(typeof isAgentEnvironment()).toBe("boolean");
    });
  });

  describe("getAgentInfo", () => {
    it("should return result from whichAgenticTui", () => {
      const mockResult = { name: "claude-code", version: "1.0.0" };
      vi.mocked(whichAgenticTui).mockReturnValue(mockResult);
      expect(getAgentInfo()).toEqual(mockResult);
      expect(whichAgenticTui).toHaveBeenCalledWith();
      expect(whichAgenticTui).toHaveBeenCalledTimes(1);
    });

    it("should return null when not in agent environment", () => {
      vi.mocked(whichAgenticTui).mockReturnValue(null);
      expect(getAgentInfo()).toBeNull();
      expect(whichAgenticTui).toHaveBeenCalledWith();
    });

    it("should handle different agent info structures", () => {
      const mockResult = {
        name: "cursor-agent",
        version: "2.0.0",
        extra: "field",
      };
      vi.mocked(whichAgenticTui).mockReturnValue(mockResult);
      expect(getAgentInfo()).toEqual(mockResult);
    });
  });

  describe("getAgentDiagramPadding", () => {
    it("should return exactly AGENT_DIAGRAM_PADDING_LINES newline characters when in agent environment", () => {
      vi.mocked(isAgenticTui).mockReturnValue(true);
      const padding = getAgentDiagramPadding();
      // Test against the constant to be resilient to changes
      expect(padding).toBe("\n".repeat(AGENT_DIAGRAM_PADDING_LINES));
      expect(padding.length).toBe(AGENT_DIAGRAM_PADDING_LINES);
      // Verify all characters are newlines
      expect(padding.split("").every((char) => char === "\n")).toBe(true);
    });

    it("should return empty string when not in agent environment", () => {
      vi.mocked(isAgenticTui).mockReturnValue(false);
      const padding = getAgentDiagramPadding();
      expect(padding).toBe("");
      expect(padding.length).toBe(0);
    });

    it("should return a string type", () => {
      vi.mocked(isAgenticTui).mockReturnValue(false);
      expect(typeof getAgentDiagramPadding()).toBe("string");
    });

    it("should call isAgenticTui to determine environment", () => {
      vi.mocked(isAgenticTui).mockReturnValue(false);
      getAgentDiagramPadding();
      expect(isAgenticTui).toHaveBeenCalledTimes(1);
    });
  });

  describe("integration scenarios", () => {
    it("should provide padding only in agent environments", () => {
      vi.mocked(isAgenticTui).mockReturnValue(true);
      expect(isAgentEnvironment()).toBe(true);
      expect(getAgentDiagramPadding()).not.toBe("");

      vi.resetAllMocks();
      vi.mocked(isAgenticTui).mockReturnValue(false);
      expect(isAgentEnvironment()).toBe(false);
      expect(getAgentDiagramPadding()).toBe("");
    });
  });
});
