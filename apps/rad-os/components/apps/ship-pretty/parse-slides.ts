// ---------------------------------------------------------------------------
// Markdown → Slide parser for Ship Pretty deck
// ---------------------------------------------------------------------------
//
// Format:
//   # Title           → title slide (next non-blank line = subtitle)
//   ---               → slide separator
//   > Label           → if first line of slide: quote/end slide label
//   > Text            → if after bullets/body: pull-quote note
//   ## N. Heading      → section slide heading
//   - Bullet           → bullet point
//   Plain text line    → body paragraph
//
// The first slide is always 'title'. The last slide with a `> Label` at the
// top and no `##` heading is treated as 'end'. Everything in between that
// has a `##` heading is a section/bullets slide. A slide with only a `> Label`
// + body paragraphs (no heading, not last) is a 'quote' slide.
// ---------------------------------------------------------------------------

export interface Slide {
  kind: 'title' | 'quote' | 'section' | 'bullets' | 'end';
  heading?: string;
  subhead?: string;
  body?: string[];
  bullets?: string[];
  label?: string;
  note?: string;
}

export function parseSlides(raw: string): Slide[] {
  // Strip YAML frontmatter
  let md = raw;
  if (md.startsWith('---')) {
    const endIdx = md.indexOf('---', 3);
    if (endIdx !== -1) {
      md = md.slice(endIdx + 3).trimStart();
    }
  }

  // Split on horizontal rules (---)
  const blocks = md.split(/\n---\n/).map((b) => b.trim()).filter(Boolean);
  const slides: Slide[] = [];

  for (let bi = 0; bi < blocks.length; bi++) {
    const lines = blocks[bi]!.split('\n').map((l) => l.trimEnd());
    const isLast = bi === blocks.length - 1;

    // Detect title slide: starts with `# `
    const firstNonEmpty = lines.find((l) => l.length > 0);
    if (firstNonEmpty?.startsWith('# ') && bi === 0) {
      const heading = firstNonEmpty.slice(2).trim();
      const rest = lines.filter((l) => l.length > 0 && !l.startsWith('# '));
      slides.push({
        kind: 'title',
        heading,
        subhead: rest[0] || undefined,
      });
      continue;
    }

    // Parse block contents
    let sectionHeading: string | undefined;
    let sectionSubhead: string | undefined;
    let label: string | undefined;
    const bodyLines: string[] = [];
    const bulletLines: string[] = [];
    let note: string | undefined;

    let labelConsumed = false;

    for (const line of lines) {
      if (line.length === 0) continue;

      // ## heading
      if (line.startsWith('## ')) {
        const full = line.slice(3).trim();
        // Split "I. Title" into heading="I." subhead="Title"
        const match = full.match(/^([IVXLC]+\.)\s+(.+)$/);
        if (match) {
          sectionHeading = match[1];
          sectionSubhead = match[2];
        } else {
          sectionSubhead = full;
        }
        continue;
      }

      // > blockquote
      if (line.startsWith('> ')) {
        const text = line.slice(2).trim();
        // If nothing parsed yet (no heading, no body, no bullets), it's a label
        if (!sectionHeading && !sectionSubhead && bodyLines.length === 0 && bulletLines.length === 0 && !labelConsumed) {
          label = text;
          labelConsumed = true;
        } else {
          // It's a pull-quote / note
          note = note ? `${note} ${text}` : text;
        }
        continue;
      }

      // - bullet
      if (line.startsWith('- ')) {
        bulletLines.push(line.slice(2).trim());
        continue;
      }

      // Plain text → body
      bodyLines.push(line);
    }

    // Determine slide kind
    if (isLast && label && !sectionHeading) {
      // End slide
      slides.push({
        kind: 'end',
        label,
        body: bodyLines.length > 0 ? bodyLines : undefined,
      });
    } else if (label && !sectionHeading && bulletLines.length === 0) {
      // Quote slide
      slides.push({
        kind: 'quote',
        label,
        body: bodyLines.length > 0 ? bodyLines : undefined,
      });
    } else if (bulletLines.length > 0) {
      slides.push({
        kind: 'bullets',
        heading: sectionHeading,
        subhead: sectionSubhead,
        body: bodyLines.length > 0 ? bodyLines : undefined,
        bullets: bulletLines,
        note,
      });
    } else {
      slides.push({
        kind: 'section',
        heading: sectionHeading,
        subhead: sectionSubhead,
        body: bodyLines.length > 0 ? bodyLines : undefined,
        note,
      });
    }
  }

  return slides;
}
