import { describe, it, expect, beforeEach, vi } from 'vitest'
import { copyStyles, pasteStyles, getClipboardStyles } from '../features/styleCopyPaste'
import { createUnifiedMutationEngine } from '../mutations/unifiedMutationEngine'
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

describe('styleCopyPaste', () => {
  let engine: UnifiedMutationEngine

  beforeEach(() => {
    engine = createUnifiedMutationEngine()
  })

  describe('copyStyles', () => {
    it('captures computed styles from element', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      el.style.backgroundColor = 'blue'
      el.style.fontSize = '16px'
      document.body.appendChild(el)

      copyStyles(el)
      const styles = getClipboardStyles()
      expect(styles).not.toBeNull()
      expect(styles!.length).toBeGreaterThan(0)
    })

    it('filters out default/empty values', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      document.body.appendChild(el)

      copyStyles(el)
      const styles = getClipboardStyles()!
      // Should not include props with empty or default values
      const emptyProps = styles.filter(s => !s.value || s.value === '')
      expect(emptyProps.length).toBe(0)
    })
  })

  describe('pasteStyles', () => {
    it('applies copied styles to target element via engine as a batch', () => {
      const source = document.createElement('div')
      source.style.color = 'red'
      source.style.fontSize = '20px'
      document.body.appendChild(source)

      const target = document.createElement('div') as HTMLElement
      document.body.appendChild(target)

      copyStyles(source)
      pasteStyles(target, engine)

      const diffs = engine.getDiffs()
      expect(diffs.length).toBe(1)
      expect(diffs[0].changes.length).toBeGreaterThan(0)
    })

    it('does nothing when clipboard is empty', () => {
      const target = document.createElement('div') as HTMLElement
      document.body.appendChild(target)

      pasteStyles(target, engine)
      expect(engine.getDiffs().length).toBe(0)
    })
  })
})
