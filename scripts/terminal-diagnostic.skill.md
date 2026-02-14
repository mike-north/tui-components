---
name: terminal-diagnostic
description: Run an interactive terminal rendering diagnostic to discover what ANSI colors, markdown tricks, and Unicode characters render correctly in this environment.
user-invocable: yes
---

# Terminal Rendering Diagnostic

You are running an interactive diagnostic to discover what terminal rendering capabilities are available in this AI assistant's output environment.

**Important:** You (the AI) will display test patterns, and the human user will tell you what they actually see rendered. You cannot see your own rendered output - only the human can observe it.

## Purpose: Renderer Selection

The `tui-components` library has multiple renderers:

- **Markdown Renderer** - Uses backtick highlighting, bold text, and anchor characters for visual styling
- **ANSI Renderer** - Uses terminal escape codes for colors and styles

This diagnostic determines which renderer works best for each AI assistant by testing both **command output** and **chat presentation** contexts.

## Critical: Two Display Contexts

AI assistants have TWO distinct ways of showing content to users:

### 1. Command Output Context (Terminal Block)

This is what the user sees when you run a bash command. The output appears in a terminal/code block area, often with:

- A command prompt header showing the command that was run
- Monospace font
- Potentially different rendering than your chat text
- **Some assistants truncate long output** (e.g., showing only 3-5 lines)

### 2. Chat Context (Direct Response Text)

This is what the user sees when you write text directly in your response, **outside** of any code block or terminal output area. This text:

- Goes through the assistant's markdown renderer
- May have different styling capabilities than command output
- Is where markdown tricks (backticks, bold) are most likely to work

**IMPORTANT:** When displaying patterns in chat context, paste them **verbatim** into your response. Do NOT wrap them in fenced code blocks (triple backticks). If you wrap the pattern in a code block, the markdown will display literally instead of being rendered, which defeats the purpose of this test.

**You must test BOTH contexts for each test.** Some assistants show full ANSI colors in command output but strip them in chat. Others render markdown beautifully in chat but not in terminal blocks.

## How This Works

1. You run a command to generate a test pattern
2. **First:** Show the command output directly (let the user see the terminal block)
3. **Then:** Copy the output and display it in your chat text (outside any code block)
4. Ask the user what they see in EACH context
5. Record both answers
6. Repeat for all tests
7. Generate a JSON capability report

## Asking Questions

**If you have a built-in tool for asking multiple-choice questions**, use it for this diagnostic. For example:

- Claude Code has the `AskUserQuestion` tool - use it to present options
- Other assistants may have similar tools

If you don't have such a tool, present the options clearly in your text response and wait for the user to reply with their choice (e.g., "A", "B", or "C").

## Setup

First, collect environment information:

```bash
npx tsx scripts/terminal-diagnostic.ts --env
```

Ask the user which AI assistant they're using:

- Claude Code
- Cursor
- Codex
- Cline
- Kiro CLI
- Gemini CLI
- OpenCode
- Other (specify)

## Agent Self-Identification Test

**Before running the rendering tests**, test whether you can identify yourself to CLI commands.

### Why This Matters

If AI agents can reliably set environment variables when calling CLI tools, the `tui-components` library can automatically detect which renderer to use. This is more reliable than environment detection.

### How to Test

Run this command with the `TUI_AGENT` environment variable set to your assistant name (use lowercase with hyphens, e.g., `claude-code`, `cursor`, `kiro-cli`):

```bash
TUI_AGENT=<your-name> npx tsx scripts/terminal-diagnostic.ts --identify <your-name>
```

For example, if you are Claude Code:

```bash
TUI_AGENT=claude-code npx tsx scripts/terminal-diagnostic.ts --identify claude-code
```

The output will be JSON indicating whether the identification was detected:

```json
{
  "detected": true,
  "value": "claude-code",
  "expected": "claude-code"
}
```

### Recording the Result

Record in the report:

- `agentIdentification.canSetEnvVar`: true if `detected` is true and `value` matches `expected`
- `agentIdentification.detectedValue`: the value that was detected (or null)

If you cannot set environment variables when running commands, record `canSetEnvVar: false`.

### Compare with Heuristic Detection

After testing explicit identification, compare it with the heuristic detection from `is-agentic-tui`:

```bash
TUI_AGENT=<your-name> npx tsx scripts/terminal-diagnostic.ts --detect
```

This outputs a comparison:

```json
{
  "heuristic": {
    "detected": true,
    "tool": "Claude Code",
    "confidence": "high",
    "signals": ["CLAUDECODE=1"]
  },
  "explicit": {
    "detected": true,
    "value": "claude-code"
  },
  "match": true
}
```

Record in the report:

- `agentIdentification.heuristicDetected`: what `is-agentic-tui` detected (tool name or null)
- `agentIdentification.heuristicConfidence`: the confidence level (high/medium/low or null)
- `agentIdentification.signalsMatch`: whether explicit and heuristic detection agree

### Future Use

If this test succeeds, the `tui-components` library can include per-agent instructions in each agent's skill folder telling it to always set `TUI_AGENT=<agent-name>` when calling CLI tools. This enables automatic renderer selection without user interaction.

## Test Categories

The diagnostic includes four categories:

1. **ANSI** (6 tests) - Terminal escape codes for colors and styles
2. **Markdown** (4 tests) - Markdown rendering tricks (backticks, bold, etc.)
3. **Unicode** (2 tests) - Block characters and box drawing
4. **TUI Patterns** (7 tests) - The specific markdown tricks used by tui-components

## Test Optimization (Short-Circuit Logic)

To save time, skip tests that are guaranteed to fail based on earlier results:

### ANSI Tests

Run tests in this order: `ansi.fg.basic` → `ansi.fg.bright` → `ansi.bg.basic` → `ansi.256` → `ansi.truecolor` → `ansi.styles`

**Short-circuit rules:**

- If `ansi.fg.basic` = "none" in a context → skip `ansi.fg.bright`, `ansi.bg.basic`, `ansi.256`, `ansi.truecolor` for that context (record as "none")
- Still test `ansi.styles` separately (bold/italic may work even without colors)

### Markdown Tests

Run tests in this order: `md.backtick` → `md.bold` → `md.whitespace` → `md.anchor`

**Short-circuit rules:**

- These are largely independent, so run all of them
- `md.backtick` result is critical for TUI patterns

### Unicode Tests

Run both `unicode.blocks` and `unicode.box` - they use different character sets and may have different support.

### TUI Pattern Tests

**Short-circuit rules:**

- If `md.backtick` = "none" in chat context → TUI patterns will likely show "partial" or "none" (no two-color distinction), but still test at least `tui.progress` to confirm
- If `md.anchor` = "none" → alignment will be broken, but highlighting may still work

### Recording Skipped Tests

When skipping a test due to short-circuit logic, record the result as "none" with a note that it was skipped:

- The test was not run
- The result is inferred from the prerequisite test failure

## Running Each Test

For each test, follow this pattern:

### Step 1: Get Test Info

```bash
npx tsx scripts/terminal-diagnostic.ts --info <test-id>
```

### Step 2: Display in Command Output Context

Run the pattern command and show the output:

```bash
npx tsx scripts/terminal-diagnostic.ts --pattern <test-id>
```

Ask: **"In the command output above, what do you see?"** with the options.

### Step 3: Display in Chat Context

**CRITICAL: Do NOT wrap the output in a fenced code block.**

Take the pattern output and paste it **verbatim** into your response text. The output must appear as regular chat text, not inside triple backticks or any code formatting.

**WRONG** (defeats the test):

````
Here's the pattern:
```
│Progress: `████████` ░░░░░░░░░░░░ 40%
```
````

**CORRECT** (verbatim in chat):

```
Here's the pattern in chat context:

│Progress: `████████` ░░░░░░░░░░░░ 40%

What do you see?
```

The pattern text above should appear directly in your message, allowing the markdown renderer to process it. If you wrap it in a code block, the backticks will display literally instead of being rendered as highlighting.

Ask: **"In the chat text above, what do you see?"** with the same options.

### Step 4: Record Both Results

Record the capability level for both contexts:

- `<test-id>.command`: result from command output
- `<test-id>.chat`: result from chat context

## Test IDs

### ANSI Tests

1. `ansi.fg.basic` - Basic ANSI Foreground Colors
2. `ansi.fg.bright` - Bright ANSI Foreground Colors
3. `ansi.bg.basic` - ANSI Background Colors
4. `ansi.256` - 256-Color Mode
5. `ansi.truecolor` - Truecolor (24-bit RGB)
6. `ansi.styles` - Text Styles (bold, italic, etc.)

### Markdown Tests

7. `md.backtick` - Markdown Backtick Highlighting
8. `md.bold` - Markdown Bold Text
9. `md.whitespace` - Leading Whitespace Preservation
10. `md.anchor` - Anchor Character Visibility

### Unicode Tests

11. `unicode.blocks` - Unicode Block Characters
12. `unicode.box` - Box Drawing Characters

### TUI Component Pattern Tests

13. `tui.progress` - Progress Bar (Markdown Two-Color)
14. `tui.sparkline` - Sparkline (Markdown Two-Color)
15. `tui.chart` - Bar Chart (Markdown Two-Color)
16. `tui.multiline-anchor` - Multi-line Anchored Content
17. `tui.mixed-styles` - Mixed Markdown Styles
18. `tui.vertical-chart` - Vertical Bar Chart with Axis
19. `tui.legend` - Chart Legend with Alternating Styles

## Generating the Report

After all tests, generate a JSON report with BOTH contexts recorded:

```json
{
  "assistant": "<name from setup>",
  "timestamp": "<current ISO timestamp>",
  "environment": "<output from --env command>",
  "agentIdentification": {
    "canSetEnvVar": "<true|false>",
    "detectedValue": "<value or null>",
    "heuristicDetected": "<tool name or null>",
    "heuristicConfidence": "<high|medium|low or null>",
    "signalsMatch": "<true|false|null>"
  },
  "results": {
    "ansi.fg.basic": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "ansi.fg.bright": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "ansi.bg.basic": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "ansi.256": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "ansi.truecolor": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "ansi.styles": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "md.backtick": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "md.bold": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "md.whitespace": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "md.anchor": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "unicode.blocks": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "unicode.box": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "tui.progress": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "tui.sparkline": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "tui.chart": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "tui.multiline-anchor": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "tui.mixed-styles": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "tui.vertical-chart": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    },
    "tui.legend": {
      "command": "<full|partial|none>",
      "chat": "<full|partial|none>"
    }
  },
  "summary": {
    "commandContext": {
      "ansiSupport": "<none|basic|256|truecolor>",
      "textStyles": "<true|false>",
      "markdownTricks": "<true|false>",
      "unicodeSupport": "<true|false>",
      "tuiPatternsWork": "<true|false>"
    },
    "chatContext": {
      "ansiSupport": "<none|basic|256|truecolor>",
      "textStyles": "<true|false>",
      "markdownTricks": "<true|false>",
      "unicodeSupport": "<true|false>",
      "tuiPatternsWork": "<true|false>"
    },
    "recommendedRenderer": "<markdown|ansi|plain>",
    "recommendedContext": "<chat|command>",
    "notes": "<any unusual observations or anomalies that might inform new renderer needs>"
  }
}
```

### Summary Calculation (for each context)

- **ansiSupport**:
  - "truecolor" if ansi.truecolor is "full"
  - "256" if ansi.256 is "full"
  - "basic" if ansi.fg.basic or ansi.fg.bright is "full"
  - "none" otherwise

- **textStyles**: true if ansi.styles is "full" or "partial"

- **markdownTricks**: true if md.backtick is "full" or "partial"

- **unicodeSupport**: true if unicode.blocks or unicode.box is "full"

- **tuiPatternsWork**: true if majority of tui.\* tests are "full"

### Renderer Recommendation Calculation

- **recommendedRenderer**:
  - "markdown" if chatContext.tuiPatternsWork is true
  - "ansi" if commandContext.ansiSupport is "basic" or better AND commandContext.tuiPatternsWork is false
  - "plain" otherwise (fallback when nothing works well)

- **recommendedContext**:
  - "chat" if recommendedRenderer is "markdown"
  - "command" if recommendedRenderer is "ansi"
  - "chat" if recommendedRenderer is "plain" (plain text works everywhere)

### Note on New Renderer Discovery

If the results show an unusual pattern (e.g., partial support for some features but not others), document this in notes. This diagnostic may reveal the need for **additional renderers** beyond markdown and ANSI. Capture any anomalies that might inform new renderer development.

## Saving the Report

After generating the JSON report, write it to a file:

```
.terminal-diagnostic-results/<assistant-name>.json
```

For example: `.terminal-diagnostic-results/claude-code.json`

Create the directory if it doesn't exist. This allows results from different assistants to be collected and compared.

**Important:** Show the user the report contents AND confirm the file was written successfully.

## Starting the Diagnostic

Begin by saying:

> **Terminal Rendering Diagnostic**
>
> I'm going to run a series of 19 tests to discover what rendering capabilities are available in this environment.
>
> **Important:** I'll test each pattern in TWO contexts:
>
> 1. Command output (terminal block)
> 2. Chat text (direct in my response)
>
> Some assistants render differently in each context, so I need you to tell me what you see in both.
>
> First, let me gather some environment information...

Then run the `--env` command and ask which assistant is being used.

## Tips for Efficient Testing

- For ANSI tests, command and chat results may differ significantly
- For markdown/TUI tests, results are usually the same in both contexts
- If the user says results are identical, you can record the same value for both
- The TUI pattern tests are the most important for determining if tui-components will render well

## Handling Command Output Truncation

Some AI assistants truncate command output, showing only a few lines (e.g., 3-5 lines). If the user reports that the command output appears truncated or incomplete:

1. **Ask if they can see the full output** - Some assistants have a "show more" or expand option
2. **Note this in the results** - Add to the notes field that this assistant truncates command output
3. **Rely more heavily on chat context** - If command output is truncated, the chat context test becomes the primary indicator

This truncation behavior itself is valuable information - assistants that truncate command output may be better suited to the markdown renderer in chat context rather than ANSI output in command blocks.
