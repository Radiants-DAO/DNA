/**
 * RadMark Context Popup
 * Inline floating popup for adding user context and categories to bookmarks
 */

import type { RadMarkBookmark } from '@/types/bookmark'

// Radiants design tokens (inline for content script)
const TOKENS = {
  colorSunYellow: '#FCE184',
  colorBlack: '#0F0E0C',
  colorWarmCloud: '#FEF8E2',
  colorWhite: '#FFFFFF',
  colorContentMuted: 'rgba(15, 14, 12, 0.6)',
  shadowCard: '2px 2px 0 0 #0F0E0C',
  shadowBtn: '0 1px 0 0 #0F0E0C',
  radiusSm: '4px',
  radiusMd: '8px',
}

// Current active popup instance
let activePopup: HTMLElement | null = null
let activeInput: HTMLInputElement | null = null
let activeCategoryDropdown: HTMLElement | null = null
let onSaveCallback: ((context: string, category: string) => void) | null = null
let onCancelCallback: (() => void) | null = null

// Track selected category
let selectedCategory = ''

/**
 * Fetch existing MOC categories from stored bookmarks
 */
async function fetchExistingCategories(): Promise<string[]> {
  const result = await chrome.storage.local.get(['pendingBookmarks'])
  const bookmarks: RadMarkBookmark[] = result.pendingBookmarks || []

  // Extract unique categories from existing bookmarks
  const categories = new Set<string>()
  bookmarks.forEach((b) => {
    if (b.suggestedCategory && b.suggestedCategory.trim()) {
      categories.add(b.suggestedCategory.trim())
    }
  })

  // Also try to get categories from settings if stored
  const settingsResult = await chrome.storage.local.get(['mocCategories'])
  const savedCategories: string[] = settingsResult.mocCategories || []
  savedCategories.forEach((c) => categories.add(c))

  // Add some default categories if none exist
  if (categories.size === 0) {
    return ['AI', 'Development', 'Design', 'Business', 'Personal']
  }

  return Array.from(categories).sort()
}

/**
 * Create the category dropdown element
 */
function createCategoryDropdown(categories: string[]): HTMLElement {
  const dropdown = document.createElement('div')
  dropdown.className = 'radmark-category-dropdown'
  dropdown.style.cssText = `
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: ${TOKENS.colorWhite};
    border: 1px solid ${TOKENS.colorBlack};
    border-radius: ${TOKENS.radiusSm};
    box-shadow: ${TOKENS.shadowCard};
    max-height: 150px;
    overflow-y: auto;
    z-index: 10002;
  `

  categories.forEach((category) => {
    const option = document.createElement('div')
    option.className = 'radmark-category-option'
    option.dataset.category = category
    option.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      font-size: 13px;
      color: ${TOKENS.colorBlack};
      transition: background-color 100ms ease;
    `
    option.textContent = category

    option.addEventListener('mouseenter', () => {
      option.style.backgroundColor = TOKENS.colorSunYellow
    })

    option.addEventListener('mouseleave', () => {
      if (selectedCategory !== category) {
        option.style.backgroundColor = 'transparent'
      }
    })

    option.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      selectCategory(category)
    })

    dropdown.appendChild(option)
  })

  // Add "New category..." option
  const newOption = document.createElement('div')
  newOption.className = 'radmark-category-new'
  newOption.style.cssText = `
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    color: ${TOKENS.colorContentMuted};
    border-top: 1px solid ${TOKENS.colorContentMuted};
    font-style: italic;
  `
  newOption.textContent = '+ New category...'

  newOption.addEventListener('mouseenter', () => {
    newOption.style.backgroundColor = TOKENS.colorWarmCloud
  })

  newOption.addEventListener('mouseleave', () => {
    newOption.style.backgroundColor = 'transparent'
  })

  newOption.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    showNewCategoryInput()
  })

  dropdown.appendChild(newOption)

  return dropdown
}

/**
 * Select a category
 */
function selectCategory(category: string) {
  selectedCategory = category

  // Update the category button text
  const categoryBtn = activePopup?.querySelector('.radmark-category-btn') as HTMLElement
  if (categoryBtn) {
    categoryBtn.textContent = category || 'Category (Tab)'
    if (category) {
      categoryBtn.style.color = TOKENS.colorBlack
      categoryBtn.style.backgroundColor = TOKENS.colorSunYellow
    }
  }

  // Hide dropdown
  hideDropdown()

  // Focus back on input
  activeInput?.focus()
}

/**
 * Show new category input
 */
function showNewCategoryInput() {
  hideDropdown()

  // Create inline input for new category
  const categoryBtn = activePopup?.querySelector('.radmark-category-btn') as HTMLElement
  if (!categoryBtn) return

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = 'New category name...'
  input.style.cssText = `
    width: 100%;
    padding: 6px 10px;
    font-size: 13px;
    border: 1px solid ${TOKENS.colorBlack};
    border-radius: ${TOKENS.radiusSm};
    outline: none;
    background: ${TOKENS.colorWhite};
    color: ${TOKENS.colorBlack};
  `

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      const newCategory = input.value.trim()
      selectedCategory = newCategory
      // Save new category to storage
      saveNewCategory(newCategory)
      // Restore category button
      input.replaceWith(categoryBtn)
      categoryBtn.textContent = newCategory
      categoryBtn.style.color = TOKENS.colorBlack
      categoryBtn.style.backgroundColor = TOKENS.colorSunYellow
      activeInput?.focus()
    } else if (e.key === 'Escape') {
      input.replaceWith(categoryBtn)
      activeInput?.focus()
    }
  })

  input.addEventListener('blur', () => {
    if (input.parentElement) {
      input.replaceWith(categoryBtn)
    }
  })

  categoryBtn.replaceWith(input)
  input.focus()
}

/**
 * Save new category to storage
 */
async function saveNewCategory(category: string) {
  const result = await chrome.storage.local.get(['mocCategories'])
  const categories: string[] = result.mocCategories || []
  if (!categories.includes(category)) {
    categories.push(category)
    await chrome.storage.local.set({ mocCategories: categories })
  }
}

/**
 * Show the category dropdown
 */
function showDropdown() {
  if (activeCategoryDropdown) {
    activeCategoryDropdown.style.display = 'block'
  }
}

/**
 * Hide the category dropdown
 */
function hideDropdown() {
  if (activeCategoryDropdown) {
    activeCategoryDropdown.style.display = 'none'
  }
}

/**
 * Toggle the category dropdown
 */
function toggleDropdown() {
  if (activeCategoryDropdown) {
    if (activeCategoryDropdown.style.display === 'none') {
      showDropdown()
    } else {
      hideDropdown()
    }
  }
}

/**
 * Create the context popup element
 */
async function createContextPopup(): Promise<HTMLElement> {
  const popup = document.createElement('div')
  popup.className = 'radmark-context-popup'
  popup.style.cssText = `
    position: absolute;
    z-index: 10001;
    width: 280px;
    padding: 12px;
    background: ${TOKENS.colorWarmCloud};
    border: 1px solid ${TOKENS.colorBlack};
    border-radius: ${TOKENS.radiusMd};
    box-shadow: ${TOKENS.shadowCard};
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `

  // Header
  const header = document.createElement('div')
  header.style.cssText = `
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    color: ${TOKENS.colorBlack};
  `
  header.textContent = 'Add context'
  popup.appendChild(header)

  // Input field
  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = 'Add a note about this bookmark...'
  input.className = 'radmark-context-input'
  input.style.cssText = `
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
    border: 1px solid ${TOKENS.colorBlack};
    border-radius: ${TOKENS.radiusSm};
    outline: none;
    background: ${TOKENS.colorWhite};
    color: ${TOKENS.colorBlack};
    transition: border-color 100ms ease, box-shadow 100ms ease;
  `

  input.addEventListener('focus', () => {
    input.style.borderColor = TOKENS.colorSunYellow
    input.style.boxShadow = `0 0 0 2px ${TOKENS.colorSunYellow}`
  })

  input.addEventListener('blur', () => {
    input.style.borderColor = TOKENS.colorBlack
    input.style.boxShadow = 'none'
    // Auto-save on blur (after a short delay to allow for click events)
    setTimeout(() => {
      if (!activePopup) return // Already closed
      handleSave()
    }, 150)
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      toggleDropdown()
    }
  })

  popup.appendChild(input)
  activeInput = input

  // Category button container
  const categoryContainer = document.createElement('div')
  categoryContainer.style.cssText = `
    position: relative;
    margin-top: 8px;
  `

  // Category button
  const categoryBtn = document.createElement('button')
  categoryBtn.type = 'button'
  categoryBtn.className = 'radmark-category-btn'
  categoryBtn.style.cssText = `
    width: 100%;
    padding: 6px 10px;
    font-size: 12px;
    text-align: left;
    border: 1px solid ${TOKENS.colorBlack};
    border-radius: ${TOKENS.radiusSm};
    background: ${TOKENS.colorWhite};
    color: ${TOKENS.colorContentMuted};
    cursor: pointer;
    transition: transform 100ms ease, box-shadow 100ms ease;
    box-shadow: ${TOKENS.shadowBtn};
  `
  categoryBtn.textContent = 'Category (Tab)'

  categoryBtn.addEventListener('mouseenter', () => {
    categoryBtn.style.transform = 'translateY(-1px)'
    categoryBtn.style.boxShadow = '0 2px 0 0 #0F0E0C'
  })

  categoryBtn.addEventListener('mouseleave', () => {
    categoryBtn.style.transform = 'translateY(0)'
    categoryBtn.style.boxShadow = TOKENS.shadowBtn
  })

  categoryBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleDropdown()
  })

  categoryContainer.appendChild(categoryBtn)

  // Fetch categories and create dropdown
  const categories = await fetchExistingCategories()
  const dropdown = createCategoryDropdown(categories)
  categoryContainer.appendChild(dropdown)
  activeCategoryDropdown = dropdown

  popup.appendChild(categoryContainer)

  // Hint text
  const hint = document.createElement('div')
  hint.style.cssText = `
    margin-top: 8px;
    font-size: 11px;
    color: ${TOKENS.colorContentMuted};
  `
  hint.innerHTML = '<kbd style="background:#fff;border:1px solid #ccc;padding:1px 4px;border-radius:2px;font-family:inherit;">Enter</kbd> save &nbsp; <kbd style="background:#fff;border:1px solid #ccc;padding:1px 4px;border-radius:2px;font-family:inherit;">Esc</kbd> cancel'
  popup.appendChild(hint)

  // Handle click outside
  const handleClickOutside = (e: MouseEvent) => {
    if (activePopup && !activePopup.contains(e.target as Node)) {
      handleSave()
    }
  }

  // Add click listener with a slight delay to avoid immediate triggering
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
  }, 100)

  // Store cleanup function
  ;(popup as any)._cleanup = () => {
    document.removeEventListener('click', handleClickOutside)
  }

  return popup
}

/**
 * Handle save action
 */
function handleSave() {
  if (activePopup && onSaveCallback && activeInput) {
    const context = activeInput.value.trim()
    onSaveCallback(context, selectedCategory)
  }
  closePopup()
}

/**
 * Handle cancel action
 */
function handleCancel() {
  if (onCancelCallback) {
    onCancelCallback()
  }
  closePopup()
}

/**
 * Close the popup
 */
function closePopup() {
  if (activePopup) {
    // Call cleanup function
    if ((activePopup as any)._cleanup) {
      (activePopup as any)._cleanup()
    }
    activePopup.remove()
    activePopup = null
    activeInput = null
    activeCategoryDropdown = null
    onSaveCallback = null
    onCancelCallback = null
    selectedCategory = ''
  }
}

/**
 * Show the context popup near the given button element
 */
export async function showContextPopup(
  buttonElement: HTMLElement,
  onSave: (context: string, category: string) => void,
  onCancel?: () => void
): Promise<void> {
  // Close any existing popup
  closePopup()

  // Store callbacks
  onSaveCallback = onSave
  onCancelCallback = onCancel || null

  // Create popup
  const popup = await createContextPopup()
  activePopup = popup

  // Calculate position
  const buttonRect = buttonElement.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Position popup to the right of the button, or left if not enough space
  let left = buttonRect.right + 8
  let top = buttonRect.top

  // Check if popup would go off screen to the right
  if (left + 280 > viewportWidth) {
    left = buttonRect.left - 280 - 8
  }

  // Check if popup would go off screen at the bottom
  if (top + 200 > viewportHeight) {
    top = viewportHeight - 220
  }

  // Ensure not above viewport
  if (top < 10) {
    top = 10
  }

  // Apply fixed positioning relative to viewport
  popup.style.position = 'fixed'
  popup.style.left = `${left}px`
  popup.style.top = `${top}px`

  // Add to document
  document.body.appendChild(popup)

  // Focus input
  setTimeout(() => {
    activeInput?.focus()
  }, 50)
}

/**
 * Check if a popup is currently active
 */
export function isPopupActive(): boolean {
  return activePopup !== null
}
