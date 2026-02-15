import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRenderContext } from "../src/terminal.js";

describe("createRenderContext", () => {
  describe("agent configuration", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset environment before each test
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should use grayscale mode for cline agent", () => {
      const ctx = createRenderContext({ agent: "cline" });
      expect(ctx.renderMode).toBe("grayscale");
    });

    it("should use markdown with inline mode for github-copilot agent", () => {
      const ctx = createRenderContext({ agent: "github-copilot" });
      expect(ctx.renderMode).toBe("markdown");
      expect(ctx.markdownOptions?.multilineMode).toBe("inline");
    });

    it("should use markdown with relaxed spacing for kiro-cli agent", () => {
      const ctx = createRenderContext({ agent: "kiro-cli" });
      expect(ctx.renderMode).toBe("markdown");
      expect(ctx.markdownOptions?.spacingMode).toBe("relaxed");
    });

    it("should use standard markdown for claude-code agent", () => {
      const ctx = createRenderContext({ agent: "claude-code" });
      expect(ctx.renderMode).toBe("markdown");
      expect(ctx.markdownOptions).toBeUndefined();
    });

    it("should use standard markdown for codex agent", () => {
      const ctx = createRenderContext({ agent: "codex" });
      expect(ctx.renderMode).toBe("markdown");
    });

    it("should use standard markdown for gemini-cli agent", () => {
      const ctx = createRenderContext({ agent: "gemini-cli" });
      expect(ctx.renderMode).toBe("markdown");
    });

    it("should use standard markdown for opencode agent", () => {
      const ctx = createRenderContext({ agent: "opencode" });
      expect(ctx.renderMode).toBe("markdown");
    });

    it("should read agent from TUI_AGENT environment variable", () => {
      process.env["TUI_AGENT"] = "cline";
      const ctx = createRenderContext();
      expect(ctx.renderMode).toBe("grayscale");
    });

    it("should prefer options.agent over TUI_AGENT env var", () => {
      process.env["TUI_AGENT"] = "cline";
      const ctx = createRenderContext({ agent: "github-copilot" });
      expect(ctx.renderMode).toBe("markdown");
      expect(ctx.markdownOptions?.multilineMode).toBe("inline");
    });

    it("should allow explicit markdownOptions to override agent config", () => {
      const ctx = createRenderContext({
        agent: "github-copilot",
        markdownOptions: { multilineMode: "full" },
      });
      expect(ctx.renderMode).toBe("markdown");
      expect(ctx.markdownOptions?.multilineMode).toBe("full");
    });

    it("should allow explicit renderMode to override agent config", () => {
      const ctx = createRenderContext({
        agent: "cline",
        renderMode: "markdown",
      });
      expect(ctx.renderMode).toBe("markdown");
    });

    it("should use ansi mode for unknown agents when autoDetectMode is false", () => {
      const ctx = createRenderContext({
        agent: "unknown-agent",
        autoDetectMode: false,
      });
      expect(ctx.renderMode).toBe("ansi");
    });
  });

  describe("style functions", () => {
    it("should provide grayscale style functions for cline agent", () => {
      const ctx = createRenderContext({ agent: "cline" });
      expect(ctx.style.secondary("test")).toBe("░test░");
    });

    it("should provide markdown style functions for github-copilot", () => {
      const ctx = createRenderContext({ agent: "github-copilot" });
      expect(ctx.style.secondary("test")).toBe(" `test`");
    });

    it("should provide relaxed markdown style functions for kiro-cli", () => {
      const ctx = createRenderContext({ agent: "kiro-cli" });
      expect(ctx.style.secondary("test")).toBe("  `test`");
    });
  });
});
