import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { join } from "node:path";

const cliPath = join(__dirname, "..", "dist", "cli.js");

// Helper to run CLI commands
function runCli(args: string, input?: string): string {
  const options: { encoding: BufferEncoding; input?: string } = {
    encoding: "utf-8",
  };
  if (input) {
    options.input = input;
  }
  return execSync(`node ${cliPath} ${args}`, options);
}

describe("CLI", () => {
  beforeAll(() => {
    // Ensure the CLI is built
    execSync("pnpm build", { cwd: join(__dirname, "..") });
  });

  describe("list", () => {
    it("should list registered components", () => {
      const output = runCli("list");
      expect(output).toContain("table");
    });

    it("should output JSON when --json flag is used", () => {
      const output = runCli("list --json");
      const parsed = JSON.parse(output);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.find((c: { name: string }) => c.name === "table")).toBeDefined();
    });
  });

  describe("schema", () => {
    it("should output JSON schema for a component", () => {
      const output = runCli("schema table");
      const schema = JSON.parse(output);
      // Schema may use $ref with definitions or have type directly
      if (schema.$ref && schema.definitions) {
        const defName = schema.$ref.replace("#/definitions/", "");
        expect(schema.definitions[defName]).toHaveProperty("type", "object");
      } else {
        expect(schema).toHaveProperty("type", "object");
      }
    });

    it("should error for unknown component", () => {
      expect(() => runCli("schema nonexistent")).toThrow();
    });
  });

  describe("render", () => {
    it("should render a table from JSON input", () => {
      const input = JSON.stringify({
        columns: [{ header: "Name", key: "name" }],
        rows: [{ name: "Alice" }],
      });
      const output = runCli(`render table --json '${input}'`);
      expect(output).toContain("Name");
      expect(output).toContain("Alice");
    });

    it("should render from stdin", () => {
      const input = JSON.stringify({
        columns: [{ header: "Test", key: "test" }],
        rows: [{ test: "value" }],
      });
      const output = runCli("render table", input);
      expect(output).toContain("Test");
      expect(output).toContain("value");
    });
  });

  describe("examples", () => {
    it("should show examples for a component", () => {
      const output = runCli("examples table");
      expect(output).toContain("basic");
      expect(output).toContain("Input:");
    });

    it("should output JSON when --json flag is used", () => {
      const output = runCli("examples table --json");
      const examples = JSON.parse(output);
      expect(Array.isArray(examples)).toBe(true);
    });

    it("should render examples with --render flag", () => {
      const output = runCli("examples table --render");
      expect(output).toContain("Output:");
      expect(output).toContain("─"); // Border character
    });
  });
});
