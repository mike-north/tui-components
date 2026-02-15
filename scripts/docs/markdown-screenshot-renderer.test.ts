import { describe, it, expect } from "vitest";
import { renderMarkdownToHtml } from "./markdown-screenshot-renderer.js";

describe("renderMarkdownToHtml", () => {
  describe("positive cases", () => {
    it("should wrap plain text in HTML document", () => {
      const html = renderMarkdownToHtml("Hello world");
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html>");
      expect(html).toContain("<body>");
      expect(html).toContain("Hello world");
    });

    it("should apply inline code styling with backticks", () => {
      const html = renderMarkdownToHtml("This is `code`");
      expect(html).toContain('<span class="inline-code">`code`</span>');
    });

    it("should apply anchor character styling", () => {
      const html = renderMarkdownToHtml("Text │ with anchors");
      expect(html).toContain('<span class="anchor">│</span>');
    });

    it("should apply bold text styling", () => {
      const html = renderMarkdownToHtml("This is **bold**");
      expect(html).toContain('<span class="bold">**bold**</span>');
    });

    it("should apply header styling", () => {
      const html = renderMarkdownToHtml("# Header\n## Subheader");
      expect(html).toContain('<span class="header"># Header</span>');
      expect(html).toContain('<span class="header">## Subheader</span>');
    });

    it("should apply list marker styling for unordered lists", () => {
      const html = renderMarkdownToHtml("- Item 1\n* Item 2\n+ Item 3");
      expect(html).toContain('<span class="list-marker">-</span>');
      expect(html).toContain('<span class="list-marker">*</span>');
      expect(html).toContain('<span class="list-marker">+</span>');
    });

    it("should apply list marker styling for ordered lists", () => {
      const html = renderMarkdownToHtml("1. First\n2. Second");
      expect(html).toContain('<span class="list-marker">1.</span>');
      expect(html).toContain('<span class="list-marker">2.</span>');
    });

    it("should handle multiple inline code blocks", () => {
      const html = renderMarkdownToHtml("`first` and `second`");
      expect(html).toContain('<span class="inline-code">`first`</span>');
      expect(html).toContain('<span class="inline-code">`second`</span>');
    });

    it("should handle mixed markdown elements", () => {
      const html = renderMarkdownToHtml(
        "# Title\n\nSome `code` and **bold** text"
      );
      expect(html).toContain('<span class="header"># Title</span>');
      expect(html).toContain('<span class="inline-code">`code`</span>');
      expect(html).toContain('<span class="bold">**bold**</span>');
    });
  });

  describe("negative cases - HTML escaping", () => {
    it("should escape HTML special characters", () => {
      const html = renderMarkdownToHtml("<script>alert('xss')</script>");
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });

    it("should escape ampersands", () => {
      const html = renderMarkdownToHtml("AT&T");
      expect(html).toContain("AT&amp;T");
    });

    it("should escape quotes", () => {
      const html = renderMarkdownToHtml('Say "hello"');
      expect(html).toContain("&quot;hello&quot;");
    });

    it("should not apply inline code styling across newlines", () => {
      const html = renderMarkdownToHtml("`code\nbreak`");
      expect(html).not.toContain('<span class="inline-code">');
      // Backticks should remain as-is when they don't match the pattern
      expect(html).toContain("`code");
      expect(html).toContain("break`");
    });

    it("should not apply bold styling across newlines", () => {
      const html = renderMarkdownToHtml("**bold\nbreak**");
      expect(html).not.toContain('<span class="bold">');
      expect(html).toContain("**bold");
      expect(html).toContain("break**");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const html = renderMarkdownToHtml("");
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<pre></pre>");
    });

    it("should handle string with only whitespace", () => {
      const html = renderMarkdownToHtml("   \n\n   ");
      expect(html).toContain("<pre>   \n\n   </pre>");
    });

    it("should handle nested markdown elements", () => {
      const html = renderMarkdownToHtml("**bold with `code` inside**");
      // Note: Our implementation processes inline code before bold,
      // so the `code` part gets wrapped first
      expect(html).toContain('<span class="inline-code">`code`</span>');
      // The bold markers remain but may not wrap everything perfectly
      expect(html).toContain("**bold with");
    });

    it("should handle indented list items", () => {
      const html = renderMarkdownToHtml("  - Indented item");
      expect(html).toContain('  <span class="list-marker">-</span>');
    });

    it("should handle multiple anchor characters", () => {
      const html = renderMarkdownToHtml("│ first │ second │");
      const anchorCount = (html.match(/<span class="anchor">│<\/span>/g) || [])
        .length;
      expect(anchorCount).toBe(3);
    });

    it("should preserve line breaks", () => {
      const html = renderMarkdownToHtml("Line 1\nLine 2\nLine 3");
      expect(html).toContain("Line 1\nLine 2\nLine 3");
    });

    it("should handle empty inline code", () => {
      const html = renderMarkdownToHtml("Empty: ``");
      // Empty backticks should not match our pattern (requires at least one char)
      expect(html).toContain("Empty: ``");
    });
  });

  describe("real-world TUI output", () => {
    it("should handle sparkline markdown output", () => {
      const sparklineOutput = "`▁▃▅▇█`";
      const html = renderMarkdownToHtml(sparklineOutput);
      expect(html).toContain('<span class="inline-code">`▁▃▅▇█`</span>');
    });

    it("should handle chart with markdown backticks", () => {
      const chartOutput = `Q1 │ \`████████████████████\`
Q2 │ \`██████████████████████████████\``;
      const html = renderMarkdownToHtml(chartOutput);
      expect(html).toContain('<span class="anchor">│</span>');
      expect(html).toContain(
        '<span class="inline-code">`████████████████████`</span>'
      );
    });

    it("should handle gauge with multiple elements", () => {
      const gaugeOutput = "**Progress:** `75%` │ `███████▌   `";
      const html = renderMarkdownToHtml(gaugeOutput);
      expect(html).toContain('<span class="bold">**Progress:**</span>');
      expect(html).toContain('<span class="inline-code">`75%`</span>');
      expect(html).toContain('<span class="anchor">│</span>');
    });
  });
});
