/**
 * Vitest integration for assistant rendering testing.
 *
 * @example
 * ```typescript
 * // In your vitest setup file:
 * import { setupAssistantMatchers } from "@tuicomponents/test-harness/vitest";
 * setupAssistantMatchers();
 *
 * // In your tests:
 * expect(output).toRenderAs("expected", "claude-code", "chat");
 * expect(output).toNotBeTruncated("github-copilot");
 * ```
 *
 * To get TypeScript support, add this to your test file or setup:
 * ```typescript
 * import type {} from "@tuicomponents/test-harness/vitest";
 * ```
 */

import { expect } from "vitest";
import { createAssistantMatchers } from "./matchers.js";

/**
 * Set up custom Vitest matchers for assistant rendering testing.
 * Call this in your vitest setup file.
 *
 * @public
 */
export function setupAssistantMatchers(): void {
  expect.extend(createAssistantMatchers());
}

export { createAssistantMatchers } from "./matchers.js";
export type { AssistantMatchers } from "./matchers.js";
