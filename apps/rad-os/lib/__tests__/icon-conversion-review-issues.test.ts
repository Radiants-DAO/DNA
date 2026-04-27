import { describe, expect, it } from 'vitest';
import {
  formatIconConversionIssueClipboard,
  getAcceptedIconConversionIssue,
  getIconConversionReviewState,
} from '@/lib/icon-conversion-review-issues';

function makeEntry(
  overrides: Partial<{
    key: string;
    name: string;
    iconSet: 16 | 24;
    snappedValues: number;
    offGridValues: number[];
    hadDiagonalSegments: boolean;
    error: string | null;
    acceptedIssue: {
      readonly action: 'incorrect';
      readonly signature: string;
    } | null;
  }> = {},
) {
  const iconSet = overrides.iconSet ?? 16;
  const name = overrides.name ?? 'example-icon';

  return {
    key: overrides.key ?? `${iconSet}:${name}`,
    name,
    fileName: `${name}.svg`,
    iconSet,
    sourceSvgDataUri: 'data:image/svg+xml,',
    converted: overrides.error
      ? null
      : {
          bits: '0'.repeat(iconSet * iconSet),
          width: iconSet,
          height: iconSet,
          report: {
            snappedValues: overrides.snappedValues ?? 0,
            offGridValues: overrides.offGridValues ?? [],
            hadCurves: false,
            hadDiagonalSegments: overrides.hadDiagonalSegments ?? false,
          },
        },
    trimPreview: null,
    diagnosis: {
      code: 'clean-grid',
      summary: 'fixture',
    },
    error: overrides.error ?? null,
    acceptedIssue: overrides.acceptedIssue,
  };
}

describe('icon conversion accepted issues', () => {
  it('matches exact checked-in accepted exceptions', () => {
    const accepted = makeEntry({
      name: 'code-file',
      offGridValues: [0.75, 1.75, 4.75, 3.75, 5.75, 14.25, 10.75, 15.25, 7.75, 8.75, 6.75, 9.75, 2.75],
    });

    expect(getAcceptedIconConversionIssue(accepted)).toEqual({
      action: 'incorrect',
      signature:
        'incorrect | 16px | code-file | snapped=0 | diagonals=false | off-grid=0.75, 1.75, 4.75, 3.75, 5.75, 14.25, 10.75, 15.25, 7.75, 8.75, 6.75, 9.75, 2.75',
    });

    expect(
      getAcceptedIconConversionIssue(
        makeEntry({
          name: 'code-file',
          offGridValues: [0.75, 1.75, 4.75],
        }),
      ),
    ).toBeNull();
  });

  it('treats manifest matches as accepted while leaving unlisted icons implicitly ok', () => {
    const acceptedBase = makeEntry({
      name: 'ticket',
      offGridValues: [2, 3, 5, 7, 9, 10, 12, 14, 16, 18, 19],
    });
    const accepted = {
      ...acceptedBase,
      acceptedIssue: getAcceptedIconConversionIssue(acceptedBase),
    };
    const unlisted = makeEntry({
      name: 'alert-circle',
      snappedValues: 1,
    });

    expect(getIconConversionReviewState(accepted, {})).toBe('accepted');
    expect(getIconConversionReviewState(unlisted, {})).toBe('implicit-ok');
    expect(getIconConversionReviewState(accepted, { [accepted.key]: 'incorrect' })).toBe('incorrect');
  });

  it('omits accepted defaults from clipboard export unless explicitly overridden', () => {
    const acceptedBase = makeEntry({
      name: 'discord',
      snappedValues: 2,
      offGridValues: [13.333, 3.33333, 9.33301, 10.6663, 4.66667, 5.33301, 6.66634, 2.66634, 1.33301, 12.6667, 14.6663, 7.33333],
    });
    const accepted = {
      ...acceptedBase,
      acceptedIssue: getAcceptedIconConversionIssue(acceptedBase),
    };
    const flagged = makeEntry({
      name: 'alert-circle',
      snappedValues: 1,
      hadDiagonalSegments: true,
    });

    const defaultExport = formatIconConversionIssueClipboard([accepted, flagged], {
      [flagged.key]: 'incorrect',
    });

    expect(defaultExport).toContain('Accepted exceptions in manifest: 1');
    expect(defaultExport).toContain(
      '- incorrect | 16px | alert-circle | snapped=1 | diagonals=true',
    );
    expect(defaultExport).not.toContain('discord');

    const overrideExport = formatIconConversionIssueClipboard([accepted], {
      [accepted.key]: 'incorrect',
    });

    expect(overrideExport).toContain(
      '- incorrect | 16px | discord | snapped=2 | diagonals=false | off-grid=13.333, 3.33333, 9.33301, 10.6663, 4.66667, 5.33301, 6.66634, 2.66634, 1.33301, 12.6667, 14.6663, 7.33333',
    );
  });
});
