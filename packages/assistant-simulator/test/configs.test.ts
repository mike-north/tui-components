import { describe, it, expect } from "vitest";
import {
  getConfig,
  getAllConfigs,
  getAssistantIds,
  claudeCodeConfig,
  githubCopilotConfig,
  clineConfig,
  codexConfig,
  geminiCliConfig,
  kiroCliConfig,
  opencodeConfig,
} from "../src/configs/index.js";

describe("config exports", () => {
  it("should export claudeCodeConfig", () => {
    expect(claudeCodeConfig).toBeDefined();
    expect(claudeCodeConfig.id).toBe("claude-code");
    expect(claudeCodeConfig.displayName).toBe("Claude Code");
  });

  it("should export githubCopilotConfig", () => {
    expect(githubCopilotConfig).toBeDefined();
    expect(githubCopilotConfig.id).toBe("github-copilot");
    expect(githubCopilotConfig.displayName).toBe("GitHub Copilot");
  });

  it("should export clineConfig", () => {
    expect(clineConfig).toBeDefined();
    expect(clineConfig.id).toBe("cline");
    expect(clineConfig.displayName).toBe("Cline");
  });

  it("should export codexConfig", () => {
    expect(codexConfig).toBeDefined();
    expect(codexConfig.id).toBe("codex");
    expect(codexConfig.displayName).toBe("Codex");
  });

  it("should export geminiCliConfig", () => {
    expect(geminiCliConfig).toBeDefined();
    expect(geminiCliConfig.id).toBe("gemini-cli");
    expect(geminiCliConfig.displayName).toBe("Gemini CLI");
  });

  it("should export kiroCliConfig", () => {
    expect(kiroCliConfig).toBeDefined();
    expect(kiroCliConfig.id).toBe("kiro-cli");
    expect(kiroCliConfig.displayName).toBe("Kiro CLI");
  });

  it("should export opencodeConfig", () => {
    expect(opencodeConfig).toBeDefined();
    expect(opencodeConfig.id).toBe("opencode");
    expect(opencodeConfig.displayName).toBe("OpenCode");
  });
});

describe("getConfig", () => {
  it("should retrieve config by ID", () => {
    const config = getConfig("claude-code");
    expect(config.id).toBe("claude-code");
    expect(config.displayName).toBe("Claude Code");
  });

  it("should retrieve all available configs", () => {
    expect(getConfig("claude-code")).toBeDefined();
    expect(getConfig("github-copilot")).toBeDefined();
    expect(getConfig("cline")).toBeDefined();
    expect(getConfig("codex")).toBeDefined();
    expect(getConfig("gemini-cli")).toBeDefined();
    expect(getConfig("kiro-cli")).toBeDefined();
    expect(getConfig("opencode")).toBeDefined();
  });

  it("should throw error for unknown assistant ID", () => {
    expect(() => getConfig("unknown-assistant")).toThrow(
      "Unknown assistant: unknown-assistant"
    );
  });

  it("should include available assistants in error message", () => {
    expect(() => getConfig("invalid")).toThrow(/Available:/);
  });
});

describe("getAllConfigs", () => {
  it("should return all configs", () => {
    const configs = getAllConfigs();
    expect(configs).toHaveLength(7);
  });

  it("should return readonly array", () => {
    const configs = getAllConfigs();
    expect(Array.isArray(configs)).toBe(true);
  });

  it("should include all known assistants", () => {
    const configs = getAllConfigs();
    const ids = configs.map((c) => c.id);

    expect(ids).toContain("claude-code");
    expect(ids).toContain("github-copilot");
    expect(ids).toContain("cline");
    expect(ids).toContain("codex");
    expect(ids).toContain("gemini-cli");
    expect(ids).toContain("kiro-cli");
    expect(ids).toContain("opencode");
  });
});

describe("getAssistantIds", () => {
  it("should return all assistant IDs", () => {
    const ids = getAssistantIds();
    expect(ids).toHaveLength(7);
  });

  it("should include all known IDs", () => {
    const ids = getAssistantIds();

    expect(ids).toContain("claude-code");
    expect(ids).toContain("github-copilot");
    expect(ids).toContain("cline");
    expect(ids).toContain("codex");
    expect(ids).toContain("gemini-cli");
    expect(ids).toContain("kiro-cli");
    expect(ids).toContain("opencode");
  });

  it("should return readonly array", () => {
    const ids = getAssistantIds();
    expect(Array.isArray(ids)).toBe(true);
  });
});

describe("config structure validation", () => {
  it("should have valid structure for all configs", () => {
    const configs = getAllConfigs();

    for (const config of configs) {
      // Check top-level properties
      expect(config.id).toBeDefined();
      expect(typeof config.id).toBe("string");
      expect(config.displayName).toBeDefined();
      expect(typeof config.displayName).toBe("string");
      expect(config.contexts).toBeDefined();

      // Check command context
      expect(config.contexts.command).toBeDefined();
      expect(config.contexts.command.ansi).toBeDefined();
      expect(config.contexts.command.markdown).toBeDefined();
      expect(config.contexts.command.structure).toBeDefined();

      // Check chat context
      expect(config.contexts.chat).toBeDefined();
      expect(config.contexts.chat.ansi).toBeDefined();
      expect(config.contexts.chat.markdown).toBeDefined();
      expect(config.contexts.chat.structure).toBeDefined();
    }
  });

  it("should have valid ANSI support values", () => {
    const configs = getAllConfigs();
    const validSupport = ["none", "basic", "256", "truecolor"];

    for (const config of configs) {
      expect(validSupport).toContain(config.contexts.command.ansi.support);
      expect(validSupport).toContain(config.contexts.chat.ansi.support);
    }
  });

  it("should have valid newline handling values", () => {
    const configs = getAllConfigs();
    const validHandling = ["full", "collapsed"];

    for (const config of configs) {
      expect(validHandling).toContain(
        config.contexts.command.structure.newlineHandling
      );
      expect(validHandling).toContain(
        config.contexts.chat.structure.newlineHandling
      );
    }
  });

  it("should have non-negative truncation lines", () => {
    const configs = getAllConfigs();

    for (const config of configs) {
      expect(
        config.contexts.command.structure.truncationLines
      ).toBeGreaterThanOrEqual(0);
      expect(
        config.contexts.chat.structure.truncationLines
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it("should have boolean markdown flags", () => {
    const configs = getAllConfigs();

    for (const config of configs) {
      expect(typeof config.contexts.command.markdown.backtickHighlight).toBe(
        "boolean"
      );
      expect(typeof config.contexts.command.markdown.boldRendering).toBe(
        "boolean"
      );
      expect(typeof config.contexts.chat.markdown.backtickHighlight).toBe(
        "boolean"
      );
      expect(typeof config.contexts.chat.markdown.boldRendering).toBe(
        "boolean"
      );
    }
  });
});

describe("specific config behaviors", () => {
  it("Claude Code should truncate command output to 3 lines", () => {
    expect(claudeCodeConfig.contexts.command.structure.truncationLines).toBe(3);
  });

  it("Claude Code should not truncate chat output", () => {
    expect(claudeCodeConfig.contexts.chat.structure.truncationLines).toBe(0);
  });

  it("GitHub Copilot should collapse newlines", () => {
    expect(githubCopilotConfig.contexts.command.structure.newlineHandling).toBe(
      "collapsed"
    );
    expect(githubCopilotConfig.contexts.chat.structure.newlineHandling).toBe(
      "collapsed"
    );
  });

  it("Cline should not highlight backticks", () => {
    expect(clineConfig.contexts.command.markdown.backtickHighlight).toBe(false);
    expect(clineConfig.contexts.chat.markdown.backtickHighlight).toBe(false);
  });

  it("Codex should support truecolor ANSI", () => {
    expect(codexConfig.contexts.command.ansi.support).toBe("truecolor");
    expect(codexConfig.contexts.chat.ansi.support).toBe("truecolor");
  });

  it("Gemini CLI should support basic ANSI", () => {
    expect(geminiCliConfig.contexts.command.ansi.support).toBe("basic");
    expect(geminiCliConfig.contexts.chat.ansi.support).toBe("basic");
  });

  it("Kiro CLI should support 256 color ANSI", () => {
    expect(kiroCliConfig.contexts.command.ansi.support).toBe("256");
    expect(kiroCliConfig.contexts.chat.ansi.support).toBe("256");
  });

  it("most assistants should strip ANSI codes", () => {
    expect(claudeCodeConfig.contexts.command.ansi.support).toBe("none");
    expect(githubCopilotConfig.contexts.command.ansi.support).toBe("none");
    expect(clineConfig.contexts.command.ansi.support).toBe("none");
    expect(opencodeConfig.contexts.command.ansi.support).toBe("none");
  });
});
