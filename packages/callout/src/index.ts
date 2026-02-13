export { createCallout, CalloutComponent } from "./callout.js";
export {
  calloutInputSchema,
  calloutTypeSchema,
  borderStyleSchema,
  type CalloutInput,
  type CalloutInputWithDefaults,
  type CalloutType,
  type BorderStyle,
} from "./schema.js";
export {
  type CalloutTypeDefaults,
  CALLOUT_DEFAULTS,
  getCalloutDefaults,
} from "./defaults.js";
export { type BorderChars, getBorderChars } from "./chars.js";
export { type CalloutLayout, computeCalloutLayout } from "./layout.js";
export { renderCalloutAnsi, renderCalloutMarkdown } from "./renderers.js";
