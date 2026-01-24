/**
 * RadMark Bookmark Processing Prompt
 * Generates the Claude prompt for processing pending bookmarks into Obsidian notes
 */

import type { RadMarkBookmark } from '@/types/bookmark'

/**
 * Generate the full processing prompt
 * @param vaultPath - Path to the Obsidian vault
 * @param bookmarks - Optional bookmarks to embed (for "Copy + Data" mode)
 */
export function generateProcessingPrompt(
  vaultPath: string,
  bookmarks?: RadMarkBookmark[]
): string {
  const includeData = bookmarks && bookmarks.length > 0

  const prompt = `# RadMark Bookmark Processor

You are processing Twitter/X bookmarks captured by RadMark into organized Obsidian notes.

## Vault Structure
- **Vault path**: ${vaultPath || '{your-vault-path}/bookmark'}
- **Pending bookmarks**: .pending/bookmarks.json
- **Output notes**: bookmarks/
- **MOC files**: MOCs/
- **Template**: templates/bookmark.md

## Processing Steps

### Step 1: Read Pending Bookmarks
${includeData
  ? 'The bookmarks are provided below in this prompt.'
  : `Read the pending bookmarks from \`${vaultPath || '{vault}'}/.pending/bookmarks.json\`.`
}

If there are no bookmarks to process, report "No pending bookmarks to process" and stop.

### Step 2: For Each Bookmark

#### 2a. Fetch External Content
For each external link in the bookmark:
- Fetch the URL and extract key information
- For GitHub repos: Get description, stars, language, README summary
- For articles: Get title, author, publication, key points
- For tools/products: Get name, description, pricing info
- If fetch fails, note "Unable to fetch [URL]" and continue

#### 2b. Generate Title
Create a descriptive title based on:
- Main topic or subject matter
- Key insight or takeaway
- NOT just the author's name
- Format: "Title Case with Meaningful Keywords"

Examples:
- "Claude AI Best Practices from Anthropic Engineer"
- "Obsidian Plugin for Academic Paper Management"
- "Thread on Startup Fundraising Strategies"

#### 2c. Determine Category (MOC)
Analyze the bookmark content to determine the most appropriate category:
1. Check existing MOCs in the MOCs/ folder
2. If content fits an existing MOC, use it
3. If content doesn't fit, create a new MOC (ask user first)
4. Default categories: AI, Development, Design, Business, Personal, Tools

#### 2d. Create Obsidian Note
Create a markdown file in \`bookmarks/\` with this structure:

\`\`\`markdown
---
title: "[Generated Title]"
source: "[Tweet URL]"
author: "@[handle]"
date: [YYYY-MM-DD]
tags: [tag1, tag2, tag3]
moc: "[[MOC Name]]"
tweet_id: "[ID]"
---

## Summary
[2-3 sentence summary of the bookmark's key insight or value]

## Content
[Original tweet text]

[If thread context exists:]
### Thread Context
> **Parent tweet:**
> [Parent tweet text]

> **Thread continuation:**
> [Child tweets as numbered list]

[If quoted tweet exists:]
### Quoted Tweet
> @[quoted_author]: [quoted text]
> [View original](quoted_url)

## External Links
[For each external link:]
- **[Link Title]** ([domain])
  [1-2 sentence summary of what this resource is]

## Media
[List any media URLs for embedding]

## My Notes
[User's context note from the extension]

---
*Bookmarked via RadMark on [date]*
\`\`\`

#### 2e. Update MOC
Add a backlink to the new note in the appropriate MOC file:
- Find the "## Notes" section in the MOC
- Add: \`- [[Note Title]] - [one-line description]\`
- If MOC doesn't exist, create it with standard structure

### Step 3: Report Summary
After processing all bookmarks, provide a summary:

\`\`\`
## Processing Complete

### Created Notes (X)
1. [[Note Title 1]] -> [[MOC Name]]
2. [[Note Title 2]] -> [[MOC Name]]
...

### Updated MOCs
- [[AI]] - Added X new links
- [[Development]] - Added X new link
- [[Tools]] (NEW) - Created with X links

### Issues
- [URL] - Fetch failed (404)
- [Tweet ID] - Missing author info

### Pending Actions
- [ ] Review the created notes
- [ ] Verify MOC categorizations
- [ ] Confirm cleanup of processed bookmarks
\`\`\`

### Step 4: Await User Confirmation
Before proceeding to cleanup, ask:

> "I've processed X bookmarks into Obsidian notes. Please review the created files and confirm:
> 1. Are the note titles appropriate?
> 2. Are the MOC categorizations correct?
> 3. Should I proceed to remove these from the pending queue?"

### Step 5: Cleanup (After Confirmation)
Only after user confirms:
1. Read current \`.pending/bookmarks.json\`
2. Remove the processed bookmark IDs
3. Write updated JSON back
4. Report: "Removed X processed bookmarks from pending queue. Y bookmarks remaining."

## Error Handling

### URL Fetch Failures
- Note the URL in the External Links section as "Unable to fetch"
- Continue processing other parts of the bookmark
- Include in Issues summary

### Missing Data
- Skip optional fields gracefully
- Log warning in Issues summary
- Never fail entire processing for one bad field

### Duplicate Detection
- Check if note with same tweet ID exists in bookmarks/
- If exists, update existing note instead of creating duplicate
- Note update in summary

## Important Notes
- Always use wiki-link format: \`[[Note Name]]\`
- Preserve emoji in tweet content
- Use relative paths within vault
- Respect existing MOC structure and naming
- Never delete user-added content in existing notes
${includeData ? `

## Bookmarks to Process

<bookmarks>
${JSON.stringify(bookmarks, null, 2)}
</bookmarks>

Proceed with Step 2 for each bookmark above.` : `

## Getting Started
First, read the pending bookmarks from:
\`${vaultPath || '{vault}'}/.pending/bookmarks.json\`

Then proceed with Step 2 for each bookmark.`}
`

  return prompt
}

/**
 * Generate a minimal prompt (just the essential instructions)
 */
export function generateMinimalPrompt(vaultPath: string): string {
  return `Process pending RadMark bookmarks from:
${vaultPath || '{vault}'}/.pending/bookmarks.json

For each bookmark:
1. Fetch and summarize external URLs
2. Generate a descriptive title
3. Determine MOC category
4. Create Obsidian note with YAML frontmatter
5. Update MOCs with backlinks

After processing, show summary and ask for confirmation before cleanup.`
}
