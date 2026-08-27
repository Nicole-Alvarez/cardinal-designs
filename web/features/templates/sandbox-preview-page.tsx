"use client";

import React, { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  extractReactPropPaths,
  resolveTemplateString,
  withReactPlaceholderFallbacks,
} from "./metadata";
import {
  isSandboxParentMessage,
  type SandboxRenderMessage,
} from "./sandbox-preview-messages";
import { renderPreviewImage } from "./image-export";

function previewChannel(): string {
  return decodeURIComponent(window.location.hash.slice(1));
}

export default function SandboxPreviewPage() {
  const channel = typeof window === "undefined" ? "" : previewChannel();
  const [request, setRequest] = useState<SandboxRenderMessage | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function post(type: "ready") {
      window.parent.postMessage(
        { source: "cardinal-preview-frame", type, channel },
        "*"
      );
    }
    async function handleMessage(event: MessageEvent) {
      if (event.source !== window.parent) return;
      if (!isSandboxParentMessage(event.data, channel)) return;
      if (event.data.type === "render") {
        setRequest(event.data);
        return;
      }
      try {
        const root = rootRef.current;
        if (!root) throw new Error("Preview is not ready yet.");
        const elements = event.data.target === "batch"
          ? [root.querySelector<HTMLElement>("[data-template-preview-batch]")]
          : [...root.querySelectorAll<HTMLElement>("[data-template-preview-card]")];
        if (elements.length === 0 || elements.some((element) => !element)) {
          throw new Error("Preview is not ready yet.");
        }
        const images = [];
        for (const element of elements) {
          images.push(
            await renderPreviewImage(element as HTMLElement, root, {
              pixelRatio: event.data.pixelRatio,
              allowFontFallback: event.data.allowFontFallback,
            })
          );
        }
        window.parent.postMessage(
          {
            source: "cardinal-preview-frame",
            type: "exported",
            channel,
            requestId: event.data.requestId,
            images,
          },
          "*"
        );
      } catch (error) {
        window.parent.postMessage(
          {
            source: "cardinal-preview-frame",
            type: "export-error",
            channel,
            requestId: event.data.requestId,
            message: error instanceof Error ? error.message : "Could not export preview.",
          },
          "*"
        );
      }
    }
    window.addEventListener("message", handleMessage);
    post("ready");
    return () => window.removeEventListener("message", handleMessage);
  }, [channel]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reportHeight = () => {
      const height = Math.ceil(root.getBoundingClientRect().height);
      if (height <= 0) return;
      window.parent.postMessage(
        { source: "cardinal-preview-frame", type: "height", channel, height },
        "*"
      );
    };
    reportHeight();
    const observer = new ResizeObserver(reportHeight);
    observer.observe(root);
    return () => observer.disconnect();
  }, [channel, request]);

  return (
    <main ref={rootRef} className="min-h-screen bg-white p-3 text-zinc-950">
      {!request ? (
        <p className="text-xs text-zinc-500">Waiting for preview…</p>
      ) : request.mode === "html" ? (
        <HtmlSandboxPreview request={request} channel={channel} />
      ) : (
        <ReactSandboxPreview request={request} channel={channel} />
      )}
    </main>
  );
}

function HtmlSandboxPreview({
  request,
  channel,
}: {
  request: SandboxRenderMessage;
  channel: string;
}) {
  const records = request.metadata.length > 0 ? request.metadata : [{}];
  useEffect(() => {
    window.parent.postMessage(
      { source: "cardinal-preview-frame", type: "rendered", channel },
      "*"
    );
  }, [channel, request]);

  return (
    <div data-template-preview-batch className="inline-flex flex-col gap-4 bg-white">
      {records.map((record, index) => (
        <div
          key={index}
          data-template-preview-card
          dangerouslySetInnerHTML={{ __html: resolveTemplateString(request.code, record) }}
        />
      ))}
    </div>
  );
}

function ReactSandboxPreview({
  request,
  channel,
}: {
  request: SandboxRenderMessage;
  channel: string;
}) {
  const [state, setState] = useState<{
    Component?: ComponentType<Record<string, unknown>>;
    error?: string;
  }>({});
  const fields = useMemo(() => extractReactPropPaths(request.code), [request.code]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setState({});
      try {
        const Component = await compileReactComponent(request.code);
        if (!cancelled) {
          setState({ Component });
          window.parent.postMessage(
            { source: "cardinal-preview-frame", type: "rendered", channel },
            "*"
          );
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Could not compile preview.";
        setState({ error: message });
        window.parent.postMessage(
          { source: "cardinal-preview-frame", type: "error", channel, message },
          "*"
        );
      }
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [channel, request.code]);

  const PreviewComponent = state.Component;
  if (state.error) return null;
  if (!PreviewComponent) {
    return <p className="text-xs text-zinc-500">Compiling React preview…</p>;
  }

  return (
    <div data-template-preview-batch className="inline-flex flex-col gap-4 bg-white">
      {(request.metadata.length > 0 ? request.metadata : [{}]).map((record, index) => (
        <div key={index} data-template-preview-card>
          <ErrorBoundary
            onError={(message) => {
              setState({ error: message });
              window.parent.postMessage(
                { source: "cardinal-preview-frame", type: "error", channel, message },
                "*"
              );
            }}
          >
            <PreviewComponent {...withReactPlaceholderFallbacks(record, fields)} />
          </ErrorBoundary>
        </div>
      ))}
    </div>
  );
}

async function compileReactComponent(
  source: string
): Promise<ComponentType<Record<string, unknown>>> {
  const Babel = await import("@babel/standalone");
  const transformed = Babel.transform(source, {
    filename: "template.tsx",
    presets: [
      ["react", { runtime: "classic" }],
      ["typescript", { ignoreExtensions: true }],
    ],
    plugins: ["transform-modules-commonjs"],
  }).code;
  if (!transformed) throw new Error("Compilation produced no output");

  const module_ = {
    exports: {} as { default?: ComponentType<Record<string, unknown>> },
  };
  new Function("module", "exports", "React", transformed)(
    module_,
    module_.exports,
    React
  );
  const Component = module_.exports.default;
  if (typeof Component !== "function") {
    throw new Error("Pasted code must `export default` a function component");
  }
  return Component;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (message: string) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message);
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
