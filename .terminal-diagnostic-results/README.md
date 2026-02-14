# Terminal Diagnostic Results

This directory contains JSON reports from running the terminal rendering diagnostic across different AI coding assistants.

## File Naming

Each file is named after the assistant that generated it:

- `claude-code.json`
- `cursor.json`
- `codex.json`
- etc.

## Running the Diagnostic

To generate a report for your assistant, invoke the `terminal-diagnostic` skill:

```
/terminal-diagnostic
```

Or ask the assistant to "run the terminal diagnostic".

## Report Structure

Each report contains:

- `assistant` - Name of the AI assistant
- `timestamp` - When the diagnostic was run
- `environment` - Terminal environment variables
- `results` - Individual test results (full/partial/none)
- `summary` - Aggregated capability levels
