import { describe, it, expect } from "vitest";
import {
  inlineCode,
  anchorLine,
  joinAnchoredLines,
  DEFAULT_ANCHOR,
} from "../src/markdown.js";
import type { MarkdownRendererOptions } from "../src/markdown.js";

describe("inlineCode with options", () => {
  it("should use single space prefix by default", () => {
    expect(inlineCode("text")).toBe(" `text`");
  });

  it("should use single space prefix for tight mode", () => {
    const options: MarkdownRendererOptions = { spacingMode: "tight" };
    expect(inlineCode("text", options)).toBe(" `text`");
  });

  it("should use double space prefix for relaxed mode", () => {
    const options: MarkdownRendererOptions = { spacingMode: "relaxed" };
    expect(inlineCode("text", options)).toBe("  `text`");
  });
});

describe("anchorLine with options", () => {
  it("should use no separator by default", () => {
    expect(anchorLine("content")).toBe("│content");
  });

  it("should use no separator for tight mode", () => {
    const options: MarkdownRendererOptions = { spacingMode: "tight" };
    expect(anchorLine("content", DEFAULT_ANCHOR, options)).toBe("│content");
  });

  it("should add space separator for relaxed mode", () => {
    const options: MarkdownRendererOptions = { spacingMode: "relaxed" };
    expect(anchorLine("**bold**", DEFAULT_ANCHOR, options)).toBe("│ **bold**");
  });

  it("should work with custom anchors", () => {
    const options: MarkdownRendererOptions = { spacingMode: "relaxed" };
    expect(anchorLine("content", ">", options)).toBe("> content");
  });
});

describe("joinAnchoredLines with options", () => {
  it("should join with newlines by default", () => {
    const lines = ["line 1", "line 2", "line 3"];
    expect(joinAnchoredLines(lines)).toBe("│line 1\n│line 2\n│line 3");
  });

  it("should join with newlines for full multiline mode", () => {
    const lines = ["line 1", "line 2"];
    const options: MarkdownRendererOptions = { multilineMode: "full" };
    expect(joinAnchoredLines(lines, DEFAULT_ANCHOR, options)).toBe(
      "│line 1\n│line 2"
    );
  });

  it("should join with pipe separator for inline mode", () => {
    const lines = ["line 1", "line 2", "line 3"];
    const options: MarkdownRendererOptions = { multilineMode: "inline" };
    expect(joinAnchoredLines(lines, DEFAULT_ANCHOR, options)).toBe(
      "│line 1 | │line 2 | │line 3"
    );
  });

  it("should combine relaxed spacing and inline mode", () => {
    const lines = ["A", "B"];
    const options: MarkdownRendererOptions = {
      spacingMode: "relaxed",
      multilineMode: "inline",
    };
    expect(joinAnchoredLines(lines, DEFAULT_ANCHOR, options)).toBe(
      "│ A | │ B"
    );
  });
});
