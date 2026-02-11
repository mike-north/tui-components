import { Command } from "commander";
import { readFileSync } from "node:fs";
import { registry, createRenderContext, type RenderMode } from "@tuicomponents/core";

export const renderCommand = new Command("render")
  .description("Render a component with the given input")
  .argument("<component>", "Component name")
  .option("--json <data>", "Inline JSON input")
  .option("--file <path>", "Read input from JSON file")
  .option("--width <n>", "Override terminal width", parseInt)
  .option("--no-color", "Disable colors")
  .option(
    "--render-mode <mode>",
    "Render mode: ansi (rich terminal) or markdown (AI assistants)",
    (value: string): RenderMode => {
      if (value !== "ansi" && value !== "markdown") {
        throw new Error(`Invalid render mode: ${value}. Must be 'ansi' or 'markdown'.`);
      }
      return value;
    }
  )
  .action(
    async (
      componentName: string,
      options: {
        json?: string;
        file?: string;
        width?: number;
        color?: boolean;
        renderMode?: RenderMode;
      }
    ) => {
      const component = registry.get(componentName);

      if (!component) {
        console.error(`Error: Component "${componentName}" not found.`);
        console.error("Use 'tui list' to see available components.");
        process.exit(1);
      }

      // Get input from one of the sources
      let inputData: unknown;

      if (options.json) {
        try {
          inputData = JSON.parse(options.json);
        } catch (_e) {
          console.error("Error: Invalid JSON in --json option");
          process.exit(1);
        }
      } else if (options.file) {
        try {
          const content = readFileSync(options.file, "utf-8");
          inputData = JSON.parse(content);
        } catch (_e) {
          console.error(`Error: Could not read or parse file: ${options.file}`);
          process.exit(1);
        }
      } else if (!process.stdin.isTTY) {
        // Read from stdin
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk as Buffer);
        }
        const stdinContent = Buffer.concat(chunks).toString("utf-8");
        try {
          inputData = JSON.parse(stdinContent);
        } catch (_e) {
          console.error("Error: Invalid JSON from stdin");
          process.exit(1);
        }
      } else {
        console.error("Error: No input provided.");
        console.error("Provide input via --json, --file, or stdin.");
        process.exit(1);
      }

      // Validate input against schema
      const parseResult = component.schema.safeParse(inputData);
      if (!parseResult.success) {
        console.error("Error: Invalid input:");
        console.error(JSON.stringify(parseResult.error.issues, null, 2));
        process.exit(1);
      }

      // Create render context with optional overrides
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

      // Render the component
      const result = component.render(parseResult.data, context);
      console.log(result.output);
    }
  );
