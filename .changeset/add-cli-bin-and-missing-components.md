---
"tui-components": minor
"@tuicomponents/cli": minor
---

Add CLI binary to umbrella package and register callout/layout in CLI

The `tui-components` package now exposes a `tui-components` binary, enabling `npx tui-components render <component>` without needing to know about the internal `@tuicomponents/cli` package. The CLI now also registers the `callout` and `layout` components, bringing the total to 14 available components.
