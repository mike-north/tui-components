import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/box.ts",
    "src/chart.ts",
    "src/diff.ts",
    "src/gauge.ts",
    "src/graph.ts",
    "src/keyvalue.ts",
    "src/list.ts",
    "src/progress.ts",
    "src/sparkline.ts",
    "src/table.ts",
    "src/tree.ts",
    "src/core.ts",
    "src/layout.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
