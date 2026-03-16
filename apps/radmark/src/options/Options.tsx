import { useState, useEffect, useCallback, useRef } from 'react'
import type { RadMarkSettings } from '@/types/settings'
import {
  isFileSystemSupported,
  requestVaultAccess,
  hasVaultAccess,
  getVaultHandle,
  clearVaultAccess,
  syncBookmarks,
  clearAllBookmarks,
} from '@/storage'

const defaultSettings: RadMarkSettings = {
  vaultPath: '',
  keyboardShortcut: 'r',
  clipboardFallback: true,
}

export function Options() {
  const [settings, setSettings] = useState<RadMarkSettings>(defaultSettings)
  const [saved, setSaved] = useState(false)
  const [vaultStatus, setVaultStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [vaultName, setVaultName] = useState<string>('')
  const [fileSystemSupported] = useState(isFileSystemSupported())
  const [isCapturingShortcut, setIsCapturingShortcut] = useState(false)
  const shortcutInputRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [isClearing, setIsClearing] = useState(false)

  // Check vault access status
  const checkVaultStatus = useCallback(async () => {
    const connected = await hasVaultAccess()
    setVaultStatus(connected ? 'connected' : 'disconnected')

    if (connected) {
      const handle = await getVaultHandle()
      if (handle) {
        setVaultName(handle.name)
      }
    } else {
      setVaultName('')
    }
  }, [])

  useEffect(() => {
    chrome.storage.sync.get(['settings'], (result) => {
      if (result.settings) {
        setSettings({ ...defaultSettings, ...result.settings })
      }
    })

    // Check vault status on mount
    checkVaultStatus()

    // Load pending bookmark count
    chrome.storage.local.get(['pendingBookmarks'], (result) => {
      setPendingCount(result.pendingBookmarks?.length || 0)
    })
  }, [checkVaultStatus])

  // Listen for bookmark count changes
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.pendingBookmarks) {
        setPendingCount(changes.pendingBookmarks.newValue?.length || 0)
      }
    }
    chrome.storage.local.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.local.onChanged.removeListener(handleStorageChange)
  }, [])

  const handleConnectVault = async () => {
    const success = await requestVaultAccess()
    if (success) {
      await checkVaultStatus()
      // Sync bookmarks after connecting
      await syncBookmarks()
    }
  }

  const handleDisconnectVault = async () => {
    await clearVaultAccess()
    setVaultStatus('disconnected')
    setVaultName('')
  }

  const handleSave = () => {
    chrome.storage.sync.set({ settings }, () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const handleResetToDefaults = () => {
    setSettings(defaultSettings)
    chrome.storage.sync.set({ settings: defaultSettings }, () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const handleClearAllData = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      // Auto-reset confirmation after 5 seconds
      setTimeout(() => setConfirmClear(false), 5000)
      return
    }

    setIsClearing(true)
    await clearAllBookmarks()
    setIsClearing(false)
    setConfirmClear(false)
    setPendingCount(0)
  }

  const handleChange = (key: keyof RadMarkSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleShortcutCapture = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    // Ignore modifier keys by themselves
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      return
    }

    // Get the key (lowercase for letters)
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key

    // Only allow single character keys
    if (key.length === 1 && /^[a-z0-9]$/i.test(key)) {
      handleChange('keyboardShortcut', key)
      setIsCapturingShortcut(false)
      shortcutInputRef.current?.blur()
    }
  }

  const startShortcutCapture = () => {
    setIsCapturingShortcut(true)
    shortcutInputRef.current?.focus()
  }

  const cancelShortcutCapture = () => {
    setIsCapturingShortcut(false)
    shortcutInputRef.current?.blur()
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      {/* Header with logo */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <img
            src="/icons/rad-mark-yellow.svg"
            alt="RadMark"
            className="w-8 h-8"
          />
          <h1 className="text-2xl font-semibold text-main">RadMark Settings</h1>
        </div>
        <p className="text-sm text-mute">
          Configure your RadMark extension preferences
        </p>
      </header>

      <div className="space-y-6">
        {/* Vault Connection Section */}
        <section>
          <h2 className="text-xs font-medium text-mute uppercase tracking-wide mb-3">
            Storage
          </h2>
          <div className="card-radiants p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-medium text-main">Obsidian Vault</span>
                <span className="block text-xs text-mute mt-1 mb-3">
                  Connect to your Obsidian vault to save bookmarks as JSON files
                </span>
              </div>
              {vaultStatus === 'connected' && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-success text-main rounded border border-line">
                  Connected
                </span>
              )}
            </div>

            {!fileSystemSupported ? (
              <div className="p-3 bg-depth rounded border border-rule">
                <p className="text-xs text-mute">
                  File System Access API is not supported in this browser.
                  Bookmarks will be stored in browser storage only.
                </p>
              </div>
            ) : vaultStatus === 'checking' ? (
              <div className="text-sm text-mute">Checking vault access...</div>
            ) : vaultStatus === 'connected' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-depth rounded border border-rule">
                  <svg className="w-4 h-4 text-success flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4z"/>
                    <path d="M5 7h6v1H5V7zm0 2h4v1H5V9z"/>
                  </svg>
                  <span className="text-sm text-main font-medium truncate">{vaultName}</span>
                  <span className="text-xs text-mute flex-shrink-0">/.pending/bookmarks.json</span>
                </div>
                <button
                  onClick={handleDisconnectVault}
                  className="text-xs text-link hover:underline"
                >
                  Disconnect vault
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-mute">
                  Select your Obsidian vault&apos;s bookmark folder. RadMark will create a
                  <code className="mx-1 px-1 py-0.5 bg-depth rounded text-xs">.pending</code>
                  folder to store bookmarks.
                </p>
                <button
                  onClick={handleConnectVault}
                  className="btn-radiants btn-radiants-primary"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4z"/>
                    <path d="M8 5a.5.5 0 0 1 .5.5v2h2a.5.5 0 0 1 0 1h-2v2a.5.5 0 0 1-1 0v-2h-2a.5.5 0 0 1 0-1h2v-2A.5.5 0 0 1 8 5z"/>
                  </svg>
                  Connect Vault Folder
                </button>
              </div>
            )}
          </div>

          {/* Manual vault path input */}
          <div className="card-radiants p-4 mt-3">
            <label className="block">
              <span className="text-sm font-medium text-main">Manual Vault Path</span>
              <span className="block text-xs text-mute mt-1 mb-2">
                Reference path for Claude prompt (used when &quot;Copy Prompt&quot; is clicked)
              </span>
              <input
                type="text"
                value={settings.vaultPath}
                onChange={(e) => handleChange('vaultPath', e.target.value)}
                placeholder="/path/to/your/vault/bookmark"
                className="input-radiants"
              />
            </label>
          </div>
        </section>

        {/* Keyboard Shortcuts Section */}
        <section>
          <h2 className="text-xs font-medium text-mute uppercase tracking-wide mb-3">
            Keyboard Shortcuts
          </h2>
          <div className="card-radiants p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-sm font-medium text-main">Bookmark Shortcut</span>
                <span className="block text-xs text-mute mt-1">
                  Press this key when a tweet is focused to toggle RadMark bookmark.
                  Use <kbd className="px-1.5 py-0.5 bg-depth border border-rule rounded text-xs font-mono">Alt</kbd> + key to open context popup.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isCapturingShortcut ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={shortcutInputRef}
                      type="text"
                      value=""
                      onKeyDown={handleShortcutCapture}
                      onBlur={cancelShortcutCapture}
                      placeholder="Press key..."
                      className="input-radiants w-24 text-center text-sm animate-pulse"
                      autoFocus
                    />
                    <button
                      onClick={cancelShortcutCapture}
                      className="text-xs text-mute hover:text-main"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startShortcutCapture}
                    className="flex items-center gap-2 px-3 py-2 bg-depth border border-line rounded hover:bg-card transition-colors"
                    title="Click to change shortcut"
                  >
                    <kbd className="px-2 py-1 bg-accent text-main border border-line rounded font-mono text-sm font-bold min-w-[32px] text-center">
                      {settings.keyboardShortcut.toUpperCase()}
                    </kbd>
                    <svg className="w-3 h-3 text-mute" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5z"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Behavior Section */}
        <section>
          <h2 className="text-xs font-medium text-mute uppercase tracking-wide mb-3">
            Behavior
          </h2>
          <div className="card-radiants p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.clipboardFallback}
                onChange={(e) => handleChange('clipboardFallback', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-accent cursor-pointer"
              />
              <span>
                <span className="text-sm font-medium text-main">Clipboard Fallback</span>
                <span className="block text-xs text-mute mt-1">
                  Copy bookmark data to clipboard if file system access fails or is unavailable
                </span>
              </span>
            </label>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-xs font-medium text-danger uppercase tracking-wide mb-3">
            Danger Zone
          </h2>
          <div className="card-radiants p-4 border-danger">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-sm font-medium text-main">Clear All Pending Bookmarks</span>
                <span className="block text-xs text-mute mt-1">
                  Permanently delete all {pendingCount} pending bookmark{pendingCount !== 1 ? 's' : ''} from storage. This cannot be undone.
                </span>
              </div>
              <button
                onClick={handleClearAllData}
                disabled={pendingCount === 0 || isClearing}
                className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                  confirmClear
                    ? 'bg-danger text-white border-danger hover:opacity-90'
                    : pendingCount === 0
                    ? 'bg-depth text-mute border-rule cursor-not-allowed'
                    : 'bg-page text-danger border-danger hover:bg-danger hover:text-white'
                }`}
              >
                {isClearing ? 'Clearing...' : confirmClear ? 'Click to Confirm' : 'Clear All Data'}
              </button>
            </div>
            {confirmClear && (
              <div className="mt-3 p-3 bg-danger/10 border border-danger rounded text-xs text-danger">
                <strong>Warning:</strong> This will permanently delete all pending bookmarks from both browser storage and your vault file. Click the button again to confirm.
              </div>
            )}
          </div>
        </section>

        {/* Actions */}
        <section className="pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handleSave} className="btn-radiants btn-radiants-primary">
                Save Settings
              </button>
              {saved && (
                <span className="text-sm text-success flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                  Saved!
                </span>
              )}
            </div>
            <button
              onClick={handleResetToDefaults}
              className="text-xs text-mute hover:text-main hover:underline"
            >
              Reset to defaults
            </button>
          </div>
        </section>

        {/* About Section */}
        <section className="pt-4 mt-4 border-t border-rule">
          <div className="flex items-center justify-between text-xs text-mute">
            <div className="flex items-center gap-4">
              <span>RadMark v0.1.0</span>
              <a
                href="https://github.com/radmark/radmark"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:underline"
              >
                GitHub
              </a>
            </div>
            <span>Save X/Twitter bookmarks to Obsidian</span>
          </div>
        </section>
      </div>
    </div>
  )
}
