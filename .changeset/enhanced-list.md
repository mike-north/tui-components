---
"@tuicomponents/list": minor
"tui-components": minor
---

Add task lists and definition lists to the list component

- New `task` style with checkbox markers (`[x]`, `[ ]`, `[~]`) for checked, unchecked, and partial states
- New `definition` style for term-definition pairs with auto-calculated or explicit `termWidth`
- New item types: `TaskItem` with `checked` property, `DefinitionItem` with `term` and `definition` properties
- Type guards: `isTaskItem()`, `isDefinitionItem()`, `isStandardItem()` for discriminating item types
- New exports: `taskItemSchema`, `taskCheckedSchema`, `definitionItemSchema`, `getTaskMarker()`
