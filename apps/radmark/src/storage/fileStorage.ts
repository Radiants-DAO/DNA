/**
 * RadMark File Storage Service
 * Handles JSON file storage using Chrome File System Access API
 * Writes bookmarks to {vault}/.pending/bookmarks.json
 */

import type { RadMarkBookmark } from '@/types/bookmark'

// File System Access API types (not fully in TypeScript libs)
interface FileSystemDirectoryHandle {
  kind: 'directory'
  name: string
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>
}

interface FileSystemFileHandle {
  kind: 'file'
  name: string
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStream>
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>
  close(): Promise<void>
}

// Stored directory handle for vault access
let vaultDirectoryHandle: FileSystemDirectoryHandle | null = null

/**
 * Check if File System Access API is supported
 */
export function isFileSystemSupported(): boolean {
  return 'showDirectoryPicker' in window
}

/**
 * Request access to the vault directory
 * This prompts the user to select a directory
 */
export async function requestVaultAccess(): Promise<boolean> {
  if (!isFileSystemSupported()) {
    console.warn('RadMark: File System Access API not supported')
    return false
  }

  try {
    // @ts-expect-error - showDirectoryPicker is not in TypeScript libs
    vaultDirectoryHandle = await window.showDirectoryPicker({
      id: 'radmark-vault',
      mode: 'readwrite',
      startIn: 'documents',
    })

    // Store the handle for later use (persisted in IndexedDB)
    if (vaultDirectoryHandle) {
      await storeDirectoryHandle(vaultDirectoryHandle)
      console.log('RadMark: Vault access granted:', vaultDirectoryHandle.name)
    }
    return true
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('RadMark: User cancelled directory picker')
    } else {
      console.error('RadMark: Failed to request vault access:', error)
    }
    return false
  }
}

/**
 * Store directory handle in IndexedDB for persistence
 */
async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('radmark-storage', 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles')
      }
    }

    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('handles', 'readwrite')
      const store = tx.objectStore('handles')
      store.put(handle, 'vault')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    }

    request.onerror = () => reject(request.error)
  })
}

/**
 * Restore directory handle from IndexedDB
 */
async function restoreDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open('radmark-storage', 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles')
      }
    }

    request.onsuccess = () => {
      const db = request.result
      try {
        const tx = db.transaction('handles', 'readonly')
        const store = tx.objectStore('handles')
        const getRequest = store.get('vault')

        getRequest.onsuccess = () => {
          resolve(getRequest.result || null)
        }

        getRequest.onerror = () => resolve(null)
      } catch {
        resolve(null)
      }
    }

    request.onerror = () => resolve(null)
  })
}

/**
 * Verify we still have permission to access the directory
 */
async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    // @ts-expect-error - queryPermission not in TypeScript libs
    const permission = await handle.queryPermission({ mode: 'readwrite' })
    if (permission === 'granted') {
      return true
    }

    // Try to request permission again
    // @ts-expect-error - requestPermission not in TypeScript libs
    const requested = await handle.requestPermission({ mode: 'readwrite' })
    return requested === 'granted'
  } catch {
    return false
  }
}

/**
 * Get the vault directory handle (restoring from storage if needed)
 */
export async function getVaultHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (vaultDirectoryHandle) {
    const hasPermission = await verifyPermission(vaultDirectoryHandle)
    if (hasPermission) {
      return vaultDirectoryHandle
    }
  }

  // Try to restore from IndexedDB
  const stored = await restoreDirectoryHandle()
  if (stored) {
    const hasPermission = await verifyPermission(stored)
    if (hasPermission) {
      vaultDirectoryHandle = stored
      return stored
    }
  }

  return null
}

/**
 * Check if vault access is configured
 */
export async function hasVaultAccess(): Promise<boolean> {
  const handle = await getVaultHandle()
  return handle !== null
}

/**
 * Get the .pending directory handle, creating it if needed
 */
async function getPendingDirectory(vaultHandle: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle> {
  return await vaultHandle.getDirectoryHandle('.pending', { create: true })
}

/**
 * Read bookmarks from the JSON file
 */
export async function readBookmarksFromFile(): Promise<RadMarkBookmark[]> {
  const vaultHandle = await getVaultHandle()
  if (!vaultHandle) {
    console.log('RadMark: No vault access, falling back to chrome.storage')
    return []
  }

  try {
    const pendingDir = await getPendingDirectory(vaultHandle)
    const fileHandle = await pendingDir.getFileHandle('bookmarks.json', { create: false })
    const file = await fileHandle.getFile()
    const content = await file.text()

    if (!content.trim()) {
      return []
    }

    const data = JSON.parse(content)
    return Array.isArray(data) ? data : data.bookmarks || []
  } catch (error) {
    if ((error as Error).name === 'NotFoundError') {
      // File doesn't exist yet, that's fine
      return []
    }
    console.error('RadMark: Failed to read bookmarks file:', error)
    return []
  }
}

/**
 * Write bookmarks to the JSON file
 */
export async function writeBookmarksToFile(bookmarks: RadMarkBookmark[]): Promise<boolean> {
  const vaultHandle = await getVaultHandle()
  if (!vaultHandle) {
    console.warn('RadMark: No vault access, cannot write to file')
    return false
  }

  try {
    const pendingDir = await getPendingDirectory(vaultHandle)
    const fileHandle = await pendingDir.getFileHandle('bookmarks.json', { create: true })
    const writable = await fileHandle.createWritable()

    // Format with pretty printing for readability
    const content = JSON.stringify(bookmarks, null, 2)

    await writable.write(content)
    await writable.close()

    console.log('RadMark: Wrote', bookmarks.length, 'bookmarks to file')
    return true
  } catch (error) {
    console.error('RadMark: Failed to write bookmarks file:', error)
    return false
  }
}

/**
 * Copy bookmarks to clipboard as fallback
 */
export async function copyToClipboard(bookmarks: RadMarkBookmark[]): Promise<boolean> {
  try {
    const content = JSON.stringify(bookmarks, null, 2)
    await navigator.clipboard.writeText(content)
    console.log('RadMark: Copied', bookmarks.length, 'bookmarks to clipboard')
    return true
  } catch (error) {
    console.error('RadMark: Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Sync bookmarks between chrome.storage and file system
 * File system is the source of truth when available
 */
export async function syncBookmarks(): Promise<RadMarkBookmark[]> {
  const hasAccess = await hasVaultAccess()

  if (hasAccess) {
    // Read from file system (source of truth)
    const fileBookmarks = await readBookmarksFromFile()

    // Update chrome.storage to match
    await chrome.storage.local.set({ pendingBookmarks: fileBookmarks })

    return fileBookmarks
  } else {
    // Fall back to chrome.storage
    const result = await chrome.storage.local.get(['pendingBookmarks'])
    return result.pendingBookmarks || []
  }
}

/**
 * Add a bookmark (writes to both file and chrome.storage)
 */
export async function addBookmarkToStorage(bookmark: RadMarkBookmark): Promise<{
  success: boolean
  usedFile: boolean
  usedClipboard: boolean
}> {
  // Get current bookmarks
  const currentBookmarks = await syncBookmarks()

  // Check for duplicates
  if (currentBookmarks.some(b => b.id === bookmark.id)) {
    console.log('RadMark: Bookmark already exists:', bookmark.id)
    return { success: true, usedFile: false, usedClipboard: false }
  }

  // Add new bookmark
  const updatedBookmarks = [...currentBookmarks, bookmark]

  // Try to write to file system
  const fileWritten = await writeBookmarksToFile(updatedBookmarks)

  // Always update chrome.storage as backup
  await chrome.storage.local.set({ pendingBookmarks: updatedBookmarks })

  // If file write failed and clipboard fallback is enabled, copy to clipboard
  let clipboardUsed = false
  if (!fileWritten) {
    const result = await chrome.storage.sync.get(['settings'])
    if (result.settings?.clipboardFallback) {
      clipboardUsed = await copyToClipboard(updatedBookmarks)
    }
  }

  return {
    success: true,
    usedFile: fileWritten,
    usedClipboard: clipboardUsed,
  }
}

/**
 * Remove a bookmark (removes from both file and chrome.storage)
 */
export async function removeBookmarkFromStorage(tweetId: string): Promise<boolean> {
  // Get current bookmarks
  const currentBookmarks = await syncBookmarks()

  // Filter out the bookmark to remove
  const updatedBookmarks = currentBookmarks.filter(b => b.id !== tweetId)

  // Try to write to file system
  await writeBookmarksToFile(updatedBookmarks)

  // Always update chrome.storage
  await chrome.storage.local.set({ pendingBookmarks: updatedBookmarks })

  return true
}

/**
 * Get all bookmarked tweet IDs
 */
export async function getBookmarkedIds(): Promise<Set<string>> {
  const bookmarks = await syncBookmarks()
  return new Set(bookmarks.map(b => b.id))
}

/**
 * Clear vault access (for settings/reset)
 */
export async function clearVaultAccess(): Promise<void> {
  vaultDirectoryHandle = null

  return new Promise((resolve) => {
    const request = indexedDB.open('radmark-storage', 1)

    request.onsuccess = () => {
      const db = request.result
      try {
        const tx = db.transaction('handles', 'readwrite')
        const store = tx.objectStore('handles')
        store.delete('vault')
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch {
        resolve()
      }
    }

    request.onerror = () => resolve()
  })
}

/**
 * Clear all pending bookmarks (for settings/reset)
 * Removes bookmarks from both chrome.storage and file system
 */
export async function clearAllBookmarks(): Promise<boolean> {
  try {
    // Clear from chrome.storage.local
    await chrome.storage.local.set({ pendingBookmarks: [] })

    // Try to clear from file system if connected
    const vaultHandle = await getVaultHandle()
    if (vaultHandle) {
      await writeBookmarksToFile([])
    }

    console.log('RadMark: Cleared all pending bookmarks')
    return true
  } catch (error) {
    console.error('RadMark: Failed to clear bookmarks:', error)
    return false
  }
}
