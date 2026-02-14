#!/usr/bin/env node
/**
 * Terminal Rendering Diagnostic - Pattern Generator
 *
 * Outputs test patterns for the terminal diagnostic skill.
 * This utility is called by AI assistants following the diagnostic skill.
 *
 * Usage:
 *   npx tsx scripts/terminal-diagnostic.ts --pattern <id>   # Output one pattern
 *   npx tsx scripts/terminal-diagnostic.ts --list           # List all test IDs
 *   npx tsx scripts/terminal-diagnostic.ts --info <id>      # Get test metadata
 *   npx tsx scripts/terminal-diagnostic.ts --env            # Show environment info
 */

// ============================================================================
// ANSI Escape Code Helpers
// ============================================================================

const ESC = "\x1b[";
const RESET = `${ESC}0m`;

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

const STYLE = {
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  italic: `${ESC}3m`,
  underline: `${ESC}4m`,
  strikethrough: `${ESC}9m`,
};

function fg256(n: number): string {
  return `${ESC}38;5;${String(n)}m`;
}

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
  {
    id: "ansi.fg.basic",
    name: "Basic ANSI Foreground Colors",
    pattern: () =>
      `${FG.red}RED${RESET}  ${FG.green}GREEN${RESET}  ${FG.blue}BLUE${RESET}  ${FG.yellow}YELLOW${RESET}`,
    expected: "Four words in red, green, blue, and yellow colors",
    options: [
      {
        label: "A",
        description: "All four colors visible and correct",
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
  {
    id: "ansi.fg.bright",
    name: "Bright ANSI Foreground Colors",
    pattern: () =>
      `${FG_BRIGHT.red}BRIGHT RED${RESET}  ${FG_BRIGHT.green}BRIGHT GREEN${RESET}  ${FG_BRIGHT.cyan}BRIGHT CYAN${RESET}`,
    expected:
      "Three phrases in bright/vivid red, green, and cyan (brighter than basic)",
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
  {
    id: "ansi.bg.basic",
    name: "ANSI Background Colors",
    pattern: () =>
      `${BG.red}${FG.white} RED BG ${RESET} ${BG.green}${FG.black} GREEN BG ${RESET} ${BG.blue}${FG.white} BLUE BG ${RESET}`,
    expected: "Three text blocks with colored backgrounds (red, green, blue)",
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
  {
    id: "ansi.256",
    name: "256-Color Mode",
    pattern: () => {
      const colors = [196, 202, 208, 214, 220, 226, 190, 154, 118, 82, 46];
      const gradient = colors.map((c) => `${fg256(c)}█${RESET}`).join("");
      return `${gradient}  ${fg256(27)}Blue${RESET} ${fg256(196)}Red${RESET} ${fg256(46)}Green${RESET}`;
    },
    expected:
      "A gradient of colored blocks (red→yellow→green) plus labeled colors",
    options: [
      {
        label: "A",
        description: "Smooth gradient with distinct colors",
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
  {
    id: "ansi.truecolor",
    name: "Truecolor (24-bit RGB)",
    pattern: () => {
      const steps: string[] = [];
      for (let i = 0; i < 16; i++) {
        const r = Math.round(255 * (1 - i / 15));
        const g = Math.round(255 * (i / 15));
        steps.push(`${fgRgb(r, g, 128)}█${RESET}`);
      }
      return `${steps.join("")}  ${fgRgb(255, 99, 71)}Tomato${RESET} ${fgRgb(138, 43, 226)}Violet${RESET}`;
    },
    expected:
      "Smooth gradient from red to green, plus 'Tomato' and 'Violet' in specific colors",
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
  {
    id: "ansi.styles",
    name: "Text Styles",
    pattern: () =>
      `${STYLE.bold}Bold${RESET}  ${STYLE.dim}Dim${RESET}  ${STYLE.italic}Italic${RESET}  ${STYLE.underline}Underline${RESET}  ${STYLE.strikethrough}Strike${RESET}`,
    expected:
      "Five words with different styles: bold, dim, italic, underlined, strikethrough",
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
  {
    id: "md.backtick",
    name: "Markdown Backtick Highlighting",
    pattern: () => "Plain text then `highlighted text` then plain again.",
    expected:
      '"highlighted text" has a distinct background color (often tan/gray)',
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
  {
    id: "md.bold",
    name: "Markdown Bold Text",
    pattern: () => "Normal text then **bold text** then normal again.",
    expected: '"bold text" appears in bold/heavier weight',
    options: [
      {
        label: "A",
        description: "Bold text is visibly heavier",
        level: "full",
      },
      {
        label: "B",
        description: "Asterisks visible, no bold styling",
        level: "partial",
      },
      {
        label: "C",
        description: "No asterisks, no bold styling",
        level: "none",
      },
    ],
  },
  {
    id: "md.whitespace",
    name: "Leading Whitespace Preservation",
    pattern: () => "No indent\n    Four spaces\n        Eight spaces",
    expected: "Three lines with increasing indentation (0, 4, 8 spaces)",
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
  {
    id: "md.anchor",
    name: "Anchor Character Visibility",
    pattern: () =>
      "│ Line with anchor\n│ Another anchored line\n│     Anchor with indent",
    expected: 'Each line starts with a visible "│" character',
    options: [
      {
        label: "A",
        description: "│ characters clearly visible",
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
  {
    id: "unicode.blocks",
    name: "Unicode Block Characters",
    pattern: () =>
      "Full: ████  3/4: ▓▓▓▓  1/2: ▒▒▒▒  1/4: ░░░░  Lower: ▄▄▄▄  Upper: ▀▀▀▀",
    expected: "Six groups of block characters with varying densities",
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
  {
    id: "unicode.box",
    name: "Box Drawing Characters",
    pattern: () => "┌───┬───┐\n│ A │ B │\n├───┼───┤\n│ C │ D │\n└───┴───┘",
    expected: "A 2x2 table with clean corners and straight lines",
    options: [
      {
        label: "A",
        description: "Clean box with proper corners and lines",
        level: "full",
      },
      {
        label: "B",
        description: "Box visible but some characters misaligned",
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
// Environment Detection
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
// Commands
// ============================================================================

function showHelp(): void {
  console.log(`
Terminal Rendering Diagnostic - Pattern Generator

Usage:
  npx tsx scripts/terminal-diagnostic.ts --pattern <id>   Output a test pattern
  npx tsx scripts/terminal-diagnostic.ts --list           List all test IDs
  npx tsx scripts/terminal-diagnostic.ts --info <id>      Get test metadata as JSON
  npx tsx scripts/terminal-diagnostic.ts --env            Show environment info
  npx tsx scripts/terminal-diagnostic.ts --help           Show this help

This utility is designed to be called by AI assistants following the
terminal-diagnostic skill. The skill guides the conversational flow.
`);
}

function listTests(): void {
  for (const test of tests) {
    console.log(`${test.id}: ${test.name}`);
  }
}

function showPattern(id: string): void {
  const test = tests.find((t) => t.id === id);
  if (!test) {
    console.error(`Unknown test ID: ${id}`);
    console.error(`Use --list to see available tests.`);
    process.exit(1);
  }
  // Output the raw pattern - this is what gets rendered
  console.log(test.pattern());
}

function showInfo(id: string): void {
  const test = tests.find((t) => t.id === id);
  if (!test) {
    console.error(`Unknown test ID: ${id}`);
    process.exit(1);
  }
  // Output metadata as JSON (without the pattern function)
  const info = {
    id: test.id,
    name: test.name,
    expected: test.expected,
    options: test.options,
  };
  console.log(JSON.stringify(info, null, 2));
}

function showEnv(): void {
  const env = detectEnv();
  console.log(JSON.stringify(env, null, 2));
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  if (args.includes("--list")) {
    listTests();
    return;
  }

  if (args.includes("--env")) {
    showEnv();
    return;
  }

  const patternIdx = args.indexOf("--pattern");
  if (patternIdx !== -1 && args[patternIdx + 1]) {
    showPattern(args[patternIdx + 1]);
    return;
  }

  const infoIdx = args.indexOf("--info");
  if (infoIdx !== -1 && args[infoIdx + 1]) {
    showInfo(args[infoIdx + 1]);
    return;
  }

  console.error("Unknown command. Use --help for usage.");
  process.exit(1);
}

main();
