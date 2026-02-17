import type { MetadataRoute } from 'next';
import { getCanonicalSiteUrl } from './lib/llm-docs';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
    host: siteUrl,
  };
}
