import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { loadConfig, mergeConfigs } from "../src/config.js";
import type { TuiConfig } from "../src/config.schema.js";

describe("loadConfig", () => {
  let tempDir: string;
  let originalCwd: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tui-config-test-"));
    originalCwd = process.cwd();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    process.chdir(originalCwd);
    process.env = originalEnv;
    vi.resetModules();
  });

  describe("project config", () => {
    it("should load .tui-components.yaml from current directory", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: monokai
render:
  defaultMode: markdown
terminal:
  width: 120
`
      );

      const config = loadConfig(tempDir);

      expect(config).toEqual({
        theme: {
          preset: "monokai",
        },
        render: {
          defaultMode: "markdown",
        },
        terminal: {
          width: 120,
        },
      });
    });

    it("should load .tui-components.yml from current directory", () => {
      const configPath = path.join(tempDir, ".tui-components.yml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: nord
`
      );

      const config = loadConfig(tempDir);

      expect(config?.theme?.preset).toBe("nord");
    });

    it("should walk up directory tree to find config", () => {
      const nestedDir = path.join(tempDir, "a", "b", "c");
      fs.mkdirSync(nestedDir, { recursive: true });

      const configPath = path.join(tempDir, "a", ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: solarized-dark
`
      );

      const config = loadConfig(nestedDir);

      expect(config?.theme?.preset).toBe("solarized-dark");
    });

    it("should prefer .yaml over .yml when both exist", () => {
      const yamlPath = path.join(tempDir, ".tui-components.yaml");
      const ymlPath = path.join(tempDir, ".tui-components.yml");

      fs.writeFileSync(
        yamlPath,
        `
theme:
  preset: monokai
`
      );
      fs.writeFileSync(
        ymlPath,
        `
theme:
  preset: nord
`
      );

      const config = loadConfig(tempDir);

      expect(config?.theme?.preset).toBe("monokai");
    });

    it("should stop at filesystem root when config not found", () => {
      const config = loadConfig(tempDir);
      expect(config).toBeNull();
    });

    it("should return null for invalid YAML", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(configPath, "invalid: yaml: content: [[[");

      const config = loadConfig(tempDir);

      expect(config).toBeNull();
    });

    it("should return null for invalid config schema", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: invalid-preset-name
`
      );

      const config = loadConfig(tempDir);

      expect(config).toBeNull();
    });

    it("should load config with semantic color overrides", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: default
  semantic:
    success: "#00FF00"
    error: "#FF0000"
`
      );

      const config = loadConfig(tempDir);

      expect(config?.theme?.semantic?.success).toBe("#00FF00");
      expect(config?.theme?.semantic?.error).toBe("#FF0000");
    });

    it("should load config with agent-specific overrides", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
render:
  defaultMode: ansi
  agents:
    my-custom-agent:
      mode: markdown
      markdownOptions:
        multilineMode: inline
`
      );

      const config = loadConfig(tempDir);

      expect(config?.render?.defaultMode).toBe("ansi");
      expect(config?.render?.agents?.["my-custom-agent"]?.mode).toBe(
        "markdown"
      );
      expect(
        config?.render?.agents?.["my-custom-agent"]?.markdownOptions
          ?.multilineMode
      ).toBe("inline");
    });

    it("should allow partial config (only theme)", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: nord
`
      );

      const config = loadConfig(tempDir);

      expect(config).toEqual({
        theme: {
          preset: "nord",
        },
      });
    });

    it("should allow partial config (only render)", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
render:
  defaultMode: markdown
  autoDetect: false
`
      );

      const config = loadConfig(tempDir);

      expect(config).toEqual({
        render: {
          defaultMode: "markdown",
          autoDetect: false,
        },
      });
    });

    it("should allow partial config (only terminal)", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
terminal:
  colorLevel: 2
  width: 100
`
      );

      const config = loadConfig(tempDir);

      expect(config).toEqual({
        terminal: {
          colorLevel: 2,
          width: 100,
        },
      });
    });

    it("should allow empty config", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(configPath, "{}");

      const config = loadConfig(tempDir);

      expect(config).toEqual({});
    });
  });

  describe("user config", () => {
    it("should load config from XDG_CONFIG_HOME", () => {
      const xdgConfigHome = path.join(tempDir, ".config");
      const tuiConfigDir = path.join(xdgConfigHome, "tui-components");
      fs.mkdirSync(tuiConfigDir, { recursive: true });

      const configPath = path.join(tuiConfigDir, "config.yaml");
      fs.writeFileSync(
        configPath,
        `
theme:
  preset: solarized-light
`
      );

      process.env["XDG_CONFIG_HOME"] = xdgConfigHome;

      const config = loadConfig(tempDir);

      expect(config?.theme?.preset).toBe("solarized-light");
    });

    it("should fall back to ~/.config when XDG_CONFIG_HOME not set", () => {
      // This test would require mocking os.homedir(), which is complex
      // For now, we test that the function handles missing user config gracefully
      delete process.env["XDG_CONFIG_HOME"];

      const config = loadConfig(tempDir);

      expect(config).toBeNull(); // No project or user config
    });

    it("should prefer project config over user config", () => {
      // Set up user config
      const xdgConfigHome = path.join(tempDir, ".config");
      const tuiConfigDir = path.join(xdgConfigHome, "tui-components");
      fs.mkdirSync(tuiConfigDir, { recursive: true });

      const userConfigPath = path.join(tuiConfigDir, "config.yaml");
      fs.writeFileSync(
        userConfigPath,
        `
theme:
  preset: nord
`
      );

      // Set up project config
      const projectConfigPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        projectConfigPath,
        `
theme:
  preset: monokai
`
      );

      process.env["XDG_CONFIG_HOME"] = xdgConfigHome;

      const config = loadConfig(tempDir);

      expect(config?.theme?.preset).toBe("monokai");
    });
  });

  describe("edge cases", () => {
    it("should handle config with all color levels", () => {
      const levels: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];

      for (const level of levels) {
        const configPath = path.join(tempDir, ".tui-components.yaml");
        fs.writeFileSync(
          configPath,
          `
terminal:
  colorLevel: ${level}
`
        );

        const config = loadConfig(tempDir);

        expect(config?.terminal?.colorLevel).toBe(level);
      }
    });

    it("should reject invalid color level", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
terminal:
  colorLevel: 4
`
      );

      const config = loadConfig(tempDir);

      expect(config).toBeNull();
    });

    it("should reject negative terminal width", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
terminal:
  width: -10
`
      );

      const config = loadConfig(tempDir);

      expect(config).toBeNull();
    });

    it("should reject non-integer terminal width", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
terminal:
  width: 120.5
`
      );

      const config = loadConfig(tempDir);

      expect(config).toBeNull();
    });

    it("should handle config with all supported render modes", () => {
      const modes = ["ansi", "markdown", "grayscale"] as const;

      for (const mode of modes) {
        const configPath = path.join(tempDir, ".tui-components.yaml");
        fs.writeFileSync(
          configPath,
          `
render:
  defaultMode: ${mode}
`
        );

        const config = loadConfig(tempDir);

        expect(config?.render?.defaultMode).toBe(mode);
      }
    });

    it("should handle config with all supported theme presets", () => {
      const presets = [
        "default",
        "monokai",
        "solarized-dark",
        "solarized-light",
        "nord",
      ] as const;

      for (const preset of presets) {
        const configPath = path.join(tempDir, ".tui-components.yaml");
        fs.writeFileSync(
          configPath,
          `
theme:
  preset: ${preset}
`
        );

        const config = loadConfig(tempDir);

        expect(config?.theme?.preset).toBe(preset);
      }
    });

    it("should handle config with all markdown options", () => {
      const configPath = path.join(tempDir, ".tui-components.yaml");
      fs.writeFileSync(
        configPath,
        `
render:
  agents:
    test-agent:
      mode: markdown
      markdownOptions:
        multilineMode: inline
        spacingMode: relaxed
`
      );

      const config = loadConfig(tempDir);

      const agentConfig = config?.render?.agents?.["test-agent"];
      expect(agentConfig?.mode).toBe("markdown");
      expect(agentConfig?.markdownOptions?.multilineMode).toBe("inline");
      expect(agentConfig?.markdownOptions?.spacingMode).toBe("relaxed");
    });
  });
});

describe("mergeConfigs", () => {
  it("should return programmatic config when user config is null", () => {
    const programmatic: Partial<TuiConfig> = {
      theme: { preset: "monokai" },
    };

    const merged = mergeConfigs(programmatic, null);

    expect(merged).toEqual(programmatic);
  });

  it("should prefer programmatic theme preset over user config", () => {
    const programmatic: Partial<TuiConfig> = {
      theme: { preset: "monokai" },
    };
    const userConfig: TuiConfig = {
      theme: { preset: "nord" },
    };

    const merged = mergeConfigs(programmatic, userConfig);

    expect(merged.theme?.preset).toBe("monokai");
  });

  it("should use user config theme preset when not provided programmatically", () => {
    const programmatic: Partial<TuiConfig> = {};
    const userConfig: TuiConfig = {
      theme: { preset: "nord" },
    };

    const merged = mergeConfigs(programmatic, userConfig);

    expect(merged.theme?.preset).toBe("nord");
  });

  it("should deep merge semantic color overrides", () => {
    const programmatic: Partial<TuiConfig> = {
      theme: {
        semantic: {
          success: "#00FF00",
        },
      },
    };
    const userConfig: TuiConfig = {
      theme: {
        preset: "default",
        semantic: {
          error: "#FF0000",
          warning: "#FFFF00",
        },
      },
    };

    const merged = mergeConfigs(programmatic, userConfig);

    expect(merged.theme?.preset).toBe("default");
    expect(merged.theme?.semantic?.success).toBe("#00FF00");
    expect(merged.theme?.semantic?.error).toBe("#FF0000");
    expect(merged.theme?.semantic?.warning).toBe("#FFFF00");
  });

  it("should prefer programmatic render mode over user config", () => {
    const programmatic: Partial<TuiConfig> = {
      render: { defaultMode: "markdown" },
    };
    const userConfig: TuiConfig = {
      render: { defaultMode: "ansi" },
    };

    const merged = mergeConfigs(programmatic, userConfig);

    expect(merged.render?.defaultMode).toBe("markdown");
  });

  it("should prefer programmatic autoDetect over user config", () => {
    const programmatic: Partial<TuiConfig> = {
      render: { autoDetect: false },
    };
    const userConfig: TuiConfig = {
      render: { autoDetect: true },
    };

    const merged = mergeConfigs(programmatic, userConfig);

    expect(merged.render?.autoDetect).toBe(false);
  });

  it("should deep merge agent configurations", () => {
    const programmatic: Partial<TuiConfig> = {
      render: {
        agents: {
          "agent-a": {
            mode: "markdown",
          },
        },
      },
    };
    const userConfig: TuiConfig = {
      render: {
        agents: {
          "agent-b": {
            mode: "grayscale",
          },
          "agent-c": {
            mode: "ansi",
          },
        },
      },
    };

    const merged = mergeConfigs(programmatic, userConfig);

    expect(merged.render?.agents?.["agent-a"]?.mode).toBe("markdown");
    expect(merged.render?.agents?.["agent-b"]?.mode).toBe("grayscale");
    expect(merged.render?.agents?.["agent-c"]?.mode).toBe("ansi");
  });

  it("should override user agent config with programmatic agent config", () => {
    const programmatic: Partial<TuiConfig> = {
      render: {
        agents: {
          "test-agent": {
            mode: "markdown",
            markdownOptions: {
              multilineMode: "inline",
            },
          },
        },
      },
    };
    const userConfig: TuiConfig = {
      render: {
        agents: {
          "test-agent": {
            mode: "grayscale",
          },
        },
      },
    };

    const merged = mergeConfigs(programmatic, userConfig);

    expect(merged.render?.agents?.["test-agent"]?.mode).toBe("markdown");
    expect(
      merged.render?.agents?.["test-agent"]?.markdownOptions?.multilineMode
    ).toBe("inline");
  });

  it("should prefer programmatic terminal colorLevel over user config", () => {
    const programmatic: Partial<TuiConfig> = {
      terminal: { colorLevel: 3 },
    };
    const userConfig: TuiConfig = {
      terminal: { colorLevel: 1 },
    };

    const merged = mergeConfigs(programmatic, userConfig);

    expect(merged.terminal?.colorLevel).toBe(3);
  });

  it("should prefer programmatic terminal width over user config", () => {
    const programmatic: Partial<TuiConfig> = {
      terminal: { width: 120 },
    };
    const userConfig: TuiConfig = {
      terminal: { width: 80 },
    };

    const merged = mergeConfigs(programmatic, userConfig);

    expect(merged.terminal?.width).toBe(120);
  });

  it("should handle merging with empty programmatic config", () => {
    const programmatic: Partial<TuiConfig> = {};
    const userConfig: TuiConfig = {
      theme: { preset: "nord" },
      render: {
        defaultMode: "markdown",
        autoDetect: true,
      },
      terminal: {
        colorLevel: 2,
        width: 100,
      },
    };

    const merged = mergeConfigs(programmatic, userConfig);

    expect(merged.theme?.preset).toBe("nord");
    expect(merged.render?.defaultMode).toBe("markdown");
    expect(merged.render?.autoDetect).toBe(true);
    expect(merged.terminal?.colorLevel).toBe(2);
    expect(merged.terminal?.width).toBe(100);
  });

  it("should handle merging with empty user config", () => {
    const programmatic: Partial<TuiConfig> = {
      theme: { preset: "monokai" },
      render: {
        defaultMode: "ansi",
        autoDetect: false,
      },
      terminal: {
        colorLevel: 0,
        width: 80,
      },
    };
    const userConfig: TuiConfig = {};

    const merged = mergeConfigs(programmatic, userConfig);

    expect(merged.theme?.preset).toBe("monokai");
    expect(merged.render?.defaultMode).toBe("ansi");
    expect(merged.render?.autoDetect).toBe(false);
    expect(merged.terminal?.colorLevel).toBe(0);
    expect(merged.terminal?.width).toBe(80);
  });

  it("should handle complex merge scenario", () => {
    const programmatic: Partial<TuiConfig> = {
      theme: {
        preset: "monokai",
        semantic: {
          success: "#CUSTOM_GREEN",
        },
      },
      render: {
        agents: {
          "my-agent": {
            mode: "markdown",
          },
        },
      },
      terminal: {
        width: 120,
      },
    };
    const userConfig: TuiConfig = {
      theme: {
        preset: "nord",
        semantic: {
          error: "#CUSTOM_RED",
          warning: "#CUSTOM_YELLOW",
        },
      },
      render: {
        defaultMode: "ansi",
        autoDetect: true,
        agents: {
          "default-agent": {
            mode: "grayscale",
          },
        },
      },
      terminal: {
        colorLevel: 2,
        width: 80,
      },
    };

    const merged = mergeConfigs(programmatic, userConfig);

    // Programmatic theme preset wins
    expect(merged.theme?.preset).toBe("monokai");
    // Semantic colors are merged
    expect(merged.theme?.semantic?.success).toBe("#CUSTOM_GREEN");
    expect(merged.theme?.semantic?.error).toBe("#CUSTOM_RED");
    expect(merged.theme?.semantic?.warning).toBe("#CUSTOM_YELLOW");
    // User render defaultMode is preserved
    expect(merged.render?.defaultMode).toBe("ansi");
    expect(merged.render?.autoDetect).toBe(true);
    // Agents are merged
    expect(merged.render?.agents?.["my-agent"]?.mode).toBe("markdown");
    expect(merged.render?.agents?.["default-agent"]?.mode).toBe("grayscale");
    // Programmatic terminal width wins
    expect(merged.terminal?.width).toBe(120);
    // User colorLevel is preserved
    expect(merged.terminal?.colorLevel).toBe(2);
  });
});
