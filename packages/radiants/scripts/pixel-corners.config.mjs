import { getCornerSet } from '@rdna/pixel';
import { buildProfileFromCornerSet } from './pixel-corners-lib.mjs';

const PROFILE_OPTIONS = {
  xs: { borderRadius: '3px' },
  sm: { borderRadius: '6px' },
  md: { borderRadius: '10px' },
  lg: { borderRadius: '13px' },
  xl: { borderRadius: '20px' },
};

const profiles = Object.fromEntries(
  Object.entries(PROFILE_OPTIONS).map(([name, options]) => [
    name,
    buildProfileFromCornerSet(getCornerSet(name), options),
  ]),
);

export const PIXEL_CORNER_CONFIG = {
  profiles,

  variants: [
    // --- Simple sizes (all 4 corners same profile) ---
    {
      name: 'xs',
      selectors: ['.pixel-rounded-xs'],
      wrapperSelector: '.pixel-rounded-xs--wrapper',
      corners: { tl: 'xs', tr: 'xs', br: 'xs', bl: 'xs' },
    },
    {
      name: 'sm',
      selectors: ['.pixel-rounded-sm'],
      wrapperSelector: '.pixel-rounded-sm--wrapper',
      corners: { tl: 'sm', tr: 'sm', br: 'sm', bl: 'sm' },
    },
    {
      name: 'md',
      selectors: ['.pixel-rounded-md'],
      wrapperSelector: '.pixel-rounded-md--wrapper',
      corners: { tl: 'md', tr: 'md', br: 'md', bl: 'md' },
    },
    {
      name: 'lg',
      selectors: ['.pixel-rounded-lg', '.pixel-corners'],
      wrapperSelector: '.pixel-rounded-lg--wrapper',
      wrapperAliases: ['.pixel-corners--wrapper'],
      corners: { tl: 'lg', tr: 'lg', br: 'lg', bl: 'lg' },
    },
    {
      name: 'xl',
      selectors: ['.pixel-rounded-xl'],
      wrapperSelector: '.pixel-rounded-xl--wrapper',
      corners: { tl: 'xl', tr: 'xl', br: 'xl', bl: 'xl' },
    },

    // --- Compound variants ---
    {
      name: 't-sm-b-md',
      selectors: ['.pixel-rounded-t-sm-b-md'],
      corners: { tl: 'sm', tr: 'sm', br: 'md', bl: 'md' },
      borderRadius: '0',
    },
    {
      name: 't-sm',
      selectors: ['.pixel-rounded-t-sm'],
      corners: { tl: 'sm', tr: 'sm', br: 'square', bl: 'square' },
      edges: { top: true, right: true, bottom: false, left: true },
      borderRadius: '0',
    },
    {
      name: 'l-sm',
      selectors: ['.pixel-rounded-l-sm'],
      corners: { tl: 'sm', tr: 'square', br: 'square', bl: 'sm' },
      edges: { top: true, right: false, bottom: true, left: true },
      borderRadius: '0',
    },
    {
      name: 'sm-notl',
      selectors: ['.pixel-rounded-sm-notl'],
      corners: { tl: 'square', tr: 'sm', br: 'sm', bl: 'sm' },
      borderRadius: '0',
    },
  ],
};
