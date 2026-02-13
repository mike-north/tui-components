#!/usr/bin/env tsx

/**
 * Generate JSON Schema for screenshot scenarios from component Zod schemas.
 *
 * This ensures the JSON Schema stays in sync with the actual component schemas,
 * providing accurate IDE autocomplete and validation.
 *
 * Usage:
 *   pnpm docs:schema           # Generate/update the JSON schema
 *   pnpm docs:schema --check   # Check if schema is up to date (for CI)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";
import { registry } from "@tuicomponents/core";

// Import all components to register them
import "@tuicomponents/sparkline";
import "@tuicomponents/box";
import "@tuicomponents/table";
import "@tuicomponents/chart";
import "@tuicomponents/list";
import "@tuicomponents/tree";
import "@tuicomponents/progress";
import "@tuicomponents/gauge";
import "@tuicomponents/diff";
import "@tuicomponents/keyvalue";
import "@tuicomponents/graph";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_FILE = path.join(__dirname, "screenshot-scenarios.schema.json");

/**
 * Generate the combined JSON schema for all screenshot scenarios.
 */
function generateSchema(): object {
  const componentInputSchemas: Record<string, object> = {};

  // Generate JSON schema for each component's input
  for (const name of registry.names()) {
    const component = registry.get(name);
    if (!component) continue;

    const zodSchema = component.schema;

    if (zodSchema) {
      try {
        const jsonSchema = zodToJsonSchema(zodSchema, {
          $refStrategy: "none",
          target: "jsonSchema7",
        });
        // Remove $schema from individual component schemas (we add it at top level)
        const { $schema: _, ...schemaWithoutMeta } = jsonSchema as Record<string, unknown>;
        componentInputSchemas[`${name}Input`] = schemaWithoutMeta;
      } catch (err) {
        console.warn(`Warning: Could not generate JSON schema for ${name}:`, err);
      }
    }
  }

  // Build the full schema
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://tuicomponents.dev/schemas/screenshot-scenarios.json",
    title: "TUI Components Screenshot Scenarios",
    description:
      "Schema for defining screenshot scenarios for TUI component documentation. Generated from component Zod schemas.",
    type: "object",
    additionalProperties: {
      type: "array",
      description: "Array of scenarios for a component",
      items: {
        $ref: "#/$defs/scenario",
      },
    },
    $defs: {
      scenario: {
        type: "object",
        description: "A single screenshot scenario",
        required: ["name", "description", "input"],
        properties: {
          name: {
            type: "string",
            description:
              "Unique scenario name (used as filename without extension)",
            pattern: "^[a-z0-9-]+$",
          },
          description: {
            type: "string",
            description: "Brief description for documentation",
          },
          width: {
            type: "integer",
            description: "Render width in characters",
            default: 80,
            minimum: 20,
            maximum: 200,
          },
          input: {
            description:
              "Component input data. See component-specific schemas in $defs for structure.",
          },
        },
        additionalProperties: false,
      },
      // Include all component input schemas as definitions
      ...componentInputSchemas,
    },
  };

  return schema;
}

/**
 * Main entry point.
 */
function main(): void {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");

  console.log("Generating screenshot scenarios JSON schema from Zod schemas...");

  const schema = generateSchema();
  const schemaJson = JSON.stringify(schema, null, 2) + "\n";

  if (checkOnly) {
    // Check mode: compare with existing file
    if (!fs.existsSync(SCHEMA_FILE)) {
      console.error("Error: Schema file does not exist. Run without --check to generate.");
      process.exit(1);
    }

    const existing = fs.readFileSync(SCHEMA_FILE, "utf-8");
    if (existing !== schemaJson) {
      console.error("Error: Schema is out of date. Run 'pnpm docs:schema' to update.");
      process.exit(1);
    }

    console.log("✓ Schema is up to date");
  } else {
    // Generate mode: write the file
    fs.writeFileSync(SCHEMA_FILE, schemaJson);
    console.log(`✓ Generated ${path.basename(SCHEMA_FILE)}`);

    // List the components included
    const components = registry.names();
    console.log(`  Components: ${components.join(", ")}`);
  }
}

main();
