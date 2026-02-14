import type { CalloutType } from "./schema.js";

/**
 * Default configuration for each callout type.
 */
export interface CalloutTypeDefaults {
  /** Default icon character */
  icon: string;
  /** Default title text */
  title: string;
}

/**
 * Default icons and titles for each callout type.
 */
export const calloutDefaults: Record<CalloutType, CalloutTypeDefaults> = {
  tip: {
    icon: "💡",
    title: "Tip",
  },
  note: {
    icon: "📝",
    title: "Note",
  },
  info: {
    icon: "ℹ️",
    title: "Info",
  },
  warning: {
    icon: "⚠️",
    title: "Warning",
  },
  error: {
    icon: "❌",
    title: "Error",
  },
  success: {
    icon: "✅",
    title: "Success",
  },
};

/**
 * Get the defaults for a callout type.
 *
 * @param type - The callout type
 * @returns The default icon and title
 */
export function getCalloutDefaults(type: CalloutType): CalloutTypeDefaults {
  return calloutDefaults[type];
}
