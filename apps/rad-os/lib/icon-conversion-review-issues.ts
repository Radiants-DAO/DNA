export type ReviewAction = 'delete' | 'incorrect';

interface ConvertedReportLike {
  readonly snappedValues: number;
  readonly offGridValues: readonly number[];
  readonly hadDiagonalSegments: boolean;
}

interface ReviewEntryLike {
  readonly key?: string;
  readonly name: string;
  readonly iconSet: 16 | 24;
  readonly converted: {
    readonly report: ConvertedReportLike;
  } | null;
  readonly error: string | null;
  readonly acceptedIssue?: AcceptedIconConversionIssue | null;
}

export interface AcceptedIconConversionIssue {
  readonly action: 'incorrect';
  readonly signature: string;
}

const ACCEPTED_ICON_CONVERSION_ISSUES = [
  'incorrect | 16px | code-file | snapped=0 | diagonals=false | off-grid=0.75, 1.75, 4.75, 3.75, 5.75, 14.25, 10.75, 15.25, 7.75, 8.75, 6.75, 9.75, 2.75',
  'incorrect | 16px | discord | snapped=2 | diagonals=false | off-grid=13.333, 3.33333, 9.33301, 10.6663, 4.66667, 5.33301, 6.66634, 2.66634, 1.33301, 12.6667, 14.6663, 7.33333',
  'incorrect | 16px | rad-mark | snapped=0 | diagonals=false | off-grid=7.53843, 2.92307, 8.46149, 9.38457, 3.84614, 6.61536, 13.0769, 7.53842, 9.38455, 12.1538, 6.61534, 8.4616, 9.38468, 6.61547, 7.53855, 4.76925, 4.76908, 5.69213, 3.84617, 3.846, 5.6923, 10.3077, 11.2308, 11.2306, 10.3075, 12.1537, 7.53853, 6.61545, 12.1539, 9.38466, 6.6153, 4.76936, 9.38451, 5.69243, 10.3076, 6.61551, 11.2307, 9.38472, 10.3078, 11.2309, 5.69223, 4.76915',
  'incorrect | 16px | ticket | snapped=0 | diagonals=false | off-grid=2, 3, 5, 7, 9, 10, 12, 14, 16, 18, 19',
  'incorrect | 16px | zzz | snapped=0 | diagonals=false | off-grid=2, 5, 7, 9, 12, 14, 17, 19, 21, 24',
] as const;

const ACCEPTED_ICON_CONVERSION_ISSUE_SET: ReadonlySet<string> = new Set(
  ACCEPTED_ICON_CONVERSION_ISSUES,
);

function formatIssueSignature(entry: ReviewEntryLike, action: ReviewAction): string {
  if (!entry.converted) {
    return `${action} | ${entry.iconSet}px | ${entry.name} | error=${entry.error ?? 'unknown'}`;
  }

  const report = entry.converted.report;
  const offGrid =
    report.offGridValues.length > 0 ? ` | off-grid=${report.offGridValues.join(', ')}` : '';

  if (action === 'delete') {
    return `delete-both | ${entry.iconSet}px | ${entry.name} | remove svg and bitmap${offGrid}`;
  }

  return `incorrect | ${entry.iconSet}px | ${entry.name} | snapped=${report.snappedValues} | diagonals=${String(report.hadDiagonalSegments)}${offGrid}`;
}

export function getAcceptedIconConversionIssue(
  entry: ReviewEntryLike,
): AcceptedIconConversionIssue | null {
  if (!entry.converted) {
    return null;
  }

  const signature = formatIssueSignature(entry, 'incorrect');
  if (!ACCEPTED_ICON_CONVERSION_ISSUE_SET.has(signature)) {
    return null;
  }

  return {
    action: 'incorrect',
    signature,
  };
}

export function getIconConversionReviewState(
  entry: ReviewEntryLike,
  decisions: Record<string, ReviewAction>,
): 'delete' | 'incorrect' | 'accepted' | 'implicit-ok' {
  const explicitDecision = entry.key ? decisions[entry.key] : undefined;
  if (explicitDecision) {
    return explicitDecision;
  }

  if (entry.acceptedIssue) {
    return 'accepted';
  }

  return 'implicit-ok';
}

export function formatIconConversionIssueClipboard(
  entries: readonly ReviewEntryLike[],
  decisions: Record<string, ReviewAction>,
): string {
  const acceptedCount = entries.filter((entry) => entry.acceptedIssue).length;
  const issueEntries = entries
    .map((entry) => ({
      entry,
      action: entry.key ? decisions[entry.key] : undefined,
    }))
    .filter((item): item is { entry: ReviewEntryLike; action: ReviewAction } => {
      return item.action === 'delete' || item.action === 'incorrect';
    });

  if (issueEntries.length === 0 && acceptedCount === 0) {
    return 'No issues marked yet.';
  }

  const lines = issueEntries.length > 0
    ? issueEntries.map(({ entry, action }) => `- ${formatIssueSignature(entry, action)}`)
    : ['- no explicit issues marked'];

  return [
    '# Icon Conversion Issues',
    '',
    'Unlisted icons are implicitly OK.',
    `Accepted exceptions in manifest: ${acceptedCount}`,
    '',
    ...lines,
  ].join('\n');
}

export function listAcceptedIconConversionIssues(): readonly string[] {
  return ACCEPTED_ICON_CONVERSION_ISSUES;
}
