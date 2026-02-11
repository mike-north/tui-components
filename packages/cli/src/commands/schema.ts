import { Command } from "commander";
import { registry } from "@tuicomponents/core";

export const schemaCommand = new Command("schema")
  .description("Get the JSON Schema for a component's input")
  .argument("<component>", "Component name")
  .action((componentName: string) => {
    const component = registry.get(componentName);

    if (!component) {
      console.error(`Error: Component "${componentName}" not found.`);
      console.error("Use 'tui list' to see available components.");
      process.exit(1);
    }

    const schema = component.getJsonSchema();
    console.log(JSON.stringify(schema, null, 2));
  });
