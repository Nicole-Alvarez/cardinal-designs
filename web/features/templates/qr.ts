import qrcode from "qrcode-generator";

/** Returns a scannable QR SVG data URI, or null when the value cannot be encoded. */
export function qrDataUri(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const code = qrcode(0, "M");
    code.addData(value);
    code.make();
    const svg = code.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return null;
  }
}
