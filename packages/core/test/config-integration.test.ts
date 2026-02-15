import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { loadConfig, mergeConfigs } from "../src/config.js";
import { createRenderContext } from "../src/terminal.js";
import { getThemePreset } from "../src/theme.js";

/**
 * Integration tests demonstrating how the config system works with the rest of the core package.
 */
describe("config integration", () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tui-config-integration-"));
    originalCwd = process.cwd();
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    process.chdir(originalCwd);
  });

  it("should load config and use it to customize render context", () => {
    // Create a config file
    const configPath = path.join(tempDir, ".tui-components.yaml");
    fs.writeFileSync(
      configPath,
      `
render:
  defaultMode: markdown
  agents:
    test-agent:
      mode: grayscale
terminal:
  width: 100
  colorLevel: 2
`
    );

    // Load the config
    const config = loadConfig(tempDir);
    expect(config).not.toBeNull();

    // In a real application, you would:
    // 1. Load the config
    // 2. Extract the relevant settings
    // 3. Pass them to createRenderContext

    // Get agent-specific config if available
    const agentConfig = config?.render?.agents?.["test-agent"];

    // Use the config to create a render context
    const ctx = createRenderContext({
      width: config?.terminal?.width,
      renderMode: agentConfig?.mode ?? config?.render?.defaultMode,
      markdownOptions: agentConfig?.markdownOptions,
    });

    // Verify the config was applied
    expect(ctx.width).toBe(100);
    expect(ctx.renderMode).toBe("grayscale");
  });

  it("should merge programmatic options with file config", () => {
    // Create a config file with defaults
    const configPath = path.join(tempDir, ".tui-components.yaml");
    fs.writeFileSync(
      configPath,
      `
theme:
  preset: nord
render:
  defaultMode: ansi
terminal:
  width: 80
`
    );

    // Load the file config
    const fileConfig = loadConfig(tempDir);

    // Merge with programmatic overrides
    const merged = mergeConfigs(
      {
        render: {
          defaultMode: "markdown",
        },
        terminal: {
          width: 120,
        },
      },
      fileConfig
    );

    // Verify the merge
    expect(merged.theme?.preset).toBe("nord"); // From file
    expect(merged.render?.defaultMode).toBe("markdown"); // Programmatic override
    expect(merged.terminal?.width).toBe(120); // Programmatic override
  });

  it("should validate config schema and reject invalid values", () => {
    // Create an invalid config file
    const configPath = path.join(tempDir, ".tui-components.yaml");
    fs.writeFileSync(
      configPath,
      `
render:
  defaultMode: invalid-mode
`
    );

    // Load the config - should return null for invalid config
    const config = loadConfig(tempDir);
    expect(config).toBeNull();
  });

  it("should handle missing config gracefully", () => {
    // Try to load config from directory with no config file
    const config = loadConfig(tempDir);
    expect(config).toBeNull();

    // Should still be able to create render context with defaults
    const ctx = createRenderContext();
    expect(ctx.width).toBeGreaterThan(0);
  });

  it("should support agent-specific overrides", () => {
    // Create config with agent-specific settings
    const configPath = path.join(tempDir, ".tui-components.yaml");
    fs.writeFileSync(
      configPath,
      `
render:
  defaultMode: ansi
  agents:
    github-copilot:
      mode: markdown
      markdownOptions:
        multilineMode: inline
    cline:
      mode: grayscale
`
    );

    const config = loadConfig(tempDir);

    // Verify agent configs
    expect(config?.render?.defaultMode).toBe("ansi");
    expect(config?.render?.agents?.["github-copilot"]?.mode).toBe("markdown");
    expect(
      config?.render?.agents?.["github-copilot"]?.markdownOptions?.multilineMode
    ).toBe("inline");
    expect(config?.render?.agents?.["cline"]?.mode).toBe("grayscale");
  });

  describe("theme preset integration", () => {
    it("should load and apply theme preset from config", () => {
      // Create config with theme preset
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: monokai
terminal:
  colorLevel: 3
`
      );

      process.chdir(tempDir);

      // Create render context - should automatically load config
      const ctx = createRenderContext({
        renderMode: "ansi",
      });

      // Should have applied the monokai theme (colorLevel from config forces colors)
      expect(ctx.theme).toBeDefined();
      expect(ctx.colorLevel).toBe(3);

      // Verify theme produces output (colors are applied)
      const successOutput = ctx.theme?.semantic.success("test");
      expect(successOutput).toBeDefined();
      expect(successOutput).toContain("test");
    });

    it("should respect explicit theme option over config", () => {
      // Create config with monokai preset
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: monokai
terminal:
  colorLevel: 3
`
      );

      process.chdir(tempDir);

      // Explicitly provide nord theme
      const nordTheme = getThemePreset("nord");
      const ctx = createRenderContext({
        theme: nordTheme,
        renderMode: "ansi",
      });

      // Should use the explicit theme, not config theme
      expect(ctx.theme).toBe(nordTheme);
      expect(ctx.colorLevel).toBe(3);
    });

    it("should not apply theme in non-ansi modes", () => {
      // Create config with theme preset
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: nord
`
      );

      process.chdir(tempDir);

      // Create render context in markdown mode
      const ctx = createRenderContext({
        renderMode: "markdown",
      });

      // Should not have theme in markdown mode
      expect(ctx.theme).toBeUndefined();
      expect(ctx.renderMode).toBe("markdown");
    });

    it("should disable config loading when loadUserConfig is false", () => {
      // Create config with theme preset
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: monokai
render:
  defaultMode: markdown
terminal:
  colorLevel: 3
`
      );

      process.chdir(tempDir);

      // Create render context with config loading disabled
      const ctx = createRenderContext({
        loadUserConfig: false,
        renderMode: "ansi",
        userConfig: {
          terminal: { colorLevel: 3 },
        },
      });

      // Config should be ignored, using explicit userConfig instead
      expect(ctx.theme).toBeDefined();
      expect(ctx.renderMode).toBe("ansi");
      expect(ctx.colorLevel).toBe(3);
    });

    it("should use explicit userConfig option", () => {
      // Create a config file that should be ignored
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: monokai
`
      );

      process.chdir(tempDir);

      // Provide explicit config
      const ctx = createRenderContext({
        userConfig: {
          theme: { preset: "nord" },
          render: { defaultMode: "ansi" },
          terminal: { width: 100, colorLevel: 3 },
        },
        renderMode: "ansi",
      });

      // Should use explicit config (nord), not file config (monokai)
      expect(ctx.theme).toBeDefined();
      expect(ctx.width).toBe(100);
      expect(ctx.colorLevel).toBe(3);
    });

    it("should integrate theme preset with render mode from config", () => {
      // Create comprehensive config
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: solarized-dark
render:
  defaultMode: ansi
  autoDetect: false
terminal:
  width: 120
  colorLevel: 3
`
      );

      process.chdir(tempDir);

      // Create render context with config
      const ctx = createRenderContext();

      // All config settings should be applied
      expect(ctx.width).toBe(120);
      expect(ctx.renderMode).toBe("ansi");
      expect(ctx.colorLevel).toBe(3);
      expect(ctx.theme).toBeDefined();

      // Theme should work
      const successOutput = ctx.theme?.semantic.success("test");
      expect(successOutput).toBeDefined();
      expect(successOutput).toContain("test");
    });

    it("should handle agent override with theme config", () => {
      // Create config with agent override and theme
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: nord
render:
  defaultMode: ansi
  agents:
    test-agent:
      mode: markdown
`
      );

      process.chdir(tempDir);

      // Create render context with agent
      const ctx = createRenderContext({
        agent: "test-agent",
      });

      // Agent should override render mode to markdown
      expect(ctx.renderMode).toBe("markdown");

      // Theme should not be applied in markdown mode
      expect(ctx.theme).toBeUndefined();
    });

    it("should apply theme in ansi mode even with agent config", () => {
      // Create config with agent that uses ansi mode
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: monokai
render:
  agents:
    test-ansi-agent:
      mode: ansi
terminal:
  colorLevel: 3
`
      );

      process.chdir(tempDir);

      // Create render context with ansi agent
      const ctx = createRenderContext({
        agent: "test-ansi-agent",
      });

      // Should be in ansi mode with theme applied
      expect(ctx.renderMode).toBe("ansi");
      expect(ctx.theme).toBeDefined();
      expect(ctx.colorLevel).toBe(3);
    });
  });
});
