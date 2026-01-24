import { useState, useEffect, useCallback } from 'react'
import type { RadMarkBookmark } from '@/types/bookmark'
import {
  hasVaultAccess,
  syncBookmarks,
  removeBookmarkFromStorage,
  writeBookmarksToFile,
  copyToClipboard,
} from '@/storage'
import { generateProcessingPrompt } from '@/prompts/process-bookmarks'

/**
 * Extension popup UI with Radiants styling
 * Shows pending bookmarks and provides copy buttons for Claude processing
 */
export function Popup() {
  const [bookmarks, setBookmarks] = useState<RadMarkBookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [vaultConnected, setVaultConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [vaultPath, setVaultPath] = useState<string>('')

  // Initial load and sync
  useEffect(() => {
    async function loadBookmarks() {
      // Check vault connection status
      const connected = await hasVaultAccess()
      setVaultConnected(connected)

      // Load vault path from settings
      const result = await chrome.storage.sync.get(['settings'])
      if (result.settings?.vaultPath) {
        setVaultPath(result.settings.vaultPath)
      }

      // Sync bookmarks (uses file system if available)
      const synced = await syncBookmarks()
      setBookmarks(synced)
      setLoading(false)
    }

    loadBookmarks()

    // Listen for storage changes to update UI in real-time
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes.pendingBookmarks) {
        setBookmarks(changes.pendingBookmarks.newValue || [])
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [])

  // Manual sync handler
  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      const synced = await syncBookmarks()
      setBookmarks(synced)
      showCopyFeedback('Synced!')
    } catch {
      showCopyFeedback('Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [])

  const showCopyFeedback = useCallback((message: string) => {
    setCopyFeedback(message)
    setTimeout(() => setCopyFeedback(null), 2000)
  }, [])

  const generatePrompt = useCallback((includeData: boolean): string => {
    return generateProcessingPrompt(
      vaultPath,
      includeData ? bookmarks : undefined
    )
  }, [bookmarks, vaultPath])

  const handleCopyPrompt = useCallback(async () => {
    try {
      const prompt = generatePrompt(false)
      await navigator.clipboard.writeText(prompt)
      showCopyFeedback('Prompt copied!')
    } catch {
      showCopyFeedback('Failed to copy')
    }
  }, [generatePrompt, showCopyFeedback])

  const handleCopyPromptWithData = useCallback(async () => {
    try {
      const prompt = generatePrompt(true)
      await navigator.clipboard.writeText(prompt)
      showCopyFeedback('Prompt + data copied!')
    } catch {
      showCopyFeedback('Failed to copy')
    }
  }, [generatePrompt, showCopyFeedback])

  const handleExportToFile = useCallback(async () => {
    if (bookmarks.length === 0) return

    if (vaultConnected) {
      // Write to connected vault
      const success = await writeBookmarksToFile(bookmarks)
      showCopyFeedback(success ? 'Exported to file!' : 'Export failed')
    } else {
      // Fallback to clipboard
      const success = await copyToClipboard(bookmarks)
      showCopyFeedback(success ? 'Copied JSON to clipboard!' : 'Copy failed')
    }
  }, [bookmarks, vaultConnected, showCopyFeedback])

  const handleRemoveBookmark = useCallback(async (id: string) => {
    // Remove using the storage service (handles both file and chrome.storage)
    await removeBookmarkFromStorage(id)
    // UI will update via storage change listener
  }, [])

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
  }

  return (
    <div className="w-80 min-h-[280px] bg-surface-primary">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-edge-muted">
        <div className="flex items-center gap-2">
          <img
            src="/icons/rad-mark-yellow.svg"
            alt="RadMark"
            className="w-6 h-6"
          />
          <h1 className="text-lg font-semibold text-content-primary">RadMark</h1>
        </div>
        {/* Pending count badge */}
        <div
          className="flex items-center justify-center min-w-[28px] h-7 px-2 text-sm font-semibold bg-action-primary text-content-primary rounded-full border border-edge-primary"
          title={`${bookmarks.length} pending bookmark${bookmarks.length !== 1 ? 's' : ''}`}
        >
          {loading ? '...' : bookmarks.length}
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {/* Storage Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {vaultConnected ? (
              <>
                <span className="w-2 h-2 bg-status-success rounded-full" />
                <span className="text-xs text-content-muted">File sync active</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-content-muted rounded-full" />
                <span className="text-xs text-content-muted">Browser storage only</span>
              </>
            )}
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs text-content-link hover:underline disabled:opacity-50"
            title="Sync bookmarks"
          >
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>

        {/* Bookmark List */}
        <div className="mb-4">
          <h2 className="text-xs font-medium text-content-muted uppercase tracking-wide mb-2">
            Pending Bookmarks
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-content-muted">Loading...</div>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="card-radiants p-4 text-center">
              <div className="text-2xl mb-2">📑</div>
              <div className="text-sm text-content-muted">
                No pending bookmarks
              </div>
              <div className="text-xs text-content-muted mt-1">
                Click the RadMark button on tweets to save them
              </div>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {bookmarks.map((bookmark) => (
                <li
                  key={bookmark.id}
                  className="card-radiants p-3 group relative"
                >
                  {/* Author row */}
                  <div className="flex items-center gap-2 mb-1">
                    {bookmark.author.avatar && (
                      <img
                        src={bookmark.author.avatar}
                        alt=""
                        className="w-5 h-5 rounded-full border border-edge-muted"
                      />
                    )}
                    <span className="text-sm font-medium text-content-primary truncate">
                      {bookmark.author.name}
                    </span>
                    <span className="text-xs text-content-muted">
                      {bookmark.author.handle}
                    </span>
                  </div>

                  {/* Tweet preview */}
                  <p className="text-xs text-content-secondary leading-relaxed mb-2">
                    {truncateText(bookmark.content.text, 80)}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-content-muted">
                      {formatTimestamp(bookmark.timestamp)}
                    </span>

                    {/* User context indicator */}
                    {bookmark.userContext && (
                      <span
                        className="text-xs text-content-link"
                        title={bookmark.userContext}
                      >
                        Has note
                      </span>
                    )}
                  </div>

                  {/* Remove button (shown on hover) */}
                  <button
                    onClick={() => handleRemoveBookmark(bookmark.id)}
                    className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-content-muted hover:text-action-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove bookmark"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M9.17 2.83L6 6l3.17 3.17-1 1L5 7l-3.17 3.17-1-1L4 6 .83 2.83l1-1L5 5l3.17-3.17 1 1z"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Copy Feedback Toast */}
        {copyFeedback && (
          <div className="mb-3 p-2 bg-status-success text-content-primary text-sm text-center rounded border border-edge-primary">
            {copyFeedback}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleCopyPrompt}
            disabled={bookmarks.length === 0}
            className="btn-radiants btn-radiants-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
              <path d="M6 6h4v1H6V6zm0 2h4v1H6V8zm0 2h2v1H6v-1z"/>
            </svg>
            Copy Prompt
          </button>
          <button
            onClick={handleCopyPromptWithData}
            disabled={bookmarks.length === 0}
            className="btn-radiants btn-radiants-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 0A1.5 1.5 0 0 0 4 1.5V3H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V12h1.5a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 14.5 0h-9zM12 4.5v7a.5.5 0 0 1-.5.5H4V4.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5z"/>
            </svg>
            Copy Prompt + Data
          </button>
          <button
            onClick={handleExportToFile}
            disabled={bookmarks.length === 0}
            className="btn-radiants btn-radiants-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a1 1 0 0 1 1 1v5.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7 6.793V1a1 1 0 0 1 1-1z"/>
              <path d="M2 10a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2H3v3h10v-3h-2a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-4z"/>
            </svg>
            {vaultConnected ? 'Export to File' : 'Copy JSON'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-edge-muted bg-surface-muted">
        <div className="flex items-center justify-between">
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="text-xs text-content-link hover:underline flex items-center gap-1"
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
            </svg>
            Settings
          </button>
          <span className="text-xs text-content-muted">
            v1.0.0
          </span>
        </div>
      </footer>
    </div>
  )
}
