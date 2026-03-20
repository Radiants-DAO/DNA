export const PIXEL_CORNER_CONFIG = {
  profiles: {
    xs: {
      radius: 2,
      borderRadius: '2px',
      points: [[0,2],[1,2],[1,1],[2,1],[2,0]],
      innerPoints: [[1,2],[2,2],[2,1]],
    },
    sm: {
      radius: 4,
      borderRadius: '6px',
      points: [[0,5],[1,5],[1,3],[2,3],[2,2],[3,2],[3,1],[5,1],[5,0]],
      innerPoints: [[1,5],[2,5],[2,3],[3,3],[3,2],[5,2],[5,1]],
    },
    md: {
      radius: 6,
      borderRadius: '6px',
      points: [[0,9],[1,9],[1,8],[1,6],[2,6],[2,5],[3,5],[3,4],[4,3],[5,3],[5,2],[6,2],[6,1],[8,1],[9,1],[9,0]],
      innerPoints: [[1,9],[2,9],[2,8],[2,6],[3,6],[3,5],[4,5],[4,4],[5,4],[5,3],[6,3],[6,2],[8,2],[9,2],[9,1]],
    },
    lg: {
      radius: 8,
      borderRadius: '8px',
      points: [[0,12],[1,12],[1,9],[2,9],[2,8],[3,8],[3,7],[3,6],[4,6],[4,5],[5,4],[6,4],[6,3],[7,3],[8,3],[8,2],[9,2],[9,1],[12,1],[12,0]],
      innerPoints: [[1,12],[2,12],[2,9],[3,9],[3,8],[4,8],[4,7],[4,6],[5,6],[5,5],[6,5],[6,4],[7,4],[8,4],[8,3],[9,3],[9,2],[12,2],[12,1]],
    },
    xl: {
      radius: 16,
      borderRadius: '16px',
      points: [[0,19],[1,19],[1,16],[2,16],[2,15],[2,13],[3,13],[3,12],[4,12],[4,11],[4,10],[5,10],[5,9],[6,9],[6,8],[7,8],[7,7],[8,7],[8,6],[9,6],[9,5],[10,5],[10,4],[11,4],[12,4],[12,3],[13,3],[13,2],[15,2],[16,2],[16,1],[19,1],[19,0]],
      innerPoints: [[1,19],[2,19],[2,16],[3,16],[3,15],[3,13],[4,13],[4,12],[5,12],[5,11],[5,10],[6,10],[6,9],[7,9],[7,8],[8,8],[8,7],[9,7],[9,6],[10,6],[10,5],[11,5],[12,5],[12,4],[13,4],[13,3],[15,3],[16,3],[16,2],[19,2],[19,1]],
    },
  },

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
