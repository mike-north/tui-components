import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { parse as parseYaml } from "yaml";
import { tuiConfigSchema, type TuiConfig } from "./config.schema.js";

/**
 * Filenames to search for in project directories.
 */
const CONFIG_FILENAMES = [".tui-components.yaml", ".tui-components.yml"];

/**
 * Path to user config file within XDG_CONFIG_HOME.
 */
const XDG_CONFIG_PATH = "tui-components/config.yaml";

/**
 * Search for config file starting from cwd, walking up to filesystem root.
 *
 * @param startDir - Directory to start searching from
 * @returns Path to config file, or null if not found
 */
function findProjectConfig(startDir: string): string | null {
  let dir = startDir;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    for (const filename of CONFIG_FILENAMES) {
      const configPath = path.join(dir, filename);
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break; // Reached filesystem root
    }
    dir = parent;
  }
  return null;
}

/**
 * Get user config path (~/.config/tui-components/config.yaml).
 *
 * @returns Path to user config file
 */
function getUserConfigPath(): string {
  const xdgConfig =
    process.env["XDG_CONFIG_HOME"] ?? path.join(os.homedir(), ".config");
  return path.join(xdgConfig, XDG_CONFIG_PATH);
}

/**
 * Load and parse a config file.
 *
 * @param configPath - Path to the config file
 * @returns Parsed and validated config, or null if loading/parsing fails
 */
function loadConfigFile(configPath: string): TuiConfig | null {
  try {
    const content = fs.readFileSync(configPath, "utf-8");
    const parsed: unknown = parseYaml(content);
    const validated = tuiConfigSchema.parse(parsed);
    return validated;
  } catch {
    // Silently ignore parse/validation errors
    return null;
  }
}

/**
 * Load user configuration from project or user config files.
 *
 * Priority order:
 * 1. Project config (.tui-components.yaml in cwd or parent directories)
 * 2. User config (~/.config/tui-components/config.yaml)
 *
 * @param cwd - Current working directory to start search from
 * @returns Loaded configuration, or null if no valid config found
 *
 * @example
 * ```ts
 * const config = loadConfig();
 * if (config?.theme?.preset) {
 *   console.log(`Using theme: ${config.theme.preset}`);
 * }
 * ```
 *
 * @public
 */
export function loadConfig(cwd: string = process.cwd()): TuiConfig | null {
  // Try project config first
  const projectConfigPath = findProjectConfig(cwd);
  if (projectConfigPath) {
    const config = loadConfigFile(projectConfigPath);
    if (config) {
      return config;
    }
  }

  // Fall back to user config
  const userConfigPath = getUserConfigPath();
  if (fs.existsSync(userConfigPath)) {
    return loadConfigFile(userConfigPath);
  }

  return null;
}

/**
 * Merge loaded config with programmatic options.
 *
 * Programmatic options take precedence over loaded config.
 * Deep merges nested objects (theme.semantic, render.agents).
 *
 * @param programmatic - Options provided programmatically
 * @param userConfig - Config loaded from files
 * @returns Merged configuration
 *
 * @example
 * ```ts
 * const fileConfig = loadConfig();
 * const merged = mergeConfigs(
 *   { render: { defaultMode: "markdown" } },
 *   fileConfig
 * );
 * ```
 *
 * @public
 */
export function mergeConfigs(
  programmatic: Partial<TuiConfig>,
  userConfig: TuiConfig | null
): TuiConfig {
  if (!userConfig) {
    return programmatic as TuiConfig;
  }

  return {
    theme: {
      preset: programmatic.theme?.preset ?? userConfig.theme?.preset,
      semantic: {
        ...userConfig.theme?.semantic,
        ...programmatic.theme?.semantic,
      },
    },
    render: {
      defaultMode:
        programmatic.render?.defaultMode ?? userConfig.render?.defaultMode,
      autoDetect:
        programmatic.render?.autoDetect ?? userConfig.render?.autoDetect,
      agents: {
        ...userConfig.render?.agents,
        ...programmatic.render?.agents,
      },
    },
    terminal: {
      colorLevel:
        programmatic.terminal?.colorLevel ?? userConfig.terminal?.colorLevel,
      width: programmatic.terminal?.width ?? userConfig.terminal?.width,
    },
  };
}
