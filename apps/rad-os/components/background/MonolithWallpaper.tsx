'use client';

import type { CSSProperties } from 'react';
import { useRadOSStore } from '@/store';

const portalBgStyle = {
  '--monolith-map-src': 'url("/monolith/portal_neb2.avif")',
} as CSSProperties;

const portalMidStyle = {
  '--monolith-map-src': 'url("/monolith/portal_neb1.avif")',
} as CSSProperties;

const doorStyle = {
  '--monolith-map-src': 'url("/monolith/monolith_20.avif")',
} as CSSProperties;

const COLORS = {
  dark: [0.063, 0.157, 0.173],
  teal: [0.380, 0.686, 0.741],
  sky: [0.584, 0.824, 0.902],
  mist: [0.812, 0.902, 0.894],
  cream: [0.980, 0.976, 0.957],
} as const;

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function scaledColor(color: readonly number[], strength: number): number[] {
  return color.map((channel) => Math.min(1, channel * strength));
}

function channelTable(colors: number[][], channel: number): string {
  return colors.map((color) => formatNumber(color[channel])).join(' ');
}

export function MonolithWallpaper() {
  const gradientMapValues = useRadOSStore((state) => state.monolithGradientMapValues);
  const portalColors = [
    scaledColor(COLORS.dark, gradientMapValues.portalDark),
    scaledColor(COLORS.teal, gradientMapValues.portalTeal),
    scaledColor(COLORS.sky, gradientMapValues.portalSky),
    scaledColor(COLORS.mist, gradientMapValues.portalMist),
    scaledColor(COLORS.cream, gradientMapValues.portalCream),
  ];
  const doorColors = [
    scaledColor(COLORS.teal, gradientMapValues.doorTeal),
    scaledColor(COLORS.sky, gradientMapValues.doorSky),
    scaledColor(COLORS.mist, gradientMapValues.doorMist),
    scaledColor(COLORS.cream, gradientMapValues.doorCream),
    scaledColor(COLORS.cream, gradientMapValues.doorCream),
  ];

  return (
    <div className="monolith-wallpaper" aria-hidden="true">
      <svg className="monolith-gradient-map-defs" width="0" height="0" focusable="false">
        <defs>
          <filter id="monolith-light-portal-map" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"
              result="gray"
            />
            <feComponentTransfer in="gray">
              <feFuncR
                type="table"
                tableValues={channelTable(portalColors, 0)}
              />
              <feFuncG
                type="table"
                tableValues={channelTable(portalColors, 1)}
              />
              <feFuncB
                type="table"
                tableValues={channelTable(portalColors, 2)}
              />
            </feComponentTransfer>
          </filter>
          <filter id="monolith-light-door-map" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"
              result="gray"
            />
            <feComponentTransfer in="gray">
              <feFuncR
                type="table"
                tableValues={channelTable(doorColors, 0)}
              />
              <feFuncG
                type="table"
                tableValues={channelTable(doorColors, 1)}
              />
              <feFuncB
                type="table"
                tableValues={channelTable(doorColors, 2)}
              />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <div className="monolith-portal-layer">
        <span className="monolith-portal monolith-portal--bg monolith-gradient-map" style={portalBgStyle}>
          <img
            src="/monolith/portal_neb2.avif"
            alt=""
            className="monolith-map-source"
            draggable={false}
          />
        </span>
        <span className="monolith-portal monolith-portal--mid monolith-gradient-map" style={portalMidStyle}>
          <img
            src="/monolith/portal_neb1.avif"
            alt=""
            className="monolith-map-source"
            draggable={false}
          />
        </span>
      </div>
      <div className="monolith-door-layer">
        <span className="monolith-door monolith-gradient-map" style={doorStyle}>
          <img
            src="/monolith/monolith_20.avif"
            alt=""
            className="monolith-map-source"
            draggable={false}
          />
        </span>
      </div>
    </div>
  );
}
