# @tuicomponents/assistant-simulator

Simulate how AI coding assistants render terminal/TUI output.

## Overview

This package provides a generic, reusable framework for simulating how different AI coding assistants handle terminal output. Each assistant may strip ANSI codes, collapse newlines, truncate output, or apply other transformations based on their rendering capabilities.

## Installation

```bash
npm install @tuicomponents/assistant-simulator
```

## Usage

### Basic Simulation

```typescript
import {
  simulateRendering,
  claudeCodeConfig,
} from "@tuicomponents/assistant-simulator";

const rawOutput = "\x1b[31mError\x1b[0m\nLine 2\nLine 3\nLine 4";
const result = simulateRendering(rawOutput, claudeCodeConfig, "command");

console.log(result.rendered);
// => "Error\nLine 2\nLine 3\n... (1 more line)"

console.log(result.metadata);
// {
//   assistantId: "claude-code",
//   context: "command",
//   wasTruncated: true,
//   originalLineCount: 4,
//   transformsApplied: ["stripAnsi", "truncateLines(3)"]
// }
```

### Using Transform Functions Directly

```typescript
import {
  stripAnsi,
  collapseNewlines,
  composeTransforms,
} from "@tuicomponents/assistant-simulator";

const input = "\x1b[31mRed\x1b[0m\n\nText";

// Use individual transforms
console.log(stripAnsi(input)); // "Red\n\nText"
console.log(collapseNewlines(stripAnsi(input))); // "Red Text"

// Or compose them
const transform = composeTransforms([stripAnsi, collapseNewlines]);
console.log(transform(input)); // "Red Text"
```

### Available Assistants

```typescript
import {
  getAssistantIds,
  getConfig,
  getAllConfigs,
} from "@tuicomponents/assistant-simulator";

// Get all assistant IDs
console.log(getAssistantIds());
// ["claude-code", "github-copilot", "cline", "codex", "gemini-cli", "kiro-cli", "opencode"]

// Get specific config
const config = getConfig("github-copilot");
console.log(config.displayName); // "GitHub Copilot"

// Get all configs
const allConfigs = getAllConfigs();
```

### Assistant Configurations

| Assistant      | ANSI Support | Newline Handling | Command Truncation | Notes                                     |
| -------------- | ------------ | ---------------- | ------------------ | ----------------------------------------- |
| Claude Code    | None         | Full             | 3 lines            | Strips ANSI, truncates command output     |
| GitHub Copilot | None         | Collapsed        | None               | Collapses all newlines to spaces          |
| Cline          | None         | Full             | None               | Shows literal backticks (no highlighting) |
| Codex          | Truecolor    | Full             | None               | Full ANSI color support                   |
| Gemini CLI     | Basic        | Full             | None               | 16-color ANSI support                     |
| Kiro CLI       | 256          | Full             | None               | 256-color ANSI support                    |
| OpenCode       | None         | Full             | None               | Basic ANSI stripping                      |

### Custom Transforms

```typescript
import {
  simulateRendering,
  claudeCodeConfig,
} from "@tuicomponents/assistant-simulator";

const addTimestamp = (s: string) => `[${new Date().toISOString()}] ${s}`;
const toUpperCase = (s: string) => s.toUpperCase();

const result = simulateRendering(
  "\x1b[31merror\x1b[0m",
  claudeCodeConfig,
  "chat",
  {
    additionalTransforms: [addTimestamp, toUpperCase],
  }
);

console.log(result.rendered);
// "[2024-01-15T10:30:00.000Z] ERROR"
```

## API Reference

### Types

#### `AssistantContext`

- `"command"`: Output shown in a bash/terminal command result block
- `"chat"`: Output shown directly in the chat/conversation

#### `AnsiSupport`

- `"none"`: All ANSI codes are stripped
- `"basic"`: 16 basic colors supported
- `"256"`: 256 color palette supported
- `"truecolor"`: Full 24-bit RGB color supported

#### `NewlineHandling`

- `"full"`: Newlines are preserved as-is
- `"collapsed"`: Multiple newlines collapsed to spaces

### Transform Functions

- **`stripAnsi(input: string): string`** - Strips all ANSI escape codes
- **`collapseNewlines(input: string): string`** - Collapses newlines to spaces
- **`truncateLines(input: string, maxLines: number): string`** - Truncates to max lines with ellipsis
- **`createTruncateTransform(maxLines: number): TransformFn`** - Creates reusable truncate transform
- **`stripBackticks(input: string): string`** - Removes markdown backticks
- **`stripBoldMarkers(input: string): string`** - Removes markdown bold markers
- **`addSpaceAfterBoxChars(input: string): string`** - Adds spaces after Unicode box characters
- **`identity(input: string): string`** - Returns input unchanged (no-op)
- **`composeTransforms(transforms: TransformFn[]): TransformFn`** - Composes multiple transforms

### Main Function

#### `simulateRendering(output, config, context, options?)`

Simulates how an AI assistant would render terminal output.

**Parameters:**

- `output: string` - Raw terminal output
- `config: AssistantConfig` - Assistant configuration
- `context: AssistantContext` - Rendering context ("command" or "chat")
- `options?: SimulateOptions` - Optional additional transforms

**Returns:** `SimulatedOutput`

```typescript
{
  rendered: string;
  metadata: {
    assistantId: string;
    context: AssistantContext;
    wasTruncated: boolean;
    originalLineCount: number;
    transformsApplied: readonly string[];
  };
}
```

## License

UNLICENSED
