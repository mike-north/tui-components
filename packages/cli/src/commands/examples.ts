import { Command } from "commander";
import { registry, createRenderContext } from "@tuicomponents/core";

export const examplesCommand = new Command("examples")
  .description("Show usage examples for a component")
  .argument("<component>", "Component name")
  .option("--render", "Render the example outputs")
  .option("--json", "Output examples as JSON")
  .option("--no-color", "Disable colors")
  .action(
    (
      componentName: string,
      options: { render?: boolean; json?: boolean; color?: boolean }
    ) => {
      const component = registry.get(componentName);

      if (!component) {
        console.error(`Error: Component "${componentName}" not found.`);
        console.error("Use 'tui list' to see available components.");
        process.exit(1);
      }

      const { examples } = component.metadata;

      if (examples.length === 0) {
        console.log(`No examples available for "${componentName}".`);
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(examples, null, 2));
        return;
      }

      for (const example of examples) {
        console.log(`\n--- ${example.name} ---`);
        if (example.description) {
          console.log(example.description);
        }
        console.log("\nInput:");
        console.log(JSON.stringify(example.input, null, 2));

        if (options.render) {
          console.log("\nOutput:");
          const context = createRenderContext({
            noColor: options.color === false,
          });
          // Validate and render
          const parseResult = component.schema.safeParse(example.input);
          if (parseResult.success) {
            const result = component.render(parseResult.data, context);
            console.log(result.output);
          } else {
            console.log("(Error rendering example)");
          }
        }
        console.log("");
      }
    }
  );
