import { describe, it, expect, beforeEach } from 'vitest';
import {
  createHorizontalGuide,
  createVerticalGuide,
  renderGuides,
} from '../guides/gridlinesOverlay';
import type { GuidesState } from '../guides/guides';

describe('gridlinesOverlay', () => {
  describe('createHorizontalGuide', () => {
    it('creates a horizontal guide at the specified y position', () => {
      const guide = createHorizontalGuide(100);
      expect(guide.className).toBe('flow-guide flow-guide-horizontal');
      expect(guide.style.top).toBe('100px');
      expect(guide.style.width).toBe('100%');
      expect(guide.style.height).toBe('1px');
    });
  });

  describe('createVerticalGuide', () => {
    it('creates a vertical guide at the specified x position', () => {
      const guide = createVerticalGuide(200);
      expect(guide.className).toBe('flow-guide flow-guide-vertical');
      expect(guide.style.left).toBe('200px');
      expect(guide.style.width).toBe('1px');
      expect(guide.style.height).toBe('100%');
    });
  });

  describe('renderGuides', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
    });

    it('renders nothing when guides are not visible', () => {
      const state: GuidesState = {
        visible: false,
        horizontalY: 100,
        verticalX: 200,
      };
      renderGuides(container, state);
      expect(container.querySelectorAll('.flow-guide').length).toBe(0);
    });

    it('renders horizontal guide when visible and position set', () => {
      const state: GuidesState = {
        visible: true,
        horizontalY: 150,
        verticalX: null,
      };
      renderGuides(container, state);
      const guides = container.querySelectorAll('.flow-guide-horizontal');
      expect(guides.length).toBe(1);
      expect((guides[0] as HTMLElement).style.top).toBe('150px');
    });

    it('renders vertical guide when visible and position set', () => {
      const state: GuidesState = {
        visible: true,
        horizontalY: null,
        verticalX: 250,
      };
      renderGuides(container, state);
      const guides = container.querySelectorAll('.flow-guide-vertical');
      expect(guides.length).toBe(1);
      expect((guides[0] as HTMLElement).style.left).toBe('250px');
    });

    it('renders both guides when both positions are set', () => {
      const state: GuidesState = {
        visible: true,
        horizontalY: 100,
        verticalX: 200,
      };
      renderGuides(container, state);
      expect(container.querySelectorAll('.flow-guide').length).toBe(2);
    });

    it('clears existing guides before rendering', () => {
      const state: GuidesState = {
        visible: true,
        horizontalY: 100,
        verticalX: null,
      };
      renderGuides(container, state);
      expect(container.querySelectorAll('.flow-guide').length).toBe(1);

      // Render again with different position
      state.horizontalY = 200;
      renderGuides(container, state);
      expect(container.querySelectorAll('.flow-guide').length).toBe(1);
      expect(
        (container.querySelector('.flow-guide-horizontal') as HTMLElement).style.top
      ).toBe('200px');
    });
  });
});
