import { describe, it, expect } from "vitest";
import {
  getStringWidth,
  padToWidth,
  truncateToWidth,
  measureLines,
} from "../src/width.js";

describe("getStringWidth", () => {
  it("should return correct width for ASCII strings", () => {
    expect(getStringWidth("hello")).toBe(5);
    expect(getStringWidth("")).toBe(0);
    expect(getStringWidth("   ")).toBe(3);
  });

  it("should handle CJK characters as double-width", () => {
    expect(getStringWidth("你好")).toBe(4);
    expect(getStringWidth("こんにちは")).toBe(10);
  });

  it("should handle emoji as double-width", () => {
    expect(getStringWidth("👋")).toBe(2);
    expect(getStringWidth("👋🌍")).toBe(4);
  });

  it("should ignore ANSI escape codes", () => {
    expect(getStringWidth("\x1b[31mred\x1b[0m")).toBe(3);
    expect(getStringWidth("\x1b[1m\x1b[4mbold underline\x1b[0m")).toBe(14);
  });

  it("should handle mixed content", () => {
    // "Hello" = 5, " " = 1, "你好" = 4, " " = 1, "👋" = 2 = 13
    expect(getStringWidth("Hello 你好 👋")).toBe(13);
  });
});

describe("padToWidth", () => {
  it("should pad strings to target width with default left alignment", () => {
    expect(padToWidth("hi", 5)).toBe("hi   ");
    expect(padToWidth("a", 4)).toBe("a   ");
  });

  it("should pad with right alignment", () => {
    expect(padToWidth("hi", 5, { align: "right" })).toBe("   hi");
  });

  it("should pad with center alignment", () => {
    expect(padToWidth("hi", 6, { align: "center" })).toBe("  hi  ");
    // Odd padding: left gets fewer
    expect(padToWidth("hi", 5, { align: "center" })).toBe(" hi  ");
  });

  it("should return original string if already at or exceeds target width", () => {
    expect(padToWidth("hello", 5)).toBe("hello");
    expect(padToWidth("hello world", 5)).toBe("hello world");
  });

  it("should use custom pad character", () => {
    expect(padToWidth("hi", 5, { padChar: "-" })).toBe("hi---");
  });

  it("should handle CJK characters correctly", () => {
    // "你" is 2 columns, so padding "你" to 5 needs 3 spaces
    expect(padToWidth("你", 5)).toBe("你   ");
  });
});

describe("truncateToWidth", () => {
  it("should truncate strings that exceed target width", () => {
    expect(truncateToWidth("hello world", 8)).toBe("hello w…");
  });

  it("should return original string if within target width", () => {
    expect(truncateToWidth("hello", 10)).toBe("hello");
    expect(truncateToWidth("hello", 5)).toBe("hello");
  });

  it("should use custom ellipsis", () => {
    expect(truncateToWidth("hello world", 8, { ellipsis: "..." })).toBe(
      "hello..."
    );
  });

  it("should truncate in middle when specified", () => {
    const result = truncateToWidth("hello world", 8, { position: "middle" });
    // 8 - 1 (ellipsis) = 7, ceil(7/2) = 4 left, floor(7/2) = 3 right
    expect(result).toBe("hell…rld");
  });

  it("should handle CJK characters correctly", () => {
    // "你好世界" = 8 columns, truncate to 5 with ellipsis
    expect(truncateToWidth("你好世界", 5)).toBe("你好…");
  });

  it("should handle edge case where ellipsis is wider than target", () => {
    expect(truncateToWidth("hello", 1)).toBe("h");
  });
});

describe("measureLines", () => {
  it("should measure single line", () => {
    const result = measureLines("hello");
    expect(result.lines).toEqual(["hello"]);
    expect(result.maxWidth).toBe(5);
    expect(result.lineCount).toBe(1);
  });

  it("should measure multiple lines", () => {
    const result = measureLines("hello\nworld\ntest");
    expect(result.lines).toEqual(["hello", "world", "test"]);
    expect(result.maxWidth).toBe(5);
    expect(result.lineCount).toBe(3);
  });

  it("should find max width across lines", () => {
    const result = measureLines("hi\nhello world\ntest");
    expect(result.maxWidth).toBe(11); // "hello world"
  });

  it("should handle empty string", () => {
    const result = measureLines("");
    expect(result.lines).toEqual([""]);
    expect(result.maxWidth).toBe(0);
    expect(result.lineCount).toBe(1);
  });
});
