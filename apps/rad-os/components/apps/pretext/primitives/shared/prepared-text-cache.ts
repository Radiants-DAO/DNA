import { type PreparedTextWithSegments } from '@chenglou/pretext';
import { prepareHyphenated } from '@rdna/radiants/patterns/pretext-prepare';

export function getPreparedText(
  cache: Map<string, PreparedTextWithSegments>,
  text: string,
  font: string,
): PreparedTextWithSegments {
  const key = `${font}::${text}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const prepared = prepareHyphenated(text, font);
  cache.set(key, prepared);
  return prepared;
}
