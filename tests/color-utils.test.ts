import { describe, test, expect } from "vitest";
import {
  toRelativeLuminance,
  getContrastRatio,
  getAccessibleTextColor,
  adjustColorForReadability,
} from "../src/color-utils";
import { Color } from "../src/types";

describe("toRelativeLuminance", () => {
  test("black has luminance 0", () => {
    expect(toRelativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0);
  });

  test("white has luminance 1", () => {
    expect(toRelativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1);
  });
});

describe("getContrastRatio", () => {
  test("black vs white is 21:1", () => {
    const black: Color = { r: 0, g: 0, b: 0 };
    const white: Color = { r: 255, g: 255, b: 255 };
    expect(getContrastRatio(black, white)).toBeCloseTo(21, 0);
  });

  test("same color has ratio 1", () => {
    const c: Color = { r: 128, g: 128, b: 128 };
    expect(getContrastRatio(c, c)).toBeCloseTo(1);
  });
});

describe("getAccessibleTextColor", () => {
  test("returns white on dark background", () => {
    const dark: Color = { r: 0, g: 0, b: 100 };
    expect(getAccessibleTextColor(dark)).toEqual({ r: 255, g: 255, b: 255 });
  });

  test("returns black on light background", () => {
    const light: Color = { r: 255, g: 255, b: 200 };
    expect(getAccessibleTextColor(light)).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe("adjustColorForReadability", () => {
  test("returns original color if already meets 4.5:1", () => {
    const white: Color = { r: 255, g: 255, b: 255 };
    const black: Color = { r: 0, g: 0, b: 0 };
    expect(adjustColorForReadability(white, black)).toEqual(white);
  });

  test("adjusts low-contrast color to meet WCAG AA", () => {
    const gray: Color = { r: 150, g: 150, b: 150 };
    const white: Color = { r: 255, g: 255, b: 255 };
    const adjusted = adjustColorForReadability(gray, white);
    expect(getContrastRatio(adjusted, white)).toBeGreaterThanOrEqual(4.5);
  });

  test("adjusts color on dark background", () => {
    const gray: Color = { r: 100, g: 100, b: 100 };
    const dark: Color = { r: 30, g: 30, b: 30 };
    const adjusted = adjustColorForReadability(gray, dark);
    expect(getContrastRatio(adjusted, dark)).toBeGreaterThanOrEqual(4.5);
  });

  test("preserves hue when adjusting", () => {
    const red: Color = { r: 180, g: 50, b: 50 };
    const white: Color = { r: 255, g: 255, b: 255 };
    const adjusted = adjustColorForReadability(red, white);
    // Adjusted red should still be reddish (r > g and r > b)
    expect(adjusted.r).toBeGreaterThan(adjusted.g);
    expect(adjusted.r).toBeGreaterThan(adjusted.b);
  });
});
