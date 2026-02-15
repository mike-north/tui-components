# @tuicomponents/diff

Renders unified diff format with additions and deletions

## Installation

```bash
pnpm add @tuicomponents/diff
```

## Quick Start

```typescript
import { createDiff } from "@tuicomponents/diff";
import { createRenderContext } from "@tuicomponents/core";

const component = createDiff();
const context = createRenderContext();

const result = component.render(
  {
    hunks: [
      {
        lines: [
          {
            type: "deletion",
            content: "Hello World",
          },
          {
            type: "addition",
            content: "Hello Universe",
          },
        ],
      },
    ],
  },
  context
);
console.log(result.output);
```

## Examples

### basic

Simple text diff

![Simple text diff](../../docs/screenshots/diff/basic.png)

<details>
<summary>Input</summary>

```json
{
  "hunks": [
    {
      "lines": [
        {
          "type": "deletion",
          "content": "Hello World"
        },
        {
          "type": "addition",
          "content": "Hello Universe"
        }
      ]
    }
  ]
}
```

</details>

### config-change

Configuration file diff

![Configuration file diff](../../docs/screenshots/diff/config-change.png)

<details>
<summary>Input</summary>

```json
{
  "oldFile": "config.ini",
  "newFile": "config.ini",
  "showLineNumbers": true,
  "hunks": [
    {
      "lines": [
        {
          "type": "deletion",
          "content": "port=8080"
        },
        {
          "type": "addition",
          "content": "port=3000"
        },
        {
          "type": "context",
          "content": "host=localhost"
        },
        {
          "type": "deletion",
          "content": "debug=false"
        },
        {
          "type": "addition",
          "content": "debug=true"
        }
      ]
    }
  ]
}
```

</details>

### code-diff

Code change diff

![Code change diff](../../docs/screenshots/diff/code-diff.png)

<details>
<summary>Input</summary>

```json
{
  "oldFile": "greet.js",
  "newFile": "greet.ts",
  "showLineNumbers": true,
  "hunks": [
    {
      "lines": [
        {
          "type": "deletion",
          "content": "function greet(name) {"
        },
        {
          "type": "addition",
          "content": "function greet(name: string): string {"
        },
        {
          "type": "deletion",
          "content": "  return \"Hello, \" + name;"
        },
        {
          "type": "addition",
          "content": "  return `Hello, ${name}!`;"
        },
        {
          "type": "context",
          "content": "}"
        }
      ]
    }
  ]
}
```

</details>

### gutter-style

IDE-style diff with gutter and backgrounds

![IDE-style diff with gutter and backgrounds](../../docs/screenshots/diff/gutter-style.png)

<details>
<summary>Input</summary>

```json
{
  "displayStyle": "gutter",
  "backgroundMode": "line",
  "showLineNumbers": true,
  "hunks": [
    {
      "lines": [
        {
          "type": "context",
          "content": "const config = {",
          "oldLineNumber": 45,
          "newLineNumber": 45
        },
        {
          "type": "deletion",
          "content": "  debug: false,",
          "oldLineNumber": 46
        },
        {
          "type": "addition",
          "content": "  debug: true,",
          "newLineNumber": 46
        },
        {
          "type": "context",
          "content": "};",
          "oldLineNumber": 47,
          "newLineNumber": 47
        }
      ]
    }
  ]
}
```

</details>

## Configuration Options

| Property          | Type       | Required | Default    | Description                                     |
| ----------------- | ---------- | -------- | ---------- | ----------------------------------------------- |
| `hunks`           | `object[]` | ✓        | -          | Array of diff hunks                             |
| `oldFile`         | `string`   |          | -          | Original file name                              |
| `newFile`         | `string`   |          | -          | New file name                                   |
| `showLineNumbers` | `boolean`  |          | `true`     | Show line numbers                               |
| `markerStyle`     | `string`   |          | `"symbol"` | Marker style: `"symbol"`, `"word"`, or `"none"` |
| `showHunkHeaders` | `boolean`  |          | `true`     | Show hunk headers                               |
| `contextLines`    | `number`   |          | `3`        | Number of context lines                         |
| `displayStyle`    | `string`   |          | `"inline"` | Display style: `"inline"` or `"gutter"`         |
| `backgroundMode`  | `string`   |          | `"none"`   | Background mode: `"none"` or `"line"`           |

## Render Modes

The component supports three render modes:

- **ANSI**: Rich terminal output with colors and Unicode characters
- **Markdown**: Plain text suitable for AI assistants and documentation
- **Grayscale**: ANSI output without colors (for terminals that don't support color)

You can specify the render mode when creating the context:

```typescript
import { createRenderContext } from "@tuicomponents/core";

// ANSI mode (default)
const ansiContext = createRenderContext({ renderMode: "ansi" });

// Markdown mode
const mdContext = createRenderContext({ renderMode: "markdown" });

// Grayscale mode
const grayscaleContext = createRenderContext({ renderMode: "grayscale" });
```

## API

For detailed API documentation, see the [API docs](../../docs/diff.md).

## License

UNLICENSED
