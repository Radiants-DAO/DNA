import type { CornerPosition, PixelCornerSet } from '../types.js';

export type BuiltInCornerShapeName =
  | 'circle'
  | 'chamfer'
  | 'scallop';

export type CornerShapeName = BuiltInCornerShapeName | (string & {});

export interface ThemeCornerBinding {
  source: 'theme';
}

export interface FixedCornerBinding {
  source: 'fixed';
  shape: CornerShapeName;
}

export type CornerBinding = ThemeCornerBinding | FixedCornerBinding;

export interface CornerDescriptor {
  radiusPx: number;
  binding: CornerBinding;
}

export type CornerValue = 0 | CornerDescriptor;

export type EdgeFlags = [top: 0 | 1, right: 0 | 1, bottom: 0 | 1, left: 0 | 1];

export interface CornerMap<T> {
  tl?: T;
  tr?: T;
  br?: T;
  bl?: T;
}

export type RequiredCornerMap<T> = Required<CornerMap<T>>;

export interface PreparedCornerAsset {
  bits: string;
  path: string;
  maskImage: string;
  width: number;
  height: number;
}

export interface PreparedCornerProfile {
  key: string;
  shape: CornerShapeName;
  radiusPx: number;
  gridSize: number;
  source: 'math' | 'override';
  cover: RequiredCornerMap<PreparedCornerAsset>;
  border: RequiredCornerMap<PreparedCornerAsset>;
}

export type PreparedCornerRecipeEntry =
  | { kind: 'flat' }
  | {
      kind: 'theme';
      radiusPx: number;
      binding: ThemeCornerBinding;
    }
  | {
      kind: 'fixed';
      radiusPx: number;
      binding: FixedCornerBinding;
      profile: PreparedCornerProfile;
    };

export interface CornerRecipeDefinition {
  name?: string;
  corners: CornerMap<CornerValue>;
  edges?: EdgeFlags;
}

export interface NormalizedCornerRecipe {
  name?: string;
  corners: RequiredCornerMap<CornerValue>;
  edges: EdgeFlags;
}

export interface PreparedCornerRecipe {
  name?: string;
  corners: RequiredCornerMap<PreparedCornerRecipeEntry>;
  edges: EdgeFlags;
}

export interface CornerStyleMaterializeOptions {
  corner?: CornerPosition;
}

export interface CornerRecipeMaterializeOptions {
  themeShape?: CornerShapeName;
}

export interface CornerOverrideDefinition {
  kind: 'override';
  shape: CornerShapeName;
  match(radiusPx: number): PixelCornerSet | null;
}

export interface CornerGeneratorDefinition {
  kind: 'generator';
  shape: CornerShapeName;
  rasterize(radiusPx: number): PixelCornerSet;
}

export type CornerDefinition = CornerGeneratorDefinition | CornerOverrideDefinition;

export interface PxConfigCanonical {
  corners: CornerMap<CornerValue>;
  edges?: EdgeFlags;
  color?: string;
  themeShape?: CornerShapeName;
}
