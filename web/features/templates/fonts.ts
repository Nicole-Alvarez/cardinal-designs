export interface FontOption {
  label: string;
  /** Full CSS font-family stack stored on BlockStyle.fontFamily. */
  stack: string;
  /** css2 query segment (e.g. "Inter:wght@300;400;500;600;700") when Google-hosted. */
  googleQuery?: string;
  group: "Web-safe" | "Google";
}

const GOOGLE_WEIGHTS = "300;400;500;600;700";

const google = (label: string, query: string): FontOption => ({
  label,
  stack: `'${label}', sans-serif`,
  googleQuery: `${label.replace(/ /g, "+")}:${query}`,
  group: "Google",
});

const webSafe = (label: string, stack: string): FontOption => ({
  label,
  stack,
  group: "Web-safe",
});

export const FONT_OPTIONS: FontOption[] = [
  webSafe("System default", "system-ui, sans-serif"),
  webSafe("Arial", "Arial, Helvetica, sans-serif"),
  webSafe("Verdana", "Verdana, Geneva, sans-serif"),
  webSafe("Tahoma", "Tahoma, Geneva, sans-serif"),
  webSafe("Trebuchet MS", "'Trebuchet MS', Helvetica, sans-serif"),
  webSafe("Georgia", "Georgia, 'Times New Roman', serif"),
  webSafe("Times New Roman", "'Times New Roman', Times, serif"),
  webSafe("Courier New", "'Courier New', Courier, monospace"),
  google("Inter", `wght@${GOOGLE_WEIGHTS}`),
  google("Roboto", `wght@${GOOGLE_WEIGHTS}`),
  google("Open Sans", `wght@${GOOGLE_WEIGHTS}`),
  google("Lato", `wght@${GOOGLE_WEIGHTS}`),
  google("Montserrat", `wght@${GOOGLE_WEIGHTS}`),
  google("Poppins", `wght@${GOOGLE_WEIGHTS}`),
  google("Oswald", `wght@${GOOGLE_WEIGHTS}`),
  google("Raleway", `wght@${GOOGLE_WEIGHTS}`),
  google("Playfair Display", `wght@${GOOGLE_WEIGHTS}`),
  google("Merriweather", `wght@${GOOGLE_WEIGHTS}`),
];

/** Combined css2 stylesheet URL covering every Google font in the catalog. */
export const GOOGLE_FONTS_URL = (() => {
  const queries = FONT_OPTIONS.filter((f) => f.googleQuery).map((f) => `family=${f.googleQuery}`);
  if (queries.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${queries.join("&")}&display=swap`;
})();

/** Distinct Google families actually used by the given stacks. */
export function googleFamiliesIn(stacks: (string | undefined)[]): FontOption[] {
  const used = new Set(stacks.filter(Boolean));
  return FONT_OPTIONS.filter((f) => f.googleQuery && used.has(f.stack));
}
