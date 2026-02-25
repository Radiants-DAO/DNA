/**
 * Radiants Desktop Icon Components
 * Pixel-art SVG icons for the RadOS desktop environment
 *
 * Standard Icon Sizes:
 * - ICON_SIZE.xs = 12px  (small UI elements)
 * - ICON_SIZE.sm = 14px  (taskbar, compact UI)
 * - ICON_SIZE.md = 16px  (default, buttons)
 * - ICON_SIZE.lg = 20px  (larger UI)
 * - ICON_SIZE.xl = 24px  (desktop icons)
 */

import type { IconProps } from './types';
export { ICON_SIZE, type IconSize } from './types';

// ============================================================================
// Brand Icons
// ============================================================================

export function RadMarkIcon({ className = '', size = 65 }: IconProps) {
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
// Navigation Icons
// ============================================================================

export function TreeIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M10 0H14V2H16V4H18V6H20V10H18V8H16V10H14V8H10V10H8V8H6V10H4V6H6V4H8V2H10V0Z" />
      <path d="M8 10H16V12H18V14H20V18H18V16H16V18H14V16H10V18H8V16H6V18H4V14H6V12H8V10Z" />
      <path d="M10 18H14V24H10V18Z" />
    </svg>
  );
}

// ============================================================================
// UI Icons
// ============================================================================

export function DarkModeIcon({ className = '', size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      className={className}
    >
      <path
        d="M0.128906 9.18807H1.94092V11.0001H0.128906V9.18807ZM1.94092 2.01711H3.71439V3.79057H1.94092V2.01711ZM1.94092 9.18807H3.71439V11.0001H1.94092V9.18807ZM1.94092 18.2095H3.71439V19.9831H1.94092V18.2095ZM3.71439 3.79057H5.52641V5.60258H3.71439V3.79057ZM3.71439 16.3976H5.52641V18.2095H3.71439V16.3976ZM5.52641 7.41461H7.33842V9.18807H5.52641V7.41461ZM5.52641 9.18807H7.33842V11.0001H5.52641V9.18807ZM5.52641 11.0001H7.33842V12.8121H5.52641V11.0001ZM5.52641 12.8121H7.33842V14.5856H5.52641V12.8121ZM7.33842 5.60258H9.11189V7.41461H7.33842V5.60258ZM7.33842 7.41461H9.11189V9.18807H7.33842V7.41461ZM7.33842 9.18807H9.11189V11.0001H7.33842V9.18807ZM7.33842 11.0001H9.11189V12.8121H7.33842V11.0001ZM7.33842 12.8121H9.11189V14.5856H7.33842V12.8121ZM7.33842 14.5856H9.11189V16.3976H7.33842V14.5856ZM9.11189 5.60258H10.9239V7.41461H9.11189V5.60258ZM9.11189 7.41461H10.9239V9.18807H9.11189V7.41461ZM9.11189 9.18807H10.9239V11.0001H9.11189V9.18807ZM9.11189 11.0001H10.9239V12.8121H9.11189V11.0001ZM9.11189 12.8121H10.9239V14.5856H9.11189V12.8121ZM9.11189 14.5856H10.9239V16.3976H9.11189V14.5856ZM9.11189 18.2095H10.9239V19.9831H9.11189V18.2095ZM9.11189 19.9831H10.9239V21.7951H9.11189V19.9831ZM10.9239 0.205078H12.7359V2.01711H10.9239V0.205078ZM10.9239 2.01711H12.7359V3.79057H10.9239V2.01711ZM10.9239 5.60258H12.7359V7.41461H10.9239V5.60258ZM10.9239 7.41461H12.7359V9.18807H10.9239V7.41461ZM10.9239 9.18807H12.7359V11.0001H10.9239V9.18807ZM10.9239 11.0001H12.7359V12.8121H10.9239V11.0001ZM10.9239 12.8121H12.7359V14.5856H10.9239V12.8121ZM10.9239 14.5856H12.7359V16.3976H10.9239V14.5856ZM12.7359 5.60258H14.5094V7.41461H12.7359V5.60258ZM12.7359 7.41461H14.5094V9.18807H12.7359V7.41461ZM12.7359 9.18807H14.5094V11.0001H12.7359V9.18807ZM12.7359 11.0001H14.5094V12.8121H12.7359V11.0001ZM12.7359 12.8121H14.5094V14.5856H12.7359V12.8121ZM12.7359 14.5856H14.5094V16.3976H12.7359V14.5856ZM14.5094 7.41461H16.3214V9.18807H14.5094V7.41461ZM14.5094 9.18807H16.3214V11.0001H14.5094V9.18807ZM14.5094 11.0001H16.3214V12.8121H14.5094V11.0001ZM14.5094 12.8121H16.3214V14.5856H14.5094V12.8121ZM16.3214 3.79057H18.1333V5.60258H16.3214V3.79057ZM16.3214 16.3976H18.1333V18.2095H16.3214V16.3976ZM18.1333 2.01711H19.907V3.79057H18.1333V2.01711ZM18.1333 11.0001H19.907V12.8121H18.1333V11.0001ZM18.1333 18.2095H19.907V19.9831H18.1333V18.2095ZM19.907 11.0001H21.7189V12.8121H19.907V11.0001Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ============================================================================
// Social Icons
// ============================================================================

export function TwitterIcon({ className = '', size = 12 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 10"
      fill="none"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0H7V1H6V2V3H5H4H3V2H2V1H1V0H0V1V2V3H1V4H0V5H1H2V6H1V7H2H3V8H2V9H1V8H0V9H1V10H2H3H4H5H6V9H7H8V8H9V7H10V6V5H11V4V3V2H12V1V0H11V1H10V0H9H8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function DiscordIcon({ className = '', size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 18"
      fill="none"
      className={className}
    >
      <path
        d="M18 6V2H16V0H12V2H14V4H6V2H8V0H4V2H2V6H0V16H2V18H8V16H12V18H18V16H20V6H18ZM6 12V8H8V12H6ZM14 12H12V8H14V12Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ============================================================================
// Download & Action Icons
// ============================================================================

export function RobotIcon({ className = '', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
    >
      <path d="M30.4699 18.2801V7.62012H28.9499V16.7601H27.4299V15.2401H25.8999V27.4301H27.4299V25.9001H30.4699V24.3801H31.9999V18.2801H30.4699Z" />
      <path d="M25.8999 12.1899H24.3799V15.2399H25.8999V12.1899Z" />
      <path d="M6.09009 27.4299V28.9499H7.62009V30.4799H9.14009V28.9499H22.8501V30.4799H24.3801V28.9499H25.9001V27.4299H6.09009Z" />
      <path d="M24.3801 18.28H22.8501V21.33H24.3801V18.28Z" />
      <path d="M24.3801 10.6699H22.8501V12.1899H24.3801V10.6699Z" />
      <path d="M22.8501 16.76H19.8101V18.28H22.8501V16.76Z" />
      <path d="M22.8499 30.48H9.13989V32H22.8499V30.48Z" />
      <path d="M22.8501 21.3301H19.8101V22.8601H22.8501V21.3301Z" />
      <path d="M19.81 18.28H18.28V21.33H19.81V18.28Z" />
      <path d="M19.81 1.52002H18.28V3.05002H19.81V1.52002Z" />
      <path d="M18.28 24.3799H13.71V25.8999H18.28V24.3799Z" />
      <path d="M18.28 0H13.71V1.52H18.28V0Z" />
      <path d="M13.7099 18.28H12.1899V21.33H13.7099V18.28Z" />
      <path d="M13.7099 1.52002H12.1899V3.05002H13.7099V1.52002Z" />
      <path d="M12.1899 16.76H9.13989V18.28H12.1899V16.76Z" />
      <path d="M22.8499 10.67V9.14005H16.7599V4.57005H18.2799V3.05005H13.7099V4.57005H15.2299V9.14005H9.13989V10.67H22.8499Z" />
      <path d="M12.1899 21.3301H9.13989V22.8601H12.1899V21.3301Z" />
      <path d="M9.14012 18.28H7.62012V21.33H9.14012V18.28Z" />
      <path d="M9.14012 10.6699H7.62012V12.1899H9.14012V10.6699Z" />
      <path d="M7.62009 12.1899H6.09009V15.2399H7.62009V12.1899Z" />
      <path d="M6.09 15.2401H4.57V16.7601H3.04V7.62012H1.52V18.2801H0V24.3801H1.52V25.9001H4.57V27.4301H6.09V15.2401Z" />
    </svg>
  );
}

export function ColorSwatchIcon({ className = '', size = 16 }: IconProps) {
  const numSize = typeof size === 'string' ? parseFloat(size) || 16 : Number(size);
  return (
    <div className={`flex gap-0.5 ${className}`} style={{ height: numSize }}>
      <div
        className="border border-current rounded-xs"
        style={{ width: numSize * 0.5, height: numSize, backgroundColor: 'var(--color-ink)' }}
      />
      <div
        className="border border-current rounded-xs"
        style={{ width: numSize * 0.5, height: numSize, backgroundColor: 'var(--color-cream)' }}
      />
      <div
        className="border border-current rounded-xs"
        style={{ width: numSize * 0.5, height: numSize, backgroundColor: 'var(--color-sun-yellow)' }}
      />
    </div>
  );
}

export function FontAaIcon({ className = '', size = 16 }: IconProps) {
  const numSize = typeof size === 'string' ? parseFloat(size) || 16 : Number(size);
  return (
    <span
      className={`font-mondwest font-bold ${className}`}
      style={{ fontSize: numSize * 0.85, lineHeight: 1 }}
    >
      Aa
    </span>
  );
}
