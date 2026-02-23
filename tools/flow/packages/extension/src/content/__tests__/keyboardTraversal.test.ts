import { describe, it, expect, beforeEach } from 'vitest'
import {
  getNextSibling,
  getPrevSibling,
  getFirstChild,
  getParent,
} from '../features/keyboardTraversal'

describe('keyboardTraversal', () => {
  let parent: HTMLElement
  let childA: HTMLElement
  let childB: HTMLElement
  let childC: HTMLElement
  let grandchild: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = ''
    parent = document.createElement('div')
    parent.id = 'parent'
    childA = document.createElement('div')
    childA.id = 'a'
    childB = document.createElement('div')
    childB.id = 'b'
    childC = document.createElement('div')
    childC.id = 'c'
    grandchild = document.createElement('span')
    grandchild.id = 'gc'
    childB.appendChild(grandchild)
    parent.append(childA, childB, childC)
    document.body.appendChild(parent)
  })

  describe('getNextSibling', () => {
    it('returns next element sibling', () => {
      expect(getNextSibling(childA)).toBe(childB)
    })

    it('wraps to first sibling at end', () => {
      expect(getNextSibling(childC)).toBe(childA)
    })

    it('returns null for only child', () => {
      expect(getNextSibling(grandchild)).toBeNull()
    })
  })

  describe('getPrevSibling', () => {
    it('returns previous element sibling', () => {
      expect(getPrevSibling(childC)).toBe(childB)
    })

    it('wraps to last sibling at start', () => {
      expect(getPrevSibling(childA)).toBe(childC)
    })
  })

  describe('getFirstChild', () => {
    it('returns first element child', () => {
      expect(getFirstChild(childB)).toBe(grandchild)
    })

    it('returns null for leaf element', () => {
      expect(getFirstChild(childA)).toBeNull()
    })
  })

  describe('getParent', () => {
    it('returns parent element', () => {
      expect(getParent(childA)).toBe(parent)
    })

    it('returns null at body', () => {
      expect(getParent(document.body)).toBeNull()
    })

    it('returns null at html', () => {
      expect(getParent(document.documentElement)).toBeNull()
    })
  })
})
