#!/usr/bin/env node
/**
 * Terminal Rendering Diagnostic Tool
 *
 * A standalone diagnostic tool for AI coding assistants to discover their
 * terminal rendering capabilities. Tests ANSI color support, markdown tricks,
 * and Unicode rendering.
 *
 * Usage:
 *   npx tsx scripts/terminal-diagnostic.ts           # Interactive mode
 *   npx tsx scripts/terminal-diagnostic.ts --dump    # Non-interactive mode
 *
 * The human user observes what renders and provides answers to multiple-choice
 * questions. The script generates a JSON capability report at the end.
 */

import * as readline from "node:readline";

// ============================================================================
// ANSI Escape Code Helpers
// ============================================================================

const ESC = "\x1b[";
const RESET = `${ESC}0m`;

// Basic foreground colors (30-37)
const FG = {
  black: `${ESC}30m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,
};

// Bright foreground colors (90-97)
const FG_BRIGHT = {
  black: `${ESC}90m`,
  red: `${ESC}91m`,
  green: `${ESC}92m`,
  yellow: `${ESC}93m`,
  blue: `${ESC}94m`,
  magenta: `${ESC}95m`,
  cyan: `${ESC}96m`,
  white: `${ESC}97m`,
};

// Basic background colors (40-47)
const BG = {
  black: `${ESC}40m`,
  red: `${ESC}41m`,
  green: `${ESC}42m`,
  yellow: `${ESC}43m`,
  blue: `${ESC}44m`,
  magenta: `${ESC}45m`,
  cyan: `${ESC}46m`,
  white: `${ESC}47m`,
};

// Text styles
const STYLE = {
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  italic: `${ESC}3m`,
  underline: `${ESC}4m`,
  strikethrough: `${ESC}9m`,
};

// 256-color mode
function fg256(n: number): string {
  return `${ESC}38;5;${String(n)}m`;
}

// Truecolor (24-bit)
function fgRgb(r: number, g: number, b: number): string {
  return `${ESC}38;2;${String(r)};${String(g)};${String(b)}m`;
}

// ============================================================================
// Test Definitions
// ============================================================================

type CapabilityLevel = "full" | "partial" | "none";

interface TestOption {
  label: string;
  description: string;
  level: CapabilityLevel;
}

interface Test {
  id: string;
  name: string;
  pattern: () => string;
  expected: string;
  options: TestOption[];
}

const tests: Test[] = [
  // -------------------------------------------------------------------------
  // Test 1: Basic ANSI Foreground Colors
  // -------------------------------------------------------------------------
  {
    id: "ansi.fg.basic",
    name: "Basic ANSI Foreground Colors",
    pattern: () => `
  ${FG.red}This text should be RED${RESET}
  ${FG.green}This text should be GREEN${RESET}
  ${FG.blue}This text should be BLUE${RESET}
  ${FG.yellow}This text should be YELLOW${RESET}
`,
    expected: "Four lines with red, green, blue, and yellow text",
    options: [
      {
        label: "A",
        description: "All colors visible and correct",
        level: "full",
      },
      {
        label: "B",
        description: "Colors visible but wrong shades",
        level: "partial",
      },
      { label: "C", description: "Plain text, no colors", level: "none" },
      {
        label: "D",
        description: "Raw escape codes visible (e.g., [31m)",
        level: "none",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Test 2: Bright ANSI Foreground Colors
  // -------------------------------------------------------------------------
  {
    id: "ansi.fg.bright",
    name: "Bright ANSI Foreground Colors",
    pattern: () => `
  ${FG_BRIGHT.red}This text should be BRIGHT RED${RESET}
  ${FG_BRIGHT.green}This text should be BRIGHT GREEN${RESET}
  ${FG_BRIGHT.cyan}This text should be BRIGHT CYAN${RESET}
`,
    expected:
      "Three lines with bright/vivid red, green, and cyan text (brighter than basic colors)",
    options: [
      {
        label: "A",
        description: "Bright colors visible and distinct from basic",
        level: "full",
      },
      {
        label: "B",
        description: "Colors visible but same as basic (not brighter)",
        level: "partial",
      },
      { label: "C", description: "Plain text, no colors", level: "none" },
      { label: "D", description: "Raw escape codes visible", level: "none" },
    ],
  },

  // -------------------------------------------------------------------------
  // Test 3: ANSI Background Colors
  // -------------------------------------------------------------------------
  {
    id: "ansi.bg.basic",
    name: "ANSI Background Colors",
    pattern: () => `
  ${BG.red}${FG.white} RED BACKGROUND ${RESET}
  ${BG.green}${FG.black} GREEN BACKGROUND ${RESET}
  ${BG.blue}${FG.white} BLUE BACKGROUND ${RESET}
`,
    expected:
      "Three text blocks with colored backgrounds (red, green, blue) and contrasting text",
    options: [
      {
        label: "A",
        description: "Colored backgrounds visible and correct",
        level: "full",
      },
      {
        label: "B",
        description: "Only foreground colors, no backgrounds",
        level: "partial",
      },
      { label: "C", description: "Plain text, no colors", level: "none" },
      { label: "D", description: "Raw escape codes visible", level: "none" },
    ],
  },

  // -------------------------------------------------------------------------
  // Test 4: 256-Color Mode
  // -------------------------------------------------------------------------
  {
    id: "ansi.256",
    name: "256-Color Mode",
    pattern: () => {
      // Show a gradient using 256 colors
      const colors = [196, 202, 208, 214, 220, 226, 190, 154, 118, 82, 46];
      const gradient = colors.map((c) => `${fg256(c)}█${RESET}`).join("");
      return `
  ${gradient}

  ${fg256(27)}Color 27 (blue)${RESET}  ${fg256(196)}Color 196 (red)${RESET}  ${fg256(46)}Color 46 (green)${RESET}
`;
    },
    expected:
      "A gradient of colored blocks (red to yellow to green) and three labeled colors below",
    options: [
      {
        label: "A",
        description: "Smooth gradient with distinct colors visible",
        level: "full",
      },
      {
        label: "B",
        description: "Some colors visible but limited palette",
        level: "partial",
      },
      { label: "C", description: "Plain blocks, no colors", level: "none" },
      { label: "D", description: "Raw escape codes visible", level: "none" },
    ],
  },

  // -------------------------------------------------------------------------
  // Test 5: Truecolor (RGB)
  // -------------------------------------------------------------------------
  {
    id: "ansi.truecolor",
    name: "Truecolor (24-bit RGB)",
    pattern: () => {
      // Show smooth RGB gradient
      const steps: string[] = [];
      for (let i = 0; i < 24; i++) {
        const r = Math.round(255 * (1 - i / 23));
        const g = Math.round(255 * (i / 23));
        steps.push(`${fgRgb(r, g, 128)}█${RESET}`);
      }
      return `
  ${steps.join("")}

  ${fgRgb(255, 99, 71)}Tomato RGB(255,99,71)${RESET}
  ${fgRgb(138, 43, 226)}BlueViolet RGB(138,43,226)${RESET}
  ${fgRgb(0, 206, 209)}DarkTurquoise RGB(0,206,209)${RESET}
`;
    },
    expected:
      "A smooth gradient from red to green, plus three specifically colored text lines",
    options: [
      {
        label: "A",
        description: "Smooth gradient with exact colors",
        level: "full",
      },
      {
        label: "B",
        description: "Stepped/banded colors (256-color fallback)",
        level: "partial",
      },
      { label: "C", description: "Plain text, no colors", level: "none" },
      { label: "D", description: "Raw escape codes visible", level: "none" },
    ],
  },

  // -------------------------------------------------------------------------
  // Test 6: Text Styles
  // -------------------------------------------------------------------------
  {
    id: "ansi.styles",
    name: "Text Styles (Bold, Italic, Underline)",
    pattern: () => `
  ${STYLE.bold}This text should be BOLD${RESET}
  ${STYLE.dim}This text should be DIM${RESET}
  ${STYLE.italic}This text should be ITALIC${RESET}
  ${STYLE.underline}This text should be UNDERLINED${RESET}
  ${STYLE.strikethrough}This text should be STRIKETHROUGH${RESET}
`,
    expected:
      "Five lines with different text styles: bold, dim, italic, underlined, and strikethrough",
    options: [
      {
        label: "A",
        description: "All styles visible and correct",
        level: "full",
      },
      {
        label: "B",
        description: "Some styles work, others don't",
        level: "partial",
      },
      { label: "C", description: "Plain text, no styling", level: "none" },
      { label: "D", description: "Raw escape codes visible", level: "none" },
    ],
  },

  // -------------------------------------------------------------------------
  // Test 7: Markdown Backticks
  // -------------------------------------------------------------------------
  {
    id: "md.backtick",
    name: "Markdown Backtick Highlighting",
    pattern: () => `
Plain text then \`highlighted text\` then plain again.

Compare: \`inline code\` vs regular text
`,
    expected:
      '"highlighted text" and "inline code" have distinct background color (often tan/gray)',
    options: [
      {
        label: "A",
        description: "Highlighted with different background",
        level: "full",
      },
      {
        label: "B",
        description: "Backticks visible, no background change",
        level: "partial",
      },
      {
        label: "C",
        description: "No backticks visible, no highlighting",
        level: "none",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Test 8: Markdown Diff Blocks
  // -------------------------------------------------------------------------
  {
    id: "md.diff",
    name: "Markdown Diff Blocks",
    pattern: () =>
      "\n```diff\n" +
      " unchanged line\n" +
      "+added line (should be green)\n" +
      "-removed line (should be red)\n" +
      " another unchanged line\n" +
      "```\n",
    expected: "Lines starting with + are green, lines starting with - are red",
    options: [
      {
        label: "A",
        description: "Green and red coloring visible",
        level: "full",
      },
      {
        label: "B",
        description: "Code block visible but no colors",
        level: "partial",
      },
      {
        label: "C",
        description: "Raw markdown visible (```diff)",
        level: "none",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Test 9: Leading Whitespace Preservation
  // -------------------------------------------------------------------------
  {
    id: "md.whitespace",
    name: "Leading Whitespace Preservation",
    pattern: () => `
    Four spaces before this line
        Eight spaces before this line
No leading spaces here
`,
    expected:
      "First line indented 4 spaces, second line indented 8 spaces, third at left margin",
    options: [
      {
        label: "A",
        description: "Indentation preserved correctly",
        level: "full",
      },
      {
        label: "B",
        description: "Some indentation but collapsed/reduced",
        level: "partial",
      },
      {
        label: "C",
        description: "All lines start at the same position",
        level: "none",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Test 10: Anchor Characters
  // -------------------------------------------------------------------------
  {
    id: "md.anchor",
    name: "Anchor Character Visibility",
    pattern: () => `
│ This line starts with a vertical bar anchor
│ Another line with the anchor
│     Anchor with indentation preserved
`,
    expected:
      'Each line starts with a visible "│" character (box drawing light vertical)',
    options: [
      {
        label: "A",
        description: "│ characters visible on each line",
        level: "full",
      },
      {
        label: "B",
        description: "Some other character or garbled",
        level: "partial",
      },
      {
        label: "C",
        description: "No leading character visible",
        level: "none",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Test 11: Unicode Block Characters
  // -------------------------------------------------------------------------
  {
    id: "unicode.blocks",
    name: "Unicode Block Characters",
    pattern: () => `
  Full:   ████████████████████
  3/4:    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
  1/2:    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
  1/4:    ░░░░░░░░░░░░░░░░░░░░
  Lower:  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
  Upper:  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
`,
    expected:
      "Six rows of block characters with varying densities (full, 3/4, 1/2, 1/4, lower half, upper half)",
    options: [
      {
        label: "A",
        description: "All block characters render correctly",
        level: "full",
      },
      {
        label: "B",
        description: "Some blocks render, others show as ? or boxes",
        level: "partial",
      },
      {
        label: "C",
        description: "Blocks show as ? or empty boxes",
        level: "none",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Test 12: Box Drawing Characters
  // -------------------------------------------------------------------------
  {
    id: "unicode.box",
    name: "Box Drawing Characters",
    pattern: () => `
  ┌─────────────────┐
  │  Box Drawing    │
  ├─────────────────┤
  │  ┌───┬───┐      │
  │  │ A │ B │      │
  │  ├───┼───┤      │
  │  │ C │ D │      │
  │  └───┴───┘      │
  └─────────────────┘
`,
    expected: "A nested box structure with clean corners and straight lines",
    options: [
      {
        label: "A",
        description: "Clean box with proper corners and lines",
        level: "full",
      },
      {
        label: "B",
        description: "Box visible but some characters misaligned or wrong",
        level: "partial",
      },
      {
        label: "C",
        description: "Characters show as ? or jumbled",
        level: "none",
      },
    ],
  },
];

// ============================================================================
// Environment Detection (inline, no deps)
// ============================================================================

interface EnvInfo {
  isTTY: boolean;
  term: string | undefined;
  colorTerm: string | undefined;
  termProgram: string | undefined;
  noColor: boolean;
  forceColor: string | undefined;
  ciDetected: boolean;
}

function detectEnv(): EnvInfo {
  // Note: process.stdout.isTTY is typed as boolean but may be undefined at runtime
  const isTTY = "isTTY" in process.stdout && process.stdout.isTTY;
  return {
    isTTY,
    term: process.env["TERM"],
    colorTerm: process.env["COLORTERM"],
    termProgram: process.env["TERM_PROGRAM"],
    noColor: process.env["NO_COLOR"] !== undefined,
    forceColor: process.env["FORCE_COLOR"],
    ciDetected:
      process.env["CI"] !== undefined ||
      process.env["GITHUB_ACTIONS"] !== undefined,
  };
}

// ============================================================================
// UI Helpers
// ============================================================================

function formatTestHeader(
  testNum: number,
  totalTests: number,
  name: string
): string {
  const bar = "═".repeat(63);
  return `
╔${bar}╗
║  TEST ${String(testNum)}/${String(totalTests)}: ${name.padEnd(51)}║
╚${bar}╝`;
}

function formatPrompt(test: Test): string {
  const lines = [
    "┌───────────────────────────────────────────────────────────────┐",
    `│ EXPECTED: ${test.expected.substring(0, 51).padEnd(51)}│`,
  ];

  // Handle long expected text
  if (test.expected.length > 51) {
    const remaining = test.expected.substring(51);
    const chunks = [];
    for (let i = 0; i < remaining.length; i += 53) {
      chunks.push(remaining.substring(i, i + 53));
    }
    for (const chunk of chunks) {
      lines.push(`│           ${chunk.padEnd(51)}│`);
    }
  }

  lines.push(
    "│                                                               │"
  );
  lines.push(
    "│ What do you see?                                              │"
  );

  for (const opt of test.options) {
    const optLine = `  (${opt.label}) ${opt.description}`;
    lines.push(`│${optLine.padEnd(63)}│`);
  }

  lines.push(
    "│                                                               │"
  );
  lines.push(
    `│ Reply with just the letter (${test.options.map((o) => o.label).join("/")}):${"".padEnd(63 - 32 - test.options.length * 2)}│`
  );
  lines.push(
    "└───────────────────────────────────────────────────────────────┘"
  );

  return lines.join("\n");
}

// ============================================================================
// Report Generation
// ============================================================================

interface DiagnosticReport {
  assistant: string;
  timestamp: string;
  environment: EnvInfo;
  results: Record<string, CapabilityLevel>;
  summary: {
    ansiSupport: "none" | "basic" | "256" | "truecolor";
    textStyles: boolean;
    markdownTricks: boolean;
    unicodeSupport: boolean;
  };
}

function computeSummary(
  results: Record<string, CapabilityLevel>
): DiagnosticReport["summary"] {
  // Determine ANSI support level
  let ansiSupport: "none" | "basic" | "256" | "truecolor" = "none";
  if (results["ansi.truecolor"] === "full") {
    ansiSupport = "truecolor";
  } else if (results["ansi.256"] === "full") {
    ansiSupport = "256";
  } else if (
    results["ansi.fg.basic"] === "full" ||
    results["ansi.fg.bright"] === "full"
  ) {
    ansiSupport = "basic";
  }

  // Text styles
  const textStyles =
    results["ansi.styles"] === "full" || results["ansi.styles"] === "partial";

  // Markdown tricks (at least one works)
  const markdownTricks =
    results["md.backtick"] === "full" ||
    results["md.diff"] === "full" ||
    results["md.whitespace"] === "full";

  // Unicode support
  const unicodeSupport =
    results["unicode.blocks"] === "full" || results["unicode.box"] === "full";

  return {
    ansiSupport,
    textStyles,
    markdownTricks,
    unicodeSupport,
  };
}

function generateReport(
  results: Record<string, CapabilityLevel>,
  assistant: string
): DiagnosticReport {
  return {
    assistant,
    timestamp: new Date().toISOString(),
    environment: detectEnv(),
    results,
    summary: computeSummary(results),
  };
}

// ============================================================================
// Interactive Mode
// ============================================================================

async function askQuestion(
  rl: readline.Interface,
  prompt: string
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim().toUpperCase());
    });
  });
}

async function runInteractive(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          TERMINAL RENDERING DIAGNOSTIC TOOL                   ║
║                                                               ║
║  This tool tests terminal rendering capabilities.             ║
║  The AI assistant will run this script, but YOU (the human)   ║
║  must observe what actually renders and answer each question. ║
║                                                               ║
║  For each test:                                               ║
║    1. Look at the rendered output                             ║
║    2. Compare to the expected description                     ║
║    3. Type the letter (A/B/C/D) matching what you see         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

  // Ask which assistant is running this
  console.log("Which AI assistant is running this diagnostic?");
  console.log("  (1) Claude Code");
  console.log("  (2) Cursor");
  console.log("  (3) GitHub Copilot");
  console.log("  (4) Windsurf");
  console.log("  (5) Cody");
  console.log("  (6) Aider");
  console.log("  (7) Continue");
  console.log("  (8) Other");
  console.log("");

  const assistantChoice = await askQuestion(rl, "Enter number (1-8): ");
  const assistantNames: Record<string, string> = {
    "1": "claude-code",
    "2": "cursor",
    "3": "github-copilot",
    "4": "windsurf",
    "5": "cody",
    "6": "aider",
    "7": "continue",
    "8": "other",
  };
  const assistant = assistantNames[assistantChoice] ?? "unknown";

  console.log(`\nStarting diagnostic for: ${assistant}\n`);
  console.log("Press Enter to begin...");
  await askQuestion(rl, "");

  const results: Record<string, CapabilityLevel> = {};

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    if (!test) continue;
    console.log(formatTestHeader(i + 1, tests.length, test.name));
    console.log(test.pattern());
    console.log(formatPrompt(test));

    let answer = "";
    const validOptions = test.options.map((o) => o.label);
    while (!validOptions.includes(answer)) {
      answer = await askQuestion(rl, "\nYour answer: ");
      if (!validOptions.includes(answer)) {
        console.log(`Please enter one of: ${validOptions.join(", ")}`);
      }
    }

    const selectedOption = test.options.find((o) => o.label === answer);
    results[test.id] = selectedOption?.level ?? "none";

    console.log(`\n✓ Recorded: ${selectedOption?.description ?? answer}\n`);
  }

  rl.close();

  console.log("\n" + "=".repeat(65));
  console.log("DIAGNOSTIC COMPLETE");
  console.log("=".repeat(65) + "\n");

  const report = generateReport(results, assistant);
  console.log("JSON Report (copy this for analysis):\n");
  console.log(JSON.stringify(report, null, 2));
}

// ============================================================================
// Dump Mode (Non-Interactive)
// ============================================================================

function runDump(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          TERMINAL RENDERING DIAGNOSTIC - DUMP MODE            ║
║                                                               ║
║  All test patterns are displayed below.                       ║
║  Observe what renders and note your observations.             ║
╚═══════════════════════════════════════════════════════════════╝
`);

  // Environment info
  const env = detectEnv();
  console.log("ENVIRONMENT DETECTION:");
  console.log(`  isTTY: ${String(env.isTTY)}`);
  console.log(`  TERM: ${env.term ?? "(not set)"}`);
  console.log(`  COLORTERM: ${env.colorTerm ?? "(not set)"}`);
  console.log(`  TERM_PROGRAM: ${env.termProgram ?? "(not set)"}`);
  console.log(`  NO_COLOR: ${String(env.noColor)}`);
  console.log(`  FORCE_COLOR: ${env.forceColor ?? "(not set)"}`);
  console.log(`  CI detected: ${String(env.ciDetected)}`);
  console.log("");

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    if (!test) continue;
    console.log(formatTestHeader(i + 1, tests.length, test.name));
    console.log(`[ID: ${test.id}]`);
    console.log("");
    console.log(test.pattern());
    console.log(`EXPECTED: ${test.expected}`);
    console.log("");
    console.log("Options:");
    for (const opt of test.options) {
      console.log(`  (${opt.label}) ${opt.description} → "${opt.level}"`);
    }
    console.log("\n" + "-".repeat(65) + "\n");
  }

  console.log(`
MANUAL RESULT TEMPLATE:

Copy and fill in this JSON with your observations:

{
  "assistant": "YOUR_ASSISTANT_NAME",
  "timestamp": "${new Date().toISOString()}",
  "results": {
${tests.map((t) => `    "${t.id}": "full|partial|none"`).join(",\n")}
  }
}
`);
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Terminal Rendering Diagnostic Tool

Usage:
  npx tsx scripts/terminal-diagnostic.ts           Interactive mode
  npx tsx scripts/terminal-diagnostic.ts --dump    Dump all tests (non-interactive)
  npx tsx scripts/terminal-diagnostic.ts --help    Show this help

Interactive mode:
  The human user answers multiple-choice questions based on what they
  observe in the terminal. A JSON capability report is generated at the end.

Dump mode:
  All test patterns are output at once. Useful when interactive input
  is awkward. User manually records observations.
`);
    return;
  }

  if (args.includes("--dump")) {
    runDump();
  } else {
    await runInteractive();
  }
}

main().catch((err: unknown) => {
  console.error("Diagnostic error:", err);
  process.exit(1);
});
