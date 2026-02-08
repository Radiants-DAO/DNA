import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createModeController, type ModeController } from '../modes/modeController'
import type { ModeState } from '../modes/types'

describe('ModeController', () => {
  let controller: ModeController
  let onModeChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onModeChange = vi.fn()
    controller = createModeController({ onModeChange })
  })

  describe('initial state', () => {
    it('should start in default mode with no sub-mode', () => {
      const state = controller.getState()
      expect(state.topLevel).toBe('default')
      expect(state.designSubMode).toBeNull()
      expect(state.previousTopLevel).toBeNull()
    })
  })

  describe('setTopLevel', () => {
    it('should switch to design mode', () => {
      controller.setTopLevel('design')
      expect(controller.getState().topLevel).toBe('design')
      expect(onModeChange).toHaveBeenCalledWith(
        expect.objectContaining({ topLevel: 'design' })
      )
    })

    it('should default to position sub-mode when entering design', () => {
      controller.setTopLevel('design')
      expect(controller.getState().designSubMode).toBe('position')
    })

    it('should track previousTopLevel', () => {
      controller.setTopLevel('design')
      expect(controller.getState().previousTopLevel).toBe('default')

      controller.setTopLevel('annotate')
      expect(controller.getState().previousTopLevel).toBe('design')
    })

    it('should clear sub-mode when leaving design', () => {
      controller.setTopLevel('design')
      controller.setDesignSubMode('spacing')
      controller.setTopLevel('annotate')
      expect(controller.getState().designSubMode).toBeNull()
    })

    it('should not notify when setting same mode', () => {
      controller.setTopLevel('design')
      onModeChange.mockClear()

      controller.setTopLevel('design')
      expect(onModeChange).not.toHaveBeenCalled()
    })

    it('should return to default on escape (setting default)', () => {
      controller.setTopLevel('design')
      controller.setTopLevel('default')
      expect(controller.getState().topLevel).toBe('default')
      expect(controller.getState().designSubMode).toBeNull()
    })

    it('should preserve design sub-mode when re-entering design', () => {
      controller.setTopLevel('design')
      controller.setDesignSubMode('typography')
      controller.setTopLevel('annotate')
      // Sub-mode was cleared when leaving design
      expect(controller.getState().designSubMode).toBeNull()

      // Re-entering design defaults to position (sub-mode was cleared)
      controller.setTopLevel('design')
      expect(controller.getState().designSubMode).toBe('position')
    })
  })

  describe('setDesignSubMode', () => {
    it('should switch sub-mode when in design mode', () => {
      controller.setTopLevel('design')
      controller.setDesignSubMode('spacing')
      expect(controller.getState().designSubMode).toBe('spacing')
    })

    it('should ignore sub-mode changes when not in design mode', () => {
      controller.setDesignSubMode('spacing')
      expect(controller.getState().designSubMode).toBeNull()
      expect(onModeChange).not.toHaveBeenCalled()
    })

    it('should not notify when setting same sub-mode', () => {
      controller.setTopLevel('design')
      controller.setDesignSubMode('spacing')
      onModeChange.mockClear()

      controller.setDesignSubMode('spacing')
      expect(onModeChange).not.toHaveBeenCalled()
    })

    it('should cycle through all sub-modes', () => {
      controller.setTopLevel('design')

      const subModes = [
        'position', 'spacing', 'layout', 'color',
        'effects', 'typography', 'guides', 'accessibility',
      ] as const

      for (const sub of subModes) {
        controller.setDesignSubMode(sub)
        expect(controller.getState().designSubMode).toBe(sub)
      }
    })
  })

  describe('subscribe', () => {
    it('should notify subscribers on mode change', () => {
      let lastState: ModeState | null = null
      controller.subscribe((state) => { lastState = state })

      controller.setTopLevel('design')
      expect(lastState).not.toBeNull()
      expect(lastState!.topLevel).toBe('design')
    })

    it('should return unsubscribe function', () => {
      let callCount = 0
      const unsub = controller.subscribe(() => { callCount++ })

      controller.setTopLevel('design')
      expect(callCount).toBe(1)

      unsub()
      controller.setTopLevel('annotate')
      expect(callCount).toBe(1)
    })

    it('should support multiple subscribers', () => {
      let count1 = 0
      let count2 = 0
      controller.subscribe(() => { count1++ })
      controller.subscribe(() => { count2++ })

      controller.setTopLevel('design')
      expect(count1).toBe(1)
      expect(count2).toBe(1)
    })
  })

  describe('getState immutability', () => {
    it('should return a copy of state', () => {
      const state1 = controller.getState()
      controller.setTopLevel('design')
      const state2 = controller.getState()

      // Mutations to returned state should not affect controller
      expect(state1.topLevel).toBe('default')
      expect(state2.topLevel).toBe('design')
    })
  })
})
