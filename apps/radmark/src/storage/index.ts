/**
 * RadMark Storage Module
 * Exports file storage utilities for JSON bookmark persistence
 */

export {
  isFileSystemSupported,
  requestVaultAccess,
  hasVaultAccess,
  getVaultHandle,
  readBookmarksFromFile,
  writeBookmarksToFile,
  copyToClipboard,
  syncBookmarks,
  addBookmarkToStorage,
  removeBookmarkFromStorage,
  getBookmarkedIds,
  clearVaultAccess,
  clearAllBookmarks,
} from './fileStorage'
