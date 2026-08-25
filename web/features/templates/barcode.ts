import JsBarcode from "jsbarcode";

/** Returns a scannable Code 128 SVG data URI, or null when the value cannot be encoded. */
export function barcodeDataUri(value: string | undefined): string | null {
  if (!value || typeof document === "undefined") return null;

  try {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svg, value, {
      format: "CODE128",
      width: 2,
      height: 80,
      margin: 4,
      displayValue: true,
      fontSize: 16,
    });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`;
  } catch {
    return null;
  }
}
