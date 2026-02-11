import { Command } from "commander";
import { registry } from "@tuicomponents/core";

export const listCommand = new Command("list")
  .description("List all available TUI components")
  .option("--json", "Output as JSON")
  .action((options: { json?: boolean }) => {
    const components = registry.list();

    if (options.json) {
      console.log(JSON.stringify(components, null, 2));
    } else {
      if (components.length === 0) {
        console.log("No components registered.");
        return;
      }

      console.log("Available components:\n");
      for (const component of components) {
        console.log(`  ${component.name} (v${component.version})`);
        console.log(`    ${component.description}\n`);
      }
    }
  });
