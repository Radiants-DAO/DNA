---
title: "{{title}}"
source: "{{url}}"
author: "@{{handle}}"
date: {{date}}
tags: [{{tags}}]
moc: "[[{{moc}}]]"
tweet_id: "{{id}}"
---

## Summary
{{summary}}

## Content
{{content}}

{{#if thread}}
## Thread Context
{{#if thread.parent}}
> **Parent tweet:**
> {{thread.parent.text}}
{{/if}}

{{#if thread.children}}
> **Thread continuation:**
{{#each thread.children}}
> {{@index}}. {{this.text}}
{{/each}}
{{/if}}
{{/if}}

{{#if quotedTweet}}
## Quoted Tweet
> @{{quotedTweet.author.handle}}: {{quotedTweet.content.text}}
> [View original]({{quotedTweet.url}})
{{/if}}

{{#if externalLinks}}
## External Links
{{#each externalLinks}}
- **{{this.title}}** ([{{this.domain}}]({{this.url}}))
  {{this.description}}
{{/each}}
{{/if}}

{{#if media}}
## Media
{{#each media}}
- ![]({{this}})
{{/each}}
{{/if}}

{{#if userContext}}
## My Notes
{{userContext}}
{{/if}}

---
*Bookmarked via RadMark on {{bookmarkDate}}*
