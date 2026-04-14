---
type: "“presentation-thesis”"
---
# Ship Pretty or Die

## Thesis

“Taste” is bullshit. There is no inherent value in having taste. What matters is applying it — relentlessly, over a large number of years. Ship pretty, consistently, or die in the noise.

## Core Pitch

> An open brand is better than a protected one. Make your assets available so that your superfans can build without you.

***

## I. Long Live the Tradesman *(opener — design is full stack now)*

*🎵 Good the Bad and the Ugly — set the tone. Americana. The tradesman is back.*

The old division — designer makes mockups, developer writes code — is dead. Design is a full-stack trade now. The strongest designers touch every layer: tokens, components, linting rules, deployment, motion, typography, color science. If you can’t ship it, you didn’t design it.

The role hasn’t expanded. The walls just fell down. Design was always full stack — we just didn’t have the tools to prove it.

And here’s the uncomfortable part for the room: if you think Claude skills will save you from not being good at frontend, you’ll get mogged. AI is the best chisel ever made. It’s still just a chisel. You need to know what you’re carving.

***

## II. The Filter Is the Brand Kit

Your linter is your brand guardian now. Not your brand PDF. Not your Figma library. Your *linter.*

A good filter — enforced token usage, semantic color rules, spacing constraints, motion limits — produces consistent design at scale without a 40-page style guide nobody reads.

Build a good filter, have good design. The brand kit isn’t a document. It’s a set of rules that reject bad decisions before they ship.

*Demo: eslint-plugin-rdna — the design system as enforcement, not documentation.*

***

## III. Build Your Own Tools

You cannot compete with the flaming money pile. They will have access to tools you do not — unless you build your own.

* **Flow** — Webflow replacement. Chrome extension. Edit the web directly.

* **RadOS** — Desktop-OS UI. Window system. App ecosystem. The manifesto ships here.

* **DNA / Radiants** — Token system, component schemas, theme spec. A portable design system that agents can read.

The moat isn’t the technology. It’s the taste baked into the toolchain.

*Demos: Flow (live-editing a site in Chrome), RadOS (window system + apps), Radiants in Figma + Paper.*

***

## IV. The Agentic Web Demands Beauty

As the web gets more agentic — agents browsing, agents buying, agents comparing — humans become the scarce resource. You must give people reasons to *want* to use the website. Not need to. Want to.

Agents don’t care about your brand. Humans do. Beauty is the last defensible moat against automation. The sites that survive the agentic web are the ones people choose to visit with their own eyes.

***

## V. Branding Has Collapsed Into Design

Branding, UI/UX, visual design, product design, motion design — these used to be separate careers with separate job titles. They’ve collapsed into one discipline. The strongest designers have always been generalists. Now they need only a team of agents and a Claude Max subscription.

The generalist designer with taste and agency is the new full-stack. The specialist who can only push pixels in one tool is the new junior.

***

## VI. Time in the Market of the Mind

Branding is about time in the market of the mind. We’re all fatigued by new things. Every day there’s a new tool, a new framework, a new AI wrapper. The brands that win are the ones that stay. Not the ones that launch loudest.

Consistency compounds. Every day your brand exists and doesn’t embarrass itself is a day it gets stronger.

This is why “taste” as a concept is hollow — taste is a snapshot. Applied taste, over years, is a brand. The act of showing up and shipping pretty, again and again, is the entire game.

***

## VII. Open Brand > Protected Brand

**The freelancer story:** You’ve been there. Scraping assets off of websites to build pitches for clients. Pulling logos from Google Images. Begging for brand guidelines that don’t exist or are locked behind an NDA. The friction is real and it kills good work before it starts.

Now flip it: if you open your brand — make every asset, every token, every component available — your superfans become your design team. They build things you never imagined. They extend your brand into places you can’t reach. You can hire based on what people have already made *for* you, unprompted.

Free cult labor is the best kind of labor.

The old model: protect your assets, sue anyone who uses your logo wrong.\
The new model: make everything available. An open brand scales through love, not litigation.

The assets are the invitation. The filter (the linter, the curation, the rejection of bad work) is what keeps it coherent.

***

## Demo Flow

1. **Flow** — Chrome extension, live-editing a site. Webflow without the Webflow.

2. **RadOS** — Desktop OS in the browser. Window system, apps, the manifesto lives here.

3. **Radiants in Figma + Paper** — Design system as living artifact, not static documentation.

*Keep demos conversational, not deeply technical. Show the craft, not the code.*

***

## Notes

* **Manifesto language:** light touch. Curation/rejection yes, alchemist/Hopi probably not — professional audience.

* **CTA:** No hard sell. Here to inform, plant seeds.

* **Emotional arc:** Americana conviction opener → build through practical proof (tools, filter, demos) → land on the open brand philosophy.

# Pretext Browser Smoke Checklist

## Setup

* [ ] Run `pnpm --filter rad-os dev`
* [ ] Open RadOS in the browser
* [ ] Open `Scratchpad`
* [ ] Confirm there are no immediate console errors

## Scratchpad Basics

* [ ] The layout is three-pane:

  * [ ] document list/actions on the left
  * [ ] markdown source in the middle
  * [ ] settings + import/export + live preview on the right

* [ ] Creating `New Editorial` opens an editorial preview

* [ ] Creating `New Broadsheet` opens a broadsheet preview

* [ ] Creating `New Book` opens a book preview

* [ ] Switching between docs preserves each doc’s content and settings

* [ ] Legacy docs, if present, show the compatibility banner instead of crashing

## Markdown Editing

* [ ] Editing markdown updates the preview live
* [ ] `# Heading` renders as the document title/ headline
* [ ] Paragraphs render as body copy
* [ ] Bullet and numbered lists render correctly
* [ ] Blockquotes render correctly
* [ ] `---` renders as a rule/divider
* [ ] Fenced code blocks render as code
* [ ] `![Alt](key)` resolves when the asset key exists in settings/assets
* [ ] No stale preview state remains after rapid edits

## Editorial Primitive

* [ ] `Drop cap` toggle visibly adds/removes the opening drop cap
* [ ] `Pullquote` toggle changes blockquote rendering into the pullquote treatment
* [ ] Editorial column count changes the layout when width allows
* [ ] Large pasted markdown does not freeze the UI

## Broadsheet Primitive

* [ ] Column count switch changes between 2 and 3 columns
* [ ] Masthead text updates in preview
* [ ] Hero wrap changes layout around the image
* [ ] Headline comes from the markdown title
* [ ] Preview still looks correct after switching away and back

## Book Primitive

* [ ] Page size controls affect the rendered page dimensions
* [ ] Column count changes pagination/layout
* [ ] Multi-section markdown produces multiple pages when expected
* [ ] Scrolling through pages feels stable

## Export / Import

* [ ] `Export bundle` downloads two files:

  * [ ] `slug.md`
  * [ ] `slug.pretext.json`

* [ ] Importing both files restores the same primitive and preview

* [ ] Importing markdown alone updates body content but preserves current primitive/settings

* [ ] Pasting markdown alone stages correctly before apply

* [ ] Pasting markdown plus fenced JSON stages both markdown and settings

* [ ] The staged import UI clearly shows what will be applied before overwrite

## Shared Consumers

* [ ] `GoodNews` still opens and renders correctly
* [ ] `Manifesto` still opens and renders correctly
* [ ] Their layouts still respond correctly to window size changes

## Sample Bundles

* [ ] The sample bundles under `/pretext/` load without parse errors
* [ ] `editorial-demo` renders as editorial
* [ ] `broadsheet-demo` renders as broadsheet
* [ ] `book-demo` renders as book

## Red Flags

* [ ] No missing-font flashes that permanently break layout
* [ ] No import path silently downgrades invalid settings into plain markdown
* [ ] No duplicate or stale docs appear after import/apply
* [ ] No console errors during create/edit/export/ import flows
* [ ] No preview primitive mismatches the selected/ settings primitive

⠀