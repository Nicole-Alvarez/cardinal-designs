"use client";

import type { BlockStyle, BlockType, TemplateBlock } from "@/features/templates/types";
import { ColorInput, Field } from "./inspector-controls";

const VARIANTS: { type: BlockType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "heading", label: "Heading" },
  { type: "button", label: "Button" },
  { type: "image", label: "Image" },
  { type: "divider", label: "Divider" },
  { type: "spacer", label: "Spacer" },
];

interface BlockInspectorProps {
  block: TemplateBlock | null;
  onChange: (patch: Partial<TemplateBlock>) => void;
  onStyleChange: (patch: Partial<BlockStyle>) => void;
}

export default function BlockInspector({
  block,
  onChange,
  onStyleChange,
}: BlockInspectorProps) {
  if (!block) {
    return (
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Select a block to edit its content and style.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Block
      </p>

      <Field label="Variant">
        <div className="grid grid-cols-3 gap-1">
          {VARIANTS.map((variant) => (
            <button
              key={variant.type}
              type="button"
              onClick={() => onChange({ type: variant.type })}
              className={
                "rounded-lg border px-1 py-1.5 text-xs transition-colors " +
                (block.type === variant.type
                  ? "border-zinc-900 font-medium text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                  : "border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800")
              }
            >
              {variant.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Position & size">
        <div className="grid grid-cols-4 gap-1">
          <GeometryInput label="X" value={block.x} onChange={(x) => onChange({ x })} />
          <GeometryInput label="Y" value={block.y} onChange={(y) => onChange({ y })} />
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
        </div>
      </Field>

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
            <input
              value={block.src ?? ""}
              onChange={(e) => onChange({ src: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
            />
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

      {block.type !== "spacer" && (
        <>
          <Field label="Text color">
            <ColorInput
              value={block.style.color}
              allowInherit
              onChange={(color) => onStyleChange({ color })}
            />
          </Field>
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
                  <span className="w-12 text-right text-xs text-zinc-500 dark:text-zinc-400">
                    {block.style.fontSize}px
                  </span>
                </div>
              </Field>
              <Field label="Font weight">
                <select
                  value={block.style.fontWeight}
                  onChange={(e) => onStyleChange({ fontWeight: Number(e.target.value) })}
                  className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
                >
                  {[300, 400, 500, 600, 700].map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
          <Field label="Background">
            <ColorInput
              value={block.style.backgroundColor}
              onChange={(backgroundColor) => onStyleChange({ backgroundColor })}
            />
          </Field>
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
          <Field label="Border width">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={16}
                value={block.style.borderWidth}
                onChange={(e) => onStyleChange({ borderWidth: Number(e.target.value) })}
                className="flex-1 accent-zinc-900 dark:accent-zinc-100"
              />
              <span className="w-12 text-right text-xs text-zinc-500 dark:text-zinc-400">
                {block.style.borderWidth}px
              </span>
            </div>
          </Field>
          {block.style.borderWidth > 0 && (
            <Field label="Border color">
              <ColorInput
                value={block.style.borderColor}
                onChange={(borderColor) => onStyleChange({ borderColor })}
              />
            </Field>
          )}
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
        </>
      )}
    </div>
  );
}

function GeometryInput({
  label,
  value,
  min = 0,
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
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-zinc-300 bg-transparent px-1 py-1 text-center text-xs focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
      />
    </label>
  );
}
