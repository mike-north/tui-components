#!/usr/bin/env node

/**
 * Script to generate README.md files for each component package.
 *
 * This script:
 * 1. Loads all components from the registry
 * 2. Extracts metadata, schema definitions, and examples
 * 3. Loads screenshot scenarios from YAML configuration
 * 4. Generates a README.md file for each component with embedded screenshots
 *
 * Usage:
 *   node --import=tsx/esm scripts/docs/generate-readmes.ts
 * Or:
 *   Add script to package.json and run: pnpm run generate-readmes
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import YAML from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import types and registry from built dist files

// Dynamic import to load from dist after build
const packagesDir = resolve(__dirname, "../../packages");
const scenariosPath = resolve(__dirname, "screenshot-scenarios.yaml");
const screenshotsDir = resolve(__dirname, "../../docs/screenshots");

interface Scenario {
  name: string;
  description: string;
  width?: number;
  input: unknown;
}

type ScenariosFile = Record<string, Scenario[]>;

/**
 * Load screenshot scenarios from YAML file.
 */
function loadScenarios(): ScenariosFile {
  if (!existsSync(scenariosPath)) {
    console.warn("Warning: screenshot-scenarios.yaml not found");
    return {};
  }
  const content = readFileSync(scenariosPath, "utf-8");
  return YAML.parse(content) as ScenariosFile;
}

// Load core registry
const { registry } = await import(`${packagesDir}/core/dist/index.js`);

// Components to generate READMEs for (excluding core, cli, tui-components meta-package)
// Note: chart is excluded because it has a hand-crafted README + AGENT_INSTRUCTIONS.md
const VISUAL_COMPONENTS = [
  "sparkline",
  "table",
  "box",
  "list",
  "tree",
  "progress",
  "gauge",
  "diff",
  "keyvalue",
  "graph",
  // "chart" - has hand-crafted README, do not overwrite
];

interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

/**
 * Extract field information from a Zod schema.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSchemaFields(schema: any): SchemaField[] {
  const fields: SchemaField[] = [];

  // Handle ZodObject - access shape property directly
  if (schema && typeof schema === "object" && "shape" in schema) {
    const shape = schema.shape as Record<string, z.ZodType>;

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const field = extractFieldInfo(key, fieldSchema);
      fields.push(field);
    }
  }

  return fields;
}

/**
 * Extract information about a single field from its Zod schema.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFieldInfo(name: string, schema: any): SchemaField {
  let type = getZodTypeName(schema);
  let required = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let description = (schema as any).description ?? "";
  let defaultValue: string | undefined;

  // Unwrap optional schemas by checking _def.typeName
  if (schema._def?.typeName === "ZodOptional") {
    required = false;
    schema = schema._def.innerType;
    type = getZodTypeName(schema);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    description = (schema as any).description ?? description;
  }

  // Unwrap default schemas
  if (schema._def?.typeName === "ZodDefault") {
    required = false;
    // In Zod v4, defaultValue is a property, not a function
    defaultValue = JSON.stringify(schema._def.defaultValue);
    // Access inner type through _def
    schema = schema._def.innerType;
    type = getZodTypeName(schema);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    description = (schema as any).description ?? description;
  }

  return {
    name,
    type,
    required,
    description,
    default: defaultValue,
  };
}

/**
 * Get a human-readable type name from a Zod schema.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getZodTypeName(schema: any): string {
  if (!schema || !schema._def) return "unknown";

  const typeName = schema._def.typeName;

  switch (typeName) {
    case "ZodString":
      return "string";
    case "ZodNumber":
      return "number";
    case "ZodBoolean":
      return "boolean";
    case "ZodArray": {
      const elementType = getZodTypeName(schema._def.type);
      return `${elementType}[]`;
    }
    case "ZodObject":
      return "object";
    case "ZodUnion": {
      const types = schema._def.options.map((opt: z.ZodType) =>
        getZodTypeName(opt)
      );
      return types.join(" | ");
    }
    case "ZodEnum": {
      return schema._def.values.map((opt: string) => `"${opt}"`).join(" | ");
    }
    case "ZodLiteral":
      return JSON.stringify(schema._def.value);
    case "ZodOptional":
      return getZodTypeName(schema._def.innerType);
    case "ZodDefault":
      return getZodTypeName(schema._def.innerType);
    default:
      return "unknown";
  }
}

/**
 * Convert a component name to PascalCase (e.g., "sparkline" -> "Sparkline").
 */
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Generate a configuration options table from schema fields.
 */
function generateConfigTable(fields: SchemaField[]): string {
  if (fields.length === 0) {
    return "_No configuration options available._";
  }

  const header =
    "| Property | Type | Required | Default | Description |\n" +
    "|----------|------|----------|---------|-------------|";

  const rows = fields.map((field) => {
    const name = `\`${field.name}\``;
    const type = `\`${field.type}\``;
    const required = field.required ? "✓" : "";
    const defaultVal = field.default ? `\`${field.default}\`` : "-";
    const description = field.description || "-";

    return `| ${name} | ${type} | ${required} | ${defaultVal} | ${description} |`;
  });

  return [header, ...rows].join("\n");
}

/**
 * Generate examples section from screenshot scenarios.
 * Uses screenshots from docs/screenshots/{component}/ directory.
 */
function generateExamples(
  componentName: string,
  scenarios: Scenario[]
): string {
  if (scenarios.length === 0) {
    return "_No examples available._";
  }

  return scenarios
    .map((scenario) => {
      const screenshotPath = `../../docs/screenshots/${componentName}/${scenario.name}.png`;
      const absoluteScreenshotPath = resolve(
        screenshotsDir,
        componentName,
        `${scenario.name}.png`
      );

      const hasScreenshot = existsSync(absoluteScreenshotPath);
      const input = JSON.stringify(scenario.input, null, 2);

      const screenshotSection = hasScreenshot
        ? `![${scenario.description}](${screenshotPath})`
        : "_Screenshot not yet generated. Run `pnpm docs:screenshots` to generate._";

      return `### ${scenario.name}

${scenario.description}

${screenshotSection}

<details>
<summary>Input</summary>

\`\`\`json
${input}
\`\`\`

</details>`;
    })
    .join("\n\n");
}

/**
 * Generate a README.md for a component.
 */
function generateReadme(
  componentName: string,
  scenarios: Scenario[]
): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const component = registry.get(componentName);
  if (!component) {
    throw new Error(`Component "${componentName}" not found in registry`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const metadata = component.metadata;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const schema = component.schema;
  const pascalName = toPascalCase(componentName);

  // Extract schema fields
  const fields = extractSchemaFields(schema);

  // Get first scenario for Quick Start
  const firstScenario = scenarios[0];
  const quickStartInput = firstScenario
    ? JSON.stringify(firstScenario.input, null, 2)
    : "{}";

  // Generate sections
  const configTable = generateConfigTable(fields);
  const examplesSection = generateExamples(componentName, scenarios);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const description = String(metadata.description);

  return `# @tuicomponents/${componentName}

${description}

## Installation

\`\`\`bash
pnpm add @tuicomponents/${componentName}
\`\`\`

## Quick Start

\`\`\`typescript
import { create${pascalName} } from '@tuicomponents/${componentName}';
import { createRenderContext } from '@tuicomponents/core';

const component = create${pascalName}();
const context = createRenderContext();

const result = component.render(${quickStartInput}, context);
console.log(result.output);
\`\`\`

## Examples

${examplesSection}

## Configuration Options

${configTable}

## Render Modes

The component supports two render modes:

- **ANSI**: Rich terminal output with colors and Unicode characters
- **Markdown**: Plain text suitable for AI assistants and documentation

You can specify the render mode when creating the context:

\`\`\`typescript
import { createRenderContext } from '@tuicomponents/core';

// ANSI mode (default)
const ansiContext = createRenderContext({ renderMode: 'ansi' });

// Markdown mode
const mdContext = createRenderContext({ renderMode: 'markdown' });
\`\`\`

## API

For detailed API documentation, see the [API docs](../../docs/${componentName}.md).

## License

UNLICENSED
`;
}

/**
 * Main function to generate all READMEs.
 */
async function main(): Promise<void> {
  console.log("Generating README.md files for components...\n");

  // Load screenshot scenarios
  const allScenarios = loadScenarios();
  console.log(
    `Loaded scenarios for: ${Object.keys(allScenarios).join(", ")}\n`
  );

  // Import all component packages to register them
  for (const componentName of VISUAL_COMPONENTS) {
    try {
      await import(`${packagesDir}/${componentName}/dist/index.js`);
    } catch (error) {
      console.error(
        `✗ Failed to load component "${componentName}". Make sure packages are built first.`,
        error
      );
      process.exit(1);
    }
  }

  // Generate READMEs for each component
  for (const componentName of VISUAL_COMPONENTS) {
    try {
      const scenarios = allScenarios[componentName] ?? [];
      const readme = generateReadme(componentName, scenarios);
      const packagePath = resolve(
        __dirname,
        "../../packages",
        componentName,
        "README.md"
      );

      writeFileSync(packagePath, readme, "utf-8");
      console.log(
        `✓ Generated ${componentName}/README.md (${String(scenarios.length)} examples)`
      );
    } catch (error) {
      console.error(`✗ Failed to generate ${componentName}/README.md:`, error);
      process.exit(1);
    }
  }

  console.log("\n✓ All READMEs generated successfully!");
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
