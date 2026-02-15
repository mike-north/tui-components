/**
 * Custom Vitest matchers for TUI component testing.
 */

import type { AssistantConfig, AssistantContext } from "@tuicomponents/assistant-simulator";
import { simulateRendering, getConfig } from "@tuicomponents/assistant-simulator";

/**
 * Result of a matcher evaluation.
 * @public
 */
export interface MatcherResult {
  pass: boolean;
  message: () => string;
  actual?: unknown;
  expected?: unknown;
}

/**
 * Create matchers for extending Vitest's expect.
 * @public
 */
export function createAssistantMatchers() {
  return {
    /**
     * Assert that output renders to expected value for an assistant.
     */
    toRenderAs(
      received: string,
      expected: string,
      configOrId: AssistantConfig | string,
      context: AssistantContext = "chat"
    ): MatcherResult {
      const config = typeof configOrId === "string" ? getConfig(configOrId) : configOrId;
      const result = simulateRendering(received, config, context);
      const pass = result.rendered === expected;

      return {
        pass,
        message: () =>
          pass
            ? `Expected output to not render as the given value for ${config.displayName}`
            : `Expected output to render as:\n${expected}\n\nBut got:\n${result.rendered}\n\nFor ${config.displayName} in ${context} context`,
        actual: result.rendered,
        expected,
      };
    },

    /**
     * Assert that output is not truncated by an assistant.
     */
    toNotBeTruncated(
      received: string,
      configOrId: AssistantConfig | string,
      context: AssistantContext = "chat"
    ): MatcherResult {
      const config = typeof configOrId === "string" ? getConfig(configOrId) : configOrId;
      const result = simulateRendering(received, config, context);
      const pass = !result.metadata.wasTruncated;

      return {
        pass,
        message: () =>
          pass
            ? `Expected output to be truncated for ${config.displayName}`
            : `Output was truncated from ${result.metadata.originalLineCount.toString()} lines for ${config.displayName} in ${context} context`,
        actual: result.metadata.wasTruncated,
        expected: false,
      };
    },

    /**
     * Assert that output preserves newlines for an assistant.
     */
    toPreserveNewlines(
      received: string,
      configOrId: AssistantConfig | string,
      context: AssistantContext = "chat"
    ): MatcherResult {
      const config = typeof configOrId === "string" ? getConfig(configOrId) : configOrId;
      const result = simulateRendering(received, config, context);
      const inputNewlines = (received.match(/\n/g) ?? []).length;
      const outputNewlines = (result.rendered.match(/\n/g) ?? []).length;
      const pass = inputNewlines === outputNewlines;

      return {
        pass,
        message: () =>
          pass
            ? `Expected newlines to be collapsed for ${config.displayName}`
            : `Expected ${inputNewlines.toString()} newlines to be preserved, but got ${outputNewlines.toString()} for ${config.displayName}`,
        actual: outputNewlines,
        expected: inputNewlines,
      };
    },

    /**
     * Assert that output has ANSI codes stripped by an assistant.
     */
    toStripAnsi(
      received: string,
      configOrId: AssistantConfig | string,
      context: AssistantContext = "chat"
    ): MatcherResult {
      const config = typeof configOrId === "string" ? getConfig(configOrId) : configOrId;
      const result = simulateRendering(received, config, context);
      // Check if any ANSI codes remain
      // eslint-disable-next-line no-control-regex
      const hasAnsi = /\x1b\[[0-9;]*[a-zA-Z]/.test(result.rendered);
      const pass = !hasAnsi;

      return {
        pass,
        message: () =>
          pass
            ? `Expected ANSI codes to be preserved for ${config.displayName}`
            : `Expected ANSI codes to be stripped for ${config.displayName}, but they remain`,
        actual: hasAnsi,
        expected: false,
      };
    },
  };
}

/**
 * Vitest matcher types for TypeScript support.
 * @public
 */
export interface AssistantMatchers<R = unknown> {
  toRenderAs(
    expected: string,
    configOrId: AssistantConfig | string,
    context?: AssistantContext
  ): R;
  toNotBeTruncated(configOrId: AssistantConfig | string, context?: AssistantContext): R;
  toPreserveNewlines(configOrId: AssistantConfig | string, context?: AssistantContext): R;
  toStripAnsi(configOrId: AssistantConfig | string, context?: AssistantContext): R;
}
