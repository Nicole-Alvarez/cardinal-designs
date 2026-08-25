export interface CanvasGuidePalette {
  grid: string;
  alignment: string;
  measurement: string;
  labelBackground: string;
  labelText: string;
  paddingFill: string;
  paddingBorder: string;
  gapFill: string;
}

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

function parseHexColor(value: string): RgbColor | null {
  const hex = value.trim().match(/^#([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i)?.[1];
  if (!hex) return null;
  const expanded = hex.length === 3
    ? hex.split("").map((digit) => digit + digit).join("")
    : hex.slice(0, 6);
  return {
    red: Number.parseInt(expanded.slice(0, 2), 16),
    green: Number.parseInt(expanded.slice(2, 4), 16),
    blue: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

function relativeLuminance(color: RgbColor): number {
  const channels = [color.red, color.green, color.blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

/** Contrast-aware editor colors based on the canvas fill, never exported with a template. */
export function canvasGuidePalette(backgroundColor: string, textColor: string): CanvasGuidePalette {
  const background = parseHexColor(backgroundColor);
  const fallback = parseHexColor(textColor);
  const isDark = background
    ? relativeLuminance(background) < 0.35
    : fallback
      ? relativeLuminance(fallback) > 0.5
      : false;

  return isDark
    ? {
        grid: "rgba(255,255,255,0.16)",
        alignment: "rgba(125,211,252,0.95)",
        measurement: "rgba(125,211,252,0.9)",
        labelBackground: "rgba(224,242,254,0.96)",
        labelText: "#0c4a6e",
        paddingFill: "rgba(125,211,252,0.16)",
        paddingBorder: "rgba(125,211,252,0.55)",
        gapFill: "rgba(251,146,60,0.24)",
      }
    : {
        grid: "rgba(0,0,0,0.09)",
        alignment: "rgba(37,99,235,0.82)",
        measurement: "rgba(37,99,235,0.78)",
        labelBackground: "rgba(37,99,235,0.94)",
        labelText: "#ffffff",
        paddingFill: "rgba(59,130,246,0.12)",
        paddingBorder: "rgba(37,99,235,0.42)",
        gapFill: "rgba(249,115,22,0.15)",
      };
}
