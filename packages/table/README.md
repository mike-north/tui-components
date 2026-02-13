# @tuicomponents/table

Renders tabular data with customizable borders and alignment

## Installation

```bash
pnpm add @tuicomponents/table
```

## Quick Start

```typescript
import { createTable } from "@tuicomponents/table";
import { createRenderContext } from "@tuicomponents/core";

const component = createTable();
const context = createRenderContext();

const result = component.render(
  {
    columns: [
      {
        key: "name",
        header: "Name",
      },
      {
        key: "role",
        header: "Role",
      },
      {
        key: "status",
        header: "Status",
      },
    ],
    rows: [
      {
        name: "Alice",
        role: "Admin",
        status: "Active",
      },
      {
        name: "Bob",
        role: "User",
        status: "Active",
      },
      {
        name: "Carol",
        role: "User",
        status: "Inactive",
      },
    ],
  },
  context
);
console.log(result.output);
```

## Examples

### basic

Simple data table

![Simple data table](../../docs/screenshots/table/basic.png)

<details>
<summary>Input</summary>

```json
{
  "columns": [
    {
      "key": "name",
      "header": "Name"
    },
    {
      "key": "role",
      "header": "Role"
    },
    {
      "key": "status",
      "header": "Status"
    }
  ],
  "rows": [
    {
      "name": "Alice",
      "role": "Admin",
      "status": "Active"
    },
    {
      "name": "Bob",
      "role": "User",
      "status": "Active"
    },
    {
      "name": "Carol",
      "role": "User",
      "status": "Inactive"
    }
  ]
}
```

</details>

### with-borders

Table with borders

![Table with borders](../../docs/screenshots/table/with-borders.png)

<details>
<summary>Input</summary>

```json
{
  "columns": [
    {
      "key": "id",
      "header": "ID"
    },
    {
      "key": "task",
      "header": "Task"
    },
    {
      "key": "priority",
      "header": "Priority"
    }
  ],
  "rows": [
    {
      "id": "1",
      "task": "Review PR",
      "priority": "High"
    },
    {
      "id": "2",
      "task": "Update docs",
      "priority": "Medium"
    },
    {
      "id": "3",
      "task": "Fix bug",
      "priority": "High"
    }
  ],
  "borderStyle": "single"
}
```

</details>

## Configuration Options

| Property        | Type        | Required | Default  | Description    |
| --------------- | ----------- | -------- | -------- | -------------- | ------- | -------- | --- | --- | --- |
| `columns`       | `object[]`  | ✓        | -        | -              |
| `rows`          | `unknown[]` | ✓        | -        | -              |
| `borderStyle`   | `"none"     | "single" | "double" | "rounded"      | "heavy" | "ascii"` |     | -   | -   |
| `showHeader`    | `boolean`   |          | -        | -              |
| `rowSeparators` | `boolean`   |          | -        | -              |
| `maxWidth`      | `number`    |          | -        | -              |
| `headerStyle`   | `"normal"   | "bold"   | "italic" | "bold-italic"` |         | -        | -   |

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

For detailed API documentation, see the [API docs](../../docs/table.md).

## License

UNLICENSED
