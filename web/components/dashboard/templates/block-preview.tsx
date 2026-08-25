import type { BlockStyle, TemplateBlock } from "@/features/templates/types";
import { getIconSvg } from "@/features/templates/icons";

function wrapperStyle(style: BlockStyle): React.CSSProperties {
  return {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    padding: style.padding,
    backgroundColor: style.backgroundColor === "transparent" ? undefined : style.backgroundColor,
    textAlign: style.textAlign,
    overflow: "hidden",
    borderWidth: style.borderWidth > 0 ? style.borderWidth : undefined,
    borderStyle: style.borderWidth > 0 ? "solid" : undefined,
    borderColor: style.borderWidth > 0 ? style.borderColor : undefined,
    borderRadius: style.borderRadius,
  };
}

const DIVIDER_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
};

function textStyle(block: TemplateBlock): React.CSSProperties {
  return {
    margin: 0,
    color: block.style.color === "inherit" ? undefined : block.style.color,
    fontSize: block.style.fontSize,
    fontWeight: block.style.fontWeight,
    fontFamily: block.style.fontFamily,
    fontStyle: block.style.italic ? "italic" : undefined,
    textDecoration: block.style.underline ? "underline" : undefined,
  };
}

export default function BlockPreview({ block }: { block: TemplateBlock }) {
  switch (block.type) {
    case "heading": {
      const Tag = (`h${block.level ?? 2}` as unknown) as "h2";
      return (
        <div style={wrapperStyle(block.style)}>
          <Tag style={textStyle(block)}>{block.text}</Tag>
        </div>
      );
    }
    case "text":
      return (
        <div style={wrapperStyle(block.style)}>
          <p style={textStyle(block)}>{block.text}</p>
        </div>
      );
    case "button":
      return (
        <div style={wrapperStyle(block.style)}>
          <a
            href={block.href || "#"}
            onClick={(e) => e.preventDefault()}
            style={{
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: 8,
              textDecoration: block.style.underline ? "underline" : "none",
              whiteSpace: "nowrap",
              fontFamily: block.style.fontFamily,
              fontStyle: block.style.italic ? "italic" : undefined,
            }}
          >
            {block.text}
          </a>
        </div>
      );
    case "image":
      return (
        <div style={{ ...wrapperStyle(block.style), padding: 0 }}>
          {block.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.src}
              alt={block.alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 0,
                margin: 0,
                display: "block",
              }}
            />
          ) : (
            <div className="flex h-full min-h-16 w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400 dark:border-zinc-700">
              No image URL set
            </div>
          )}
        </div>
      );
    case "icon": {
      const inner = getIconSvg(block.icon);
      return (
        <div
          style={{
            ...wrapperStyle(block.style),
            padding: 0,
            color: block.style.color === "inherit" ? undefined : block.style.color,
          }}
        >
          {inner ? (
            <svg
              viewBox="0 0 24 24"
              width="100%"
              height="100%"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "block" }}
              dangerouslySetInnerHTML={{ __html: inner }}
            />
          ) : (
            <div className="flex h-full min-h-16 w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400 dark:border-zinc-700">
              No icon selected
            </div>
          )}
        </div>
      );
    }
    case "divider":
      return (
        <div style={DIVIDER_STYLE}>
          <hr className="w-full border-t border-zinc-300 dark:border-zinc-700" />
        </div>
      );
    case "spacer":
      return <div style={wrapperStyle(block.style)} />;
    default:
      return null;
  }
}
