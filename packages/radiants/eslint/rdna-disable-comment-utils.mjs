const RDNA_RULE_RE = /\brdna\/[a-z0-9-]+\b/g;
const DISABLE_DIRECTIVE_RE = /\beslint-disable(?:(-next-line)|(-line))?\b/;
const FIELD_RE = /(^|\s)(reason|owner|expires|issue):/gm;
const OWNER_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISSUE_RE = /^(?:DNA-\d+|https:\/\/\S+)$/;

export const REQUIRED_EXCEPTION_FIELDS = ['reason', 'owner', 'expires', 'issue'];

export function parseRdnaDisableComment(rawText) {
  const text = normalizeCommentText(rawText);
  const directiveMatch = text.match(DISABLE_DIRECTIVE_RE);
  if (!directiveMatch) return null;
  if (directiveMatch.index !== 0) return null;

  const kind = directiveMatch[1]
    ? 'disable-next-line'
    : directiveMatch[2]
      ? 'disable-line'
      : 'disable';

  const afterDirective = text.slice(directiveMatch.index + directiveMatch[0].length).trim();
  const metadataIndex = afterDirective.indexOf('--');
  const ruleSegment = metadataIndex >= 0 ? afterDirective.slice(0, metadataIndex).trim() : afterDirective;
  const metadataText = metadataIndex >= 0 ? afterDirective.slice(metadataIndex + 2).trim() : '';
  const rdnaRules = [...new Set(ruleSegment.match(RDNA_RULE_RE) ?? [])];

  if (rdnaRules.length === 0) return null;

  return {
    kind,
    rdnaRules,
    metadataText,
    text,
  };
}

export function parseExceptionMetadata(metadataText) {
  const fields = new Map();
  const matches = [...metadataText.matchAll(FIELD_RE)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const nextMatch = matches[index + 1];
    const field = match[2];
    const valueStart = match.index + match[0].length;
    const valueEnd = nextMatch ? nextMatch.index : metadataText.length;
    const value = metadataText.slice(valueStart, valueEnd).trim();
    fields.set(field, value);
  }

  return fields;
}

export function validateExceptionMetadata(metadataText, options = {}) {
  const fields = parseExceptionMetadata(metadataText);
  const missing = REQUIRED_EXCEPTION_FIELDS.filter(field => !fields.has(field));
  const malformed = [];
  let expired = null;
  let today = getTodayIsoUtc(options.today);

  if (missing.length > 0) {
    return { fields, missing, malformed, expired, today };
  }

  if (!fields.get('reason')) {
    malformed.push('reason');
  }

  if (!OWNER_RE.test(fields.get('owner'))) {
    malformed.push('owner');
  }

  const expires = fields.get('expires');
  if (!isValidIsoDate(expires)) {
    malformed.push('expires');
  } else if (expires < today) {
    expired = expires;
  }

  if (!ISSUE_RE.test(fields.get('issue'))) {
    malformed.push('issue');
  }

  return { fields, missing, malformed, expired, today };
}

export function extractAddedRdnaDisableCommentsFromDiff(diffText) {
  const additions = [];
  const lines = diffText.split('\n');
  let filePath = null;
  let nextNewLine = null;
  let activeBlockComment = null;

  function flushActiveBlockComment() {
    if (!activeBlockComment) return;

    const parsed = parseRdnaDisableComment(activeBlockComment.lines.join('\n'));
    if (parsed) {
      additions.push({
        filePath: activeBlockComment.filePath,
        line: activeBlockComment.line,
        kind: parsed.kind,
        rdnaRules: parsed.rdnaRules,
        text: parsed.text,
      });
    }

    activeBlockComment = null;
  }

  function pushParsedAddition(parsed, line) {
    additions.push({
      filePath,
      line,
      kind: parsed.kind,
      rdnaRules: parsed.rdnaRules,
      text: parsed.text,
    });
  }

  function handleAddedLine(addedText, line) {
    if (activeBlockComment) {
      if (activeBlockComment.mode === 'existing-block') {
        if (isStarPrefixedCommentLine(addedText)) {
          activeBlockComment.lines.push(addedText);
          return;
        }

        flushActiveBlockComment();
      } else {
        activeBlockComment.lines.push(addedText);
        if (addedText.includes('*/')) {
          flushActiveBlockComment();
        }
        return;
      }
    }

    const parsed = parseRdnaDisableCommentFromSourceLine(addedText);
    if (parsed) {
      pushParsedAddition(parsed, line);
      return;
    }

    if (addedText.trim().startsWith('/*') && !addedText.includes('*/')) {
      activeBlockComment = {
        filePath,
        line,
        lines: [addedText],
        mode: 'new-block',
      };
      return;
    }

    if (isStarPrefixedDisableDirectiveLine(addedText)) {
      activeBlockComment = {
        filePath,
        line,
        lines: [addedText],
        mode: 'existing-block',
      };
    }
  }

  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      flushActiveBlockComment();
      filePath = line.slice(6);
      continue;
    }

    if (line.startsWith('@@')) {
      flushActiveBlockComment();
      const match = line.match(/\+(\d+)(?:,\d+)?/);
      nextNewLine = match ? Number.parseInt(match[1], 10) : null;
      continue;
    }

    if (nextNewLine === null || !filePath) {
      continue;
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      const addedText = line.slice(1);
      handleAddedLine(addedText, nextNewLine);
      nextNewLine += 1;
      continue;
    }

    if (activeBlockComment) {
      flushActiveBlockComment();
    }

    if (line.startsWith('-') && !line.startsWith('---')) {
      continue;
    }

    if (!line.startsWith('\\')) {
      nextNewLine += 1;
    }
  }

  flushActiveBlockComment();

  return additions;
}

export function normalizeCommentText(rawText) {
  let text = rawText.trim();

  if (text.startsWith('//')) {
    return text.replace(/^\/\/\s?/, '').trim();
  }

  if (text.startsWith('/*')) {
    text = text.replace(/^\/\*\s?/, '').replace(/\*\/$/, '').trim();
  }

  return text
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, '').trimEnd())
    .join('\n')
    .trim();
}

function parseRdnaDisableCommentFromSourceLine(rawLine) {
  const trimmed = rawLine.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
    return parseRdnaDisableComment(trimmed);
  }

  const inlineLineComment = rawLine.match(/(?:^|\s)(\/\/\s*eslint-disable(?:-next-line|-line)?[\s\S]*)$/);
  if (inlineLineComment) {
    return parseRdnaDisableComment(inlineLineComment[1].trim());
  }

  const inlineBlockComment = rawLine.match(/(?:^|\s)(\/\*\s*eslint-disable(?:-next-line|-line)?[\s\S]*\*\/)\s*$/);
  if (inlineBlockComment) {
    return parseRdnaDisableComment(inlineBlockComment[1].trim());
  }

  return null;
}

function isStarPrefixedCommentLine(rawLine) {
  return /^\s*\*/.test(rawLine);
}

function isStarPrefixedDisableDirectiveLine(rawLine) {
  return /^\s*\*\s*eslint-disable(?:(?:-next-line)|(?:-line))?\b/.test(rawLine);
}

function getTodayIsoUtc(todayOverride) {
  if (todayOverride) return todayOverride;
  return new Date().toISOString().slice(0, 10);
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
