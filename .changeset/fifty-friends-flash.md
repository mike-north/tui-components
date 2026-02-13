---
"@tuicomponents/diff": minor
"@tuicomponents/core": patch
---

Add IDE-style rendering options to diff component

- `displayStyle: "gutter"` - Line numbers in left gutter with +/- indicators
- `backgroundMode: "line"` - Full-width colored backgrounds on changed lines
- Added `addedBackground` and `removedBackground` to theme semantic colors

Both options are opt-in with backward-compatible defaults (`displayStyle: "inline"`, `backgroundMode: "none"`).
