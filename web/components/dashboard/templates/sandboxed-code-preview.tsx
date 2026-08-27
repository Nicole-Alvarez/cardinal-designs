"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RenderedPreviewImage } from "@/features/templates/image-export";
import { buildHtmlSandboxDocument } from "@/features/templates/html-sandbox-document";
import { buildReactSandboxDocument } from "@/features/templates/react-sandbox-document";
import type { TemplateMetadata } from "@/features/templates/types";
import {
  isSandboxChildMessage,
  type SandboxPreviewMode,
} from "@/features/templates/sandbox-preview-messages";
import { EditorIcon } from "./editor-controls";

const PREVIEW_STARTUP_TIMEOUT_MS = 8_000;

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
  const [reloadKey, setReloadKey] = useState(0);
  const [reactDocument, setReactDocument] = useState<string>();
  const htmlDocument = useMemo(
    () => mode === "html" ? buildHtmlSandboxDocument(code, metadata, channel) : undefined,
    [channel, code, metadata, mode]
  );

  const documentSource = mode === "html" ? htmlDocument : reactDocument;

  useEffect(() => {
    if (mode !== "react") {
      setReactDocument(undefined);
      return;
    }
    let cancelled = false;
    setReactDocument(undefined);
    const timer = window.setTimeout(() => {
      void buildReactSandboxDocument(code, metadata, channel)
        .then((document) => {
          if (!cancelled) setReactDocument(document);
        })
        .catch((reason: unknown) => {
          if (cancelled) return;
          setError(reason instanceof Error ? reason.message : "Could not compile preview.");
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [channel, code, metadata, mode, reloadKey]);

  useEffect(() => {
    setReady(false);
    setError(null);
  }, [code, metadata, mode]);

  useEffect(() => {
    if (ready || error) return;
    const timeout = window.setTimeout(() => {
      setError("The isolated preview did not start. Try reloading it.");
    }, PREVIEW_STARTUP_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [error, ready, reloadKey]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isSandboxChildMessage(event.data, channel)) return;
      if (event.data.type === "ready") {
        setReady(true);
        setError(null);
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
  }, [channel]);

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

  const label = mode === "react" ? "React" : "HTML";

  return (
    <div className="relative min-h-40 overflow-hidden bg-white">
      <iframe
        key={`${mode}-${reloadKey}`}
        ref={frameRef}
        title={`${label} template preview`}
        srcDoc={documentSource}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        onLoad={() => {
          if (documentSource) {
            setReady(true);
          }
        }}
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
          className="absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 bg-red-50 p-4 text-xs leading-5 text-red-700"
        >
          <EditorIcon name="circle-alert" className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 break-words">{error}</span>
          <button
            type="button"
            onClick={() => {
              setReady(false);
              setError(null);
              setReloadKey((value) => value + 1);
            }}
            className="min-h-9 rounded-lg border border-red-200 bg-white px-3 font-medium text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Retry preview
          </button>
        </div>
      )}
    </div>
  );
});

export default SandboxedCodePreview;
