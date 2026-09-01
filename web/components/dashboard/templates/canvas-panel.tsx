"use client";

import { useRef, useState } from "react";
import type { TemplateCanvas } from "@/features/templates/types";
import { uploadBlockImage } from "@/features/templates/queries";
import ImageSourceNotice from "./image-source-notice";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const allPresets = CANVAS_PRESETS.flatMap((group) => group.items);
  const matchedPreset = allPresets.find(
    (p) => p.width === canvas.width && p.height === canvas.height
  );

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadBlockImage(file);
      onChange({ overlayImage: url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Size presets">
        <select
          value={matchedPreset ? `${matchedPreset.width}x${matchedPreset.height}` : "custom"}
          onChange={(e) => {
            const preset = allPresets.find(
              (p) => `${p.width}x${p.height}` === e.target.value
            );
            if (preset) onChange({ width: preset.width, height: preset.height });
          }}
          className="min-h-11 w-full rounded-lg border border-border-subtle bg-surface-2 px-2 text-sm text-text-primary outline-none focus:border-border-strong focus:ring-2 focus:ring-focus"
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
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <input
              value={canvas.overlayImage}
              onChange={(e) => onChange({ overlayImage: e.target.value })}
              placeholder="https://... (transparent PNG works best)"
              className="min-h-11 w-full rounded-lg border border-border-subtle bg-surface-2 px-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-border-strong focus:ring-2 focus:ring-focus"
            />
            <button
              type="button"
              disabled={uploading}
              aria-busy={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="min-h-11 shrink-0 rounded-lg border border-border-subtle bg-surface-2 px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
          {uploadError && (
            <p role="alert" className="text-xs text-red-500 dark:text-red-400">{uploadError}</p>
          )}
          <span className="sr-only" aria-live="polite">
            {uploading ? "Uploading image" : canvas.overlayImage ? "Image source ready" : ""}
          </span>
          <ImageSourceNotice source={canvas.overlayImage} />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            aria-label="Overlay image URL upload"
            className="hidden"
            onChange={handleUploadFile}
          />
        </div>
      </Field>

      {canvas.overlayImage && (
        <>
          <Field label="Overlay fit">
            <select
              value={canvas.overlayFit}
              onChange={(e) => onChange({ overlayFit: e.target.value as "cover" | "contain" })}
              className="min-h-11 w-full rounded-lg border border-border-subtle bg-surface-2 px-2 text-sm text-text-primary outline-none focus:border-border-strong focus:ring-2 focus:ring-focus"
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
                className="flex-1 accent-accent"
              />
              <span className="w-10 text-right text-xs text-text-muted">
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
            className="flex-1 accent-accent"
          />
          <span className="w-10 text-right text-xs text-text-muted">
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

      <Field label="Corner radius">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={48}
            value={canvas.borderRadius}
            onChange={(e) => onChange({ borderRadius: Number(e.target.value) })}
            className="flex-1 accent-accent"
          />
          <span className="w-10 text-right text-xs text-text-muted">
            {canvas.borderRadius}px
          </span>
        </div>
      </Field>
    </div>
  );
}
