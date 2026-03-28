export type BrandLogoFormat = 'png' | 'svg';

export function getBrandLogoDownloadHref(logoId: string, format: BrandLogoFormat) {
  return `/assets/logos/${logoId}.${format}`;
}

export function getFontDownloadHref(fontFile: string) {
  return `/assets/fonts/${fontFile}`;
}
