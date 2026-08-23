import { describe, expect, it } from "vitest";
import { fontStack, fontStyle } from "../typography";

describe("fontStack", () => {
  it("appends Arabic-capable fallbacks (RTL contract)", () => {
    const stack = fontStack();
    expect(stack).toContain("Tahoma");
    expect(stack).toContain("Arial");
  });

  it("puts the token font family first", () => {
    expect(fontStack()).toMatch(/^"Plus Jakarta Sans"/);
  });
});

describe("fontStyle", () => {
  it("returns token values for a known style", () => {
    const s = fontStyle("label-medium-medium");
    expect(s.fontSize).toBe("14px");
    expect(s.lineHeight).toBe("20px");
    expect(s.fontWeight).toBe("500");
  });
});
