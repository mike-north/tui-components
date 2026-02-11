import { Command } from "commander";
import { readFileSync } from "node:fs";
import { registry, createRenderContext, type RenderMode } from "@tuicomponents/core";

/**
 * Output format for the batch command.
 */
type OutputFormat = "text" | "json";

/**
 * A single item in the batch input (JSON-L format).
 */
interface BatchInputItem {
  component: string;
  input: unknown;
}

/**
 * JSON output format for a single rendered item.
 */
interface BatchJsonOutput {
  component: string;
  output: string;
  width: number;
  lines: number;
}

/**
 * Error output for JSON format.
 */
interface BatchJsonError {
  component: string;
  error: string;
}

/**
 * Parse a render mode string, throwing on invalid input.
 */
function parseRenderMode(value: string): RenderMode {
  if (value !== "ansi" && value !== "markdown") {
    throw new Error(`Invalid render mode: ${value}. Must be 'ansi' or 'markdown'.`);
  }
  return value;
}

/**
 * Parse an output format string, throwing on invalid input.
 */
function parseOutputFormat(value: string): OutputFormat {
  if (value !== "text" && value !== "json") {
    throw new Error(`Invalid output format: ${value}. Must be 'text' or 'json'.`);
  }
  return value;
}

/**
 * Read stdin as a string.
 */
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

/**
 * Parse JSON-L (newline-delimited JSON) input.
 * Each line should be a valid JSON object.
 */
function parseJsonL(input: string): BatchInputItem[] {
  const lines = input.split("\n").filter((line) => line.trim() !== "");
  const items: BatchInputItem[] = [];

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    try {
      const parsed = JSON.parse(line) as unknown;
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("Each line must be a JSON object");
      }
      const item = parsed as { component?: unknown; input?: unknown };
      if (typeof item.component !== "string") {
        throw new Error('Missing or invalid "component" field');
      }
      if (item.input === undefined) {
        throw new Error('Missing "input" field');
      }
      items.push({ component: item.component, input: item.input });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Line ${index + 1}: Invalid JSON-L - ${errorMessage}`);
    }
  });

  return items;
}

export const batchCommand = new Command("batch")
  .description("Render multiple components from JSON-L input")
  .option("--file <path>", "Read JSON-L input from file instead of stdin")
  .option(
    "--format <format>",
    "Output format: text (default) or json",
    parseOutputFormat,
    "text" as OutputFormat
  )
  .option("--separator <string>", "Custom separator between text outputs", "\n")
  .option(
    "--render-mode <mode>",
    "Render mode: ansi (rich terminal) or markdown (AI assistants)",
    parseRenderMode
  )
  .option("--width <n>", "Override terminal width", parseInt)
  .option("--no-color", "Disable colors")
  .option("--continue-on-error", "Continue processing if one item fails")
  .action(
    async (options: {
      file?: string;
      format: OutputFormat;
      separator: string;
      renderMode?: RenderMode;
      width?: number;
      color?: boolean;
      continueOnError?: boolean;
    }) => {
      // Read input from file or stdin
      let inputContent: string;

      if (options.file) {
        try {
          inputContent = readFileSync(options.file, "utf-8");
        } catch (_e) {
          console.error(`Error: Could not read file: ${options.file}`);
          process.exit(1);
        }
      } else if (!process.stdin.isTTY) {
        inputContent = await readStdin();
      } else {
        console.error("Error: No input provided.");
        console.error("Provide input via --file or stdin.");
        process.exit(1);
      }

      // Parse JSON-L input
      let items: BatchInputItem[];
      try {
        items = parseJsonL(inputContent);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`Error: ${errorMessage}`);
        process.exit(1);
      }

      if (items.length === 0) {
        // No items to process
        process.exit(0);
      }

      // Create render context with options
      const contextOptions: Parameters<typeof createRenderContext>[0] = {
        noColor: options.color === false,
      };
      if (options.width !== undefined) {
        contextOptions.width = options.width;
      }
      if (options.renderMode !== undefined) {
        contextOptions.renderMode = options.renderMode;
      }
      const context = createRenderContext(contextOptions);

      // Process each item
      const textOutputs: string[] = [];
      const jsonOutputs: (BatchJsonOutput | BatchJsonError)[] = [];
      let hasError = false;

      for (const [index, item] of items.entries()) {
        const component = registry.get(item.component);

        // Check if component exists
        if (!component) {
          const errorMsg = `Unknown component: "${item.component}"`;
          if (options.format === "json") {
            jsonOutputs.push({ component: item.component, error: errorMsg });
          } else {
            console.error(`Error on item ${index + 1}: ${errorMsg}`);
          }
          hasError = true;
          if (!options.continueOnError) {
            process.exit(1);
          }
          continue;
        }

        // Validate input
        const parseResult = component.schema.safeParse(item.input);
        if (!parseResult.success) {
          const errorMsg = `Invalid input: ${JSON.stringify(parseResult.error.issues)}`;
          if (options.format === "json") {
            jsonOutputs.push({ component: item.component, error: errorMsg });
          } else {
            console.error(`Error on item ${index + 1}: ${errorMsg}`);
          }
          hasError = true;
          if (!options.continueOnError) {
            process.exit(1);
          }
          continue;
        }

        // Render the component
        try {
          const result = component.render(parseResult.data, context);

          if (options.format === "json") {
            jsonOutputs.push({
              component: item.component,
              output: result.output,
              width: result.actualWidth,
              lines: result.lineCount,
            });
          } else {
            textOutputs.push(result.output);
          }
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          if (options.format === "json") {
            jsonOutputs.push({ component: item.component, error: errorMsg });
          } else {
            console.error(`Error on item ${index + 1}: Render failed - ${errorMsg}`);
          }
          hasError = true;
          if (!options.continueOnError) {
            process.exit(1);
          }
        }
      }

      // Output results
      if (options.format === "json") {
        // JSON-L output
        for (const item of jsonOutputs) {
          console.log(JSON.stringify(item));
        }
      } else {
        // Text output with separator
        console.log(textOutputs.join(options.separator));
      }

      // Exit with error code if any errors occurred
      if (hasError) {
        process.exit(1);
      }
    }
  );
