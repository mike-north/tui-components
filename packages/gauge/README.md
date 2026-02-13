# @tuicomponents/gauge

Renders meters with threshold zones for status display

![Gauge Example](../../docs/screenshots/gauge/disk-usage.png)

## Installation

```bash
pnpm add @tuicomponents/gauge
```

## Quick Start

```typescript
import { createGauge } from "@tuicomponents/gauge";
import { createRenderContext } from "@tuicomponents/core";

const component = createGauge();
const context = createRenderContext();

const result = component.render(
  {
    value: 65,
    max: 100,
  },
  context
);
console.log(result.output);
```

## Examples

### basic

Simple gauge

![Simple gauge](../../docs/screenshots/gauge/basic.png)

<details>
<summary>Input</summary>

```json
{
  "value": 65,
  "max": 100
}
```

</details>

### disk-usage

Disk usage gauge with zones

![Disk usage gauge with zones](../../docs/screenshots/gauge/disk-usage.png)

<details>
<summary>Input</summary>

```json
{
  "value": 78,
  "max": 100,
  "label": "Disk",
  "showValue": true,
  "unit": "%",
  "zones": [
    {
      "threshold": 70,
      "color": "success"
    },
    {
      "threshold": 90,
      "color": "warning"
    },
    {
      "threshold": 100,
      "color": "error"
    }
  ]
}
```

</details>

### memory

Memory usage gauge

![Memory usage gauge](../../docs/screenshots/gauge/memory.png)

<details>
<summary>Input</summary>

```json
{
  "value": 45,
  "max": 100,
  "label": "RAM",
  "showValue": true,
  "unit": "%"
}
```

</details>

## Configuration Options

| Property    | Type       | Required   | Default   | Description |
| ----------- | ---------- | ---------- | --------- | ----------- | --- | --- |
| `value`     | `number`   | ✓          | -         | -           |
| `min`       | `number`   |            | -         | -           |
| `max`       | `number`   |            | -         | -           |
| `zones`     | `object[]` |            | -         | -           |
| `width`     | `number`   |            | -         | -           |
| `style`     | `"bar"     | "segments" | "blocks"` |             | -   | -   |
| `label`     | `string`   |            | -         | -           |
| `showValue` | `boolean`  |            | -         | -           |
| `unit`      | `string`   |            | -         | -           |

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

For detailed API documentation, see the [API docs](../../docs/gauge.md).

## License

UNLICENSED
