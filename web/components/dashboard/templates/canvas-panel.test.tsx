import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_CANVAS } from "@/features/templates/types";
import CanvasPanel from "./canvas-panel";

vi.mock("@/features/templates/queries", () => ({
  uploadBlockImage: vi.fn(),
}));

import { uploadBlockImage } from "@/features/templates/queries";

const mockedUpload = vi.mocked(uploadBlockImage);

describe("CanvasPanel overlay image upload", () => {
  beforeEach(() => {
    mockedUpload.mockReset();
  });

  it("uploads a file and applies the returned URL to overlayImage", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    mockedUpload.mockResolvedValue("https://cdn.example.com/canvas.png");
    render(<CanvasPanel canvas={DEFAULT_CANVAS} onChange={onChange} />);

    const file = new File(["image"], "canvas.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Overlay image URL upload"), file);

    expect(mockedUpload).toHaveBeenCalledWith(file);
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({ overlayImage: "https://cdn.example.com/canvas.png" })
    );
  });

  it("surfaces an upload error", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    mockedUpload.mockRejectedValue(new Error("Upload failed"));
    render(<CanvasPanel canvas={DEFAULT_CANVAS} onChange={onChange} />);

    const file = new File(["image"], "canvas.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Overlay image URL upload"), file);

    expect(await screen.findByRole("alert")).toHaveTextContent("Upload failed");
    expect(onChange).not.toHaveBeenCalled();
  });
});
