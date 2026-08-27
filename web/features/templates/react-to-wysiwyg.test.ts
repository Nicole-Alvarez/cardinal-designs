import { describe, expect, it } from "vitest";
import { htmlCodeToWysiwyg, reactCodeToWysiwyg } from "./react-to-wysiwyg";

const htmlSource = `
  <div style="position: relative; width: 505px; height: 319px;">
    <div style="position: relative; width: 100%; height: 100%;">
      <div style="position: absolute; left: 8px; top: 8px; width: 120px; height: 32px;"></div>
      <div style="position: absolute; left: 8px; top: 48px; width: 220px; height: 16px;">
        <hr style="border: none; border-top: 1px solid #d4d4d8; width: 100%;" />
      </div>
    </div>
  </div>
`;

const reactSource = `
  export default function Template() {
    return (
      <div style={{ position: "relative", width: "505px", height: "319px" }}>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div style={{ position: "absolute", left: "8px", top: "8px", width: "120px", height: "32px" }}></div>
          <div style={{ position: "absolute", left: "8px", top: "48px", width: "220px", height: "16px" }}>
            <hr style={{ border: "none", borderTop: "1px solid #d4d4d8", width: "100%" }} />
          </div>
        </div>
      </div>
    );
  }
`;

describe("code-to-Visual legacy block conversion", () => {
  it("converts empty HTML wrappers and dividers into empty Text blocks", () => {
    const conversion = htmlCodeToWysiwyg(htmlSource);

    expect(conversion.blocks.map(({ type, text }) => ({ type, text }))).toEqual([
      { type: "text", text: "" },
      { type: "text", text: "" },
    ]);
    expect(conversion.blocks[1].style).toMatchObject({
      borderWidth: 1,
      borderColor: "rgb(212, 212, 216)",
      padding: 0,
    });
  });

  it("converts empty React wrappers and dividers into empty Text blocks", async () => {
    const conversion = await reactCodeToWysiwyg(reactSource, [], {
      width: "505px",
      height: "319px",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      overlayImage: "",
      overlayFit: "cover",
      overlayOpacity: 100,
      overlayMargin: 0,
      overlayPadding: 0,
      borderWidth: 0,
      borderColor: "#d4d4d8",
      borderRadius: 0,
    });

    expect(conversion.blocks.map(({ type, text }) => ({ type, text }))).toEqual([
      { type: "text", text: "" },
      { type: "text", text: "" },
    ]);
    expect(conversion.blocks[1].style).toMatchObject({
      borderWidth: 1,
      borderColor: "#d4d4d8",
      padding: 0,
    });
  });
});
