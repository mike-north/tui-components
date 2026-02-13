# @tuicomponents/list

Renders bulleted or numbered lists with nesting support

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

## Configuration Options

| Property | Type       | Required | Default | Description |
| -------- | ---------- | -------- | ------- | ----------- | ---------- | ---------- | ------- | ------- | --- | --- | --- |
| `items`  | `object[]` | ✓        | -       | -           |
| `style`  | `"bullet"  | "dash"   | "arrow" | "star"      | "numbered" | "lettered" | "roman" | "none"` |     | -   | -   |
| `indent` | `number`   |          | -       | -           |
| `start`  | `number`   |          | -       | -           |

## Render Modes

The component supports two render modes:

- **ANSI**: Rich terminal output with colors and Unicode characters
- **Markdown**: Plain text suitable for AI assistants and documentation

You can specify the render mode when creating the context:

```typescript
import { createRenderContext } from "@tuicomponents/core";

// ANSI mode (default)
const ansiContext = createRenderContext({ renderMode: "ansi" });

// Markdown mode
const mdContext = createRenderContext({ renderMode: "markdown" });
```

## API

For detailed API documentation, see the [API docs](../../docs/list.md).

## License

UNLICENSED
