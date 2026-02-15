# @tuicomponents/test-harness

Test harness utilities for TUI components with AI assistant rendering simulation.

This package provides Vitest custom matchers, snapshot utilities, and helper functions for testing how TUI components render across different AI assistants.

## Installation

```bash
npm install --save-dev @tuicomponents/test-harness vitest
```

## Features

- **Custom Vitest matchers** for testing rendering behavior across assistants
- **Snapshot utilities** for generating comparison tests
- **Helper functions** for finding rendering differences and truncation issues
- **Re-exports** from `@tuicomponents/assistant-simulator` for convenience

## Usage

### Setting up Vitest matchers

```typescript
// vitest.setup.ts
import { setupAssistantMatchers } from "@tuicomponents/test-harness/vitest";

setupAssistantMatchers();
```

### Using custom matchers

```typescript
import { expect, test } from "vitest";

test("chart renders correctly in Claude Code", () => {
  const output = generateChart(data);

  // Assert that output renders as expected
  expect(output).toRenderAs(expectedOutput, "claude-code", "chat");

  // Assert that output is not truncated
  expect(output).toNotBeTruncated("claude-code", "chat");

  // Assert that newlines are preserved
  expect(output).toPreserveNewlines("claude-code", "chat");

  // Assert that ANSI codes are stripped
  expect(output).toStripAnsi("claude-code", "chat");
});
```

### Generating snapshots

```typescript
import { generateAllAssistantsSnapshot } from "@tuicomponents/test-harness";

const output = generateChart(data);
const snapshot = generateAllAssistantsSnapshot(output);

// snapshot contains rendering results for all assistants in both contexts
console.log(snapshot["claude-code"].chat);
console.log(snapshot["github-copilot"].command);
```

### Finding rendering differences

```typescript
import { findRenderingDifferences } from "@tuicomponents/test-harness";

const output = generateChart(data);
const differences = findRenderingDifferences(output, "chat");

// differences groups assistants by their rendered output
for (const [rendered, assistantIds] of Object.entries(differences)) {
  console.log(`Rendered as: ${rendered}`);
  console.log(`By: ${assistantIds.join(", ")}`);
}
```

### Finding truncation issues

```typescript
import { findTruncatingAssistants } from "@tuicomponents/test-harness";

const output = generateLongChart(data);
const truncating = findTruncatingAssistants(output);

if (truncating.length > 0) {
  console.warn(`Output will be truncated by: ${truncating.join(", ")}`);
}
```

## API

See [API documentation](./docs/index.md) for full details.

## License

UNLICENSED
