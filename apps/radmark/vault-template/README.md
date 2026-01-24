# RadMark Vault Template

This folder structure is designed for use with the RadMark Chrome extension and Obsidian.

## Setup

1. Copy this entire `vault-template` folder to your Obsidian vault
2. Rename it to `bookmark` (or your preferred name)
3. In the RadMark extension settings, connect to this folder

## Folder Structure

```
bookmark/
├── .pending/           # RadMark stores pending bookmarks here
│   └── bookmarks.json  # JSON file with unprocessed bookmarks
├── bookmarks/          # Processed bookmark notes go here
├── MOCs/               # Maps of Content (category indexes)
│   ├── AI.md
│   ├── Business.md
│   ├── Design.md
│   ├── Development.md
│   ├── Personal.md
│   └── Tools.md
└── templates/          # Note templates
    └── bookmark.md     # Template for bookmark notes
```

## How It Works

1. **Capture**: Use RadMark button on Twitter/X to save tweets
2. **Store**: Bookmarks are saved to `.pending/bookmarks.json`
3. **Process**: Copy the Claude prompt from RadMark popup and paste into Claude
4. **Organize**: Claude creates notes in `bookmarks/` and updates MOCs
5. **Cleanup**: After confirming, processed bookmarks are removed from pending

## MOCs (Maps of Content)

MOCs are index files that link to related bookmark notes:

- **AI** - Machine learning, LLMs, AI tools
- **Development** - Programming, web dev, engineering
- **Design** - UI/UX, design systems, visual design
- **Business** - Startups, product, marketing
- **Personal** - Productivity, health, learning
- **Tools** - Apps, utilities, extensions

Feel free to add new MOCs or modify existing ones to match your interests.

## Template Variables

The `bookmark.md` template uses these variables:

| Variable | Description |
|----------|-------------|
| `{{title}}` | Auto-generated descriptive title |
| `{{url}}` | Original tweet URL |
| `{{handle}}` | Author's Twitter handle |
| `{{date}}` | Tweet date |
| `{{tags}}` | Relevant tags |
| `{{moc}}` | Category MOC name |
| `{{id}}` | Tweet ID |
| `{{summary}}` | AI-generated summary |
| `{{content}}` | Original tweet text |
| `{{userContext}}` | Your notes from the extension |
