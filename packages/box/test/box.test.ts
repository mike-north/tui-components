import { describe, it, expect, beforeAll } from "vitest";
import { createBox, type BoxInput } from "../src/index.js";
import { type RenderContext, getMarkdownRenderedWidth, createStyleFunctions } from "@tuicomponents/core";

describe("BoxComponent", () => {
  let box: ReturnType<typeof createBox>;
  const defaultContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  beforeAll(() => {
    box = createBox();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(box.metadata.name).toBe("box");
    });

    it("should have examples", () => {
      expect(box.metadata.examples.length).toBeGreaterThan(0);
    });
  });

  describe("render", () => {
    it("should render a simple box with single border", () => {
      const input: BoxInput = {
        content: "Hello",
      };

      const result = box.render(input, defaultContext);

      expect(result.output).toContain("┌");
      expect(result.output).toContain("┐");
      expect(result.output).toContain("└");
      expect(result.output).toContain("┘");
      expect(result.output).toContain("│Hello│");
    });

    it("should render box with double border", () => {
      const input: BoxInput = {
        content: "Test",
        borderStyle: "double",
      };

      const result = box.render(input, defaultContext);

      expect(result.output).toContain("╔");
      expect(result.output).toContain("╗");
      expect(result.output).toContain("╚");
      expect(result.output).toContain("╝");
      expect(result.output).toContain("║Test║");
    });

    it("should render box with rounded corners", () => {
      const input: BoxInput = {
        content: "Round",
        borderStyle: "round",
      };

      const result = box.render(input, defaultContext);

      expect(result.output).toContain("╭");
      expect(result.output).toContain("╮");
      expect(result.output).toContain("╰");
      expect(result.output).toContain("╯");
    });

    it("should render box with bold border", () => {
      const input: BoxInput = {
        content: "Bold",
        borderStyle: "bold",
      };

      const result = box.render(input, defaultContext);

      expect(result.output).toContain("┏");
      expect(result.output).toContain("┓");
      expect(result.output).toContain("┗");
      expect(result.output).toContain("┛");
      expect(result.output).toContain("┃Bold┃");
    });

    it("should render box with classic ASCII border", () => {
      const input: BoxInput = {
        content: "ASCII",
        borderStyle: "classic",
      };

      const result = box.render(input, defaultContext);

      expect(result.output).toContain("+");
      expect(result.output).toContain("-");
      expect(result.output).toContain("|ASCII|");
    });

    it("should render box with title", () => {
      const input: BoxInput = {
        content: "Content here",
        title: "Title",
      };

      const result = box.render(input, defaultContext);

      expect(result.output).toContain(" Title ");
      expect(result.output).toContain("Content here");
    });

    it("should render box with centered title", () => {
      const input: BoxInput = {
        content: "Content",
        title: "Center",
        titleAlignment: "center",
      };

      const result = box.render(input, defaultContext);

      // Title should be surrounded by border characters on both sides
      expect(result.output).toContain(" Center ");
    });

    it("should render box with right-aligned title", () => {
      const input: BoxInput = {
        content: "Content",
        title: "Right",
        titleAlignment: "right",
      };

      const result = box.render(input, defaultContext);

      expect(result.output).toContain(" Right ");
    });

    it("should render multiline content", () => {
      const input: BoxInput = {
        content: "Line 1\nLine 2\nLine 3",
      };

      const result = box.render(input, defaultContext);

      expect(result.output).toContain("Line 1");
      expect(result.output).toContain("Line 2");
      expect(result.output).toContain("Line 3");
      expect(result.lineCount).toBe(5); // 3 content lines + 2 border lines
    });

    it("should apply uniform padding", () => {
      const input: BoxInput = {
        content: "X",
        padding: 1,
      };

      const result = box.render(input, defaultContext);
      const lines = result.output.split("\n");

      // Should have: top border, 1 padding line, content, 1 padding line, bottom border
      expect(lines.length).toBe(5);
    });

    it("should apply object padding", () => {
      const input: BoxInput = {
        content: "X",
        padding: { top: 2, bottom: 1, left: 3, right: 3 },
      };

      const result = box.render(input, defaultContext);
      const lines = result.output.split("\n");

      // Should have: top border, 2 padding lines, content, 1 padding line, bottom border
      expect(lines.length).toBe(6);
    });

    it("should respect fixed width", () => {
      const input: BoxInput = {
        content: "Hi",
        width: 20,
      };

      const result = box.render(input, defaultContext);

      expect(result.actualWidth).toBe(20);
    });

    it("should center-align content", () => {
      const input: BoxInput = {
        content: "Hi",
        width: 10,
        textAlignment: "center",
      };

      const result = box.render(input, defaultContext);

      // Content should be padded on both sides
      expect(result.output).toContain("│");
      expect(result.actualWidth).toBe(10);
    });

    it("should right-align content", () => {
      const input: BoxInput = {
        content: "Hi",
        width: 10,
        textAlignment: "right",
      };

      const result = box.render(input, defaultContext);

      expect(result.actualWidth).toBe(10);
    });

    it("should handle empty content", () => {
      const input: BoxInput = {
        content: "",
      };

      const result = box.render(input, defaultContext);

      expect(result.output).toContain("┌");
      expect(result.output).toContain("└");
      expect(result.lineCount).toBe(3); // top border, empty content line, bottom border
    });

    it("should handle content with spaces", () => {
      const input: BoxInput = {
        content: "Hello World",
      };

      const result = box.render(input, defaultContext);

      expect(result.output).toContain("│Hello World│");
    });
  });

  describe("schema", () => {
    it("should validate correct input", () => {
      const input: BoxInput = {
        content: "test",
      };

      expect(() => box.schema.parse(input)).not.toThrow();
    });

    it("should apply default values", () => {
      const input: BoxInput = {
        content: "test",
      };

      const parsed = box.schema.parse(input);

      expect(parsed.borderStyle).toBe("single");
      expect(parsed.textAlignment).toBe("left");
      expect(parsed.titleAlignment).toBe("left");
      expect(parsed.padding).toBe(0);
    });

    it("should reject invalid border style", () => {
      const input = {
        content: "test",
        borderStyle: "invalid",
      };

      expect(() => box.schema.parse(input)).toThrow();
    });

    it("should reject missing content", () => {
      const input = {};

      expect(() => box.schema.parse(input)).toThrow();
    });
  });

  describe("getJsonSchema", () => {
    it("should return valid JSON schema", () => {
      const schema = box.getJsonSchema() as Record<string, unknown>;

      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });
  });

  describe("markdown title formatting", () => {
    const markdownContext: RenderContext = {
      width: 80,
      isTTY: false,
      colorLevel: 0,
      renderMode: "markdown",
      style: createStyleFunctions("markdown"),
    };

    it("should render italic title with correct border alignment", () => {
      const input: BoxInput = {
        content: "Content here",
        title: "_Notice_",
        borderStyle: "round",
      };

      const result = box.render(input, markdownContext);
      const lines = result.output.split("\n");

      // Find top and bottom borders
      const topBorder = lines.find(l => l.includes("╭"));
      const bottomBorder = lines.find(l => l.includes("╰"));

      expect(topBorder).toBeDefined();
      expect(bottomBorder).toBeDefined();

      // Top and bottom borders should have the same VISUAL width
      // (title formatting chars are invisible when rendered)
      expect(getMarkdownRenderedWidth(topBorder!)).toBe(getMarkdownRenderedWidth(bottomBorder!));
    });

    it("should render bold title with correct border alignment", () => {
      const input: BoxInput = {
        content: "Content here",
        title: "**Warning**",
        borderStyle: "round",
      };

      const result = box.render(input, markdownContext);
      const lines = result.output.split("\n");

      const topBorder = lines.find(l => l.includes("╭"));
      const bottomBorder = lines.find(l => l.includes("╰"));

      expect(topBorder).toBeDefined();
      expect(bottomBorder).toBeDefined();
      expect(getMarkdownRenderedWidth(topBorder!)).toBe(getMarkdownRenderedWidth(bottomBorder!));
    });

    it("should render bold-italic title with correct border alignment", () => {
      const input: BoxInput = {
        content: "Alert message",
        title: "***Alert***",
        borderStyle: "double",
      };

      const result = box.render(input, markdownContext);
      const lines = result.output.split("\n");

      const topBorder = lines.find(l => l.includes("╔"));
      const bottomBorder = lines.find(l => l.includes("╚"));

      expect(topBorder).toBeDefined();
      expect(bottomBorder).toBeDefined();
      expect(getMarkdownRenderedWidth(topBorder!)).toBe(getMarkdownRenderedWidth(bottomBorder!));
    });

    it("should include markdown formatting markers in output", () => {
      const input: BoxInput = {
        content: "Test",
        title: "_Italic_",
      };

      const result = box.render(input, markdownContext);
      expect(result.output).toContain("_Italic_");
    });

    it("should not affect ANSI mode rendering", () => {
      const ansiContext: RenderContext = {
        width: 80,
        isTTY: true,
        colorLevel: 3,
        renderMode: "ansi",
        style: createStyleFunctions("ansi"),
      };

      const input: BoxInput = {
        content: "Content",
        title: "**Bold**",
        borderStyle: "single",
      };

      const result = box.render(input, ansiContext);
      const lines = result.output.split("\n");

      // In ANSI mode, ** should be treated as literal characters
      // so they count toward the title width
      const topBorder = lines.find(l => l.includes("┌"));
      const bottomBorder = lines.find(l => l.includes("└"));

      expect(topBorder).toBeDefined();
      expect(bottomBorder).toBeDefined();
      // Both should be same length (ANSI mode counts all chars)
      expect(topBorder!.length).toBe(bottomBorder!.length);
    });

    it("should handle different title alignments with formatting", () => {
      const alignments = ["left", "center", "right"] as const;

      for (const alignment of alignments) {
        const input: BoxInput = {
          content: "Content here for width",
          title: "**Title**",
          titleAlignment: alignment,
          borderStyle: "round",
        };

        const result = box.render(input, markdownContext);
        const lines = result.output.split("\n");

        const topBorder = lines.find(l => l.includes("╭"));
        const bottomBorder = lines.find(l => l.includes("╰"));

        expect(topBorder).toBeDefined();
        expect(bottomBorder).toBeDefined();
        expect(getMarkdownRenderedWidth(topBorder!)).toBe(getMarkdownRenderedWidth(bottomBorder!));
      }
    });
  });
});
