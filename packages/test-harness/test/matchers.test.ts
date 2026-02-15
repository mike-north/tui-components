/**
 * Tests for custom Vitest matchers.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { setupAssistantMatchers } from "../src/vitest.js";

beforeAll(() => {
  setupAssistantMatchers();
});

describe("toRenderAs", () => {
  it("should pass when output renders as expected", () => {
    const output = "\x1b[31mRed text\x1b[0m";
    expect(output).toRenderAs("Red text", "claude-code", "chat");
  });

  it("should fail when output does not render as expected", () => {
    const output = "Hello world";
    expect(() => {
      expect(output).toRenderAs("Goodbye world", "claude-code", "chat");
    }).toThrow();
  });

  it("should handle newline collapsing for GitHub Copilot", () => {
    const output = "Line 1\nLine 2\nLine 3";
    expect(output).toRenderAs(
      "Line 1 Line 2 Line 3",
      "github-copilot",
      "command"
    );
  });

  it("should handle ANSI stripping", () => {
    const output = "\x1b[1;31mBold Red\x1b[0m";
    expect(output).toRenderAs("Bold Red", "claude-code", "chat");
  });
});

describe("toNotBeTruncated", () => {
  it("should pass when output is not truncated", () => {
    const output = "Short output";
    expect(output).toNotBeTruncated("claude-code", "chat");
  });

  it("should fail when output is truncated", () => {
    // Create output with many lines to trigger truncation
    const manyLines = Array.from(
      { length: 200 },
      (_, i) => "Line " + (i + 1)
    ).join("\n");
    expect(() => {
      expect(manyLines).toNotBeTruncated("claude-code", "command");
    }).toThrow();
  });

  it("should handle context differences", () => {
    const output = "Some output";
    // Chat context typically has higher truncation limits
    expect(output).toNotBeTruncated("claude-code", "chat");
  });
});

describe("toPreserveNewlines", () => {
  it("should pass when newlines are preserved", () => {
    const output = "Line 1\nLine 2\nLine 3";
    expect(output).toPreserveNewlines("claude-code", "chat");
  });

  it("should fail when newlines are collapsed", () => {
    const output = "Line 1\nLine 2\nLine 3";
    expect(() => {
      expect(output).toPreserveNewlines("github-copilot", "command");
    }).toThrow();
  });

  it("should handle single line output", () => {
    const output = "Single line";
    expect(output).toPreserveNewlines("claude-code", "chat");
  });
});

describe("toStripAnsi", () => {
  it("should pass when ANSI codes are stripped", () => {
    const output = "\x1b[31mRed\x1b[0m \x1b[32mGreen\x1b[0m";
    expect(output).toStripAnsi("claude-code", "chat");
  });

  it("should handle output without ANSI codes", () => {
    const output = "Plain text";
    expect(output).toStripAnsi("claude-code", "chat");
  });

  it("should handle various ANSI escape sequences", () => {
    const output = "\x1b[1;31;42mBold Red on Green\x1b[0m";
    expect(output).toStripAnsi("github-copilot", "chat");
  });
});
