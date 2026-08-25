import type { BlockStyle, TemplateBlock } from "@/features/templates/types";
import { getIconSvg } from "@/features/templates/icons";
import { barcodeDataUri } from "@/features/templates/barcode";
import { qrDataUri } from "@/features/templates/qr";

function wrapperStyle(style: BlockStyle): React.CSSProperties {
  return {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    padding: style.padding,
    backgroundColor: style.backgroundColor === "transparent" ? undefined : style.backgroundColor,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: style.textAlign === "center" ? "center" : style.textAlign === "right" ? "flex-end" : "flex-start",
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
    textAlign: block.style.textAlign,
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
    case "qr": {
      const src = qrDataUri(block.text);
      if (src) {
        return (
          <div style={wrapperStyle(block.style)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="QR code"
              style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        );
      }
      return (
        <div style={wrapperStyle(block.style)}>
          <svg viewBox="0 0 21 21" width="100%" height="100%" style={{ display: "block" }}>
            <rect width="21" height="21" fill="white" />
            <rect x="1" y="1" width="5" height="5" fill="black" />
            <rect x="2" y="2" width="3" height="3" fill="white" />
            <rect x="2.5" y="2.5" width="2" height="2" fill="black" />
            <rect x="15" y="1" width="5" height="5" fill="black" />
            <rect x="16" y="2" width="3" height="3" fill="white" />
            <rect x="16.5" y="2.5" width="2" height="2" fill="black" />
            <rect x="1" y="15" width="5" height="5" fill="black" />
            <rect x="2" y="16" width="3" height="3" fill="white" />
            <rect x="2.5" y="16.5" width="2" height="2" fill="black" />
            <rect x="7" y="1" width="1" height="1" fill="black" />
            <rect x="9" y="1" width="1" height="1" fill="black" />
            <rect x="11" y="1" width="1" height="1" fill="black" />
            <rect x="7" y="3" width="1" height="1" fill="black" />
            <rect x="10" y="3" width="1" height="1" fill="black" />
            <rect x="13" y="3" width="1" height="1" fill="black" />
            <rect x="7" y="5" width="1" height="1" fill="black" />
            <rect x="9" y="5" width="1" height="1" fill="black" />
            <rect x="11" y="5" width="1" height="1" fill="black" />
            <rect x="1" y="7" width="1" height="1" fill="black" />
            <rect x="3" y="7" width="1" height="1" fill="black" />
            <rect x="5" y="7" width="1" height="1" fill="black" />
            <rect x="7" y="7" width="1" height="1" fill="black" />
            <rect x="9" y="7" width="1" height="1" fill="black" />
            <rect x="11" y="7" width="1" height="1" fill="black" />
            <rect x="13" y="7" width="1" height="1" fill="black" />
            <rect x="15" y="7" width="1" height="1" fill="black" />
            <rect x="17" y="7" width="1" height="1" fill="black" />
            <rect x="19" y="7" width="1" height="1" fill="black" />
            <rect x="1" y="9" width="1" height="1" fill="black" />
            <rect x="4" y="9" width="1" height="1" fill="black" />
            <rect x="7" y="9" width="1" height="1" fill="black" />
            <rect x="10" y="9" width="1" height="1" fill="black" />
            <rect x="13" y="9" width="1" height="1" fill="black" />
            <rect x="16" y="9" width="1" height="1" fill="black" />
            <rect x="19" y="9" width="1" height="1" fill="black" />
            <rect x="1" y="11" width="1" height="1" fill="black" />
            <rect x="3" y="11" width="1" height="1" fill="black" />
            <rect x="6" y="11" width="1" height="1" fill="black" />
            <rect x="8" y="11" width="1" height="1" fill="black" />
            <rect x="11" y="11" width="1" height="1" fill="black" />
            <rect x="14" y="11" width="1" height="1" fill="black" />
            <rect x="17" y="11" width="1" height="1" fill="black" />
            <rect x="19" y="11" width="1" height="1" fill="black" />
            <rect x="7" y="13" width="1" height="1" fill="black" />
            <rect x="10" y="13" width="1" height="1" fill="black" />
            <rect x="13" y="13" width="1" height="1" fill="black" />
            <rect x="16" y="13" width="1" height="1" fill="black" />
            <rect x="19" y="13" width="1" height="1" fill="black" />
            <rect x="7" y="15" width="1" height="1" fill="black" />
            <rect x="9" y="15" width="1" height="1" fill="black" />
            <rect x="11" y="15" width="1" height="1" fill="black" />
            <rect x="13" y="15" width="1" height="1" fill="black" />
            <rect x="15" y="15" width="1" height="1" fill="black" />
            <rect x="17" y="15" width="1" height="1" fill="black" />
            <rect x="19" y="15" width="1" height="1" fill="black" />
            <rect x="7" y="17" width="1" height="1" fill="black" />
            <rect x="10" y="17" width="1" height="1" fill="black" />
            <rect x="12" y="17" width="1" height="1" fill="black" />
            <rect x="15" y="17" width="1" height="1" fill="black" />
            <rect x="18" y="17" width="1" height="1" fill="black" />
            <rect x="7" y="19" width="1" height="1" fill="black" />
            <rect x="9" y="19" width="1" height="1" fill="black" />
            <rect x="11" y="19" width="1" height="1" fill="black" />
            <rect x="14" y="19" width="1" height="1" fill="black" />
            <rect x="16" y="19" width="1" height="1" fill="black" />
            <rect x="19" y="19" width="1" height="1" fill="black" />
          </svg>
        </div>
      );
    }
    case "barcode": {
      const src = barcodeDataUri(block.text);
      if (src) {
        return (
          <div style={wrapperStyle(block.style)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Barcode: ${block.text}`}
              style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        );
      }
      return (
        <div style={wrapperStyle(block.style)}>
          <svg viewBox="0 0 100 40" width="100%" height="100%" style={{ display: "block" }}>
            <rect width="100" height="40" fill="white" />
            <rect x="5" y="2" width="2" height="30" fill="black" />
            <rect x="9" y="2" width="1" height="30" fill="black" />
            <rect x="12" y="2" width="3" height="30" fill="black" />
            <rect x="17" y="2" width="1" height="30" fill="black" />
            <rect x="20" y="2" width="2" height="30" fill="black" />
            <rect x="24" y="2" width="1" height="30" fill="black" />
            <rect x="27" y="2" width="3" height="30" fill="black" />
            <rect x="32" y="2" width="1" height="30" fill="black" />
            <rect x="35" y="2" width="2" height="30" fill="black" />
            <rect x="39" y="2" width="1" height="30" fill="black" />
            <rect x="42" y="2" width="2" height="30" fill="black" />
            <rect x="46" y="2" width="3" height="30" fill="black" />
            <rect x="51" y="2" width="1" height="30" fill="black" />
            <rect x="54" y="2" width="2" height="30" fill="black" />
            <rect x="58" y="2" width="1" height="30" fill="black" />
            <rect x="61" y="2" width="3" height="30" fill="black" />
            <rect x="66" y="2" width="1" height="30" fill="black" />
            <rect x="69" y="2" width="2" height="30" fill="black" />
            <rect x="73" y="2" width="1" height="30" fill="black" />
            <rect x="76" y="2" width="2" height="30" fill="black" />
            <rect x="80" y="2" width="3" height="30" fill="black" />
            <rect x="85" y="2" width="1" height="30" fill="black" />
            <rect x="88" y="2" width="2" height="30" fill="black" />
            <rect x="92" y="2" width="1" height="30" fill="black" />
            <text x="50" y="38" textAnchor="middle" fontSize="5" fontFamily="monospace" fill="black">
              {block.text || "123456789"}
            </text>
          </svg>
        </div>
      );
    }
    default:
      return null;
  }
}
