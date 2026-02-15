#!/usr/bin/env tsx

/**
 * Visual themes for AI assistant preview generation.
 *
 * Each assistant has its own color scheme and chrome elements
 * to create authentic-looking preview images.
 */

/**
 * Terminal color theme for rendering component output.
 */
export interface TerminalTheme {
  background: string;
  foreground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

/**
 * Chrome elements displayed around the terminal output.
 */
export interface ChromeConfig {
  /** Header text shown above the output */
  headerText: string;
  /** Color of the header text */
  headerColor: string;
  /** Optional icon (emoji or URL) */
  icon?: string;
  /** Border style: "rounded", "square", or "none" */
  borderStyle: "rounded" | "square" | "none";
  /** Border color */
  borderColor: string;
  /** Whether to show a simulated command input */
  showCommandPrompt: boolean;
  /** Command prompt prefix if shown */
  commandPrompt?: string;
}

/**
 * Complete visual theme for an assistant preview.
 */
export interface AssistantTheme {
  id: string;
  displayName: string;
  terminal: TerminalTheme;
  chrome: ChromeConfig;
}

/**
 * Default dark terminal theme (VS Code-like).
 */
const DEFAULT_TERMINAL_THEME: TerminalTheme = {
  background: "#1e1e1e",
  foreground: "#d4d4d4",
  black: "#000000",
  red: "#cd3131",
  green: "#0dbc79",
  yellow: "#e5e510",
  blue: "#2472c8",
  magenta: "#bc3fbc",
  cyan: "#11a8cd",
  white: "#e5e5e5",
  brightBlack: "#666666",
  brightRed: "#f14c4c",
  brightGreen: "#23d18b",
  brightYellow: "#f5f543",
  brightBlue: "#3b8eea",
  brightMagenta: "#d670d6",
  brightCyan: "#29b8db",
  brightWhite: "#e5e5e5",
};

/**
 * Claude Code theme - warm orange accent.
 */
export const claudeCodeTheme: AssistantTheme = {
  id: "claude-code",
  displayName: "Claude Code",
  terminal: {
    ...DEFAULT_TERMINAL_THEME,
    background: "#1a1b1e",
  },
  chrome: {
    headerText: "Claude Code",
    headerColor: "#f5a623",
    icon: "🤖",
    borderStyle: "rounded",
    borderColor: "#3d3d3d",
    showCommandPrompt: true,
    commandPrompt: "$ ",
  },
};

/**
 * GitHub Copilot theme - GitHub dark.
 */
export const githubCopilotTheme: AssistantTheme = {
  id: "github-copilot",
  displayName: "GitHub Copilot",
  terminal: {
    ...DEFAULT_TERMINAL_THEME,
    background: "#0d1117",
    foreground: "#c9d1d9",
  },
  chrome: {
    headerText: "GitHub Copilot",
    headerColor: "#58a6ff",
    icon: "🐙",
    borderStyle: "rounded",
    borderColor: "#30363d",
    showCommandPrompt: false,
  },
};

/**
 * Cline theme - purple accent.
 */
export const clineTheme: AssistantTheme = {
  id: "cline",
  displayName: "Cline",
  terminal: {
    ...DEFAULT_TERMINAL_THEME,
    background: "#1e1e2e",
  },
  chrome: {
    headerText: "Cline",
    headerColor: "#cba6f7",
    icon: "💜",
    borderStyle: "rounded",
    borderColor: "#45475a",
    showCommandPrompt: true,
    commandPrompt: "> ",
  },
};

/**
 * Codex theme - OpenAI green.
 */
export const codexTheme: AssistantTheme = {
  id: "codex",
  displayName: "Codex CLI",
  terminal: {
    ...DEFAULT_TERMINAL_THEME,
    background: "#0a0a0a",
  },
  chrome: {
    headerText: "Codex CLI",
    headerColor: "#10a37f",
    icon: "🧠",
    borderStyle: "square",
    borderColor: "#2d2d2d",
    showCommandPrompt: true,
    commandPrompt: "codex> ",
  },
};

/**
 * Gemini CLI theme - Google blue.
 */
export const geminiCliTheme: AssistantTheme = {
  id: "gemini-cli",
  displayName: "Gemini CLI",
  terminal: {
    ...DEFAULT_TERMINAL_THEME,
    background: "#1f1f1f",
  },
  chrome: {
    headerText: "Gemini CLI",
    headerColor: "#4285f4",
    icon: "✨",
    borderStyle: "rounded",
    borderColor: "#3c4043",
    showCommandPrompt: false,
  },
};

/**
 * Kiro CLI theme - AWS orange.
 */
export const kiroCliTheme: AssistantTheme = {
  id: "kiro-cli",
  displayName: "Kiro CLI",
  terminal: {
    ...DEFAULT_TERMINAL_THEME,
    background: "#161e2d",
  },
  chrome: {
    headerText: "Kiro CLI",
    headerColor: "#ff9900",
    icon: "🚀",
    borderStyle: "rounded",
    borderColor: "#243041",
    showCommandPrompt: true,
    commandPrompt: "kiro> ",
  },
};

/**
 * OpenCode theme - teal accent.
 */
export const opencodeTheme: AssistantTheme = {
  id: "opencode",
  displayName: "OpenCode",
  terminal: {
    ...DEFAULT_TERMINAL_THEME,
    background: "#1a1a2e",
  },
  chrome: {
    headerText: "OpenCode",
    headerColor: "#16c79a",
    icon: "⌨️",
    borderStyle: "rounded",
    borderColor: "#2d2d4a",
    showCommandPrompt: true,
    commandPrompt: "opencode> ",
  },
};

/**
 * All assistant themes indexed by ID.
 */
export const assistantThemes: Record<string, AssistantTheme> = {
  "claude-code": claudeCodeTheme,
  "github-copilot": githubCopilotTheme,
  cline: clineTheme,
  codex: codexTheme,
  "gemini-cli": geminiCliTheme,
  "kiro-cli": kiroCliTheme,
  opencode: opencodeTheme,
};

/**
 * Get theme by assistant ID.
 */
export function getAssistantTheme(assistantId: string): AssistantTheme {
  const theme = assistantThemes[assistantId];
  if (!theme) {
    throw new Error(
      `Unknown assistant theme: ${assistantId}. Available: ${Object.keys(assistantThemes).join(", ")}`
    );
  }
  return theme;
}

/**
 * Get all assistant themes.
 */
export function getAllAssistantThemes(): AssistantTheme[] {
  return Object.values(assistantThemes);
}
