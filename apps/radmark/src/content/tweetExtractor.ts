/**
 * RadMark Tweet Extractor
 * Captures tweet data and thread context from Twitter/X DOM
 */

import type { RadMarkBookmark, TweetAuthor, TweetContent } from '@/types/bookmark'

/**
 * Extract author information from a tweet article
 */
export function extractAuthor(article: Element): TweetAuthor {
  // Find the author link (has both handle and display name)
  const userLinks = article.querySelectorAll('a[href^="/"]')
  let handle = '@unknown'
  let name = 'Unknown'
  let avatar = ''

  for (const link of userLinks) {
    const href = link.getAttribute('href') || ''
    // User profile links are just /@handle or /handle (not /status/, /hashtag/, etc.)
    if (href && !href.includes('/') || (href.match(/^\/[^/]+$/) && !href.startsWith('/i/'))) {
      // Check if this link contains the avatar image
      const img = link.querySelector('img')
      if (img) {
        avatar = img.getAttribute('src') || ''
      }

      // Get the handle from the href
      const possibleHandle = href.replace('/', '')
      if (possibleHandle && !possibleHandle.includes('/')) {
        handle = `@${possibleHandle}`
        break
      }
    }
  }

  // Find display name - it's typically in the first user cell
  const userNameElement = article.querySelector('[data-testid="User-Name"]')
  if (userNameElement) {
    // The display name is the first text span, handle is the second
    const spans = userNameElement.querySelectorAll('span')
    for (const span of spans) {
      const text = span.textContent || ''
      if (text.startsWith('@')) {
        handle = text
      } else if (text && !text.includes('@') && !text.includes('·') && text.length > 0) {
        // This might be the display name - take the first non-empty, non-@ text
        if (name === 'Unknown') {
          name = text
        }
      }
    }
  }

  // Try to find avatar in the tweet header if not found yet
  if (!avatar) {
    const avatarImg = article.querySelector('img[draggable="true"]')
    if (avatarImg) {
      avatar = avatarImg.getAttribute('src') || ''
    }
  }

  return { handle, name, avatar }
}

/**
 * Extract tweet text content
 */
export function extractTweetText(article: Element): string {
  // Tweet text is in a div with data-testid="tweetText"
  const tweetTextElement = article.querySelector('[data-testid="tweetText"]')
  if (!tweetTextElement) {
    return ''
  }

  // Get the text content, preserving line breaks
  let text = ''
  const walker = document.createTreeWalker(
    tweetTextElement,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    null
  )

  let node: Node | null
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      // Handle line breaks
      if (element.tagName === 'BR') {
        text += '\n'
      }
      // Handle emojis (they're in img tags)
      if (element.tagName === 'IMG' && element.getAttribute('alt')) {
        text += element.getAttribute('alt')
      }
    }
  }

  return text.trim()
}

/**
 * Extract media URLs from a tweet
 */
export function extractMedia(article: Element): string[] {
  const mediaUrls: string[] = []

  // Find images in the tweet
  const mediaContainer = article.querySelector('[data-testid="tweetPhoto"]')?.closest('div[aria-label]')
  if (mediaContainer) {
    const images = mediaContainer.querySelectorAll('img')
    images.forEach((img) => {
      const src = img.getAttribute('src')
      if (src && src.includes('pbs.twimg.com/media')) {
        // Get the highest quality version
        const highQualitySrc = src.replace(/\?.*$/, '?format=jpg&name=large')
        mediaUrls.push(highQualitySrc)
      }
    })
  }

  // Find video posters
  const videoContainers = article.querySelectorAll('[data-testid="videoPlayer"]')
  videoContainers.forEach((container) => {
    const poster = container.querySelector('video')?.getAttribute('poster')
    if (poster) {
      mediaUrls.push(poster)
    }
  })

  // Also check for media in the general tweet area
  const allImages = article.querySelectorAll('img[src*="pbs.twimg.com/media"]')
  allImages.forEach((img) => {
    const src = img.getAttribute('src')
    if (src && !mediaUrls.some(url => url.includes(src.split('?')[0]))) {
      const highQualitySrc = src.replace(/\?.*$/, '?format=jpg&name=large')
      mediaUrls.push(highQualitySrc)
    }
  })

  return [...new Set(mediaUrls)] // Remove duplicates
}

/**
 * Extract external links from tweet content
 */
export function extractExternalLinks(article: Element): string[] {
  const links: string[] = []

  // Find the tweet text element
  const tweetText = article.querySelector('[data-testid="tweetText"]')
  if (!tweetText) {
    return links
  }

  // Find all links in the tweet text
  const anchors = tweetText.querySelectorAll('a')
  anchors.forEach((anchor) => {
    const href = anchor.getAttribute('href') || ''

    // Skip Twitter internal links (hashtags, mentions, etc.)
    if (href.startsWith('/') || href.includes('twitter.com') || href.includes('x.com')) {
      return
    }

    // Expand t.co links - the display text often shows the actual URL
    if (href.includes('t.co')) {
      // Try to get the expanded URL from data attributes or display text
      const expandedUrl = anchor.getAttribute('data-expanded-url') ||
                         anchor.getAttribute('title') ||
                         anchor.textContent?.trim()
      if (expandedUrl && (expandedUrl.startsWith('http') || expandedUrl.includes('.'))) {
        links.push(expandedUrl)
      } else {
        links.push(href)
      }
    } else if (href.startsWith('http')) {
      links.push(href)
    }
  })

  // Also look for card links (link previews)
  const cardLinks = article.querySelectorAll('[data-testid="card.wrapper"] a')
  cardLinks.forEach((anchor) => {
    const href = anchor.getAttribute('href') || ''
    if (href && !href.includes('twitter.com') && !href.includes('x.com') && !links.includes(href)) {
      if (href.includes('t.co')) {
        const title = anchor.getAttribute('title')
        if (title && title.startsWith('http')) {
          links.push(title)
        } else {
          links.push(href)
        }
      } else if (href.startsWith('http')) {
        links.push(href)
      }
    }
  })

  return [...new Set(links)] // Remove duplicates
}

/**
 * Extract content from a tweet article
 */
export function extractContent(article: Element): TweetContent {
  return {
    text: extractTweetText(article),
    media: extractMedia(article),
    externalLinks: extractExternalLinks(article),
  }
}

/**
 * Extract tweet ID from an article element
 */
export function extractTweetId(article: Element): string | null {
  const tweetLink = article.querySelector('a[href*="/status/"]')
  if (tweetLink) {
    const href = tweetLink.getAttribute('href')
    const match = href?.match(/\/status\/(\d+)/)
    if (match) {
      return match[1]
    }
  }
  return null
}

/**
 * Extract tweet URL from an article element
 */
export function extractTweetUrl(article: Element): string {
  const tweetLink = article.querySelector('a[href*="/status/"]') as HTMLAnchorElement
  if (tweetLink) {
    const href = tweetLink.getAttribute('href')
    if (href) {
      // Normalize to full URL
      if (href.startsWith('/')) {
        return `https://x.com${href}`
      }
      return href
    }
  }
  return ''
}

/**
 * Generate a blockquote embed for the tweet
 */
export function generateTweetEmbed(tweetId: string, author: TweetAuthor, text: string): string {
  return `<blockquote class="twitter-tweet" data-conversation="none">
<p>${text}</p>
&mdash; ${author.name} (${author.handle})
<a href="https://x.com/${author.handle.replace('@', '')}/status/${tweetId}">View on X</a>
</blockquote>`
}

/**
 * Extract quoted tweet data if present
 */
export function extractQuotedTweet(article: Element): RadMarkBookmark | null {
  // Quoted tweets are in a nested article or a specific container
  const quotedTweetContainer = article.querySelector('[data-testid="quoteTweet"]')
  if (!quotedTweetContainer) {
    return null
  }

  // Find the quoted tweet article
  const quotedArticle = quotedTweetContainer.querySelector('article') || quotedTweetContainer

  const author = extractAuthor(quotedArticle)
  const content = extractContent(quotedArticle)
  const tweetId = extractTweetId(quotedArticle) || `quoted-${Date.now()}`
  const url = extractTweetUrl(quotedArticle)

  return {
    id: tweetId,
    url: url || `https://x.com/i/status/${tweetId}`,
    author,
    content,
    thread: {
      parent: null,
      children: [],
    },
    quotedTweet: null,
    userContext: '',
    suggestedCategory: '',
    timestamp: new Date().toISOString(),
    tweetEmbed: generateTweetEmbed(tweetId, author, content.text),
  }
}

/**
 * Check if two handles belong to the same author
 */
function isSameAuthor(handle1: string, handle2: string): boolean {
  const normalize = (h: string) => h.toLowerCase().replace('@', '')
  return normalize(handle1) === normalize(handle2)
}

/**
 * Find thread context - parent and children from the same author
 * This is a best-effort extraction from the current DOM state
 */
export function extractThreadContext(
  article: Element,
  currentAuthor: TweetAuthor
): { parent: RadMarkBookmark | null; children: RadMarkBookmark[] } {
  const result = {
    parent: null as RadMarkBookmark | null,
    children: [] as RadMarkBookmark[],
  }

  // Get all tweet articles on the page
  const allArticles = document.querySelectorAll('article[data-testid="tweet"]')
  const currentTweetId = extractTweetId(article)

  if (!currentTweetId) {
    return result
  }

  // Find the index of the current tweet
  let currentIndex = -1
  for (let i = 0; i < allArticles.length; i++) {
    if (extractTweetId(allArticles[i]) === currentTweetId) {
      currentIndex = i
      break
    }
  }

  if (currentIndex === -1) {
    return result
  }

  // Look for parent tweet (immediately before, same author)
  if (currentIndex > 0) {
    const prevArticle = allArticles[currentIndex - 1]
    const prevAuthor = extractAuthor(prevArticle)

    // Only capture parent if it's from the same author (indicates thread)
    if (isSameAuthor(prevAuthor.handle, currentAuthor.handle)) {
      const content = extractContent(prevArticle)
      const tweetId = extractTweetId(prevArticle)

      if (tweetId) {
        result.parent = {
          id: tweetId,
          url: extractTweetUrl(prevArticle) || `https://x.com/i/status/${tweetId}`,
          author: prevAuthor,
          content,
          thread: { parent: null, children: [] },
          quotedTweet: null,
          userContext: '',
          suggestedCategory: '',
          timestamp: new Date().toISOString(),
          tweetEmbed: generateTweetEmbed(tweetId, prevAuthor, content.text),
        }
      }
    }
  }

  // Look for children tweets (immediately after, same author)
  for (let i = currentIndex + 1; i < allArticles.length && i <= currentIndex + 3; i++) {
    const nextArticle = allArticles[i]
    const nextAuthor = extractAuthor(nextArticle)

    if (isSameAuthor(nextAuthor.handle, currentAuthor.handle)) {
      const content = extractContent(nextArticle)
      const tweetId = extractTweetId(nextArticle)

      if (tweetId) {
        result.children.push({
          id: tweetId,
          url: extractTweetUrl(nextArticle) || `https://x.com/i/status/${tweetId}`,
          author: nextAuthor,
          content,
          thread: { parent: null, children: [] },
          quotedTweet: null,
          userContext: '',
          suggestedCategory: '',
          timestamp: new Date().toISOString(),
          tweetEmbed: generateTweetEmbed(tweetId, nextAuthor, content.text),
        })
      }
    } else {
      // Different author means thread ended
      break
    }
  }

  return result
}

/**
 * Extract all tweet data from an article element
 */
export function extractTweetData(article: Element): RadMarkBookmark | null {
  const tweetId = extractTweetId(article)
  if (!tweetId) {
    return null
  }

  const author = extractAuthor(article)
  const content = extractContent(article)
  const url = extractTweetUrl(article)
  const quotedTweet = extractQuotedTweet(article)
  const thread = extractThreadContext(article, author)

  return {
    id: tweetId,
    url: url || `https://x.com/i/status/${tweetId}`,
    author,
    content,
    thread,
    quotedTweet,
    userContext: '',
    suggestedCategory: '',
    timestamp: new Date().toISOString(),
    tweetEmbed: generateTweetEmbed(tweetId, author, content.text),
  }
}

/**
 * Find the tweet article element by tweet ID
 */
export function findTweetArticle(tweetId: string): Element | null {
  const articles = document.querySelectorAll('article[data-testid="tweet"]')
  for (const article of articles) {
    const id = extractTweetId(article)
    if (id === tweetId) {
      return article
    }
  }
  return null
}
