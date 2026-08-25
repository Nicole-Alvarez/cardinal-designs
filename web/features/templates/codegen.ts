import type { TemplateBlock, TemplateCanvas } from "./types";
import { htmlIconSvg, jsxIconSvg } from "./icons";
import { googleFamiliesIn } from "./fonts";
import { barcodeDataUri } from "./barcode";
import { qrDataUri } from "./qr";

const IND = "  ";

/** Stable paint-order copy: lower z first (ties keep insertion order). */
function byZ(blocks: TemplateBlock[]): TemplateBlock[] {
  return [...blocks].sort((a, b) => a.z - b.z);
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;");
}

function canvasRootCss(canvas: TemplateCanvas): string {
  const parts = [
    "position: relative",
    "overflow: hidden",
    "box-sizing: border-box",
  ];
  if (canvas.width !== "auto") parts.push(`width: ${canvas.width}`);
  if (canvas.height !== "auto") {
    parts.push(`height: ${canvas.height}`);
  } else {
    // keeps auto-height canvases visible even when empty
    parts.push("min-height: 384px");
  }
  parts.push(`background-color: ${canvas.backgroundColor}`);
  parts.push(`color: ${canvas.textColor}`);
  if (canvas.borderWidth > 0) {
    parts.push(
      `border: ${canvas.borderWidth}px solid ${canvas.borderColor}`
    );
  }
  if (canvas.borderRadius > 0) {
    parts.push(`border-radius: ${canvas.borderRadius}px`);
  }
  return parts.join("; ");
}

function overlayCss(canvas: TemplateCanvas): string | null {
  if (!canvas.overlayImage) return null;
  const m = canvas.overlayMargin;
  return [
    "position: absolute",
    `top: ${m}px`,
    `right: ${m}px`,
    `bottom: ${m}px`,
    `left: ${m}px`,
    `padding: ${canvas.overlayPadding}px`,
    "box-sizing: border-box",
    `object-fit: ${canvas.overlayFit}`,
    `opacity: ${(canvas.overlayOpacity / 100).toFixed(2)}`,
  ].join("; ");
}

function contentWrapperCss(canvas: TemplateCanvas): string {
  // fixed-height roots can use 100%; auto-height roots rely on min-height
  return canvas.height === "auto"
    ? "position: relative; width: 100%; min-height: 384px"
    : "position: relative; width: 100%; height: 100%";
}

function blockFrameCss(block: TemplateBlock): string {
  const parts = [
    "position: absolute",
    `left: ${Math.round(block.x)}px`,
    `top: ${Math.round(block.y)}px`,
    `width: ${Math.round(block.width)}px`,
    `height: ${Math.round(block.height)}px`,
    "box-sizing: border-box",
    "overflow: hidden",
    `z-index: ${Math.max(0, Math.round(block.z))}`,
  ];
  if (block.type !== "image" && block.type !== "icon") {
    parts.push(`padding: ${block.style.padding}px`);
  }
  parts.push(`background-color: ${block.style.backgroundColor}`);
  parts.push(`text-align: ${block.style.textAlign}`);
  if (block.type === "icon" && block.style.color !== "inherit") {
    parts.push(`color: ${block.style.color}`);
  }
  if (block.style.borderWidth > 0) {
    parts.push(`border: ${block.style.borderWidth}px solid ${block.style.borderColor}`);
  }
  if (block.style.borderRadius > 0) {
    parts.push(`border-radius: ${block.style.borderRadius}px`);
  }
  if (block.type === "heading" || block.type === "text") {
    parts.push("display: flex", "align-items: center");
    parts.push(
      `justify-content: ${
        block.style.textAlign === "center"
          ? "center"
          : block.style.textAlign === "right"
            ? "flex-end"
            : "flex-start"
      }`
    );
  }
  if (block.type === "divider") {
    parts.push("display: flex", "align-items: center");
  }
  return parts.join("; ");
}

function blockInnerCss(block: TemplateBlock): string {
  const parts = ["margin: 0"];
  if (block.style.color !== "inherit") parts.push(`color: ${block.style.color}`);
  if (block.style.fontFamily) parts.push(`font-family: ${block.style.fontFamily}`);
  if (block.style.italic) parts.push("font-style: italic");
  if (block.style.underline) parts.push("text-decoration: underline");
  parts.push(`font-size: ${block.style.fontSize}px`);
  parts.push(`font-weight: ${block.style.fontWeight}`);
  return parts.join("; ");
}

/** Google Fonts stylesheet link for families used across the given blocks, or null. */
function googleFontLink(blocks: TemplateBlock[]): string | null {
  const used = googleFamiliesIn(blocks.map((b) => b.style.fontFamily));
  if (used.length === 0) return null;
  const query = used.map((f) => `family=${f.googleQuery}`).join("&");
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${query}&display=swap" />`;
}

function blockLines(block: TemplateBlock, out: string[]): void {
  const open = `<div style="${blockFrameCss(block)}">`;
  const close = "</div>";
  switch (block.type) {
    case "heading": {
      const tag = `h${block.level ?? 2}`;
      out.push(`${IND}${open}`);
      out.push(`${IND}${IND}<${tag} style="${blockInnerCss(block)}">${esc(block.text ?? "")}</${tag}>`);
      out.push(`${IND}${close}`);
      break;
    }
    case "text": {
      out.push(`${IND}${open}`);
      out.push(`${IND}${IND}<p style="${blockInnerCss(block)}">${esc(block.text ?? "")}</p>`);
      out.push(`${IND}${close}`);
      break;
    }
    case "button": {
      out.push(`${IND}${open}`);
      out.push(
        `${IND}${IND}<a href="${esc(block.href ?? "#")}" style="display: inline-block; padding: 10px 20px; border-radius: 8px; text-decoration: none; ${blockInnerCss(block)}">${esc(block.text ?? "")}</a>`
      );
      out.push(`${IND}${close}`);
      break;
    }
    case "image": {
      out.push(`${IND}${open}`);
      out.push(
        `${IND}${IND}<img src="${esc(block.src || "")}" alt="${esc(block.alt || "")}" style="display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />`
      );
      out.push(`${IND}${close}`);
      break;
    }
    case "icon": {
      out.push(`${IND}${open}`);
      const svg = htmlIconSvg(block.icon);
      if (svg) out.push(`${IND}${IND}${svg}`);
      out.push(`${IND}${close}`);
      break;
    }
    case "qr": {
      const src = qrDataUri(block.text);
      out.push(`${IND}${open}`);
      if (src) {
        out.push(
          `${IND}${IND}<img src="${esc(src)}" alt="QR code" style="display: block; width: 100%; height: 100%; object-fit: contain;" />`
        );
      } else {
        out.push(`${IND}${IND}<span>Enter QR data</span>`);
      }
      out.push(`${IND}${close}`);
      break;
    }
    case "barcode": {
      const src = barcodeDataUri(block.text);
      out.push(`${IND}${open}`);
      if (src) {
        out.push(
          `${IND}${IND}<img src="${esc(src)}" alt="Barcode: ${esc(block.text ?? "")}" style="display: block; width: 100%; height: 100%; object-fit: contain;" />`
        );
      } else {
        out.push(`${IND}${IND}<span>Enter barcode data</span>`);
      }
      out.push(`${IND}${close}`);
      break;
    }
    case "divider": {
      out.push(`${IND}${open}`);
      out.push(
        `${IND}${IND}<hr style="border: none; border-top: 1px solid currentColor; opacity: 0.2; width: 100%;" />`
      );
      out.push(`${IND}${close}`);
      break;
    }
    case "spacer": {
      out.push(`${IND}${open}${close}`);
      break;
    }
  }
}

export function blocksToHtml(blocks: TemplateBlock[], canvas: TemplateCanvas): string {
  const out: string[] = [];
  const fontLink = googleFontLink(blocks);
  if (fontLink) out.push(fontLink);
  out.push(`<div style="${canvasRootCss(canvas)}">`);

  const overlay = overlayCss(canvas);
  if (overlay) {
    out.push(`${IND}<img src="${esc(canvas.overlayImage)}" alt="" style="${overlay}" />`);
  }

  out.push(`${IND}<div style="${contentWrapperCss(canvas)}">`);
  for (const block of byZ(blocks)) blockLines(block, out);
  out.push(`${IND}</div>`);

  out.push("</div>");
  return out.join("\n");
}

function reactStyleEntries(css: string): string {
  return css
    .split("; ")
    .map((decl) => {
      const [prop, value] = decl.split(": ");
      const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return `${camel}: "${value}"`;
    })
    .join(", ");
}

function pascalIdentifier(title: string): string {
  const ident =
    title
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join("") || "Template";
  return /^[0-9]/.test(ident) ? `T${ident}` : ident;
}

function reactBlockLines(block: TemplateBlock, out: string[], depth: number): void {
  const pad = IND.repeat(depth);
  const pad2 = IND.repeat(depth + 1);
  const wrapper = reactStyleEntries(blockFrameCss(block));
  switch (block.type) {
    case "heading": {
      const tag = `h${block.level ?? 2}`;
      out.push(`${pad}<div style={{ ${wrapper} }}>`);
      out.push(
        `${pad2}<${tag} style={{ ${reactStyleEntries(blockInnerCss(block))} }}>${esc(block.text ?? "")}</${tag}>`
      );
      out.push(`${pad}</div>`);
      break;
    }
    case "text": {
      out.push(`${pad}<div style={{ ${wrapper} }}>`);
      out.push(
        `${pad2}<p style={{ ${reactStyleEntries(blockInnerCss(block))} }}>${esc(block.text ?? "")}</p>`
      );
      out.push(`${pad}</div>`);
      break;
    }
    case "button": {
      out.push(`${pad}<div style={{ ${wrapper} }}>`);
      out.push(
        `${pad2}<a href="${esc(block.href ?? "#")}" style={{ display: "inline-block", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", ${reactStyleEntries(blockInnerCss(block))} }}>${esc(block.text ?? "")}</a>`
      );
      out.push(`${pad}</div>`);
      break;
    }
    case "image": {
      out.push(`${pad}<div style={{ ${wrapper} }}>`);
      out.push(
        `${pad2}<img src="${esc(block.src || "")}" alt="${esc(block.alt || "")}" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />`
      );
      out.push(`${pad}</div>`);
      break;
    }
    case "icon": {
      out.push(`${pad}<div style={{ ${wrapper} }}>`);
      const svg = jsxIconSvg(block.icon);
      if (svg) out.push(`${pad2}${svg}`);
      out.push(`${pad}</div>`);
      break;
    }
    case "qr": {
      const src = qrDataUri(block.text);
      out.push(`${pad}<div style={{ ${wrapper} }}>`);
      if (src) {
        out.push(
          `${pad2}<img src="${esc(src)}" alt="QR code" style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />`
        );
      } else {
        out.push(`${pad2}<span>Enter QR data</span>`);
      }
      out.push(`${pad}</div>`);
      break;
    }
    case "barcode": {
      const src = barcodeDataUri(block.text);
      out.push(`${pad}<div style={{ ${wrapper} }}>`);
      if (src) {
        out.push(
          `${pad2}<img src="${esc(src)}" alt="Barcode: ${esc(block.text ?? "")}" style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />`
        );
      } else {
        out.push(`${pad2}<span>Enter barcode data</span>`);
      }
      out.push(`${pad}</div>`);
      break;
    }
    case "divider": {
      out.push(`${pad}<div style={{ ${wrapper} }}>`);
      out.push(
        `${pad2}<hr style={{ border: "none", borderTop: "1px solid currentColor", opacity: 0.2, width: "100%" }} />`
      );
      out.push(`${pad}</div>`);
      break;
    }
    case "spacer": {
      out.push(`${pad}<div style={{ ${wrapper} }} />`);
      break;
    }
  }
}

export function blocksToReact(
  blocks: TemplateBlock[],
  title: string,
  canvas: TemplateCanvas
): string {
  const name = pascalIdentifier(title);
  const out: string[] = [];
  const reactFontLink = googleFontLink(blocks);
  if (reactFontLink) out.push(reactFontLink, "");
  out.push(
    "export default function " + name + "() {",
    `${IND}return (`,
    `${IND}${IND}<div style={{ ${reactStyleEntries(canvasRootCss(canvas))} }}>`
  );

  const overlay = overlayCss(canvas);
  if (overlay) {
    out.push(
      `${IND}${IND}${IND}<img src="${esc(canvas.overlayImage)}" alt="" style={{ ${reactStyleEntries(overlay)} }} />`
    );
  }

  out.push(`${IND}${IND}${IND}<div style={{ ${reactStyleEntries(contentWrapperCss(canvas))} }}>`);

  for (const block of byZ(blocks)) reactBlockLines(block, out, 5);

  out.push(`${IND}${IND}${IND}</div>`);
  out.push(`${IND}${IND}</div>`);
  out.push(`${IND});`);
  out.push("}");
  return out.join("\n");
}

export function blocksToAngular(
  blocks: TemplateBlock[],
  title: string,
  canvas: TemplateCanvas
): string {
  const name = pascalIdentifier(title);
  const selector = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

  const body: string[] = [`${IND}${IND}<div style="${canvasRootCss(canvas)}">`];
  const overlay = overlayCss(canvas);
  if (overlay) {
    body.push(`${IND}${IND}${IND}<img src="${esc(canvas.overlayImage)}" alt="" style="${overlay}" />`);
  }
  body.push(`${IND}${IND}${IND}<div style="${contentWrapperCss(canvas)}">`);
  for (const block of byZ(blocks)) blockLines(block, body);
  body.push(`${IND}${IND}${IND}</div>`);
  body.push(`${IND}${IND}</div>`);

  const angularFontLink = googleFontLink(blocks);
  // Angular strips <link>/<style> from component templates, so instruct on index.html
  const fontComment = angularFontLink
    ? `// Uses Google Fonts — add to your index.html:\n// ${angularFontLink}\n`
    : "";

  return `${fontComment}import { Component } from "@angular/core";

@Component({
  selector: "app-${selector}",
  standalone: true,
  template: \`
${body.join("\n")}
  \`,
})
export class ${name}Component {}
`;
}
