import { it } from 'vitest';
import { buildRegistryMetadata } from '../build-registry-metadata';
import { runtimeAttachments } from '../runtime-attachments';

it('log missing demos', () => {
  for (const entry of buildRegistryMetadata()) {
    if (entry.renderMode !== 'custom') continue;
    const a = runtimeAttachments[entry.name];
    if (typeof a?.Demo !== 'function') {
      console.error('MISSING DEMO:', entry.name);
    }
  }
});
