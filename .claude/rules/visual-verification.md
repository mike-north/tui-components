# Visual Verification of UI Components

## When to Apply

Apply these guidelines when:

- Demonstrating TUI component output to the user
- Verifying that chart, sparkline, box, or other visual components render correctly
- Showing examples of component rendering

## Requirements

### Show Renderings Directly in Chat

When the user asks to see how a component renders or asks for visual verification:

1. **DO**: Render the component output directly in your response text
2. **DO NOT**: Show only the bash command and its output block
3. **DO NOT**: Wrap the rendered output in triple backtick fenced code blocks

### Correct Approach

Run the render command, capture the output, and display it directly in your response:

The chart renders as:

Q1 ████████████████████
Q2 ██████████████████████████████

### Incorrect Approaches

Showing bash command output:

```
$ echo '...' | node cli.js render chart
Q1 ████████████████████
```

Wrapping in code blocks:

```
Q1 ████████████████████
Q2 ██████████████████████████████
```

## Rationale

- Triple backtick code blocks use monospace fonts but may alter character rendering
- Bash command output sections don't render Unicode block characters correctly in all contexts
- Direct text rendering in the chat provides accurate visual verification of how components will appear
