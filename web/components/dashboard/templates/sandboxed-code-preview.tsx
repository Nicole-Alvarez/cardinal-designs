"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { RenderedPreviewImage } from "@/features/templates/image-export";
import type { TemplateMetadata } from "@/features/templates/types";
import {
  isSandboxChildMessage,
  type SandboxPreviewMode,
  type SandboxRenderMessage,
} from "@/features/templates/sandbox-preview-messages";
import { EditorIcon } from "./editor-controls";

export interface SandboxedCodePreviewHandle {
  renderImages: (
    target: "batch" | "cards",
    options: { pixelRatio: number; allowFontFallback: boolean }
  ) => Promise<RenderedPreviewImage[]>;
}

const SandboxedCodePreview = forwardRef<SandboxedCodePreviewHandle, {
  mode: SandboxPreviewMode;
  code: string;
  metadata: TemplateMetadata;
}>(function SandboxedCodePreview({
  mode,
  code,
  metadata,
}, ref) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const pendingExports = useRef(
    new Map<
      string,
      {
        resolve: (images: RenderedPreviewImage[]) => void;
        reject: (error: Error) => void;
        timeout: number;
      }
    >()
  );
  const channel = useId();
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState(240);
  const [error, setError] = useState<string | null>(null);

  const sendRender = useCallback(() => {
    const target = frameRef.current?.contentWindow;
    if (!target) return;
    const message: SandboxRenderMessage = {
      source: "cardinal-preview-parent",
      type: "render",
      channel,
      mode,
      code,
      metadata,
    };
    target.postMessage(message, "*");
  }, [channel, code, metadata, mode]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isSandboxChildMessage(event.data, channel)) return;
      if (event.data.type === "ready") {
        setReady(true);
        setError(null);
        sendRender();
      } else if (event.data.type === "height") {
        setHeight(Math.min(Math.max(event.data.height, 160), 512));
      } else if (event.data.type === "rendered") {
        setError(null);
      } else if (event.data.type === "error") {
        setError(event.data.message);
      } else if (event.data.type === "exported" || event.data.type === "export-error") {
        const pending = pendingExports.current.get(event.data.requestId);
        if (!pending) return;
        window.clearTimeout(pending.timeout);
        pendingExports.current.delete(event.data.requestId);
        if (event.data.type === "exported") pending.resolve(event.data.images);
        else pending.reject(new Error(event.data.message));
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [channel, sendRender]);

  useEffect(() => {
    const pending = pendingExports.current;
    return () => {
      for (const request of pending.values()) {
        window.clearTimeout(request.timeout);
        request.reject(new Error("Preview closed before export completed."));
      }
      pending.clear();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    renderImages(target, options) {
      const frame = frameRef.current?.contentWindow;
      if (!frame || !ready) return Promise.reject(new Error("Preview is not ready yet."));
      const requestId = crypto.randomUUID();
      return new Promise<RenderedPreviewImage[]>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          pendingExports.current.delete(requestId);
          reject(new Error("Preview export timed out."));
        }, 60_000);
        pendingExports.current.set(requestId, { resolve, reject, timeout });
        frame.postMessage(
          {
            source: "cardinal-preview-parent",
            type: "export",
            channel,
            requestId,
            target,
            ...options,
          },
          "*"
        );
      });
    },
  }), [channel, ready]);

  useEffect(() => {
    if (ready) sendRender();
  }, [ready, sendRender]);

  const label = mode === "react" ? "React" : "HTML";

  return (
    <div className="relative min-h-40 overflow-hidden bg-white">
      <iframe
        ref={frameRef}
        title={`${label} template preview`}
        src={`/preview-sandbox#${encodeURIComponent(channel)}`}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        onLoad={sendRender}
        style={{ height }}
        className="block w-full border-0 bg-white"
      />
      {!ready && !error && (
        <p
          role="status"
          className="absolute inset-0 flex items-center justify-center gap-2 bg-white text-xs text-zinc-500"
        >
          <EditorIcon name="loader-circle" className="size-4 animate-spin" />
          Preparing isolated preview…
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="absolute inset-x-0 top-0 flex items-start gap-2 bg-red-50 p-4 text-xs leading-5 text-red-700"
        >
          <EditorIcon name="circle-alert" className="mt-0.5 size-4 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}
    </div>
  );
});

export default SandboxedCodePreview;
