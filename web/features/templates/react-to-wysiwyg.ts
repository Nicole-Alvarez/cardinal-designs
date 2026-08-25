import { ICONS } from "./icons";
import {
  DEFAULT_CANVAS,
  defaultBlockStyle,
  type BlockStyle,
  type BlockType,
  type TemplateBlock,
  type TemplateCanvas,
} from "./types";

type AstNode = Record<string, unknown> & { type?: string };
type StaticValue = string | number | boolean | null;

export interface ReactWysiwygConversion {
  canvas: TemplateCanvas;
  blocks: TemplateBlock[];
}

export type CodeWysiwygConversion = ReactWysiwygConversion;

function isNode(value: unknown): value is AstNode {
  return !!value && typeof value === "object" && typeof (value as AstNode).type === "string";
}

function expressionPath(node: unknown): string | null {
  if (!isNode(node)) return null;
  if (node.type === "Identifier") return String(node.name);
  if (node.type !== "MemberExpression" || node.computed) return null;
  const object = expressionPath(node.object);
  const property = expressionPath(node.property);
  return object && property ? `${object}.${property}` : null;
}

function expressionText(node: unknown): string | null {
  if (!isNode(node)) return null;
  const path = expressionPath(node);
  if (path) return `{{${path}}}`;
  if (node.type === "StringLiteral" || node.type === "NumericLiteral") return String(node.value ?? "");
  if (node.type === "TemplateLiteral") {
    const quasis = Array.isArray(node.quasis) ? node.quasis : [];
    const expressions = Array.isArray(node.expressions) ? node.expressions : [];
    let result = "";
    for (let index = 0; index < quasis.length; index++) {
      const quasi = quasis[index] as AstNode;
      const value = quasi.value as { cooked?: string } | undefined;
      result += value?.cooked ?? "";
      if (index < expressions.length) result += expressionText(expressions[index]) ?? "";
    }
    return result;
  }
  return null;
}

function staticValue(node: unknown): StaticValue | undefined {
  if (!isNode(node)) return undefined;
  if (node.type === "StringLiteral" || node.type === "NumericLiteral" || node.type === "BooleanLiteral") {
    return node.value as StaticValue;
  }
  if (node.type === "NullLiteral") return null;
  return undefined;
}

function jsxElementText(node: AstNode): string | null {
  const children = Array.isArray(node.children) ? node.children : [];
  let result = "";
  for (const child of children) {
    if (!isNode(child)) continue;
    if (child.type === "JSXText") result += String(child.value ?? "");
    else if (child.type === "JSXExpressionContainer") {
      const text = expressionText(child.expression);
      if (text === null) return null;
      result += text;
    } else return null;
  }
  return result;
}

function jsxTag(node: AstNode): string | null {
  const opening = node.openingElement;
  if (!isNode(opening) || !isNode(opening.name) || opening.name.type !== "JSXIdentifier") return null;
  return String(opening.name.name);
}

function jsxElements(node: AstNode): AstNode[] {
  return (Array.isArray(node.children) ? node.children : []).filter(
    (child): child is AstNode => isNode(child) && child.type === "JSXElement"
  );
}

function jsxAttributeNode(node: AstNode, name: string): AstNode | null {
  const opening = node.openingElement;
  if (!isNode(opening) || !Array.isArray(opening.attributes)) return null;
  for (const attribute of opening.attributes) {
    if (!isNode(attribute) || attribute.type !== "JSXAttribute" || !isNode(attribute.name)) continue;
    if (attribute.name.type === "JSXIdentifier" && attribute.name.name === name) return attribute;
  }
  return null;
}

function jsxAttributeValue(node: AstNode, name: string): string | null {
  const attribute = jsxAttributeNode(node, name);
  if (!attribute) return null;
  const value = attribute.value;
  if (!isNode(value)) return "";
  if (value.type === "StringLiteral") return String(value.value ?? "");
  if (value.type === "JSXExpressionContainer") return expressionText(value.expression);
  return null;
}

function styleObject(node: AstNode): Record<string, StaticValue> {
  const attribute = jsxAttributeNode(node, "style");
  if (!attribute || !isNode(attribute.value) || attribute.value.type !== "JSXExpressionContainer") return {};
  const expression = attribute.value.expression;
  if (!isNode(expression) || expression.type !== "ObjectExpression" || !Array.isArray(expression.properties)) {
    throw new Error("Dynamic style expressions cannot be converted.");
  }
  const style: Record<string, StaticValue> = {};
  for (const property of expression.properties) {
    if (!isNode(property) || property.type !== "ObjectProperty" || property.computed || !isNode(property.key)) {
      throw new Error("Style spreads and computed style properties cannot be converted.");
    }
    const key = property.key.type === "Identifier" || property.key.type === "StringLiteral"
      ? String(property.key.name ?? property.key.value)
      : null;
    const value = staticValue(property.value);
    if (!key || value === undefined) throw new Error(`Dynamic style property ${key ?? "unknown"} cannot be converted.`);
    style[key] = value;
  }
  return style;
}

function cssNumber(value: StaticValue | undefined, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundedCssNumber(value: StaticValue | undefined, fallback = 0): number {
  return Math.round(cssNumber(value, fallback));
}

function borderParts(value: StaticValue | undefined): { width: number; color: string } {
  if (typeof value !== "string") return { width: 0, color: "#d4d4d8" };
  const match = value.match(/^(\d+(?:\.\d+)?)px\s+\w+\s+(.+)$/);
  return match ? { width: Math.round(Number(match[1])), color: match[2] } : { width: 0, color: "#d4d4d8" };
}

function blockStyle(frame: Record<string, StaticValue>, inner: Record<string, StaticValue>): BlockStyle {
  const border = borderParts(frame.border);
  const align = frame.textAlign;
  return {
    ...defaultBlockStyle(),
    color: String(inner.color ?? frame.color ?? "inherit"),
    backgroundColor: String(frame.backgroundColor ?? "transparent"),
    fontSize: roundedCssNumber(inner.fontSize, 16),
    fontWeight: roundedCssNumber(inner.fontWeight, 400),
    fontFamily: typeof inner.fontFamily === "string" ? inner.fontFamily : undefined,
    italic: inner.fontStyle === "italic" || undefined,
    underline: typeof inner.textDecoration === "string" && inner.textDecoration.includes("underline") || undefined,
    textAlign: align === "center" || align === "right" ? align : "left",
    padding: roundedCssNumber(frame.padding, 0),
    borderWidth: border.width,
    borderColor: border.color,
    borderRadius: roundedCssNumber(frame.borderRadius, 0),
  };
}

function walk(node: unknown, visit: (node: AstNode) => void): void {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (!isNode(node)) return;
  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "start" || key === "end") continue;
    if (Array.isArray(value) || isNode(value)) walk(value, visit);
  }
}

function returnedJsx(ast: AstNode): AstNode {
  const found: { declaration: AstNode | null } = { declaration: null };
  walk(ast, (node) => {
    if (!found.declaration && node.type === "ExportDefaultDeclaration" && isNode(node.declaration)) {
      found.declaration = node.declaration;
    }
  });
  const declaration = found.declaration;
  if (!declaration) throw new Error("React code must export a default component.");
  if (declaration.type === "ArrowFunctionExpression" && isNode(declaration.body) && declaration.body.type === "JSXElement") {
    return declaration.body;
  }
  let root: AstNode | null = null;
  walk(declaration, (node) => {
    if (!root && node.type === "ReturnStatement" && isNode(node.argument) && node.argument.type === "JSXElement") {
      root = node.argument;
    }
  });
  if (!root) throw new Error("The default component must return a JSX element.");
  return root;
}

function attributeSignature(node: AstNode): string | null {
  const opening = node.openingElement;
  if (!isNode(opening) || !Array.isArray(opening.attributes)) return null;
  const attributes: string[] = [];
  for (const attribute of opening.attributes) {
    if (!isNode(attribute) || attribute.type !== "JSXAttribute" || !isNode(attribute.name)) return null;
    const name = String(attribute.name.name ?? "");
    const value = jsxAttributeValue(node, name);
    if (!name || value === null) return null;
    attributes.push(`${name}=${value}`);
  }
  return `${jsxTag(node)}|${attributes.sort().join("|")}`;
}

function markupIconSignature(markup: string): string[] {
  return [...markup.matchAll(/<(\w+)\s+([^>]*?)\s*\/>/g)].map((match) => {
    const attributes = [...match[2].matchAll(/([\w-]+)="([^"]*)"/g)]
      .map((attribute) => `${attribute[1]}=${attribute[2]}`)
      .sort();
    return `${match[1]}|${attributes.join("|")}`;
  });
}

function iconName(svg: AstNode): string | null {
  const signature = jsxElements(svg).map(attributeSignature);
  if (signature.some((part) => part === null)) return null;
  const joined = signature.join(";");
  return ICONS.find((icon) => markupIconSignature(icon.svg).join(";") === joined)?.name ?? null;
}

function canvasFromRoot(root: AstNode): TemplateCanvas {
  if (jsxTag(root) !== "div") throw new Error("The canvas root must be a div.");
  const style = styleObject(root);
  if (style.position !== "relative") throw new Error("The canvas root must use relative positioning.");
  const border = borderParts(style.border);
  const width = typeof style.width === "string" && /^\d+(?:\.\d+)?px$/.test(style.width) ? style.width : null;
  const height = typeof style.height === "string" && /^\d+(?:\.\d+)?px$/.test(style.height) ? style.height : null;
  if (!width || !height) throw new Error("The canvas must have fixed pixel width and height.");
  return {
    ...DEFAULT_CANVAS,
    width,
    height,
    backgroundColor: String(style.backgroundColor ?? DEFAULT_CANVAS.backgroundColor),
    textColor: String(style.color ?? DEFAULT_CANVAS.textColor),
    borderWidth: border.width,
    borderColor: border.color,
    borderRadius: roundedCssNumber(style.borderRadius, 0),
  };
}

function blockFromFrame(frame: AstNode, index: number): TemplateBlock {
  if (jsxTag(frame) !== "div") throw new Error(`Block ${index + 1} must use a div wrapper.`);
  const frameStyle = styleObject(frame);
  if (frameStyle.position !== "absolute") throw new Error(`Block ${index + 1} must use absolute positioning.`);
  const children = jsxElements(frame);
  if (children.length > 1) throw new Error(`Block ${index + 1} has an unsupported nested structure.`);
  const inner = children[0] ?? null;
  const tag = inner ? jsxTag(inner) : null;
  let type: BlockType;
  if (!inner) type = "spacer";
  else if (tag === "p") type = "text";
  else if (/^h[1-3]$/.test(tag ?? "")) type = "heading";
  else if (tag === "a") type = "button";
  else if (tag === "img") type = "image";
  else if (tag === "svg") type = "icon";
  else if (tag === "hr") type = "divider";
  else throw new Error(`Block ${index + 1} uses unsupported <${tag ?? "unknown"}> content.`);

  const innerStyle = inner ? styleObject(inner) : {};
  const block: TemplateBlock = {
    id: crypto.randomUUID(),
    type,
    x: roundedCssNumber(frameStyle.left),
    y: roundedCssNumber(frameStyle.top),
    width: Math.max(16, roundedCssNumber(frameStyle.width, 16)),
    height: Math.max(16, roundedCssNumber(frameStyle.height, 16)),
    z: Math.max(0, roundedCssNumber(frameStyle.zIndex, index)),
    style: blockStyle(frameStyle, innerStyle),
  };

  if (type === "heading" || type === "text" || type === "button") {
    const text = jsxElementText(inner!);
    if (text === null) throw new Error(`Block ${index + 1} contains an unsupported text expression.`);
    block.text = text;
  }
  if (type === "heading") block.level = Number(tag?.slice(1)) as 1 | 2 | 3;
  if (type === "button") block.href = jsxAttributeValue(inner!, "href") ?? "#";
  if (type === "image") {
    block.src = jsxAttributeValue(inner!, "src") ?? "";
    block.alt = jsxAttributeValue(inner!, "alt") ?? "";
    block.style.padding = 0;
  }
  if (type === "icon") {
    const matched = iconName(inner!);
    if (!matched) throw new Error(`Block ${index + 1} contains an SVG that is not in the icon library.`);
    block.icon = matched;
    block.style.padding = 0;
  }
  return block;
}

function reconstructCodeOnly(root: AstNode): ReactWysiwygConversion {
  const canvas = canvasFromRoot(root);
  const rootChildren = jsxElements(root);
  const content = rootChildren.find((child) => {
    if (jsxTag(child) !== "div") return false;
    const style = styleObject(child);
    return style.position === "relative" && style.width === "100%";
  });
  if (!content) throw new Error("The generated relative content wrapper could not be found.");
  const frames = jsxElements(content);
  if (frames.length === 0) throw new Error("The React template does not contain convertible blocks.");
  return { canvas, blocks: frames.map(blockFromFrame) };
}

function updateRetainedBlocks(root: AstNode, blocks: TemplateBlock[]): TemplateBlock[] {
  const values: { type: "heading" | "text" | "button"; text: string }[] = [];
  walk(root, (node) => {
    if (node.type !== "JSXElement") return;
    const tag = jsxTag(node);
    const type = tag === "p" ? "text" : tag === "a" ? "button" : /^h[1-3]$/.test(tag ?? "") ? "heading" : null;
    if (!type) return;
    const text = jsxElementText(node);
    if (text !== null) values.push({ type, text });
  });
  const queues = {
    heading: values.filter((value) => value.type === "heading"),
    text: values.filter((value) => value.type === "text"),
    button: values.filter((value) => value.type === "button"),
  };
  for (const type of ["heading", "text", "button"] as const) {
    const retainedCount = blocks.filter((block) => block.type === type).length;
    if (queues[type].length !== retainedCount) {
      throw new Error(
        `The React structure does not match the retained ${type} blocks (${queues[type].length} found, ${retainedCount} expected).`
      );
    }
  }
  const converted = blocks.map((block) => ({ ...block, style: { ...block.style } }));
  for (const block of [...converted].sort((a, b) => a.z - b.z)) {
    if (block.type !== "heading" && block.type !== "text" && block.type !== "button") continue;
    const next = queues[block.type].shift();
    if (next) block.text = next.text;
  }
  return converted;
}

/** Converts supported generated React TSX without executing user code. */
export async function reactCodeToWysiwyg(
  source: string,
  retainedBlocks: TemplateBlock[],
  retainedCanvas: TemplateCanvas
): Promise<ReactWysiwygConversion> {
  const Babel = await import("@babel/standalone");
  const result = Babel.transform(source, {
    filename: "template.tsx",
    ast: true,
    code: false,
    parserOpts: { plugins: ["jsx", "typescript"] },
  });
  if (!result.ast) throw new Error("React code could not be parsed.");
  const root = returnedJsx(result.ast as unknown as AstNode);
  if (retainedBlocks.length === 0) return reconstructCodeOnly(root);
  return { canvas: retainedCanvas, blocks: updateRetainedBlocks(root, retainedBlocks) };
}

function htmlStyle(element: Element): Record<string, StaticValue> {
  const style = (element as HTMLElement | SVGElement).style;
  const values: Record<string, StaticValue> = {};
  for (const property of style) {
    const camelProperty = property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    values[camelProperty] = style.getPropertyValue(property).trim();
  }
  return values;
}

function htmlElementChildren(element: Element): Element[] {
  return Array.from(element.children);
}

function htmlAttributeSignature(element: Element): string {
  const attributes = Array.from(element.attributes)
    .map((attribute) => `${attribute.name}=${attribute.value}`)
    .sort();
  return `${element.localName}|${attributes.join("|")}`;
}

function htmlIconName(svg: Element): string | null {
  const signature = htmlElementChildren(svg).map(htmlAttributeSignature).join(";");
  return ICONS.find((icon) => markupIconSignature(icon.svg).join(";") === signature)?.name ?? null;
}

function htmlCanvasFromRoot(root: Element): TemplateCanvas {
  if (root.localName !== "div") throw new Error("The canvas root must be a div.");
  const style = htmlStyle(root);
  if (style.position !== "relative") throw new Error("The canvas root must use relative positioning.");
  const border = borderParts(style.border);
  const width = typeof style.width === "string" && /^\d+(?:\.\d+)?px$/.test(style.width) ? style.width : null;
  const height = typeof style.height === "string" && /^\d+(?:\.\d+)?px$/.test(style.height) ? style.height : null;
  if (!width || !height) throw new Error("The canvas must have fixed pixel width and height.");
  return {
    ...DEFAULT_CANVAS,
    width,
    height,
    backgroundColor: String(style.backgroundColor ?? DEFAULT_CANVAS.backgroundColor),
    textColor: String(style.color ?? DEFAULT_CANVAS.textColor),
    borderWidth: border.width,
    borderColor: border.color,
    borderRadius: roundedCssNumber(style.borderRadius, 0),
  };
}

function htmlBlockFromFrame(frame: Element, index: number): TemplateBlock {
  if (frame.localName !== "div") throw new Error(`Block ${index + 1} must use a div wrapper.`);
  const frameStyle = htmlStyle(frame);
  if (frameStyle.position !== "absolute") throw new Error(`Block ${index + 1} must use absolute positioning.`);
  const children = htmlElementChildren(frame);
  if (children.length > 1) throw new Error(`Block ${index + 1} has an unsupported nested structure.`);
  const inner = children[0] ?? null;
  const tag = inner?.localName ?? null;
  let type: BlockType;
  if (!inner) type = "spacer";
  else if (tag === "p") type = "text";
  else if (/^h[1-3]$/.test(tag ?? "")) type = "heading";
  else if (tag === "a") type = "button";
  else if (tag === "img") type = "image";
  else if (tag === "svg") type = "icon";
  else if (tag === "hr") type = "divider";
  else throw new Error(`Block ${index + 1} uses unsupported <${tag ?? "unknown"}> content.`);

  const innerStyle = inner ? htmlStyle(inner) : {};
  const block: TemplateBlock = {
    id: crypto.randomUUID(),
    type,
    x: roundedCssNumber(frameStyle.left),
    y: roundedCssNumber(frameStyle.top),
    width: Math.max(16, roundedCssNumber(frameStyle.width, 16)),
    height: Math.max(16, roundedCssNumber(frameStyle.height, 16)),
    z: Math.max(0, roundedCssNumber(frameStyle.zIndex, index)),
    style: blockStyle(frameStyle, innerStyle),
  };

  if (type === "heading" || type === "text" || type === "button") {
    block.text = inner!.textContent ?? "";
  }
  if (type === "heading") block.level = Number(tag?.slice(1)) as 1 | 2 | 3;
  if (type === "button") block.href = inner!.getAttribute("href") ?? "#";
  if (type === "image") {
    block.src = inner!.getAttribute("src") ?? "";
    block.alt = inner!.getAttribute("alt") ?? "";
    block.style.padding = 0;
  }
  if (type === "icon") {
    const matched = htmlIconName(inner!);
    if (!matched) throw new Error(`Block ${index + 1} contains an SVG that is not in the icon library.`);
    block.icon = matched;
    block.style.padding = 0;
  }
  return block;
}

/** Converts supported generated HTML without executing scripts or custom code. */
export function htmlCodeToWysiwyg(source: string): CodeWysiwygConversion {
  if (!source.trim()) throw new Error("Paste HTML code before converting.");
  const document_ = new DOMParser().parseFromString(source, "text/html");
  if (document_.querySelector("script")) throw new Error("Scripts cannot be converted to WYSIWYG blocks.");

  const roots = Array.from(document_.body.children).filter((element) => element.localName !== "link");
  if (roots.length !== 1) throw new Error("HTML must contain one canvas root element.");
  const root = roots[0];
  const canvas = htmlCanvasFromRoot(root);
  const content = htmlElementChildren(root).find((element) => {
    if (element.localName !== "div") return false;
    const style = htmlStyle(element);
    return style.position === "relative" && style.width === "100%";
  });
  if (!content) throw new Error("The generated relative content wrapper could not be found.");
  const frames = htmlElementChildren(content);
  if (frames.length === 0) throw new Error("The HTML template does not contain convertible blocks.");
  return { canvas, blocks: frames.map(htmlBlockFromFrame) };
}
