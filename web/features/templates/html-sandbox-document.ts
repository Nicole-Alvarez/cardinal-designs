import { resolveTemplateString } from "./metadata";
import type { TemplateMetadata } from "./types";

export type SandboxDocumentPayload =
  | { mode: "html"; cards: string[] }
  | { mode: "react"; compiledCode: string; records: Record<string, unknown>[] };

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const HTML_SANDBOX_RUNTIME = String.raw`
(() => {
  const body = document.body;
  const channel = body.dataset.previewChannel || "";
  const root = document.getElementById("preview-root");

  const post = (type, detail = {}) => {
    window.parent.postMessage({
      source: "cardinal-preview-frame",
      type,
      channel,
      ...detail,
    }, "*");
  };

  const decodePayload = () => {
    const binary = atob(body.dataset.previewPayload || "");
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  };

  const sanitize = (html) => {
    const template = document.createElement("template");
    template.innerHTML = html;
    template.content.querySelectorAll("script,iframe,object,embed,base").forEach((node) => node.remove());
    template.content.querySelectorAll("*").forEach((element) => {
      for (const attribute of [...element.attributes]) {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        if (name.startsWith("on") || ((name === "href" || name === "src" || name === "xlink:href") && value.startsWith("javascript:"))) {
          element.removeAttribute(attribute.name);
        }
      }
    });
    return template.content;
  };

  const fragment = Symbol("Fragment");
  const svgElements = new Set([
    "circle", "clipPath", "defs", "ellipse", "g", "line", "linearGradient",
    "mask", "path", "pattern", "polygon", "polyline", "radialGradient", "rect",
    "stop", "svg", "text", "tspan", "use",
  ]);
  const svgAttributes = {
    className: "class",
    fillRule: "fill-rule",
    clipRule: "clip-rule",
    strokeLinecap: "stroke-linecap",
    strokeLinejoin: "stroke-linejoin",
    strokeWidth: "stroke-width",
  };

  const appendChild = (parent, child) => {
    if (child === null || child === undefined || typeof child === "boolean") return;
    if (Array.isArray(child)) {
      child.forEach((value) => appendChild(parent, value));
      return;
    }
    if (child instanceof Node) {
      parent.append(child);
      return;
    }
    parent.append(document.createTextNode(String(child)));
  };

  const createElement = (type, props, ...children) => {
    const properties = props || {};
    const allChildren = properties.children === undefined ? children : [properties.children];
    if (type === fragment) {
      const result = document.createDocumentFragment();
      allChildren.forEach((child) => appendChild(result, child));
      return result;
    }
    if (typeof type === "function") return type({ ...properties, children: allChildren });
    if (typeof type !== "string") throw new Error("React preview encountered an unsupported element type.");

    const isSvg = svgElements.has(type);
    const element = isSvg
      ? document.createElementNS("http://www.w3.org/2000/svg", type)
      : document.createElement(type);
    for (const [name, value] of Object.entries(properties)) {
      if (name === "children" || name === "key" || name === "ref" || value === null || value === undefined || typeof value === "function") continue;
      if (name === "style" && typeof value === "object") {
        Object.assign(element.style, value);
        continue;
      }
      if (name === "dangerouslySetInnerHTML" && value && typeof value.__html === "string") {
        element.append(sanitize(value.__html));
        continue;
      }
      if (name.startsWith("on")) continue;
      const attribute = isSvg
        ? (svgAttributes[name] || name)
        : name === "className"
          ? "class"
          : name === "htmlFor"
            ? "for"
            : name;
      const stringValue = String(value);
      if ((attribute === "href" || attribute === "src" || attribute === "xlink:href") && stringValue.trim().toLowerCase().startsWith("javascript:")) continue;
      if (typeof value === "boolean") {
        if (value) element.setAttribute(attribute, "");
      } else {
        element.setAttribute(attribute, stringValue);
      }
    }
    if (!("dangerouslySetInnerHTML" in properties)) {
      allChildren.forEach((child) => appendChild(element, child));
    }
    return element;
  };

  const renderReact = (payload) => {
    const React = { createElement, Fragment: fragment };
    const module = { exports: {} };
    const requireModule = (name) => {
      if (name === "react") return React;
      throw new Error('React preview does not support the import "' + name + '".');
    };
    new Function("module", "exports", "React", "require", payload.compiledCode)(
      module,
      module.exports,
      React,
      requireModule
    );
    const Component = module.exports.default || module.exports;
    if (typeof Component !== "function") {
      throw new Error("Pasted code must export default a function component.");
    }
    for (const record of payload.records) {
      const card = document.createElement("div");
      card.dataset.templatePreviewCard = "";
      appendChild(card, Component(record));
      root.append(card);
    }
  };

  const reportHeight = () => {
    const height = Math.ceil(root.getBoundingClientRect().height + 24);
    if (height > 0) post("height", { height });
  };

  const waitForAssets = async (element) => {
    if (document.fonts) await document.fonts.ready;
    await Promise.all([...element.querySelectorAll("img")].map((image) => {
      if (image.complete) {
        return image.naturalWidth > 0
          ? Promise.resolve()
          : Promise.reject(new Error("A preview image could not be loaded."));
      }
      return new Promise((resolve, reject) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", () => reject(new Error("A preview image could not be loaded.")), { once: true });
      });
    }));
  };

  const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)), { once: true });
    reader.addEventListener("error", () => reject(reader.error || new Error("Could not read a preview image.")), { once: true });
    reader.readAsDataURL(blob);
  });

  const inlineImages = async (clone) => {
    await Promise.all([...clone.querySelectorAll("img")].map(async (image) => {
      const source = image.getAttribute("src") || "";
      if (!source || source.startsWith("data:")) return;
      const response = await fetch(new URL(source, document.baseURI).href);
      if (!response.ok) throw new Error("A preview image could not be loaded.");
      image.setAttribute("src", await blobToDataUrl(await response.blob()));
    }));
  };

  const renderImage = async (element, pixelRatio) => {
    await waitForAssets(element);
    const rect = element.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);
    if (width <= 0 || height <= 0) throw new Error("Preview has no visible dimensions.");

    const clone = element.cloneNode(true);
    await inlineImages(clone);
    clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    const serialized = new XMLSerializer().serializeToString(clone);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '"><foreignObject width="100%" height="100%">' + serialized + '</foreignObject></svg>';
    const image = new Image();
    image.decoding = "async";
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not create the preview image.");
    context.scale(pixelRatio, pixelRatio);
    context.drawImage(image, 0, 0, width, height);
    return {
      dataUrl: canvas.toDataURL("image/png"),
      width,
      height,
      usedFallbackFonts: false,
    };
  };

  const payload = decodePayload();
  post("ready");
  try {
    if (payload.mode === "html") {
      for (const html of payload.cards) {
        const card = document.createElement("div");
        card.dataset.templatePreviewCard = "";
        card.append(sanitize(html));
        root.append(card);
      }
    } else if (payload.mode === "react") {
      renderReact(payload);
    } else {
      throw new Error("Unsupported preview type.");
    }
    post("rendered");
  } catch (error) {
    post("error", {
      message: error instanceof Error ? error.message : "Could not render preview.",
    });
  }

  root.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) event.preventDefault();
  });

  window.addEventListener("message", async (event) => {
    const message = event.data;
    if (event.source !== window.parent || !message || message.source !== "cardinal-preview-parent" || message.type !== "export" || message.channel !== channel) return;
    try {
      const elements = message.target === "batch"
        ? [root]
        : [...root.querySelectorAll("[data-template-preview-card]")];
      const images = [];
      for (const element of elements) images.push(await renderImage(element, message.pixelRatio));
      post("exported", { requestId: message.requestId, images });
    } catch (error) {
      post("export-error", {
        requestId: message.requestId,
        message: error instanceof Error ? error.message : "Could not export preview.",
      });
    }
  });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(reportHeight);
    observer.observe(root);
  } else {
    window.addEventListener("resize", reportHeight);
  }
  reportHeight();
})();
`;

export function buildSandboxDocument(
  payload: SandboxDocumentPayload,
  channel = ""
): string {
  const encodedPayload = encodeBase64Utf8(JSON.stringify(payload));

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="referrer" content="no-referrer" />
    <meta name="color-scheme" content="light" />
    <style>
      html, body { margin: 0; min-height: 100%; background: #fff; color: #18181b; }
      body { box-sizing: border-box; padding: 12px; font-family: system-ui, sans-serif; }
      #preview-root { display: inline-flex; flex-direction: column; gap: 16px; background: #fff; }
    </style>
  </head>
  <body data-preview-channel="${escapeHtmlAttribute(channel)}" data-preview-payload="${encodedPayload}">
    <div id="preview-root" data-template-preview-batch style="display:inline-flex;flex-direction:column;gap:16px;background:#fff"></div>
    <script>${HTML_SANDBOX_RUNTIME}</script>
  </body>
</html>`;
}

export function buildHtmlSandboxDocument(
  code: string,
  metadata: TemplateMetadata,
  channel = ""
): string {
  const records = metadata.length > 0 ? metadata : [{}];
  const renderedCards = records.map((record) => resolveTemplateString(code, record));
  return buildSandboxDocument({ mode: "html", cards: renderedCards }, channel);
}
