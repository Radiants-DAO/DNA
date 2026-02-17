import type { MetadataRoute } from 'next';
import { getCanonicalSiteUrl } from './lib/llm-docs';

const ROUTES = ['/', '/embed', '/components-showcase', '/llms.txt', '/llms.md'];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getCanonicalSiteUrl();
  const now = new Date();

  return ROUTES.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
