import { execSync } from "node:child_process";

/**
 * Information about a process in the ancestry chain.
 */
export interface ProcessAncestor {
  pid: number;
  command: string;
}

/**
 * Result of environment detection.
 */
export interface EnvironmentDetection {
  /** Whether the environment is likely an AI assistant */
  isAIAssistant: boolean;
  /** Confidence level of the detection */
  confidence: "high" | "medium" | "low";
  /** Name of the detected assistant (if identified) */
  detectedAssistant?: string;
  /** Process tree from current process up to init */
  processTree: ProcessAncestor[];
}

/**
 * Known AI assistant patterns to look for in process tree.
 */
const AI_ASSISTANT_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /claude-code/i, name: "claude-code" },
  { pattern: /claude$/i, name: "claude" },
  { pattern: /cursor/i, name: "cursor" },
  { pattern: /copilot/i, name: "copilot" },
  { pattern: /windsurf/i, name: "windsurf" },
  { pattern: /cody/i, name: "cody" },
  { pattern: /aider/i, name: "aider" },
  { pattern: /continue/i, name: "continue" }, // continue.dev
];

/**
 * Walk up the process tree to find parent processes.
 * Only works on Unix-like systems (macOS, Linux).
 *
 * @returns Array of process ancestors from immediate parent up
 */
export function getProcessTree(): ProcessAncestor[] {
  if (process.platform === "win32") {
    return []; // Not implemented for Windows
  }

  const ancestors: ProcessAncestor[] = [];
  let pid = process.ppid;

  // Walk up to 20 levels (should be more than enough)
  for (let i = 0; i < 20 && pid > 1; i++) {
    try {
      const output = execSync(`ps -p ${pid} -o ppid=,comm=`, {
        encoding: "utf-8",
        timeout: 1000,
      }).trim();
      const match = /^\s*(\d+)\s+(.+)$/.exec(output);
      if (!match || !match[1] || !match[2]) break;
      const ppid = parseInt(match[1], 10);
      const command = match[2];
      ancestors.push({ pid, command });
      pid = ppid;
    } catch {
      break;
    }
  }

  return ancestors;
}

/**
 * Find AI assistant in the process tree.
 *
 * @param processTree - Array of process ancestors
 * @returns Name of detected assistant, or undefined
 */
function findAIAssistantInProcessTree(
  processTree: ProcessAncestor[]
): string | undefined {
  for (const ancestor of processTree) {
    for (const { pattern, name } of AI_ASSISTANT_PATTERNS) {
      if (pattern.test(ancestor.command)) {
        return name;
      }
    }
  }
  return undefined;
}

/**
 * Detect the environment and determine if running in an AI assistant.
 *
 * Uses multiple heuristics:
 * - Process tree analysis (most reliable)
 * - TTY detection
 * - Environment variables
 * - Color support level
 *
 * @returns Detection result with confidence
 *
 * @example
 * ```ts
 * const detection = detectEnvironment();
 * if (detection.isAIAssistant) {
 *   console.log(`Running in ${detection.detectedAssistant}`);
 * }
 * ```
 */
export function detectEnvironment(): EnvironmentDetection {
  const processTree = getProcessTree();
  let aiScore = 0;
  let terminalScore = 0;
  let detectedAssistant: string | undefined;

  // Process tree analysis (most reliable)
  detectedAssistant = findAIAssistantInProcessTree(processTree);
  if (detectedAssistant) {
    aiScore += 10;
  }

  // TTY checks
  const stdoutIsTTY = Boolean(process.stdout.isTTY);
  const stdinIsTTY = Boolean(process.stdin.isTTY);

  if (!stdoutIsTTY) {
    aiScore += 2;
  } else {
    terminalScore += 2;
  }

  if (!stdinIsTTY) {
    aiScore += 1;
  }

  // Known AI assistant env vars
  if (process.env["CLAUDE_CODE"]) {
    aiScore += 5;
    detectedAssistant = detectedAssistant ?? "claude-code";
  }

  if (process.env["CURSOR_TRACE_ID"] || process.env["CURSOR_SESSION"]) {
    aiScore += 3;
    detectedAssistant = detectedAssistant ?? "cursor";
  }

  // VSCode integration (could be Copilot or just VSCode terminal)
  if (process.env["VSCODE_PID"] || process.env["VSCODE_IPC_HOOK"]) {
    aiScore += 1;
  }

  // Terminal program identification
  const termProgram = process.env["TERM_PROGRAM"];
  if (termProgram) {
    const knownTerminals = [
      "iTerm.app",
      "Apple_Terminal",
      "Hyper",
      "Alacritty",
      "kitty",
      "WezTerm",
      "Ghostty",
    ];
    if (knownTerminals.some((t) => termProgram.includes(t))) {
      terminalScore += 2;
    }
  }

  // TERM variable
  const term = process.env["TERM"];
  if (term && term !== "dumb") {
    terminalScore += 1;
    if (term.includes("256color") || term.includes("truecolor")) {
      terminalScore += 1;
    }
  } else if (term === "dumb" || !term) {
    aiScore += 1;
  }

  // iTerm specific
  if (process.env["ITERM_SESSION_ID"]) {
    terminalScore += 2;
  }

  // Kitty
  if (process.env["KITTY_WINDOW_ID"]) {
    terminalScore += 2;
  }

  // CI environment (different from AI but also automated)
  if (process.env["CI"] || process.env["GITHUB_ACTIONS"]) {
    aiScore += 2;
  }

  // Calculate result
  const isAIAssistant = aiScore > terminalScore;

  let confidence: "high" | "medium" | "low";
  const scoreDiff = Math.abs(aiScore - terminalScore);
  if (scoreDiff >= 4) {
    confidence = "high";
  } else if (scoreDiff >= 2) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  const result: EnvironmentDetection = {
    isAIAssistant,
    confidence,
    processTree,
  };

  if (detectedAssistant !== undefined) {
    result.detectedAssistant = detectedAssistant;
  }

  return result;
}

/**
 * Simple check if running in an AI assistant environment.
 *
 * @returns true if likely running in an AI assistant
 *
 * @example
 * ```ts
 * if (isRunningInAIAssistant()) {
 *   // Use markdown-friendly output
 * }
 * ```
 */
export function isRunningInAIAssistant(): boolean {
  return detectEnvironment().isAIAssistant;
}
