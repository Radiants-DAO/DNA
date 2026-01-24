/**
 * RadMark Bookmark Types
 * Data structure for captured tweet bookmarks
 */

export interface TweetAuthor {
  handle: string
  name: string
  avatar: string
}

export interface TweetContent {
  text: string
  media: string[]
  externalLinks: string[]
}

export interface TweetThread {
  parent: RadMarkBookmark | null
  children: RadMarkBookmark[]
}

export interface RadMarkBookmark {
  id: string
  url: string
  author: TweetAuthor
  content: TweetContent
  thread: TweetThread
  quotedTweet: RadMarkBookmark | null
  userContext: string
  suggestedCategory: string
  timestamp: string
  tweetEmbed: string
}

export interface BookmarkStore {
  bookmarks: RadMarkBookmark[]
  bookmarkedIds: Set<string>
}
