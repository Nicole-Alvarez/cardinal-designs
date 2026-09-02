"use client";

import { useRef, useState } from "react";
import {
  isLegacyBlockType,
  isSquareBlock,
  type AddableBlockType,
  type BlockStyle,
  type BlockType,
  type TemplateBlock,
} from "@/features/templates/types";
import { uploadBlockImage } from "@/features/templates/queries";
import { FONT_OPTIONS } from "@/features/templates/fonts";
import Disclosure from "@/components/ui/disclosure";
import { DraftNumberInput } from "./draft-inputs";
import { ColorInput, Field } from "./inspector-controls";
import LazyIconPicker from "./lazy-icon-picker";
import ImageSourceNotice from "./image-source-notice";

const VARIANTS: { type: AddableBlockType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "heading", label: "Heading" },
  { type: "button", label: "Button" },
  { type: "image", label: "Image" },
  { type: "icon", label: "Icon" },
  { type: "qr", label: "QR Code" },
  { type: "barcode", label: "Barcode" },
];

const FONT_WEIGHTS = [300, 400, 500, 600, 700];

interface BlockInspectorProps {
  block: TemplateBlock | null;
  selectedCount: number;
  onChange: (patch: Partial<TemplateBlock>) => void;
  onStyleChange: (patch: Partial<BlockStyle>) => void;
  onStack: (dir: "front" | "back") => void;
  onGenerateAiImage?: () => void;
  aiImageStatus?: "pending" | "generating" | "uploading" | "completed" | "failed";
  aiImageError?: string | null;
  canUseGenerateAI?: boolean;
}

export default function BlockInspector({
  block,
  selectedCount,
  onChange,
  onStyleChange,
  onStack,
  onGenerateAiImage,
  aiImageStatus,
  aiImageError,
  canUseGenerateAI = true,
}: BlockInspectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadBlockImage(file);
      onChange({ src: url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!block) {
    return (
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {selectedCount > 1
          ? `${selectedCount} blocks selected. Select one block to edit its content and style.`
          : "Select a block to edit its content and style."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Field label="Variant">
        <select
          value={block.type}
          onChange={(e) => {
            const type = e.target.value as BlockType;
            // Square block types adopt the current width as their size.
            if (isSquareBlock(type) && block.width !== block.height) {
              onChange({ type, height: block.width });
            } else {
              onChange({ type });
            }
          }}
          className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
        >
          {isLegacyBlockType(block.type) ? (
            <option value={block.type}>
              {block.type === "divider" ? "Divider" : "Spacer"} (legacy)
            </option>
          ) : null}
          {VARIANTS.map((variant) => (
            <option key={variant.type} value={variant.type}>
              {variant.label}
            </option>
          ))}
        </select>
      </Field>

      {block.type === "icon" && (
        <LazyIconPicker value={block.icon} onChange={(icon) => onChange({ icon })} />
      )}

      <Disclosure title="Geometry" defaultOpen>
        <Field label="Position & size">
          <div className={isSquareBlock(block.type) ? "grid grid-cols-3 gap-1" : "grid grid-cols-4 gap-1"}>
            <GeometryInput label="X" value={block.x} onChange={(x) => onChange({ x })} />
            <GeometryInput label="Y" value={block.y} onChange={(y) => onChange({ y })} />
            {isSquareBlock(block.type) ? (
              <GeometryInput
                label="Size"
                value={block.width}
                min={16}
                onChange={(size) => onChange({ width: size, height: size })}
              />
            ) : (
              <>
                <GeometryInput
                  label="W"
                  value={block.width}
                  min={16}
                  onChange={(width) => onChange({ width })}
                />
                <GeometryInput
                  label="H"
                  value={block.height}
                  min={16}
                  onChange={(height) => onChange({ height })}
                />
              </>
            )}
          </div>
        </Field>
      </Disclosure>

      {(block.type === "heading" || block.type === "text" || block.type === "button") && (
        <Field label={block.type === "heading" ? "Heading text" : block.type === "button" ? "Button label" : "Text"}>
          {block.type === "text" ? (
            <textarea
              value={block.text ?? ""}
              onChange={(e) => onChange({ text: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
            />
          ) : (
            <input
              value={block.text ?? ""}
              onChange={(e) => onChange({ text: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
            />
          )}
        </Field>
      )}

      {block.type === "heading" && (
        <Field label="Level">
          <select
            value={block.level ?? 2}
            onChange={(e) => onChange({ level: Number(e.target.value) as 1 | 2 | 3 })}
            className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
        </Field>
      )}

      {block.type === "button" && (
        <Field label="Link (href)">
          <input
            value={block.href ?? ""}
            onChange={(e) => onChange({ href: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
          />
        </Field>
      )}

      {block.type === "image" && (
        <>
          <Field label="Image URL">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <input
                  value={block.src ?? ""}
                  onChange={(e) => onChange({ src: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
                />
                <button
                  type="button"
                  disabled={uploading}
                  aria-busy={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-11 shrink-0 rounded-md border border-zinc-300 px-3 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {uploading ? "Uploading…" : "Upload"}
                </button>
                {!block.src && onGenerateAiImage ? <button
                  type="button"
                  data-template-selection-preserving
                  disabled={!canUseGenerateAI || uploading || aiImageStatus === "generating" || aiImageStatus === "uploading"}
                  onClick={onGenerateAiImage}
                  className="min-h-11 shrink-0 rounded-md border border-zinc-300 px-3 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >{aiImageStatus === "generating" ? "Generating…" : aiImageStatus === "uploading" ? "Uploading…" : "Generate AI"}</button> : null}
              {!canUseGenerateAI ? <p className="text-xs text-zinc-500">AI generation is disabled by your account administrator.</p> : null}
              </div>
              {uploadError && (
                <p role="alert" className="text-xs text-red-500 dark:text-red-400">{uploadError}</p>
              )}
              {aiImageError ? <p role="alert" className="text-xs text-red-500 dark:text-red-400">{aiImageError}</p> : null}
              <span className="sr-only" aria-live="polite">
                {uploading ? "Uploading image" : block.src ? "Image source ready" : ""}
              </span>
              <ImageSourceNotice source={block.src ?? ""} />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleUploadFile}
              />
            </div>
          </Field>
          <Field label="Alt text">
            <input
              value={block.alt ?? ""}
              onChange={(e) => onChange({ alt: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
            />
          </Field>
        </>
      )}

      {(block.type === "qr" || block.type === "barcode") && (
        <Field label={block.type === "qr" ? "QR data" : "Barcode data"}>
          <input
            value={block.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder={block.type === "qr" ? "https://example.com" : "123456789"}
            className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
          />
        </Field>
      )}

      <Disclosure title="Appearance" defaultOpen>
        {block.type !== "spacer" ? (
          <Field label="Text color">
            <ColorInput
              value={block.style.color}
              allowInherit
              onChange={(color) => onStyleChange({ color })}
            />
          </Field>
        ) : null}
        {(block.type === "heading" || block.type === "text" || block.type === "button") && (
          <>
              <Field label="Font size">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={64}
                    value={block.style.fontSize}
                    onChange={(e) => onStyleChange({ fontSize: Number(e.target.value) })}
                    className="flex-1 accent-zinc-900 dark:accent-zinc-100"
                  />
                  {block.type === "text" ? (
                    <DraftNumberInput
                      min={10}
                      max={64}
                      integer
                      value={block.style.fontSize}
                      onCommit={(fontSize) => onStyleChange({ fontSize })}
                      aria-label="Font size in pixels"
                      className="w-16 rounded-lg border border-zinc-300 bg-transparent px-2 py-1 text-right text-xs text-zinc-700 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:text-zinc-300"
                    />
                  ) : (
                    <span className="w-12 text-right text-xs text-zinc-500 dark:text-zinc-400">
                      {block.style.fontSize}px
                    </span>
                  )}
                </div>
              </Field>
              <Field label="Font">
                <select
                  value={block.style.fontFamily ?? ""}
                  onChange={(e) =>
                    onStyleChange({ fontFamily: e.target.value || undefined })
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
                >
                  <option value="">Default</option>
                  {(["Web-safe", "Google"] as const).map((group) => (
                    <optgroup key={group} label={group}>
                      {FONT_OPTIONS.filter((f) => f.group === group).map((f) => (
                        <option key={f.stack} value={f.stack}>
                          {f.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  aria-label="Italic"
                  title="Italic"
                  aria-pressed={!!block.style.italic}
                  onClick={() => onStyleChange({ italic: !block.style.italic })}
                  className={
                    "h-7 w-7 rounded-lg border text-sm italic transition-colors " +
                    (block.style.italic
                      ? "border-zinc-900 bg-zinc-100 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-50"
                      : "border-transparent text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800")
                  }
                >
                  I
                </button>
                <button
                  type="button"
                  aria-label="Underline"
                  title="Underline"
                  aria-pressed={!!block.style.underline}
                  onClick={() => onStyleChange({ underline: !block.style.underline })}
                  className={
                    "h-7 w-7 rounded-lg border text-sm underline transition-colors " +
                    (block.style.underline
                      ? "border-zinc-900 bg-zinc-100 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-50"
                      : "border-transparent text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800")
                  }
                >
                  U
                </button>
              </div>
              <Field label="Font weight">
                <div className="flex items-center gap-2">
                  <select
                    value={block.style.fontWeight}
                    onChange={(e) => onStyleChange({ fontWeight: Number(e.target.value) })}
                    className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
                  >
                    {!FONT_WEIGHTS.includes(block.style.fontWeight) && (
                      <option value={block.style.fontWeight}>
                        {block.style.fontWeight} (custom)
                      </option>
                    )}
                    {FONT_WEIGHTS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                  <DraftNumberInput
                    min={100}
                    max={900}
                    integer
                    value={block.style.fontWeight}
                    onCommit={(fontWeight) => onStyleChange({ fontWeight })}
                    aria-label="Font weight"
                    className="w-16 rounded-lg border border-zinc-300 bg-transparent px-1 py-1.5 text-center text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
                  />
                </div>
              </Field>
          </>
        )}
        <Field label="Background">
          <ColorInput
            value={block.style.backgroundColor}
            allowTransparent
            onChange={(backgroundColor) => onStyleChange({ backgroundColor })}
          />
        </Field>
        {block.type !== "image" && (
          <Field label="Padding">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={48}
                value={block.style.padding}
                onChange={(e) => onStyleChange({ padding: Number(e.target.value) })}
                className="flex-1 accent-zinc-900 dark:accent-zinc-100"
              />
              <span className="w-12 text-right text-xs text-zinc-500 dark:text-zinc-400">
                {block.style.padding}px
              </span>
            </div>
          </Field>
        )}
        {block.type !== "spacer" ? (
          <Field label="Align">
            <div className="grid grid-cols-3 gap-1">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => onStyleChange({ textAlign: align })}
                  className={
                    "rounded-lg border px-2 py-1.5 text-xs capitalize transition-colors " +
                    (block.style.textAlign === align
                      ? "border-zinc-900 font-medium text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                      : "border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800")
                  }
                >
                  {align}
                </button>
              ))}
            </div>
          </Field>
        ) : null}
      </Disclosure>

      <Disclosure title="Advanced">
        <Field label="Stacking">
          <div className="flex items-end gap-1">
            <div className="w-16">
              <GeometryInput
                label="Z-index"
                value={block.z}
                min={0}
                onChange={(z) => onChange({ z: Math.max(0, Math.round(z)) })}
              />
            </div>
            <button
              type="button"
              onClick={() => onStack("front")}
              className="min-h-11 flex-1 rounded-lg border border-border-subtle px-2 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-2"
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => onStack("back")}
              className="min-h-11 flex-1 rounded-lg border border-border-subtle px-2 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-2"
            >
              Back
            </button>
          </div>
        </Field>
        <Field label="Border width">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={16}
              value={block.style.borderWidth}
              onChange={(e) => onStyleChange({ borderWidth: Number(e.target.value) })}
              className="flex-1 accent-accent"
            />
            <span className="w-12 text-right text-xs text-text-muted">
              {block.style.borderWidth}px
            </span>
          </div>
        </Field>
        {block.style.borderWidth > 0 ? (
          <Field label="Border color">
            <ColorInput
              value={block.style.borderColor}
              onChange={(borderColor) => onStyleChange({ borderColor })}
            />
          </Field>
        ) : null}
        <Field label="Corner radius">
          <div className="flex items-center gap-2">
            <DraftNumberInput
              min={0}
              max={48}
              integer
              value={block.style.borderRadius}
              onCommit={(borderRadius) => onStyleChange({ borderRadius })}
              aria-label="Corner radius in pixels"
              className="w-full rounded-md border border-border-subtle bg-transparent px-1 py-1 text-center text-xs focus:border-border-strong focus:outline-none"
            />
            <span className="w-12 text-right text-xs text-text-muted">
              {block.style.borderRadius}px
            </span>
          </div>
        </Field>
      </Disclosure>
    </div>
  );
}

function GeometryInput({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-0.5">
      <span className="block text-center text-[10px] uppercase text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <DraftNumberInput
        aria-label={label}
        min={min}
        integer
        value={value}
        onCommit={onChange}
        className="w-full rounded-md border border-zinc-300 bg-transparent px-1 py-1 text-center text-xs focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
      />
    </label>
  );
}
