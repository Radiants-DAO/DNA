import { describe, it, expect } from 'vitest';
import { diffSnapshots, type ElementSnapshot } from '../snapshotCapture';

describe('snapshotCapture', () => {
  const makeSnapshot = (
    overrides?: Partial<ElementSnapshot>
  ): ElementSnapshot => ({
    selector: '.test',
    inlineStyles: {},
    computed: {
      layout: { display: 'flex' },
      spacing: { 'margin-top': '0px' },
      size: { width: '100px' },
      typography: { 'font-size': '16px' },
      colors: { color: 'rgb(0, 0, 0)' },
      borders: {},
    },
    textContent: 'Hello',
    ...overrides,
  });

  describe('diffSnapshots', () => {
    it('returns empty array for identical snapshots', () => {
      const snap = makeSnapshot();
      expect(diffSnapshots(snap, snap)).toEqual([]);
    });

    it('detects spacing changes', () => {
      const before = makeSnapshot();
      const after = makeSnapshot({
        computed: {
          ...makeSnapshot().computed,
          spacing: { 'margin-top': '20px' },
        },
      });
      const changes = diffSnapshots(before, after);
      expect(changes).toContainEqual({
        property: 'margin-top',
        oldValue: '0px',
        newValue: '20px',
      });
    });

    it('detects text changes', () => {
      const before = makeSnapshot();
      const after = makeSnapshot({ textContent: 'Goodbye' });
      const changes = diffSnapshots(before, after);
      expect(changes).toContainEqual({
        property: 'textContent',
        oldValue: 'Hello',
        newValue: 'Goodbye',
      });
    });

    it('detects layout changes', () => {
      const before = makeSnapshot();
      const after = makeSnapshot({
        computed: {
          ...makeSnapshot().computed,
          layout: { display: 'grid' },
        },
      });
      const changes = diffSnapshots(before, after);
      expect(changes).toContainEqual({
        property: 'display',
        oldValue: 'flex',
        newValue: 'grid',
      });
    });

    it('detects color changes', () => {
      const before = makeSnapshot();
      const after = makeSnapshot({
        computed: {
          ...makeSnapshot().computed,
          colors: { color: 'rgb(255, 0, 0)' },
        },
      });
      const changes = diffSnapshots(before, after);
      expect(changes).toContainEqual({
        property: 'color',
        oldValue: 'rgb(0, 0, 0)',
        newValue: 'rgb(255, 0, 0)',
      });
    });

    it('detects added properties', () => {
      const before = makeSnapshot({
        computed: {
          ...makeSnapshot().computed,
          borders: {},
        },
      });
      const after = makeSnapshot({
        computed: {
          ...makeSnapshot().computed,
          borders: { 'border-radius': '8px' },
        },
      });
      const changes = diffSnapshots(before, after);
      expect(changes).toContainEqual({
        property: 'border-radius',
        oldValue: '',
        newValue: '8px',
      });
    });

    it('detects removed properties', () => {
      const before = makeSnapshot({
        computed: {
          ...makeSnapshot().computed,
          borders: { 'border-radius': '8px' },
        },
      });
      const after = makeSnapshot({
        computed: {
          ...makeSnapshot().computed,
          borders: {},
        },
      });
      const changes = diffSnapshots(before, after);
      expect(changes).toContainEqual({
        property: 'border-radius',
        oldValue: '8px',
        newValue: '',
      });
    });
  });
});
