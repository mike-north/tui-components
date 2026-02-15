import { describe, it, expect } from "vitest";
import {
  stripAnsi,
  collapseNewlines,
  truncateLines,
  createTruncateTransform,
  stripBackticks,
  stripBoldMarkers,
  addSpaceAfterBoxChars,
  identity,
  composeTransforms,
} from "../src/transforms.js";

describe("stripAnsi", () => {
  it("should strip basic color codes", () => {
    const input = "\x1b[31mRed text\x1b[0m";
    expect(stripAnsi(input)).toBe("Red text");
  });

  it("should strip multiple color codes", () => {
    const input = "\x1b[31mRed\x1b[0m \x1b[32mGreen\x1b[0m";
    expect(stripAnsi(input)).toBe("Red Green");
  });

  it("should strip complex CSI sequences", () => {
    const input = "\x1b[1;31;40mBold red on black\x1b[0m";
    expect(stripAnsi(input)).toBe("Bold red on black");
  });

  it("should handle text without ANSI codes", () => {
    const input = "Plain text";
    expect(stripAnsi(input)).toBe("Plain text");
  });

  it("should handle empty string", () => {
    expect(stripAnsi("")).toBe("");
  });

  it("should strip cursor movement codes", () => {
    const input = "\x1b[2JClear\x1b[HHome";
    expect(stripAnsi(input)).toBe("ClearHome");
  });
});

describe("collapseNewlines", () => {
  it("should collapse single newline to space", () => {
    const input = "line1\nline2";
    expect(collapseNewlines(input)).toBe("line1 line2");
  });

  it("should collapse multiple newlines to single space", () => {
    const input = "line1\n\n\nline2";
    expect(collapseNewlines(input)).toBe("line1 line2");
  });

  it("should collapse all newlines in multiline text", () => {
    const input = "a\nb\nc\nd";
    expect(collapseNewlines(input)).toBe("a b c d");
  });

  it("should handle text without newlines", () => {
    const input = "no newlines here";
    expect(collapseNewlines(input)).toBe("no newlines here");
  });

  it("should handle empty string", () => {
    expect(collapseNewlines("")).toBe("");
  });

  it("should handle string with only newlines", () => {
    expect(collapseNewlines("\n\n\n")).toBe(" ");
  });
});

describe("truncateLines", () => {
  it("should truncate to specified number of lines", () => {
    const input = "line1\nline2\nline3\nline4";
    const result = truncateLines(input, 2);
    expect(result).toBe("line1\nline2\n... (2 more lines)");
  });

  it("should not truncate when line count equals limit", () => {
    const input = "line1\nline2";
    const result = truncateLines(input, 2);
    expect(result).toBe("line1\nline2");
  });

  it("should not truncate when line count is below limit", () => {
    const input = "line1";
    const result = truncateLines(input, 2);
    expect(result).toBe("line1");
  });

  it("should handle maxLines of 0 (no truncation)", () => {
    const input = "line1\nline2\nline3";
    const result = truncateLines(input, 0);
    expect(result).toBe("line1\nline2\nline3");
  });

  it("should use correct plural for 1 remaining line", () => {
    const input = "line1\nline2";
    const result = truncateLines(input, 1);
    expect(result).toBe("line1\n... (1 more line)");
  });

  it("should use correct plural for multiple remaining lines", () => {
    const input = "line1\nline2\nline3\nline4\nline5";
    const result = truncateLines(input, 2);
    expect(result).toBe("line1\nline2\n... (3 more lines)");
  });

  it("should handle empty string", () => {
    expect(truncateLines("", 2)).toBe("");
  });

  it("should handle negative maxLines as no truncation", () => {
    const input = "line1\nline2\nline3";
    const result = truncateLines(input, -1);
    expect(result).toBe("line1\nline2\nline3");
  });
});

describe("createTruncateTransform", () => {
  it("should create a truncate function with specified limit", () => {
    const truncate3 = createTruncateTransform(3);
    const input = "a\nb\nc\nd\ne";
    expect(truncate3(input)).toBe("a\nb\nc\n... (2 more lines)");
  });

  it("should create reusable transform", () => {
    const truncate2 = createTruncateTransform(2);
    expect(truncate2("1\n2\n3")).toBe("1\n2\n... (1 more line)");
    expect(truncate2("x\ny\nz")).toBe("x\ny\n... (1 more line)");
  });

  it("should handle maxLines of 0", () => {
    const noTruncate = createTruncateTransform(0);
    expect(noTruncate("a\nb\nc")).toBe("a\nb\nc");
  });
});

describe("stripBackticks", () => {
  it("should strip single backticks", () => {
    expect(stripBackticks("`code`")).toBe("code");
  });

  it("should strip triple backticks", () => {
    expect(stripBackticks("```typescript\ncode\n```")).toBe("typescript\ncode\n");
  });

  it("should strip all backticks from text", () => {
    const input = "Use `const` or `let` for ```variables```";
    expect(stripBackticks(input)).toBe("Use const or let for variables");
  });

  it("should handle text without backticks", () => {
    expect(stripBackticks("no backticks")).toBe("no backticks");
  });

  it("should handle empty string", () => {
    expect(stripBackticks("")).toBe("");
  });

  it("should handle string with only backticks", () => {
    expect(stripBackticks("```")).toBe("");
  });
});

describe("stripBoldMarkers", () => {
  it("should strip double asterisks", () => {
    expect(stripBoldMarkers("**bold** text")).toBe("bold text");
  });

  it("should strip double underscores", () => {
    expect(stripBoldMarkers("__bold__ text")).toBe("bold text");
  });

  it("should strip both marker types", () => {
    const input = "**bold1** and __bold2__";
    expect(stripBoldMarkers(input)).toBe("bold1 and bold2");
  });

  it("should handle multiple bold sections", () => {
    const input = "**a** normal **b** normal **c**";
    expect(stripBoldMarkers(input)).toBe("a normal b normal c");
  });

  it("should handle text without bold markers", () => {
    expect(stripBoldMarkers("no markers")).toBe("no markers");
  });

  it("should handle empty string", () => {
    expect(stripBoldMarkers("")).toBe("");
  });

  it("should not affect single asterisks or underscores", () => {
    expect(stripBoldMarkers("*italic* _also italic_")).toBe("*italic* _also italic_");
  });
});

describe("addSpaceAfterBoxChars", () => {
  it("should add space after block character", () => {
    expect(addSpaceAfterBoxChars("█text")).toBe("█ text");
  });

  it("should add space after box drawing character", () => {
    expect(addSpaceAfterBoxChars("│item")).toBe("│ item");
  });

  it("should add space after horizontal line", () => {
    expect(addSpaceAfterBoxChars("─text")).toBe("─ text");
  });

  it("should handle multiple box characters", () => {
    expect(addSpaceAfterBoxChars("█a│b")).toBe("█ a│ b");
  });

  it("should handle text without box characters", () => {
    expect(addSpaceAfterBoxChars("plain text")).toBe("plain text");
  });

  it("should handle empty string", () => {
    expect(addSpaceAfterBoxChars("")).toBe("");
  });

  it("should not add extra spaces if already present", () => {
    expect(addSpaceAfterBoxChars("█ already spaced")).toBe("█  already spaced");
  });
});

describe("identity", () => {
  it("should return input unchanged", () => {
    expect(identity("text")).toBe("text");
  });

  it("should work with empty string", () => {
    expect(identity("")).toBe("");
  });

  it("should work with special characters", () => {
    const input = "\x1b[31mANSI\x1b[0m\n**bold**\n`code`";
    expect(identity(input)).toBe(input);
  });
});

describe("composeTransforms", () => {
  it("should apply transforms left-to-right", () => {
    const transform = composeTransforms([stripAnsi, collapseNewlines]);
    const input = "\x1b[31mRed\x1b[0m\n\nText";
    expect(transform(input)).toBe("Red Text");
  });

  it("should work with single transform", () => {
    const transform = composeTransforms([stripAnsi]);
    expect(transform("\x1b[31mRed\x1b[0m")).toBe("Red");
  });

  it("should work with no transforms", () => {
    const transform = composeTransforms([]);
    expect(transform("unchanged")).toBe("unchanged");
  });

  it("should apply multiple transforms in order", () => {
    const transform = composeTransforms([
      stripAnsi,
      stripBackticks,
      stripBoldMarkers,
    ]);
    const input = "\x1b[31m`code` **bold**\x1b[0m";
    expect(transform(input)).toBe("code bold");
  });

  it("should handle complex pipeline", () => {
    const transform = composeTransforms([
      stripAnsi,
      collapseNewlines,
      (s) => s.toUpperCase(),
    ]);
    const input = "\x1b[31mred\x1b[0m\ntext";
    expect(transform(input)).toBe("RED TEXT");
  });
});
