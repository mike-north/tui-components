# @tuicomponents/list

Renders lists with support for bullets, numbers, tasks, and definitions

## Installation

```bash
pnpm add @tuicomponents/list
```

## Quick Start

```typescript
import { createList } from "@tuicomponents/list";
import { createRenderContext } from "@tuicomponents/core";

const component = createList();
const context = createRenderContext();

const result = component.render(
  {
    items: [
      {
        text: "First item",
      },
      {
        text: "Second item",
      },
      {
        text: "Third item",
      },
    ],
    style: "bullet",
  },
  context
);
console.log(result.output);
```

## Examples

### bullet

Bulleted list

![Bulleted list](../../docs/screenshots/list/bullet.png)

<details>
<summary>Input</summary>

```json
{
  "items": [
    {
      "text": "First item"
    },
    {
      "text": "Second item"
    },
    {
      "text": "Third item"
    }
  ],
  "style": "bullet"
}
```

</details>

### numbered

Numbered list

![Numbered list](../../docs/screenshots/list/numbered.png)

<details>
<summary>Input</summary>

```json
{
  "items": [
    {
      "text": "Step one"
    },
    {
      "text": "Step two"
    },
    {
      "text": "Step three"
    }
  ],
  "style": "numbered"
}
```

</details>

### nested

Nested list with sub-items

![Nested list with sub-items](../../docs/screenshots/list/nested.png)

<details>
<summary>Input</summary>

```json
{
  "items": [
    {
      "text": "Project setup",
      "items": [
        {
          "text": "Install dependencies"
        },
        {
          "text": "Configure environment"
        }
      ]
    },
    {
      "text": "Development",
      "items": [
        {
          "text": "Write code"
        },
        {
          "text": "Run tests"
        }
      ]
    }
  ],
  "style": "bullet"
}
```

</details>

### task

Task list with checkboxes

![Task list with checkboxes](../../docs/screenshots/list/task.png)

<details>
<summary>Input</summary>

```json
{
  "items": [
    {
      "text": "Complete documentation",
      "checked": true
    },
    {
      "text": "Write tests",
      "checked": false
    },
    {
      "text": "Review PR",
      "checked": "partial"
    }
  ],
  "style": "task"
}
```

</details>

### definition

Definition list with terms

![Definition list with terms](../../docs/screenshots/list/definition.png)

<details>
<summary>Input</summary>

```json
{
  "items": [
    {
      "term": "API",
      "definition": "Application Programming Interface"
    },
    {
      "term": "CLI",
      "definition": "Command Line Interface"
    },
    {
      "term": "TUI",
      "definition": "Terminal User Interface"
    }
  ],
  "style": "definition"
}
```

</details>

## Configuration Options

| Property    | Type      | Required | Default   | Description |
| ----------- | --------- | -------- | --------- | ----------- | ---------- | ---------- | ------- | ------ | ------ | ------------- | --- | --- | --- |
| `items`     | `object   | object   | object[]` | ✓           | -          | -          |
| `style`     | `"bullet" | "dash"   | "arrow"   | "star"      | "numbered" | "lettered" | "roman" | "none" | "task" | "definition"` |     | -   | -   |
| `indent`    | `number`  |          | -         | -           |
| `start`     | `number`  |          | -         | -           |
| `termWidth` | `number`  |          | -         | -           |

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

For detailed API documentation, see the [API docs](../../docs/list.md).

## License

UNLICENSED
