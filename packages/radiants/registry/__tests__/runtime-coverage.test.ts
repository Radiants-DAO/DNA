import { describe, expect, it } from 'vitest';
import { buildRegistryMetadata } from '../build-registry-metadata';
import { runtimeAttachments } from '../runtime-attachments';

describe('runtime coverage', () => {
  it('runtimeAttachments exports a record keyed by component name', () => {
    expect(typeof runtimeAttachments).toBe('object');
    expect(Object.keys(runtimeAttachments).length).toBeGreaterThan(0);
  });

  it('every non-description-only metadata entry has runtime wiring', () => {
    for (const entry of buildRegistryMetadata()) {
      if (entry.renderMode === 'description-only') continue;
      const attachment = runtimeAttachments[entry.name];
      expect(attachment).toBeDefined();
      expect(attachment?.component ?? attachment?.Demo).toBeTruthy();
    }
  });

  it('custom-renderMode entries have a Demo function', () => {
    for (const entry of buildRegistryMetadata()) {
      if (entry.renderMode !== 'custom') continue;
      const attachment = runtimeAttachments[entry.name];
      expect(typeof attachment?.Demo).toBe('function');
    }
  });
});
