import { config } from "../config";
import { putImage, UploadsError } from "./uploads.service";
import { buildAiImageBlockPrompt } from "./ai-prompt-builder";
import { AiTemplateError, type AiTemplateBlock } from "./ai-template.service";

const MAX_GENERATED_IMAGE_BYTES = 4 * 1024 * 1024;

function imageSizeFor(block: AiTemplateBlock): "1024x1024" | "1024x1536" | "1536x1024" {
  const ratio = block.width / block.height;
  if (ratio > 1.25) return "1536x1024";
  if (ratio < 0.8) return "1024x1536";
  return "1024x1024";
}

function imageResult(response: unknown): string {
  const payload = response && typeof response === "object" ? response as { output?: Array<{ type?: unknown; status?: unknown; result?: unknown }> } : {};
  const call = payload.output?.find((item) => item.type === "image_generation_call" && item.status === "completed");
  if (!call || typeof call.result !== "string") throw new AiTemplateError("AI image generation returned no image", 502);
  return call.result;
}

function pngBuffer(base64: string): Buffer {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) throw new AiTemplateError("AI image generation returned invalid image data", 502);
  const buffer = Buffer.from(base64, "base64");
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_GENERATED_IMAGE_BYTES || !buffer.subarray(0, 8).equals(png)) {
    throw new AiTemplateError("AI image generation returned an invalid PNG", 502);
  }
  return buffer;
}

export async function generateImageBlockAsset(block: AiTemplateBlock, prompt: unknown) {
  if (block.type !== "image") throw new AiTemplateError("Only image blocks can generate assets");
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 500) throw new AiTemplateError("Describe the image in 500 characters or fewer", 400);
  const description = prompt.trim();
  if (!config.openAiApiKey) throw new AiTemplateError("AI Create is not configured", 503);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.openAiApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      store: false,
      input: buildAiImageBlockPrompt({ description, width: block.width, height: block.height, color: block.style.color, transparent: true }),
      tools: [{ type: "image_generation", model: "gpt-image-1.5", background: "transparent", output_format: "png", quality: "low", size: imageSizeFor(block) }],
      tool_choice: { type: "image_generation" },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("OpenAI image generation failed", { status: response.status, requestId: response.headers.get("x-request-id") ?? undefined });
    throw new AiTemplateError(response.status === 429 ? "OpenAI image generation is rate limited. Try again shortly." : "AI image generation is temporarily unavailable", response.status === 429 ? 429 : 502);
  }
  try {
    return await putImage(pngBuffer(imageResult(data)), "image/png");
  } catch (error) {
    if (error instanceof AiTemplateError || error instanceof UploadsError) throw error;
    throw new AiTemplateError("AI image generation could not save the image", 502);
  }
}
