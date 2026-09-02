import { describe, expect, it } from "vitest";
import { visibleMenuItems } from "./sidebar-menu";

describe("sidebar menu", () => {
  it("shows Users only to administrators", () => {
    expect(visibleMenuItems("admin").map((item) => item.label)).toEqual(["Dashboard", "Users", "Templates"]);
    expect(visibleMenuItems("member").map((item) => item.label)).not.toContain("Users");
  });
});
