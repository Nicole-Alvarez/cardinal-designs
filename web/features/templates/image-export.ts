import { toPng } from "html-to-image";

const fontCssCache = new Map<string, Promise<string>>();

export interface RenderedPreviewImage {
  dataUrl: string;
  width: number;
  height: number;
  usedFallbackFonts: boolean;
}

interface RenderPreviewImageOptions {
  pixelRatio?: number;
  allowFontFallback?: boolean;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)), { once: true });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Could not read font data.")), {
      once: true,
    });
    reader.readAsDataURL(blob);
  });
}

async function embedCssResources(css: string, stylesheetUrl: string): Promise<string> {
  const matches = [...css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)];
  const resources = [...new Set(matches.map((match) => match[2]).filter((url) => !url.startsWith("data:")))];
  let embedded = css;

  await Promise.all(
    resources.map(async (resource) => {
      const url = new URL(resource, stylesheetUrl).href;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load preview font (${response.status}).`);
      const dataUrl = await blobToDataUrl(await response.blob());
      embedded = embedded.split(resource).join(dataUrl);
    })
  );

  return embedded;
}

function embeddedStylesheet(url: string): Promise<string> {
  const cached = fontCssCache.get(url);
  if (cached) return cached;

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load preview font stylesheet (${response.status}).`);
      return response.text();
    })
    .then((css) => embedCssResources(css, url))
    .catch((error) => {
      fontCssCache.delete(url);
      throw error;
    });

  fontCssCache.set(url, request);
  return request;
}

/** Font-face CSS scoped to the stylesheets emitted inside the generated Preview. */
export async function previewFontEmbedCss(previewContainer: HTMLElement): Promise<string> {
  const urls = [
    ...new Set(
      [...previewContainer.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']")]
        .map((link) => link.href)
        .filter(Boolean)
    ),
  ];
  if (urls.length === 0) return "";
  return (await Promise.all(urls.map(embeddedStylesheet))).join("\n");
}

async function waitForImages(element: HTMLElement): Promise<void> {
  await element.ownerDocument.fonts.ready;
  await Promise.all(
    [...element.querySelectorAll("img")].map(
      (image) =>
        new Promise<void>((resolve, reject) => {
          if (image.complete) {
            if (image.naturalWidth > 0) resolve();
            else reject(new Error("A preview image could not be loaded."));
            return;
          }
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => reject(new Error("A preview image could not be loaded.")), {
            once: true,
          });
        })
    )
  );
}

/** Renders the measured Preview element to PNG without scanning global stylesheets. */
export async function renderPreviewImage(
  element: HTMLElement,
  previewContainer: HTMLElement,
  { pixelRatio = 1, allowFontFallback = false }: RenderPreviewImageOptions = {}
): Promise<RenderedPreviewImage> {
  await waitForImages(element);
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  if (width <= 0 || height <= 0) throw new Error("Preview has no visible dimensions.");

  let fontEmbedCSS = "";
  let usedFallbackFonts = false;
  try {
    fontEmbedCSS = await previewFontEmbedCss(previewContainer);
  } catch {
    if (!allowFontFallback) {
      throw new Error("Could not embed the Preview's web fonts for printing.");
    }
    usedFallbackFonts = true;
  }

  const dataUrl = await toPng(element, {
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    pixelRatio,
    cacheBust: true,
    fontEmbedCSS,
  });

  return { dataUrl, width, height, usedFallbackFonts };
}
