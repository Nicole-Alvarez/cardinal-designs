export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
export const ZOOM_STEPS = [
  0.25,
  0.33,
  0.5,
  0.67,
  0.75,
  1,
  1.25,
  1.5,
  2,
  3,
  4,
] as const;

export function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function stepZoom(value: number, direction: -1 | 1): number {
  const candidates =
    direction > 0
      ? ZOOM_STEPS.filter((step) => step > value + 0.001)
      : [...ZOOM_STEPS].reverse().filter((step) => step < value - 0.001);
  return candidates[0] ?? (direction > 0 ? MAX_ZOOM : MIN_ZOOM);
}

export function fitCanvasZoom(
  viewport: { width: number; height: number },
  canvas: { width: number; height: number },
  padding: number
): number {
  const width = Math.max(1, viewport.width - padding * 2);
  const height = Math.max(1, viewport.height - padding * 2);
  return clampZoom(Math.min(width / canvas.width, height / canvas.height, 1));
}

export function zoomScrollOffset(input: {
  previousScale: number;
  nextScale: number;
  scrollLeft: number;
  scrollTop: number;
  anchorX: number;
  anchorY: number;
}) {
  const ratio = input.nextScale / input.previousScale;
  return {
    left: (input.scrollLeft + input.anchorX) * ratio - input.anchorX,
    top: (input.scrollTop + input.anchorY) * ratio - input.anchorY,
  };
}

export function zoomPanOffset(input: {
  previousScale: number;
  nextScale: number;
  pan: { x: number; y: number };
  anchor: { x: number; y: number };
  previousOrigin: { x: number; y: number };
  nextOrigin: { x: number; y: number };
}) {
  const canvasPoint = {
    x:
      (input.anchor.x - input.previousOrigin.x - input.pan.x) /
      input.previousScale,
    y:
      (input.anchor.y - input.previousOrigin.y - input.pan.y) /
      input.previousScale,
  };
  return {
    x: input.anchor.x - input.nextOrigin.x - canvasPoint.x * input.nextScale,
    y: input.anchor.y - input.nextOrigin.y - canvasPoint.y * input.nextScale,
  };
}

export function clampCanvasPan(input: {
  offset: { x: number; y: number };
  viewport: { width: number; height: number };
  canvas: { width: number; height: number };
  origin: { x: number; y: number };
  minimumVisible: number;
}) {
  function clampAxis(
    offset: number,
    viewportSize: number,
    canvasSize: number,
    origin: number
  ) {
    const visible = Math.min(input.minimumVisible, canvasSize, viewportSize / 2);
    const minimum = visible - canvasSize - origin;
    const maximum = viewportSize - visible - origin;
    if (minimum > maximum) return (minimum + maximum) / 2;
    return Math.min(maximum, Math.max(minimum, offset));
  }

  return {
    x: clampAxis(input.offset.x, input.viewport.width, input.canvas.width, input.origin.x),
    y: clampAxis(input.offset.y, input.viewport.height, input.canvas.height, input.origin.y),
  };
}
