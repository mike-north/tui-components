/**
 * Markdown Screenshot Renderer
 *
 * Converts markdown-mode TUI output into styled HTML suitable for screenshots.
 * Applies visual styling to show how markdown would appear in an AI assistant
 * chat interface.
 *
 * Features:
 * - White/light background
 * - Monospace font
 * - Backtick highlighting with tan/yellow background
 * - Visual representation of │ anchor characters
 */

/**
 * CSS styles for markdown rendering
 */
const MARKDOWN_STYLES = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background: #ffffff;
    color: #1a1a1a;
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', 'DejaVu Sans Mono', monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 16px;
    display: inline-block;
  }

  pre {
    display: inline-block;
    white-space: pre;
    margin: 0;
    font-variant-ligatures: none;
    letter-spacing: 0;
    font-feature-settings: "liga" 0;
  }

  .inline-code {
    background-color: #f5f2e8;
    color: #1a1a1a;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: inherit;
  }

  .anchor {
    color: #999999;
    font-weight: normal;
  }

  .bold {
    font-weight: bold;
  }

  .header {
    color: #0066cc;
    font-weight: bold;
  }

  .list-marker {
    color: #cc6600;
  }
`;

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Apply markdown syntax highlighting to text
 *
 * Converts markdown syntax into styled HTML spans:
 * - Inline code: `text` → <span class="inline-code">text</span>
 * - Anchor characters: │ → <span class="anchor">│</span>
 * - Bold text: **text** → <span class="bold">text</span>
 * - Headers: # text → <span class="header"># text</span>
 * - List markers: - item → <span class="list-marker">-</span> item
 */
function applyMarkdownStyling(text: string): string {
  let result = text;

  // First escape HTML to prevent injection
  result = escapeHtml(result);

  // Apply inline code styling (preserve backticks)
  result = result.replace(/`([^`\n]+)`/g, (_, content) => {
    return `<span class="inline-code">\`${content}\`</span>`;
  });

  // Apply anchor character styling
  result = result.replace(/│/g, '<span class="anchor">│</span>');

  // Apply bold styling (**text**)
  result = result.replace(/\*\*([^*\n]+)\*\*/g, (_, content) => {
    return `<span class="bold">**${content}**</span>`;
  });

  // Apply header styling (# text)
  result = result.replace(/^(#{1,6}\s+.+)$/gm, (match) => {
    return `<span class="header">${match}</span>`;
  });

  // Apply list marker styling (-, *, +)
  result = result.replace(
    /^(\s*)([-*+])(\s+)/gm,
    (_, indent, marker, space) => {
      return `${indent}<span class="list-marker">${marker}</span>${space}`;
    }
  );

  // Apply ordered list marker styling (1., 2., etc.)
  result = result.replace(
    /^(\s*)(\d+\.)(\s+)/gm,
    (_, indent, marker, space) => {
      return `${indent}<span class="list-marker">${marker}</span>${space}`;
    }
  );

  return result;
}

/**
 * Generate complete HTML document for markdown screenshot
 *
 * Takes markdown-formatted text and wraps it in a complete HTML document
 * with appropriate styling for screenshot capture.
 *
 * @param markdownText - The markdown-formatted text to render
 * @returns Complete HTML document as a string
 *
 * @example
 * ```typescript
 * const html = renderMarkdownToHtml("Here is `code` and **bold**");
 * // Returns a complete HTML document with styled output
 * ```
 */
export function renderMarkdownToHtml(markdownText: string): string {
  const styledContent = applyMarkdownStyling(markdownText);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Markdown TUI Preview</title>
  <style>
${MARKDOWN_STYLES}
  </style>
</head>
<body>
  <pre>${styledContent}</pre>
</body>
</html>`;
}
