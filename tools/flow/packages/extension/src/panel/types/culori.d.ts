/**
 * Type declarations for culori color library
 */
declare module "culori" {
  export interface Color {
    mode: string;
    alpha?: number;
    [key: string]: unknown;
  }

  // Type aliases used in imports (e.g., `type Rgb`)
  export type Rgb = RgbColor;
  export type Lab = LabColor;
  export type Lch = LchColor;
  export type Oklch = OklchColor;
  export type Oklab = OklabColor;
  export type Hsl = HslColor;
  export type P3 = P3Color;

  export interface RgbColor extends Color {
    mode: "rgb";
    r: number;
    g: number;
    b: number;
  }

  export interface LabColor extends Color {
    mode: "lab";
    l: number;
    a: number;
    b: number;
  }

  export interface LchColor extends Color {
    mode: "lch";
    l: number;
    c: number;
    h?: number;
  }

  export interface OklchColor extends Color {
    mode: "oklch";
    l: number;
    c: number;
    h?: number;
  }

  export interface OklabColor extends Color {
    mode: "oklab";
    l: number;
    a: number;
    b: number;
  }

  export interface HslColor extends Color {
    mode: "hsl";
    h?: number;
    s?: number;
    l?: number;
  }

  export interface P3Color extends Color {
    mode: "p3";
    r: number;
    g: number;
    b: number;
  }

  export type AnyColor =
    | RgbColor
    | LabColor
    | LchColor
    | OklchColor
    | OklabColor
    | HslColor
    | P3Color
    | Color;

  export function parse(color: string): AnyColor | undefined;
  export function formatHex(color: AnyColor): string | undefined;
  export function formatRgb(color: AnyColor): string | undefined;
  export function formatHsl(color: AnyColor): string | undefined;

  export function converter(mode: "rgb"): (color: AnyColor) => RgbColor | undefined;
  export function converter(mode: "lab"): (color: AnyColor) => LabColor | undefined;
  export function converter(mode: "lch"): (color: AnyColor) => LchColor | undefined;
  export function converter(mode: "oklch"): (color: AnyColor) => OklchColor | undefined;
  export function converter(mode: "oklab"): (color: AnyColor) => OklabColor | undefined;
  export function converter(mode: "hsl"): (color: AnyColor) => HslColor | undefined;
  export function converter(mode: "p3"): (color: AnyColor) => P3Color | undefined;
  export function converter(mode: string): (color: AnyColor) => AnyColor | undefined;

  export const rgb: (color: AnyColor) => RgbColor | undefined;
  export const lab: (color: AnyColor) => LabColor | undefined;
  export const lch: (color: AnyColor) => LchColor | undefined;
  export const oklch: (color: AnyColor) => OklchColor | undefined;
  export const oklab: (color: AnyColor) => OklabColor | undefined;
  export const hsl: (color: AnyColor) => HslColor | undefined;
  export const p3: (color: AnyColor) => P3Color | undefined;

  // Gamut mapping functions
  export function displayable(color: AnyColor): boolean;
  export function clampChroma(color: AnyColor, mode?: string): AnyColor | undefined;
}
