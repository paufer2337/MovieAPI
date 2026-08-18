import axe, { type ElementContext, type RunOptions } from "axe-core";

/**
 * Runs only the axe rules that can produce meaningful results in jsdom.
 * jsdom does not render layout or CSS, so this helper does not verify visual
 * positioning, responsive behavior, focus visibility, or color contrast.
 */
export function runAxe(
  context: ElementContext,
  options: RunOptions = {},
) {
  return axe.run(context, {
    ...options,
    rules: {
      "color-contrast": { enabled: false },
      ...options.rules,
    },
  });
}
