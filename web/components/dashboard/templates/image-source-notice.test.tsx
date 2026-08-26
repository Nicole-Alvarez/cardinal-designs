import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ImageSourceNotice from "./image-source-notice";

describe("ImageSourceNotice", () => {
  it("warns when an image source only works inside Cardinal", () => {
    render(<ImageSourceNotice source="/api/uploads/blob?pathname=templates/legacy.png" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Project-only image. Re-upload it before copying this template."
    );
  });

  it("confirms that a public HTTPS source is portable", () => {
    render(
      <ImageSourceNotice source="https://assets.public.blob.vercel-storage.com/card.png" />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Portable image link. It will remain available in copied code."
    );
  });
});
