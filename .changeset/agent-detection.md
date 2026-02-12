---
"@tuicomponents/cli": minor
---

Add agent detection support for agentic TUI environments

The CLI now detects when it's running in an AI agent environment and adapts its behavior
to improve the user experience in chat interfaces.

**What changed:**
- Detect agentic TUI environments using the `is-agentic-tui` package (supports Claude Code, Cursor Agent, and other AI-powered development tools)
- Append usage instructions to `--help` output when in agent mode, guiding AI agents on how to properly display diagram output without wrapping in markdown code blocks
- Add 5 blank lines before diagram output (in markdown mode only) for better visual separation in chat interfaces
- All agent-related functions are marked `@internal` and are not part of the public API

**Why:**
AI agents frequently render diagram output incorrectly by wrapping it in markdown code blocks, which breaks Unicode character rendering. These changes help agents present TUI component output correctly to end users.
