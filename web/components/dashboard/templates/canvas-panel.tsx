"use client";

import type { TemplateCanvas } from "@/features/templates/types";
import { ColorInput, Field, NumberInput, SizeSelect } from "./inspector-controls";

const WIDTH_PRESETS = ["1280px", "1024px", "800px", "400px"];
const HEIGHT_PRESETS = ["720px", "1080px", "1000px", "600px"];

const CANVAS_PRESETS: {
  group: string;
  items: { label: string; width: string; height: string }[];
}[] = [
  {
    group: "General",
    items: [
      { label: "1280 × 720", width: "1280px", height: "720px" },
      { label: "1080 × 1080", width: "1080px", height: "1080px" },
      { label: "800 × 1000", width: "800px", height: "1000px" },
      { label: "400 × 600", width: "400px", height: "600px" },
    ],
  },
  {
    group: "ID card (CR80)",
    items: [
      { label: "96 DPI · screen (324×204)", width: "324px", height: "204px" },
      { label: "150 DPI · print (505×319)", width: "505px", height: "319px" },
      { label: "300 DPI · high-quality print (1011×638)", width: "1011px", height: "638px" },
      { label: "600 DPI · very high print (2022×1275)", width: "2022px", height: "1275px" },
    ],
  },
];

export default function CanvasPanel({
  canvas,
  onChange,
}: {
  canvas: TemplateCanvas;
  onChange: (patch: Partial<TemplateCanvas>) => void;
}) {
  const allPresets = CANVAS_PRESETS.flatMap((group) => group.items);
  const matchedPreset = allPresets.find(
    (p) => p.width === canvas.width && p.height === canvas.height
  );

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Main block
      </p>

      <Field label="Size presets">
        <select
          value={matchedPreset ? `${matchedPreset.width}x${matchedPreset.height}` : "custom"}
          onChange={(e) => {
            const preset = allPresets.find(
              (p) => `${p.width}x${p.height}` === e.target.value
            );
            if (preset) onChange({ width: preset.width, height: preset.height });
          }}
          className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
        >
          <option value="custom">Custom</option>
          {CANVAS_PRESETS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.items.map((preset) => (
                <option key={preset.label} value={`${preset.width}x${preset.height}`}>
                  {preset.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      <Field label="Width">
        <SizeSelect
          value={canvas.width === "auto" ? null : canvas.width}
          presets={WIDTH_PRESETS}
          onChange={(width) => onChange({ width: width ?? "auto" })}
        />
      </Field>
      <Field label="Height">
        <SizeSelect
          value={canvas.height === "auto" ? null : canvas.height}
          presets={HEIGHT_PRESETS}
          onChange={(height) => onChange({ height: height ?? "auto" })}
        />
      </Field>

      <Field label="Background color">
        <ColorInput
          value={canvas.backgroundColor}
          onChange={(backgroundColor) => onChange({ backgroundColor })}
        />
      </Field>

      <Field label="Text color">
        <ColorInput value={canvas.textColor} onChange={(textColor) => onChange({ textColor })} />
      </Field>

      <Field label="Overlay image URL">
        <input
          value={canvas.overlayImage}
          onChange={(e) => onChange({ overlayImage: e.target.value })}
          placeholder="https://... (transparent PNG works best)"
          className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
        />
      </Field>

      {canvas.overlayImage && (
        <>
          <Field label="Overlay fit">
            <select
              value={canvas.overlayFit}
              onChange={(e) => onChange({ overlayFit: e.target.value as "cover" | "contain" })}
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </Field>
          <Field label="Overlay opacity">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={canvas.overlayOpacity}
                onChange={(e) => onChange({ overlayOpacity: Number(e.target.value) })}
                className="flex-1 accent-zinc-900 dark:accent-zinc-100"
              />
              <span className="w-10 text-right text-xs text-zinc-500 dark:text-zinc-400">
                {canvas.overlayOpacity}%
              </span>
            </div>
          </Field>
          <Field label="Overlay margin (gap from edges)">
            <NumberInput
              value={canvas.overlayMargin}
              onChange={(overlayMargin) => onChange({ overlayMargin })}
            />
          </Field>
          <Field label="Overlay padding">
            <NumberInput
              value={canvas.overlayPadding}
              onChange={(overlayPadding) => onChange({ overlayPadding })}
            />
          </Field>
        </>
      )}

      <Field label="Border width">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={16}
            value={canvas.borderWidth}
            onChange={(e) => onChange({ borderWidth: Number(e.target.value) })}
            className="flex-1 accent-zinc-900 dark:accent-zinc-100"
          />
          <span className="w-10 text-right text-xs text-zinc-500 dark:text-zinc-400">
            {canvas.borderWidth}px
          </span>
        </div>
      </Field>
      {canvas.borderWidth > 0 && (
        <Field label="Border color">
          <ColorInput
            value={canvas.borderColor}
            onChange={(borderColor) => onChange({ borderColor })}
          />
        </Field>
      )}
    </div>
  );
}
