/**
 * RadMark Content Script
 * Injects the RadMark button into Twitter/X tweet action bars
 */

import type { RadMarkBookmark } from '@/types/bookmark'
import { extractTweetData, extractTweetId, findTweetArticle } from './tweetExtractor'
import { showContextPopup, isPopupActive } from './contextPopup'

// Track which tweets have RadMark buttons injected
const injectedTweets = new Set<string>()

// Track bookmarked tweet IDs
let bookmarkedIds = new Set<string>()

// Debounce timer for processing tweets
let processDebounceTimer: ReturnType<typeof setTimeout> | null = null

// Track the currently hovered tweet for keyboard shortcuts
let hoveredTweetId: string | null = null

// Initialize: load bookmarked IDs from storage
chrome.storage.local.get(['pendingBookmarks'], (result) => {
  const bookmarks: RadMarkBookmark[] = result.pendingBookmarks || []
  bookmarkedIds = new Set(bookmarks.map((b) => b.id))
})

// Listen for storage changes to keep bookmarkedIds in sync
chrome.storage.onChanged.addListener((changes) => {
  if (changes.pendingBookmarks) {
    const bookmarks: RadMarkBookmark[] = changes.pendingBookmarks.newValue || []
    bookmarkedIds = new Set(bookmarks.map((b) => b.id))
    // Update all button states
    updateAllButtonStates()
  }
})

/**
 * Show a toast notification
 */
function showToast(message: string, duration = 2000) {
  // Remove any existing toast
  const existingToast = document.querySelector('.radmark-toast')
  if (existingToast) {
    existingToast.remove()
  }

  const toast = document.createElement('div')
  toast.className = 'radmark-toast'
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    background: #0F0E0C;
    color: #FEF8E2;
    font-size: 14px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10003;
    animation: radmark-toast-in 200ms ease-out;
  `
  document.body.appendChild(toast)

  // Add animation keyframes if not already present
  if (!document.querySelector('#radmark-toast-styles')) {
    const style = document.createElement('style')
    style.id = 'radmark-toast-styles'
    style.textContent = `
      @keyframes radmark-toast-in {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes radmark-toast-out {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(10px); }
      }
      .radmark-toast-out {
        animation: radmark-toast-out 200ms ease-out forwards !important;
      }
    `
    document.head.appendChild(style)
  }

  // Auto-remove after duration
  setTimeout(() => {
    toast.classList.add('radmark-toast-out')
    setTimeout(() => toast.remove(), 200)
  }, duration)
}

/**
 * Create the RadMark SVG icon
 */
function createRadMarkIcon(filled: boolean): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 130 130')
  svg.setAttribute('width', '18.75')
  svg.setAttribute('height', '18.75')
  svg.setAttribute('fill', 'none')

  const color = filled ? '#FCE184' : 'currentColor'

  // RadMark pixel art paths
  const paths = [
    'M20 50V80H10V70H0V60H10V50H20Z',
    'M30 100V90H20V110H40V100H30Z',
    'M40 30V20H20V40H30V30H40Z',
    'M60 10H50V20H80V10H70V0H60V10Z',
    'M80 110H50V120H60V130H70V120H80V110Z',
    'M80 40V30H50V40H40V50H30V80H40V90H50V100H80V90H90V80H100V50H90V40H80Z',
    'M90 100V110H110V90H100V100H90Z',
    'M100 30V40H110V20H90V30H100Z',
    'M110 80H120V70H130V60H120V50H110V80Z',
  ]

  paths.forEach((d) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', d)
    path.setAttribute('fill', color)
    svg.appendChild(path)
  })

  return svg
}

/**
 * Create the RadMark button element
 */
function createRadMarkButton(tweetId: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.className = 'radmark-btn'
  button.dataset.tweetId = tweetId
  button.setAttribute('aria-label', 'RadMark bookmark')
  button.setAttribute('type', 'button')

  const isBookmarked = bookmarkedIds.has(tweetId)
  const icon = createRadMarkIcon(isBookmarked)
  button.appendChild(icon)

  // Apply styles
  button.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 9999px;
    transition: transform 100ms ease-out, background-color 100ms ease-out;
    color: rgb(113, 118, 123);
  `

  // Hover effect (Radiants lift)
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px)'
    button.style.backgroundColor = 'rgba(252, 225, 132, 0.1)'
  })

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)'
    button.style.backgroundColor = 'transparent'
  })

  // Click handler
  button.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()

    const altKey = e.altKey
    handleRadMarkClick(tweetId, altKey)
  })

  return button
}

/**
 * Handle RadMark button click
 */
async function handleRadMarkClick(tweetId: string, shouldShowContextPopup: boolean) {
  const isCurrentlyBookmarked = bookmarkedIds.has(tweetId)

  if (isCurrentlyBookmarked) {
    // Remove bookmark
    await removeBookmark(tweetId)
    showToast('Bookmark removed')
    updateButtonState(tweetId)
  } else if (shouldShowContextPopup) {
    // Show context popup (alt+click)
    const button = document.querySelector(`[data-tweet-id="${tweetId}"]`) as HTMLElement
    if (button) {
      showContextPopup(
        button,
        async (context, category) => {
          // Save callback
          await addBookmarkWithContext(tweetId, context, category)
          showToast(context || category ? 'Bookmarked with context!' : 'Bookmarked!')
          updateButtonState(tweetId)
        },
        () => {
          // Cancel callback - still add bookmark but without context
          addBookmark(tweetId).then(() => {
            showToast('Bookmarked!')
            updateButtonState(tweetId)
          })
        }
      )
    } else {
      // Fallback if button not found
      await addBookmark(tweetId)
      showToast('Bookmarked!')
      updateButtonState(tweetId)
    }
  } else {
    // Normal click - add bookmark
    await addBookmark(tweetId)
    showToast('Bookmarked!')
    updateButtonState(tweetId)
  }
}

/**
 * Add a bookmark with full tweet data capture
 * Sends to background script to handle file storage
 */
async function addBookmark(tweetId: string) {
  return addBookmarkWithContext(tweetId, '', '')
}

/**
 * Add a bookmark with user context and category
 * Sends to background script to handle file storage
 */
async function addBookmarkWithContext(tweetId: string, userContext: string, category: string) {
  // Find the tweet article element
  const article = findTweetArticle(tweetId)

  let bookmark: RadMarkBookmark

  if (article) {
    // Extract full tweet data from the DOM
    const extractedData = extractTweetData(article)

    if (extractedData) {
      bookmark = extractedData
      // Apply user context and category
      bookmark.userContext = userContext
      bookmark.suggestedCategory = category
      console.log('RadMark: Captured tweet data', {
        author: bookmark.author.handle,
        textLength: bookmark.content.text.length,
        mediaCount: bookmark.content.media.length,
        linksCount: bookmark.content.externalLinks.length,
        hasParent: !!bookmark.thread.parent,
        childCount: bookmark.thread.children.length,
        hasQuote: !!bookmark.quotedTweet,
        userContext: userContext || '(none)',
        category: category || '(none)',
      })
    } else {
      // Fallback if extraction fails
      bookmark = createFallbackBookmark(tweetId)
      bookmark.userContext = userContext
      bookmark.suggestedCategory = category
      console.warn('RadMark: Tweet extraction failed, using fallback')
    }
  } else {
    // Fallback if article not found
    bookmark = createFallbackBookmark(tweetId)
    bookmark.userContext = userContext
    bookmark.suggestedCategory = category
    console.warn('RadMark: Could not find tweet article, using fallback')
  }

  // Send to background script to handle storage (file + chrome.storage)
  const response = await chrome.runtime.sendMessage({
    type: 'ADD_BOOKMARK',
    bookmark,
  })

  if (response?.success) {
    bookmarkedIds.add(tweetId)
    console.log('RadMark: Bookmarked tweet', tweetId, {
      usedFile: response.usedFile,
      usedClipboard: response.usedClipboard,
    })
  } else {
    // Fallback to direct chrome.storage if message fails
    const result = await chrome.storage.local.get(['pendingBookmarks'])
    const bookmarks: RadMarkBookmark[] = result.pendingBookmarks || []
    bookmarks.push(bookmark)
    await chrome.storage.local.set({ pendingBookmarks: bookmarks })
    bookmarkedIds.add(tweetId)
    console.log('RadMark: Bookmarked tweet (fallback)', tweetId)
  }
}

/**
 * Create a fallback bookmark when extraction fails
 */
function createFallbackBookmark(tweetId: string): RadMarkBookmark {
  return {
    id: tweetId,
    url: `https://x.com/i/status/${tweetId}`,
    author: {
      handle: '@unknown',
      name: 'Unknown',
      avatar: '',
    },
    content: {
      text: '',
      media: [],
      externalLinks: [],
    },
    thread: {
      parent: null,
      children: [],
    },
    quotedTweet: null,
    userContext: '',
    suggestedCategory: '',
    timestamp: new Date().toISOString(),
    tweetEmbed: '',
  }
}

/**
 * Remove a bookmark
 * Sends to background script to handle file storage
 */
async function removeBookmark(tweetId: string) {
  // Send to background script to handle storage (file + chrome.storage)
  const response = await chrome.runtime.sendMessage({
    type: 'REMOVE_BOOKMARK',
    tweetId,
  })

  if (response?.success) {
    bookmarkedIds.delete(tweetId)
    console.log('RadMark: Removed bookmark for tweet', tweetId)
  } else {
    // Fallback to direct chrome.storage if message fails
    const result = await chrome.storage.local.get(['pendingBookmarks'])
    const bookmarks: RadMarkBookmark[] = result.pendingBookmarks || []
    const filtered = bookmarks.filter((b) => b.id !== tweetId)
    await chrome.storage.local.set({ pendingBookmarks: filtered })
    bookmarkedIds.delete(tweetId)
    console.log('RadMark: Removed bookmark (fallback)', tweetId)
  }
}

/**
 * Update a single button's visual state
 */
function updateButtonState(tweetId: string) {
  const button = document.querySelector(`[data-tweet-id="${tweetId}"]`) as HTMLButtonElement
  if (button) {
    const isBookmarked = bookmarkedIds.has(tweetId)
    button.innerHTML = ''
    button.appendChild(createRadMarkIcon(isBookmarked))
  }
}

/**
 * Update all button states
 */
function updateAllButtonStates() {
  const buttons = document.querySelectorAll('.radmark-btn') as NodeListOf<HTMLButtonElement>
  buttons.forEach((button) => {
    const tweetId = button.dataset.tweetId
    if (tweetId) {
      const isBookmarked = bookmarkedIds.has(tweetId)
      button.innerHTML = ''
      button.appendChild(createRadMarkIcon(isBookmarked))
    }
  })
}

/**
 * Find the action bar in a tweet
 */
function findActionBar(article: Element): Element | null {
  // Twitter's action bar has role="group" and contains the like/retweet/bookmark buttons
  const actionGroups = article.querySelectorAll('[role="group"]')
  for (const group of actionGroups) {
    // Check if this group contains the bookmark button (usually the last action)
    const buttons = group.querySelectorAll('button')
    if (buttons.length >= 3) {
      return group
    }
  }
  return null
}

/**
 * Inject RadMark button into a tweet
 */
function injectRadMarkButton(article: Element) {
  const tweetId = extractTweetId(article)
  if (!tweetId || injectedTweets.has(tweetId)) {
    return
  }

  const actionBar = findActionBar(article)
  if (!actionBar) {
    return
  }

  // Track hover state on the article for keyboard shortcuts
  article.addEventListener('mouseenter', () => {
    hoveredTweetId = tweetId
  })
  article.addEventListener('mouseleave', () => {
    if (hoveredTweetId === tweetId) {
      hoveredTweetId = null
    }
  })

  // Create wrapper to match Twitter's button wrapper structure
  const wrapper = document.createElement('div')
  wrapper.className = 'radmark-btn-wrapper'
  wrapper.style.cssText = 'display: flex; align-items: center;'

  const radmarkButton = createRadMarkButton(tweetId)
  wrapper.appendChild(radmarkButton)

  // Try to find the native bookmark button to insert next to it
  // On the bookmarks page, it might be "removeBookmark" instead of "bookmark"
  const bookmarkButton = actionBar.querySelector('[data-testid="bookmark"]')
  const removeBookmarkButton = actionBar.querySelector('[data-testid="removeBookmark"]')
  const shareButton = actionBar.querySelector('[data-testid="share"]') // fallback to share button

  if (bookmarkButton?.parentElement) {
    // Normal timeline - insert before bookmark button
    bookmarkButton.parentElement.insertBefore(wrapper, bookmarkButton)
  } else if (removeBookmarkButton?.parentElement) {
    // Bookmarks page - insert before the remove bookmark button
    removeBookmarkButton.parentElement.insertBefore(wrapper, removeBookmarkButton)
  } else if (shareButton?.parentElement) {
    // Fallback - insert after share button
    shareButton.parentElement.insertBefore(wrapper, shareButton.nextSibling)
  } else {
    // Last resort - append to action bar
    const lastChild = actionBar.lastElementChild
    if (lastChild) {
      actionBar.insertBefore(wrapper, lastChild)
    } else {
      actionBar.appendChild(wrapper)
    }
  }

  injectedTweets.add(tweetId)
}

/**
 * Process all visible tweets
 */
function processAllTweets() {
  const articles = document.querySelectorAll('article[data-testid="tweet"]')
  articles.forEach(injectRadMarkButton)
}

/**
 * Set up mutation observer to handle dynamically loaded tweets
 */
function setupObserver() {
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true
        break
      }
    }
    if (shouldProcess) {
      // Debounce processing to avoid excessive DOM operations
      if (processDebounceTimer) {
        clearTimeout(processDebounceTimer)
      }
      processDebounceTimer = setTimeout(() => {
        requestAnimationFrame(processAllTweets)
      }, 100)
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

/**
 * Check if the active element is an input field
 */
function isInputFocused(): boolean {
  const active = document.activeElement
  if (!active) return false

  const tagName = active.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea') return true
  if (active.getAttribute('contenteditable') === 'true') return true
  if (active.getAttribute('role') === 'textbox') return true

  // Also check if RadMark popup is active
  if (isPopupActive()) return true

  return false
}

/**
 * Handle keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  chrome.storage.sync.get(['settings'], (result) => {
    const shortcut = result.settings?.keyboardShortcut || 'r'

    document.addEventListener('keydown', (e) => {
      // Don't trigger if typing in an input field
      if (isInputFocused()) return

      // Don't trigger if modifier keys are pressed (except for specific combos)
      if (e.ctrlKey || e.metaKey) return

      if (e.key.toLowerCase() !== shortcut.toLowerCase()) {
        return
      }

      // First check for hovered tweet (preferred), then fall back to focused tweet
      let tweetId: string | null = hoveredTweetId

      if (!tweetId) {
        // Fallback to focused tweet if nothing is hovered
        const focusedTweet = document.activeElement?.closest('article[data-testid="tweet"]')
        if (focusedTweet) {
          tweetId = extractTweetId(focusedTweet)
        }
      }

      if (tweetId) {
        e.preventDefault()
        handleRadMarkClick(tweetId, e.altKey)
      }
    })
  })
}

// Initialize
function init() {
  console.log('RadMark: Content script loaded')
  processAllTweets()
  setupObserver()
  setupKeyboardShortcuts()
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
