/**
 * Type tests for test-harness package.
 */

import { expectType } from "tsd";
import type { MatcherResult } from "../src/matchers.js";

// Verify MatcherResult type structure
const result: MatcherResult = {
  pass: true,
  message: () => "test",
};

expectType<boolean>(result.pass);
expectType<() => string>(result.message);
