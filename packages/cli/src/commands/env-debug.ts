import { Command } from "commander";
import { execSync } from "node:child_process";
import { detectColorLevel, isTTY, getTerminalSize } from "@tuicomponents/core";

/**
 * Environment variables commonly set by terminals and AI assistants.
 */
const INTERESTING_ENV_VARS = [
  // Terminal identification
  "TERM",
  "TERM_PROGRAM",
  "TERM_PROGRAM_VERSION",
  "COLORTERM",
  "TERMINAL_EMULATOR",

  // Color control
  "NO_COLOR",
  "FORCE_COLOR",
  "CLICOLOR",
  "CLICOLOR_FORCE",

  // Shell info
  "SHELL",
  "SHLVL",

  // AI assistant indicators (known or suspected)
  "CLAUDE_CODE",
  "ANTHROPIC_API_KEY",
  "CURSOR_TRACE_ID",
  "CURSOR_SESSION",
  "GITHUB_COPILOT",
  "COPILOT_AGENT",
  "VSCODE_PID",
  "VSCODE_CWD",
  "VSCODE_IPC_HOOK",
  "VSCODE_GIT_IPC_HANDLE",
  "VSCODE_INJECTION",

  // IDE indicators
  "JETBRAINS_IDE",
  "IDEA_INITIAL_DIRECTORY",
  "INTELLIJ_ENVIRONMENT_READER",

  // CI/automation indicators
  "CI",
  "CONTINUOUS_INTEGRATION",
  "BUILD_NUMBER",
  "GITHUB_ACTIONS",
  "GITLAB_CI",

  // Process info
  "_",
  "PWD",
  "OLDPWD",

  // SSH/remote
  "SSH_CLIENT",
  "SSH_TTY",
  "SSH_CONNECTION",

  // macOS specific
  "Apple_PubSub_Socket_Render",
  "__CFBundleIdentifier",

  // Misc
  "LC_TERMINAL",
  "LC_TERMINAL_VERSION",
  "ITERM_SESSION_ID",
  "ITERM_PROFILE",
  "KONSOLE_VERSION",
  "GNOME_TERMINAL_SCREEN",
  "WT_SESSION",  // Windows Terminal
  "ALACRITTY_LOG",
  "KITTY_WINDOW_ID",
  "WEZTERM_PANE",
];

export const envDebugCommand = new Command("env-debug")
  .description("Debug environment detection for AI assistant vs terminal")
  .option("--json", "Output as JSON")
  .option("--all-env", "Show all environment variables")
  .action((options: { json?: boolean; allEnv?: boolean }) => {
    const info = gatherEnvironmentInfo(options.allEnv ?? false);

    if (options.json) {
      console.log(JSON.stringify(info, null, 2));
    } else {
      printHumanReadable(info);
    }
  });

interface ProcessAncestor {
  pid: number;
  command: string;
}

interface EnvironmentInfo {
  detection: {
    isTTY: boolean;
    stdoutIsTTY: boolean;
    stderrIsTTY: boolean;
    stdinIsTTY: boolean;
    colorLevel: 0 | 1 | 2 | 3;
    terminalSize: { columns: number; rows: number };
  };
  process: {
    pid: number;
    ppid: number;
    title: string;
    argv: string[];
    execPath: string;
    platform: string;
  };
  processTree: ProcessAncestor[];
  interestingEnvVars: Record<string, string | undefined>;
  allEnvVars?: Record<string, string | undefined>;
  heuristics: {
    likelyAIAssistant: boolean;
    likelyTerminal: boolean;
    confidence: "high" | "medium" | "low";
    reasons: string[];
  };
}

/**
 * Walk up the process tree to find parent processes.
 * Only works on Unix-like systems (macOS, Linux).
 */
function getProcessTree(): ProcessAncestor[] {
  if (process.platform === "win32") {
    return []; // Not implemented for Windows
  }

  const ancestors: ProcessAncestor[] = [];
  let pid = process.ppid;

  for (let i = 0; i < 20 && pid > 1; i++) {
    try {
      const output = execSync(`ps -p ${String(pid)} -o ppid=,comm=`, {
        encoding: "utf-8",
        timeout: 1000,
      }).trim();
      const match = /^\s*(\d+)\s+(.+)$/.exec(output);
      if (!match?.[1] || !match[2]) break;
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
 * Known AI assistant patterns to look for in process tree.
 */
const AI_ASSISTANT_PATTERNS = [
  /claude-code/i,
  /claude$/i,
  /cursor/i,
  /copilot/i,
  /windsurf/i,
  /cody/i,
  /aider/i,
  /continue/i,  // continue.dev
];

function gatherEnvironmentInfo(includeAllEnv: boolean): EnvironmentInfo {
  const interestingEnvVars: Record<string, string | undefined> = {};
  for (const key of INTERESTING_ENV_VARS) {
    const value = process.env[key];
    if (value !== undefined) {
      interestingEnvVars[key] = value;
    }
  }

  // Gather detection info
  const stdoutIsTTY = process.stdout.isTTY;
  const stderrIsTTY = process.stderr.isTTY;
  const stdinIsTTY = process.stdin.isTTY;
  const colorLevel = detectColorLevel();
  const terminalSize = getTerminalSize();
  const processTree = getProcessTree();

  // Run heuristics
  const heuristics = runHeuristics({
    stdoutIsTTY,
    stderrIsTTY,
    stdinIsTTY,
    colorLevel,
    env: process.env,
    processTree,
  });

  const info: EnvironmentInfo = {
    detection: {
      isTTY: isTTY(),
      stdoutIsTTY,
      stderrIsTTY,
      stdinIsTTY,
      colorLevel,
      terminalSize,
    },
    process: {
      pid: process.pid,
      ppid: process.ppid,
      title: process.title,
      argv: process.argv,
      execPath: process.execPath,
      platform: process.platform,
    },
    processTree,
    interestingEnvVars,
    heuristics,
  };

  if (includeAllEnv) {
    info.allEnvVars = { ...process.env };
  }

  return info;
}

interface HeuristicInput {
  stdoutIsTTY: boolean;
  stderrIsTTY: boolean;
  stdinIsTTY: boolean;
  colorLevel: number;
  env: NodeJS.ProcessEnv;
  processTree: ProcessAncestor[];
}

function runHeuristics(input: HeuristicInput): EnvironmentInfo["heuristics"] {
  const reasons: string[] = [];
  let aiScore = 0;
  let terminalScore = 0;

  // TTY checks
  if (!input.stdoutIsTTY) {
    aiScore += 2;
    reasons.push("stdout is not a TTY (common in AI assistants that capture output)");
  } else {
    terminalScore += 2;
    reasons.push("stdout is a TTY (suggests interactive terminal)");
  }

  if (!input.stdinIsTTY) {
    aiScore += 1;
    reasons.push("stdin is not a TTY");
  }

  // Color level
  if (input.colorLevel === 0) {
    aiScore += 1;
    reasons.push("No color support detected");
  } else if (input.colorLevel >= 2) {
    terminalScore += 1;
    reasons.push(`Color level ${String(input.colorLevel)} detected (rich terminal)`);
  }

  // Known AI assistant env vars
  if (input.env["CLAUDE_CODE"]) {
    aiScore += 5;
    reasons.push("CLAUDE_CODE env var present");
  }

  if (input.env["CURSOR_TRACE_ID"] || input.env["CURSOR_SESSION"]) {
    aiScore += 3;
    reasons.push("Cursor-related env vars present");
  }

  // VSCode integration (could be Copilot or just VSCode terminal)
  if (input.env["VSCODE_PID"] || input.env["VSCODE_IPC_HOOK"]) {
    aiScore += 1;
    reasons.push("VSCode env vars present (could be AI assistant or terminal)");
  }

  // Terminal program identification
  const termProgram = input.env["TERM_PROGRAM"];
  if (termProgram) {
    const knownTerminals = ["iTerm.app", "Apple_Terminal", "Hyper", "Alacritty", "kitty", "WezTerm", "Ghostty"];
    if (knownTerminals.some(t => termProgram.includes(t))) {
      terminalScore += 2;
      reasons.push(`Known terminal program: ${termProgram}`);
    }
  }

  // TERM variable
  const term = input.env["TERM"];
  if (term && term !== "dumb") {
    terminalScore += 1;
    if (term.includes("256color") || term.includes("truecolor")) {
      terminalScore += 1;
      reasons.push(`Rich TERM type: ${term}`);
    }
  } else if (term === "dumb" || !term) {
    aiScore += 1;
    reasons.push("TERM is 'dumb' or unset");
  }

  // iTerm specific
  if (input.env["ITERM_SESSION_ID"]) {
    terminalScore += 2;
    reasons.push("iTerm session detected");
  }

  // Kitty
  if (input.env["KITTY_WINDOW_ID"]) {
    terminalScore += 2;
    reasons.push("Kitty terminal detected");
  }

  // CI environment (different from AI but also automated)
  if (input.env["CI"] || input.env["GITHUB_ACTIONS"]) {
    aiScore += 2;
    reasons.push("CI environment detected");
  }

  // Process tree analysis (most reliable detection method)
  const foundAIAssistants: string[] = [];
  for (const ancestor of input.processTree) {
    for (const pattern of AI_ASSISTANT_PATTERNS) {
      if (pattern.test(ancestor.command)) {
        foundAIAssistants.push(ancestor.command);
        break;
      }
    }
  }
  if (foundAIAssistants.length > 0) {
    aiScore += 10; // Strong signal
    reasons.push(`AI assistant found in process tree: ${foundAIAssistants.join(", ")}`);
  }

  // Calculate result
  const likelyAIAssistant = aiScore > terminalScore;
  const likelyTerminal = terminalScore > aiScore;

  let confidence: "high" | "medium" | "low";
  const scoreDiff = Math.abs(aiScore - terminalScore);
  if (scoreDiff >= 4) {
    confidence = "high";
  } else if (scoreDiff >= 2) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  reasons.push(`Final scores - AI: ${String(aiScore)}, Terminal: ${String(terminalScore)}`);

  return {
    likelyAIAssistant,
    likelyTerminal,
    confidence,
    reasons,
  };
}

function printHumanReadable(info: EnvironmentInfo): void {
  console.log("=== TUI Environment Detection Debug ===\n");

  console.log("## Detection Results");
  console.log(`  isTTY (stdout): ${String(info.detection.stdoutIsTTY)}`);
  console.log(`  isTTY (stderr): ${String(info.detection.stderrIsTTY)}`);
  console.log(`  isTTY (stdin):  ${String(info.detection.stdinIsTTY)}`);
  console.log(`  Color Level:    ${String(info.detection.colorLevel)} (0=none, 1=basic, 2=256, 3=truecolor)`);
  console.log(`  Terminal Size:  ${String(info.detection.terminalSize.columns)}x${String(info.detection.terminalSize.rows)}`);

  console.log("\n## Process Info");
  console.log(`  PID:    ${String(info.process.pid)}`);
  console.log(`  PPID:   ${String(info.process.ppid)}`);
  console.log(`  Title:  ${info.process.title}`);

  console.log("\n## Process Tree (ancestors)");
  if (info.processTree.length === 0) {
    console.log("  (could not determine process tree)");
  } else {
    for (const ancestor of info.processTree) {
      // Highlight AI assistant processes
      const isAI = AI_ASSISTANT_PATTERNS.some((p) => p.test(ancestor.command));
      const marker = isAI ? " <-- AI ASSISTANT" : "";
      console.log(`  ${String(ancestor.pid)}: ${ancestor.command}${marker}`);
    }
  }

  console.log("\n## Interesting Environment Variables");
  const envEntries = Object.entries(info.interestingEnvVars);
  if (envEntries.length === 0) {
    console.log("  (none found)");
  } else {
    for (const [key, value] of envEntries) {
      const displayValue = value && value.length > 60 ? value.slice(0, 60) + "..." : value;
      console.log(`  ${key}: ${displayValue ?? "(undefined)"}`);
    }
  }

  console.log("\n## Heuristic Analysis");
  console.log(`  Likely AI Assistant: ${String(info.heuristics.likelyAIAssistant)}`);
  console.log(`  Likely Terminal:     ${String(info.heuristics.likelyTerminal)}`);
  console.log(`  Confidence:          ${info.heuristics.confidence}`);
  console.log("\n  Reasons:");
  for (const reason of info.heuristics.reasons) {
    console.log(`    - ${reason}`);
  }

  // Color test
  console.log("\n## Color Test (if you see colors, ANSI is working)");
  console.log(`  \x1b[31mRed\x1b[0m \x1b[32mGreen\x1b[0m \x1b[33mYellow\x1b[0m \x1b[34mBlue\x1b[0m \x1b[35mMagenta\x1b[0m \x1b[36mCyan\x1b[0m`);
}
