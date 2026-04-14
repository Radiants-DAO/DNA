import { describe, expect, it } from 'vitest';
import {
  computeBroadsheetLayout,
  type BroadsheetFlowBlock,
} from '@/components/apps/pretext/primitives/broadsheet/broadsheet-layout';

const LONG_PARAGRAPH = Array.from(
  { length: 50 },
  () =>
    'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
).join(' ');

const flow: BroadsheetFlowBlock[] = [
  { kind: 'paragraph', text: LONG_PARAGRAPH },
  { kind: 'paragraph', text: LONG_PARAGRAPH },
];

describe('computeBroadsheetLayout', () => {
  it('supports two- and three-column flow', () => {
    const twoColumn = computeBroadsheetLayout({
      containerWidth: 720,
      masthead: 'The Daily Rad',
      dateline: 'Morning Edition',
      headline: 'Ship Faster',
      columns: 2,
      heroWrap: 'leftSide',
      flow,
    });
    const threeColumn = computeBroadsheetLayout({
      containerWidth: 960,
      masthead: 'The Daily Rad',
      dateline: 'Morning Edition',
      headline: 'Ship Faster',
      columns: 3,
      heroWrap: 'leftSide',
      flow,
    });

    expect(twoColumn.columnCount).toBe(2);
    expect(threeColumn.columnCount).toBe(3);
    expect(threeColumn.columns).toHaveLength(3);
  });

  it('lays out masthead and dateline text', () => {
    const result = computeBroadsheetLayout({
      containerWidth: 960,
      masthead: 'The Daily Rad',
      dateline: 'Morning Edition',
      headline: 'Ship Faster',
      columns: 3,
      heroWrap: 'leftSide',
      flow,
    });

    const mastheadText = result.elements
      .filter((el) => el.kind === 'masthead-text')
      .map((el) => el.text);

    expect(mastheadText).toContain('The Daily Rad');
    expect(mastheadText).toContain('Morning Edition');
  });

  it('selects different hero slots based on heroWrap', () => {
    const left = computeBroadsheetLayout({
      containerWidth: 960,
      masthead: 'The Daily Rad',
      dateline: 'Morning Edition',
      headline: 'Ship Faster',
      columns: 3,
      heroWrap: 'leftSide',
      heroImageSrc: '/hero.png',
      flow,
    });
    const right = computeBroadsheetLayout({
      containerWidth: 960,
      masthead: 'The Daily Rad',
      dateline: 'Morning Edition',
      headline: 'Ship Faster',
      columns: 3,
      heroWrap: 'rightSide',
      heroImageSrc: '/hero.png',
      flow,
    });

    const leftHero = left.elements.find((el) => el.kind === 'hero');
    const rightHero = right.elements.find((el) => el.kind === 'hero');

    expect(leftHero).toBeDefined();
    expect(rightHero).toBeDefined();
    if (leftHero?.kind === 'hero' && rightHero?.kind === 'hero') {
      expect(leftHero.x).toBeLessThan(rightHero.x);
    }
  });

  it('positions the drop cap at the first text column', () => {
    const result = computeBroadsheetLayout({
      containerWidth: 960,
      masthead: 'The Daily Rad',
      dateline: 'Morning Edition',
      headline: 'Ship Faster',
      columns: 3,
      heroWrap: 'both',
      heroImageSrc: '/hero.png',
      flow,
    });

    const dropCap = result.elements.find((el) => el.kind === 'dropcap');

    expect(dropCap).toBeDefined();
    if (dropCap?.kind === 'dropcap') {
      expect(dropCap.x).toBe(result.columns[0]?.x);
    }
  });
});
