---
name: terminal-diagnostic
description: Run an interactive terminal rendering diagnostic to discover what ANSI colors, markdown tricks, and Unicode characters render correctly in this environment.
user-invocable: yes
---

# Terminal Rendering Diagnostic

You are running an interactive diagnostic to discover what terminal rendering capabilities are available in this AI assistant's output environment.

**Important:** You (the AI) will display test patterns, and the human user will tell you what they actually see rendered. You cannot see your own rendered output - only the human can observe it.

## How This Works

1. You run a command to generate a test pattern
2. You display the output to the user
3. You ask the user what they see (using structured options)
4. You record their answer
5. Repeat for all 12 tests
6. Generate a JSON capability report

## Setup

First, collect environment information and identify which assistant is running:

```bash
npx tsx scripts/terminal-diagnostic.ts --env
```

Ask the user which AI assistant they're using:

- Claude Code
- Cursor
- GitHub Copilot
- Windsurf
- Cody
- Aider
- Continue
- Other

## Test Sequence

Run each test in order. For each test:

1. **Get the test info:**

   ```bash
   npx tsx scripts/terminal-diagnostic.ts --info <test-id>
   ```

2. **Display the pattern:**

   ```bash
   npx tsx scripts/terminal-diagnostic.ts --pattern <test-id>
   ```

3. **Show the user the output** and ask them what they see, providing the multiple-choice options from the test info.

4. **Record their answer** and the corresponding capability level (full/partial/none).

### Test IDs (in order)

1. `ansi.fg.basic` - Basic ANSI Foreground Colors
2. `ansi.fg.bright` - Bright ANSI Foreground Colors
3. `ansi.bg.basic` - ANSI Background Colors
4. `ansi.256` - 256-Color Mode
5. `ansi.truecolor` - Truecolor (24-bit RGB)
6. `ansi.styles` - Text Styles (bold, italic, etc.)
7. `md.backtick` - Markdown Backtick Highlighting
8. `md.bold` - Markdown Bold Text
9. `md.whitespace` - Leading Whitespace Preservation
10. `md.anchor` - Anchor Character Visibility
11. `unicode.blocks` - Unicode Block Characters
12. `unicode.box` - Box Drawing Characters

## Conducting Each Test

For each test, follow this pattern:

### Example for Test 1 (ansi.fg.basic):

**You say:**

> **Test 1/12: Basic ANSI Foreground Colors**
>
> Here's the test pattern:
>
> [Run: `npx tsx scripts/terminal-diagnostic.ts --pattern ansi.fg.basic`]
>
> **Expected:** Four words in red, green, blue, and yellow colors
>
> What do you see?

Then use your question-asking capability to present the options:

- (A) All four colors visible and correct
- (B) Colors visible but wrong shades
- (C) Plain text, no colors
- (D) Raw escape codes visible (e.g., [31m)

Record the user's answer and move to the next test.

## Important Notes

- **Display the command output directly** - don't wrap it in code blocks, as that may affect rendering
- **Let the user see the raw output** - they need to observe what actually renders
- **Be patient** - wait for the user's response before moving to the next test
- **Track all answers** - you'll need them for the final report

## Generating the Report

After all 12 tests, generate a JSON report:

```json
{
  "assistant": "<name from setup>",
  "timestamp": "<current ISO timestamp>",
  "environment": <output from --env command>,
  "results": {
    "ansi.fg.basic": "<full|partial|none>",
    "ansi.fg.bright": "<full|partial|none>",
    "ansi.bg.basic": "<full|partial|none>",
    "ansi.256": "<full|partial|none>",
    "ansi.truecolor": "<full|partial|none>",
    "ansi.styles": "<full|partial|none>",
    "md.backtick": "<full|partial|none>",
    "md.bold": "<full|partial|none>",
    "md.whitespace": "<full|partial|none>",
    "md.anchor": "<full|partial|none>",
    "unicode.blocks": "<full|partial|none>",
    "unicode.box": "<full|partial|none>"
  },
  "summary": {
    "ansiSupport": "<none|basic|256|truecolor>",
    "textStyles": <true|false>,
    "markdownTricks": <true|false>,
    "unicodeSupport": <true|false>
  }
}
```

### Summary Calculation

- **ansiSupport**:
  - "truecolor" if ansi.truecolor is "full"
  - "256" if ansi.256 is "full"
  - "basic" if ansi.fg.basic or ansi.fg.bright is "full"
  - "none" otherwise

- **textStyles**: true if ansi.styles is "full" or "partial"

- **markdownTricks**: true if any of md.backtick, md.bold, or md.whitespace is "full"

- **unicodeSupport**: true if unicode.blocks or unicode.box is "full"

## Starting the Diagnostic

Begin by saying:

> **Terminal Rendering Diagnostic**
>
> I'm going to run a series of 12 tests to discover what rendering capabilities are available in this environment. For each test, I'll show you a pattern and ask what you see.
>
> First, let me gather some environment information...

Then run the `--env` command and ask which assistant is being used.
