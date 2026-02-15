import { describe, it, expect } from "vitest";
import { createStyleFunctions } from "../src/styling.js";
import type { MarkdownRendererOptions } from "../src/markdown.js";

describe("createStyleFunctions", () => {
  describe("grayscale mode", () => {
    const style = createStyleFunctions("grayscale");

    it("should return text unchanged for primary", () => {
      expect(style.primary("hello")).toBe("hello");
    });

    it("should wrap with light shades for secondary", () => {
      expect(style.secondary("text")).toBe("░text░");
    });

    it("should prefix with solid block for header", () => {
      expect(style.header("Title")).toBe("█ Title");
    });

    it("should return text unchanged for border", () => {
      expect(style.border("│")).toBe("│");
    });
  });

  describe("markdown mode", () => {
    const style = createStyleFunctions("markdown");

    it("should return text unchanged for primary", () => {
      expect(style.primary("hello")).toBe("hello");
    });

    it("should wrap with backticks for secondary", () => {
      expect(style.secondary("text")).toBe(" `text`");
    });

    it("should wrap with bold markers for header", () => {
      expect(style.header("Title")).toBe("**Title**");
    });

    it("should return text unchanged for border", () => {
      expect(style.border("│")).toBe("│");
    });
  });

  describe("markdown mode with relaxed spacing", () => {
    const options: MarkdownRendererOptions = { spacingMode: "relaxed" };
    const style = createStyleFunctions("markdown", undefined, options);

    it("should use double space prefix for secondary", () => {
      expect(style.secondary("text")).toBe("  `text`");
    });

    it("should still use simple bold for header", () => {
      expect(style.header("Title")).toBe("**Title**");
    });
  });

  describe("ansi mode without theme", () => {
    const style = createStyleFunctions("ansi");

    it("should return text unchanged for primary", () => {
      expect(style.primary("hello")).toBe("hello");
    });

    it("should return text unchanged for secondary", () => {
      expect(style.secondary("text")).toBe("text");
    });

    it("should return text unchanged for header", () => {
      expect(style.header("Title")).toBe("Title");
    });
  });

  describe("empty string handling", () => {
    const markdownStyle = createStyleFunctions("markdown");
    const grayscaleStyle = createStyleFunctions("grayscale");

    it("should return empty string for empty secondary in markdown", () => {
      expect(markdownStyle.secondary("")).toBe("");
    });

    it("should return empty string for empty header in markdown", () => {
      expect(markdownStyle.header("")).toBe("");
    });

    it("should return empty string for empty secondary in grayscale", () => {
      expect(grayscaleStyle.secondary("")).toBe("");
    });

    it("should return empty string for empty header in grayscale", () => {
      expect(grayscaleStyle.header("")).toBe("");
    });
  });
});
