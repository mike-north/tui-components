# @tuicomponents/box

Renders content in a bordered box/panel

## Installation

```bash
pnpm add @tuicomponents/box
```

## Quick Start

```typescript
import { createBox } from "@tuicomponents/box";
import { createRenderContext } from "@tuicomponents/core";

const component = createBox();
const context = createRenderContext();

const result = component.render(
  {
    content: "Hello, World!",
    padding: 1,
  },
  context
);
console.log(result.output);
```

## Examples

### simple

Simple box with content

![Simple box with content](../../docs/screenshots/box/simple-comparison.png)

<details>
<summary>View individual modes</summary>

| ANSI                                           | Markdown                                                    | Grayscale                                                     |
| ---------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| ![ANSI](../../docs/screenshots/box/simple.png) | ![Markdown](../../docs/screenshots/box/simple-markdown.png) | ![Grayscale](../../docs/screenshots/box/simple-grayscale.png) |

</details>

<details>
<summary>Input</summary>

```json
{
  "content": "Hello, World!",
  "padding": 1
}
```

</details>

### with-title

Box with title

![Box with title](../../docs/screenshots/box/with-title-comparison.png)

<details>
<summary>View individual modes</summary>

| ANSI                                               | Markdown                                                        | Grayscale                                                         |
| -------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| ![ANSI](../../docs/screenshots/box/with-title.png) | ![Markdown](../../docs/screenshots/box/with-title-markdown.png) | ![Grayscale](../../docs/screenshots/box/with-title-grayscale.png) |

</details>

<details>
<summary>Input</summary>

```json
{
  "content": "System Status: All services operational",
  "title": "Status",
  "padding": 1
}
```

</details>

### rounded

Box with rounded corners

![Box with rounded corners](../../docs/screenshots/box/rounded-comparison.png)

<details>
<summary>View individual modes</summary>

| ANSI                                            | Markdown                                                     | Grayscale                                                      |
| ----------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| ![ANSI](../../docs/screenshots/box/rounded.png) | ![Markdown](../../docs/screenshots/box/rounded-markdown.png) | ![Grayscale](../../docs/screenshots/box/rounded-grayscale.png) |

</details>

<details>
<summary>Input</summary>

```json
{
  "content": "This box has rounded corners",
  "title": "Info",
  "borderStyle": "round",
  "padding": 1
}
```

</details>

## Configuration Options

| Property         | Type      | Required | Default  | Description |
| ---------------- | --------- | -------- | -------- | ----------- | -------------- | -------------- | --------- | ------- | --- | --- | --- |
| `content`        | `string`  | ✓        | -        | -           |
| `title`          | `string`  |          | -        | -           |
| `titleAlignment` | `"left"   | "center" | "right"` |             | -              | -              |
| `borderStyle`    | `"single" | "double" | "round"  | "bold"      | "singleDouble" | "doubleSingle" | "classic" | "none"` |     | -   | -   |
| `padding`        | `number   | object`  |          | -           | -              |
| `width`          | `number`  |          | -        | -           |
| `textAlignment`  | `"left"   | "center" | "right"` |             | -              | -              |
| `dimBorder`      | `boolean` |          | -        | -           |

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

For detailed API documentation, see the [API docs](../../docs/box.md).

## License

UNLICENSED
