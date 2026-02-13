#!/usr/bin/env node

/**
 * Colorizes markdown-mode TUI output for screenshots.
 *
 * Takes markdown-mode output from TUI components and applies visual highlighting
 * to show how it would appear in an AI assistant chat interface.
 *
 * Usage:
 *   pnpm tsx scripts/docs/render-markdown-preview.ts < input.txt
 *   pnpm tsx scripts/docs/render-markdown-preview.ts --input input.txt
 *   echo 'Some `code` here' | pnpm tsx scripts/docs/render-markdown-preview.ts
 */

import chalk from "chalk";
import { readFileSync } from "node:fs";

/**
 * Read input from stdin
 */
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

/**
 * Parse command-line arguments
 */
function parseArgs(): { inputFile?: string; help: boolean } {
  const args = process.argv.slice(2);
  const result: { inputFile?: string; help: boolean } = { help: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--input" || arg === "-i") {
      result.inputFile = args[++i];
    }
  }

  return result;
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
Colorize markdown-mode TUI output for screenshots

Usage:
  pnpm tsx scripts/docs/render-markdown-preview.ts [options]

Options:
  --input, -i <file>    Read from file instead of stdin
  --help, -h            Show this help message

Examples:
  pnpm tsx scripts/docs/render-markdown-preview.ts < input.txt
  pnpm tsx scripts/docs/render-markdown-preview.ts --input input.txt
  echo 'Some \`code\` here' | pnpm tsx scripts/docs/render-markdown-preview.ts
`);
}

/**
 * Apply colorization to markdown text
 */
function colorizeMarkdown(input: string): string {
  let output = input;

  // Apply highlighting to code blocks first (before inline code)
  // This prevents interference between the two patterns
  output = output.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const langDisplay = lang ? chalk.gray(`\`\`\`${lang}`) : chalk.gray("```");
    return `${langDisplay}\n${chalk.green(code)}${chalk.gray("```")}`;
  });

  // Apply highlighting to inline backticked content
  // Preserve the backticks, just colorize the content
  output = output.replace(/`([^`\n]+)`/g, (_, content) => {
    return chalk.gray("`") + chalk.cyan.bold(content) + chalk.gray("`");
  });

  // Apply highlighting to bold text (**text**)
  // Preserve the asterisks, just colorize the content
  output = output.replace(/\*\*([^*\n]+)\*\*/g, (_, content) => {
    return chalk.gray("**") + chalk.bold(content) + chalk.gray("**");
  });

  // Apply highlighting to headers (# Header)
  output = output.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, content) => {
    return chalk.blue.bold(`${hashes} ${content}`);
  });

  // Apply highlighting to unordered lists (- item, * item, + item)
  output = output.replace(
    /^(\s*)([-*+])\s+(.+)$/gm,
    (_, indent, bullet, content) => {
      return `${indent}${chalk.yellow(bullet)} ${content}`;
    }
  );

  // Apply highlighting to ordered lists (1. item)
  output = output.replace(
    /^(\s*)(\d+\.)\s+(.+)$/gm,
    (_, indent, number, content) => {
      return `${indent}${chalk.yellow(number)} ${content}`;
    }
  );

  return output;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    return;
  }

  // Read input
  let input: string;
  if (args.inputFile) {
    try {
      input = readFileSync(args.inputFile, "utf-8");
    } catch (error) {
      console.error(`Error reading file: ${error}`);
      process.exit(1);
    }
  } else {
    input = await readStdin();
  }

  // Apply colorization
  const output = colorizeMarkdown(input);

  // Write to stdout
  console.log(output);
}

// Run the script
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
