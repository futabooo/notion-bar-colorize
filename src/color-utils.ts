import { Color } from "./types";

export function toRelativeLuminance({ r, g, b }: Color): number {
  const linearize = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function getContrastRatio(c1: Color, c2: Color): number {
  const l1 = toRelativeLuminance(c1);
  const l2 = toRelativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getAccessibleTextColor(background: Color): Color {
  const white: Color = { r: 255, g: 255, b: 255 };
  const black: Color = { r: 0, g: 0, b: 0 };
  return getContrastRatio(background, white) >= getContrastRatio(background, black)
    ? white
    : black;
}

function rgbToHsl({ r, g, b }: Color): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
    case gn: h = ((bn - rn) / d + 2) / 6; break;
    case bn: h = ((rn - gn) / d + 4) / 6; break;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): Color {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

// 色相・彩度を保持しつつ、背景に対して WCAG AA (4.5:1) を満たす輝度に調整する
export function adjustColorForReadability(color: Color, background: Color): Color {
  if (getContrastRatio(color, background) >= 4.5) return color;

  const [h, s, l] = rgbToHsl(color);
  const white: Color = { r: 255, g: 255, b: 255 };
  const black: Color = { r: 0, g: 0, b: 0 };
  const goLighter = getContrastRatio(white, background) >= getContrastRatio(black, background);

  let lo = goLighter ? l : 0;
  let hi = goLighter ? 100 : l;

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const candidate = hslToRgb(h, s, mid);
    if (getContrastRatio(candidate, background) >= 4.5) {
      if (goLighter) hi = mid;
      else lo = mid;
    } else {
      if (goLighter) lo = mid;
      else hi = mid;
    }
  }

  const result = hslToRgb(h, s, goLighter ? hi : lo);
  return getContrastRatio(result, background) >= 4.5 ? result : getAccessibleTextColor(background);
}
