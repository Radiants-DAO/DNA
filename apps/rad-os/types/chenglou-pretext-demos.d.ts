declare module '@chenglou/pretext/demos/wrap-geometry' {
  export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  export type Interval = {
    left: number;
    right: number;
  };

  export type Point = {
    x: number;
    y: number;
  };

  export type WrapHullMode = 'mean' | 'envelope';

  export type WrapHullOptions = {
    smoothRadius: number;
    mode: WrapHullMode;
    convexify?: boolean;
  };

  export function getWrapHull(src: string, options: WrapHullOptions): Promise<Point[]>;
  export function transformWrapPoints(points: Point[], rect: Rect, angle: number): Point[];
  export function getPolygonIntervalForBand(
    points: Point[],
    bandTop: number,
    bandBottom: number,
    horizontalPadding: number,
    verticalPadding: number,
  ): Interval | null;
  export function getRectIntervalsForBand(
    rects: Rect[],
    bandTop: number,
    bandBottom: number,
    horizontalPadding: number,
    verticalPadding: number,
  ): Interval[];
  export function carveTextLineSlots(base: Interval, blocked: Interval[]): Interval[];
}
