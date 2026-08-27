import { GENERATED_ICONS } from "./icons-data.generated";
export { DEFAULT_ICON_NAME } from "./icon-constants";

export interface IconEntry {
  name: string;
  svg: string;
}

export const ICONS: IconEntry[] = GENERATED_ICONS;
const ICON_MAP = new Map(ICONS.map((icon) => [icon.name, icon.svg]));

const svgAttrsHtml =
  'viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const svgAttrsJsx =
  'viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"';

/** Inner SVG markup for an icon name, or null if unknown. */
export function getIconSvg(name: string | undefined): string | null {
  if (!name) return null;
  return ICON_MAP.get(name) ?? null;
}

/**
 * Static <svg> element for HTML/Angular template output (kebab-case attrs).
 * Returns null when the block has no (known) icon.
 */
export function htmlIconSvg(name: string | undefined): string | null {
  const inner = getIconSvg(name);
  return inner === null ? null : `<svg ${svgAttrsHtml}>${inner}</svg>`;
}

/** Converts hyphenated SVG attribute names to their JSX equivalents. */
function svgInnerToJsx(inner: string): string {
  return inner.replace(/([\w-]+)=/g, (match, attr: string) => {
    if (!attr.includes("-")) return match;
    const camel = attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    return `${camel}=`;
  });
}

/**
 * Self-contained <svg> JSX element for React template output.
 * Returns null when the block has no (known) icon.
 */
export function jsxIconSvg(name: string | undefined): string | null {
  const inner = getIconSvg(name);
  return inner === null ? null : `<svg ${svgAttrsJsx}>${svgInnerToJsx(inner)}</svg>`;
}
