/**
 * RadMark Background Service Worker
 * Handles extension lifecycle, message passing, and file storage
 */

import type { RadMarkBookmark } from '@/types/bookmark'

// Extension installed/updated handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('RadMark: Extension installed')

    // Initialize storage with empty bookmarks
    chrome.storage.local.set({
      pendingBookmarks: [],
    })

    // Set default settings
    chrome.storage.sync.set({
      settings: {
        vaultPath: '',
        keyboardShortcut: 'r',
        clipboardFallback: true,
      },
    })
  } else if (details.reason === 'update') {
    console.log('RadMark: Extension updated to version', chrome.runtime.getManifest().version)
  }
})

/**
 * Add a bookmark to storage
 * Note: File System API operations must happen in extension pages (popup/options),
 * not in the service worker. We store to chrome.storage here and sync to file
 * when the popup/options page opens.
 */
async function addBookmark(bookmark: RadMarkBookmark): Promise<{
  success: boolean
  usedFile: boolean
  usedClipboard: boolean
}> {
  try {
    // Get current bookmarks
    const result = await chrome.storage.local.get(['pendingBookmarks'])
    const bookmarks: RadMarkBookmark[] = result.pendingBookmarks || []

    // Check for duplicates
    if (bookmarks.some(b => b.id === bookmark.id)) {
      console.log('RadMark: Bookmark already exists:', bookmark.id)
      return { success: true, usedFile: false, usedClipboard: false }
    }

    // Add new bookmark
    bookmarks.push(bookmark)
    await chrome.storage.local.set({ pendingBookmarks: bookmarks })

    console.log('RadMark: Added bookmark to storage:', bookmark.id)
    return { success: true, usedFile: false, usedClipboard: false }
  } catch (error) {
    console.error('RadMark: Failed to add bookmark:', error)
    return { success: false, usedFile: false, usedClipboard: false }
  }
}

/**
 * Remove a bookmark from storage
 */
async function removeBookmark(tweetId: string): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(['pendingBookmarks'])
    const bookmarks: RadMarkBookmark[] = result.pendingBookmarks || []
    const filtered = bookmarks.filter(b => b.id !== tweetId)

    await chrome.storage.local.set({ pendingBookmarks: filtered })

    console.log('RadMark: Removed bookmark from storage:', tweetId)
    return true
  } catch (error) {
    console.error('RadMark: Failed to remove bookmark:', error)
    return false
  }
}

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_BOOKMARKS') {
    chrome.storage.local.get(['pendingBookmarks'], (result) => {
      sendResponse({ bookmarks: result.pendingBookmarks || [] })
    })
    return true // Keep the message channel open for async response
  }

  if (message.type === 'GET_BOOKMARK_COUNT') {
    chrome.storage.local.get(['pendingBookmarks'], (result) => {
      const count = (result.pendingBookmarks || []).length
      sendResponse({ count })
    })
    return true
  }

  if (message.type === 'ADD_BOOKMARK') {
    addBookmark(message.bookmark).then(sendResponse)
    return true
  }

  if (message.type === 'REMOVE_BOOKMARK') {
    removeBookmark(message.tweetId).then((success) => {
      sendResponse({ success })
    })
    return true
  }

  return false
})

// Update badge with bookmark count
function updateBadge() {
  chrome.storage.local.get(['pendingBookmarks'], (result) => {
    const count = (result.pendingBookmarks || []).length
    const text = count > 0 ? String(count) : ''
    chrome.action.setBadgeText({ text })
    chrome.action.setBadgeBackgroundColor({ color: '#FCE184' })
    chrome.action.setBadgeTextColor({ color: '#0F0E0C' })
  })
}

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener((changes) => {
  if (changes.pendingBookmarks) {
    updateBadge()
  }
})

// Initial badge update
updateBadge()
