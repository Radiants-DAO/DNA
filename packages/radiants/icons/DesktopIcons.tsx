/**
 * Radiants Desktop Icon Components (kept subset)
 *
 * Brand logos and special non-SVG icon components that can't be
 * represented as static SVG files in assets/icons/.
 */

import type { IconProps } from './types';
export { ICON_SIZE, type IconSize } from './types';

// ============================================================================
// Brand Icons
// ============================================================================

export function RadMarkIcon({ className = '', size: sizeProp, large = false }: IconProps) {
  const size = sizeProp ?? (large ? 24 : 16);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 65 65"
      fill="none"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M29.6393 4.93988V0H34.5791V4.93988H39.519V9.87976H24.6994V4.93988H29.6393ZM59.2789 29.6392H64.2188V34.5791H59.2789V39.5189H54.339V24.6993H59.2789V29.6392ZM0 34.5797H4.93988V39.5196H9.87976V24.7H4.93988V29.6399H0V34.5797ZM14.8198 14.8189V19.7587H9.87988V9.87899H19.7596V14.8189H14.8198ZM44.4591 14.8189H49.399V19.7587H54.3389V9.87899H44.4591V14.8189ZM49.399 49.3981L49.399 44.4582H54.3389V54.338H44.4591V49.3981H49.399ZM19.7596 49.3981H14.8198V44.4582H9.87988V54.338H19.7596V49.3981ZM34.5797 59.279V64.2188H29.6398L29.6398 59.279H24.6999V54.3391H39.5195V59.279H34.5797ZM24.6991 14.8204H39.5187V19.7603H44.4586V24.7002H49.3985V39.5198H44.4586V44.4597H39.5187V49.3996H24.6991V44.4597H19.7592V39.5198H14.8193V24.7002H19.7592V19.7603H24.6991V14.8204Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ============================================================================
// Special non-SVG icons
// ============================================================================

export function FontAaIcon({ className = '', size: sizeProp, large = false }: IconProps) {
  const numSize = sizeProp ? (typeof sizeProp === 'string' ? parseFloat(sizeProp) || 16 : Number(sizeProp)) : (large ? 24 : 16);
  return (
    <span
      className={`font-mondwest font-bold ${className}`}
      style={{ fontSize: numSize * 0.85, lineHeight: 1 }}
    >
      Aa
    </span>
  );
}

// ============================================================================
// Wordmark Logos (require runtime color prop — can't be static SVGs)
// ============================================================================

type BrandLogoColor = 'cream' | 'black' | 'yellow' | 'currentColor';

interface BrandLogoProps {
  className?: string;
  color?: BrandLogoColor;
}

const BRAND_LOGO_COLORS: Record<BrandLogoColor, string> = {
  cream: '#FEF8E2',
  black: '#0F0E0C',
  yellow: '#FCE184',
  currentColor: 'currentColor',
};

export function WordmarkLogo({
  className = '',
  color = 'currentColor',
}: BrandLogoProps) {
  const fill = BRAND_LOGO_COLORS[color];

  return (
    <svg viewBox="0 0 940 130" fill="none" className={className}>
      <path d="M840 100V90H830V110H850V100H840Z" fill={fill} />
      <path d="M850 30V20H830V40H840V30H850Z" fill={fill} />
      <path d="M870 10H860V20H890V10H880V0H870V10Z" fill={fill} />
      <path d="M890 110H860V120H870V130H880V120H890V110Z" fill={fill} />
      <path d="M890 40V30H860V40H850V50H840V80H850V90H860V100H890V90H900V80H910V50H900V40H890Z" fill={fill} />
      <path d="M900 100V110H920V90H910V100H900Z" fill={fill} />
      <path d="M910 30V40H920V20H900V30H910Z" fill={fill} />
      <path d="M920 80H930V70H940V60H930V50H920V80Z" fill={fill} />
      <path d="M0 130H850V120H10V10C289.96 10 570.04 10 850 10V0C566.7 0 283.3 0 0 0V130Z" fill={fill} />
      <path d="M70 80V90H80V110H110V90H100V70H110V30H100V20C73.72 20 46.28 20 20 20V110H40V80H70ZM50 60H40V40C56.03 40 73.97 40 90 40V60C77.47 60 62.53 60 50 60Z" fill={fill} />
      <path d="M190 80V110H210V40H200V30H190V20H140V30H130V40H120V110H140V80H190ZM140 60V50H150V40H180V50H190V60H140Z" fill={fill} />
      <path d="M300 110V100H310V30H300V20H220V110H300ZM290 40V90H240V40H290Z" fill={fill} />
      <path d="M390 110V90H370V40H390V30H400V20H320V30H330V40H350V90H330V100H320V110H390Z" fill={fill} />
      <path d="M470 80V110H490V40H480V30H470V20H420V30H410V40H400V110H420V80H470ZM420 60V50H430V40H460V50H470V60H420Z" fill={fill} />
      <path d="M530 70H540V80H550V90H560V100H570V110H590V100H600V20H570V30H580V70H570V60H560V50H550V40H540V30H530V20H510V30H500V110H530V100H520V60H530V70Z" fill={fill} />
      <path d="M670 110V40H700V30H710V20H610V40H640V110H670Z" fill={fill} />
      <path d="M800 40V30H810V20H730V30H720V50H730V60H740V70H750V80H760V90H710V100H700V110H780V100H790V80H780V70H770V60H760V50H750V40H800Z" fill={fill} />
      <path d="M830 50V80H820V70H810V60H820V50H830Z" fill={fill} />
      <path d="M930 10V40H940V0H900V10H930Z" fill={fill} />
      <path d="M930 120H900V130H940V90H930V120Z" fill={fill} />
    </svg>
  );
}

export function RadSunLogo({
  className = '',
  color = 'currentColor',
}: BrandLogoProps) {
  const fill = BRAND_LOGO_COLORS[color];

  return (
    <svg viewBox="0 0 450 130" fill="none" className={className}>
      <path d="M339.35 50H329.35V60V70V80H339.35V50Z" fill={fill} />
      <path d="M349.35 100V90H339.35V110H359.35V100H349.35Z" fill={fill} />
      <path d="M359.35 30V20H339.35V40H349.35V30H359.35Z" fill={fill} />
      <path d="M379.35 10H369.35V20H399.35V10H389.35V0H379.35V10Z" fill={fill} />
      <path d="M399.35 110H369.35V120H379.35V130H389.35V120H399.35V110Z" fill={fill} />
      <path d="M399.35 40V30H369.35V40H359.35V50H349.35V80H359.35V90H369.35V100H399.35V90H409.35V80H419.35V50H409.35V40H399.35Z" fill={fill} />
      <path d="M409.35 100V110H429.35V90H419.35V100H409.35Z" fill={fill} />
      <path d="M419.35 30V40H429.35V20H409.35V30H419.35Z" fill={fill} />
      <path d="M429.35 80H439.35V70H449.35V60H439.35V50H429.35V80Z" fill={fill} />
      <path d="M0 130H359.35V120H10V10H359.35V0H0V130Z" fill={fill} />
      <path d="M70 80V90H80V110H110V90H100V70H110V30H100V20H20V110H40V80H70ZM40 60V40H90V60H40Z" fill={fill} />
      <path d="M190 80V110H210V40H200V30H190V20H140V30H130V40H120V110H140V80H190ZM140 60V50H150V40H180V50H190V60H140Z" fill={fill} />
      <path d="M300 110V100H310V30H300V20H220V110H300ZM290 40V90H240V40H290Z" fill={fill} />
      <path d="M329.35 60H319.35V70H329.35V60Z" fill={fill} />
      <path d="M439.35 10V40H449.35V0H409.35V10H439.35Z" fill={fill} />
      <path d="M439.35 120H409.35V130H449.35V90H439.35V120Z" fill={fill} />
    </svg>
  );
}
