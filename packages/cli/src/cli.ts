import { Command } from "commander";
import { listCommand } from "./commands/list.js";
import { schemaCommand } from "./commands/schema.js";
import { renderCommand } from "./commands/render.js";
import { examplesCommand } from "./commands/examples.js";
import { envDebugCommand } from "./commands/env-debug.js";
import { batchCommand } from "./commands/batch.js";
import { isAgentEnvironment, AGENT_INSTRUCTIONS } from "./agent-instructions.js";

// Import components to register them with the registry
import "@tuicomponents/box";
import "@tuicomponents/chart";
import "@tuicomponents/diff";
import "@tuicomponents/gauge";
import "@tuicomponents/graph";
import "@tuicomponents/keyvalue";
import "@tuicomponents/list";
import "@tuicomponents/progress";
import "@tuicomponents/sparkline";
import "@tuicomponents/table";
import "@tuicomponents/tree";

const program = new Command();

program
  .name("tui")
  .description("TUI Components CLI - render terminal UI from JSON")
  .version("0.1.0");

program.addCommand(listCommand);
program.addCommand(schemaCommand);
program.addCommand(renderCommand);
program.addCommand(examplesCommand);
program.addCommand(envDebugCommand);
program.addCommand(batchCommand);

// Add agent instructions to help output when running in an agentic TUI
// Wrapped in try-catch since detection is nice-to-have, not critical
try {
  if (isAgentEnvironment()) {
    program.addHelpText("after", AGENT_INSTRUCTIONS);
  }
} catch {
  // Silently ignore detection failures - this is a non-critical enhancement
}

program.parse();
