# Toolbox Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the placeholder toolbox with comprehensive Webflow-sourced content, add deep-link copy-to-clipboard per panel+tab, add judging criteria to judges panel, replace legal tab with full T&C, and add Discord/Twitter social icons to the top-right corner.

**Architecture:** All content lives in the `CONTENT` object in `InfoWindow.tsx`. Tabs use `CrtTabs` (compound component with internal state). Accordion sections use `CrtAccordion`. Deep linking uses `useSearchParams` from Next.js to sync `?panel=X&tab=Y` with app state. CrtTabs needs a controlled mode (`value` prop) for external tab control.

**Tech Stack:** React 19, Next.js (App Router), CrtTabs, CrtAccordion, `next/navigation` useSearchParams

**Brainstorm:** `docs/brainstorms/2026-01-31-toolbox-overhaul-brainstorm.md`

---

### Task 1: Add controlled mode to CrtTabs

CrtTabs currently only supports uncontrolled mode (`defaultValue` + internal `useState`). We need a `value` + `onValueChange` prop pair so deep linking can externally control the active tab.

**Files:**
- Modify: `apps/monolith-hackathon/app/components/CrtTabs.tsx`

**Step 1: Update CrtTabs props and state logic**

In `CrtTabs.tsx`, add optional `value` and `onValueChange` props. When `value` is provided, use it as the active tab instead of internal state:

```tsx
interface CrtTabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function CrtTabs({ defaultValue = '', value, onValueChange, children, className = '' }: CrtTabsProps) {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalTab;
  const setActiveTab = onValueChange ?? setInternalTab;

  return (
    <TabsContext value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext>
  );
}
```

This is backwards-compatible — existing uncontrolled usage still works.

**Step 2: Commit**

```bash
git add apps/monolith-hackathon/app/components/CrtTabs.tsx
git commit -m "feat(CrtTabs): add controlled mode with value/onValueChange props"
```

---

### Task 2: Add URL deep-linking infrastructure

Wire `useSearchParams` to sync `?panel=toolbox&tab=dev-docs` with app state. The panel param opens the corresponding InfoWindow panel. The tab param controls sub-tabs within tabbed panels (toolbox, legal).

**Files:**
- Modify: `apps/monolith-hackathon/app/page.tsx`
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx`

**Step 1: Add search param reading to page.tsx**

Add `useSearchParams` and `useRouter` from `next/navigation`. On mount, read `panel` and `tab` params. Set `activeWindow` from `panel`. Pass `initialTab` to InfoWindow.

In `page.tsx`, add imports and logic:

```tsx
import { useSearchParams, useRouter } from 'next/navigation';
```

Inside the component:

```tsx
const searchParams = useSearchParams();
const router = useRouter();

// Read initial panel from URL on mount
useEffect(() => {
  const panel = searchParams.get('panel');
  if (panel && CONTENT[panel]) {
    setActiveWindow(panel);
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

Note: `page.tsx` uses dynamic imports with `ssr: false`. Since `useSearchParams` requires `Suspense` in Next.js App Router, wrap the entire page component body in `<Suspense>` — or since SSR is already disabled for the child components, it should work client-side. If needed, wrap the component export with `Suspense`.

**Step 2: Update URL when panel changes**

Update `handleOrbitalSelect` and `handleWindowClose` to sync URL:

```tsx
function updateURL(panel: string | null, tab?: string | null) {
  const params = new URLSearchParams();
  if (panel) params.set('panel', panel);
  if (tab) params.set('tab', tab);
  const query = params.toString();
  router.replace(query ? `?${query}` : '/', { scroll: false });
}
```

Call `updateURL` in `handleOrbitalSelect`, `handleTabChange`, and `handleWindowClose`.

**Step 3: Pass initialTab to InfoWindow**

Read the `tab` search param and pass it as a prop:

```tsx
const initialTab = searchParams.get('tab');

<InfoWindow
  activeId={activeWindow}
  onTabChange={handleTabChange}
  onClose={handleWindowClose}
  initialTab={initialTab}
/>
```

**Step 4: Update InfoWindow to accept and use initialTab**

Add `initialTab?: string | null` to `InfoWindowProps`. Pass it through to `renderTabs`:

```tsx
interface InfoWindowProps {
  activeId: string;
  onTabChange: (id: string) => void;
  onClose: () => void;
  initialTab?: string | null;
}
```

In `renderTabs`, use controlled mode when `initialTab` is provided and the tab exists in the data:

```tsx
function renderTabs(
  data: Extract<WindowContent, { type: 'tabs' }>,
  initialTab?: string | null,
) {
  const defaultTab = data.tabs.find(t => t.id === initialTab)?.id ?? data.tabs[0]?.id;
  return (
    <CrtTabs defaultValue={defaultTab}>
      {/* ... same as before ... */}
    </CrtTabs>
  );
}
```

**Step 5: Commit**

```bash
git add apps/monolith-hackathon/app/page.tsx apps/monolith-hackathon/app/components/InfoWindow.tsx
git commit -m "feat: add URL deep-linking with ?panel=X&tab=Y search params"
```

---

### Task 3: Add copy-to-clipboard button to taskbar

Add a copy-link button next to the close button in the taskbar. Clicking it copies the deep-link URL for the current panel (and tab, if applicable) to the clipboard.

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx`
- Modify: `apps/monolith-hackathon/app/globals.css` (if needed for tooltip styling)

**Step 1: Create a LinkIcon SVG component**

Add inline near the existing icon components (CloseIcon, DiscordIcon, etc.) in InfoWindow.tsx:

```tsx
function LinkIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
```

**Step 2: Add copy button to taskbar**

In the `taskbar_button-wrap` div (line ~1005), add a copy button before the Discord link:

```tsx
<div className="taskbar_button-wrap">
  <button
    className="close_button"
    aria-label="Copy link"
    onClick={() => {
      const params = new URLSearchParams();
      params.set('panel', activeId);
      // If this panel has tabs, include current tab
      // We'll need to track current sub-tab — see note below
      const url = `${window.location.origin}${window.location.pathname}?${params}`;
      navigator.clipboard.writeText(url);
    }}
  >
    <LinkIcon size={20} />
  </button>
  <a href="https://discord.gg/radiants" ...>
    <DiscordIcon size={20} />
  </a>
  <button className="close_button" onClick={onClose} aria-label="Close">
    <CloseIcon size={20} />
  </button>
</div>
```

**Step 3: Track active sub-tab for tabbed panels**

For panels with tabs (toolbox, legal), we need to know the current sub-tab to include it in the URL. Add an `onSubTabChange` callback or track it via CrtTabs `onValueChange`.

The simplest approach: lift tab state for tabbed panels. In InfoWindow, add state:

```tsx
const [activeSubTab, setActiveSubTab] = useState<string | null>(initialTab ?? null);
```

Pass to renderTabs:

```tsx
<CrtTabs
  value={activeSubTab && data.tabs.find(t => t.id === activeSubTab) ? activeSubTab : data.tabs[0]?.id}
  onValueChange={setActiveSubTab}
>
```

Then in the copy handler, include the sub-tab:

```tsx
if (activeSubTab) params.set('tab', activeSubTab);
```

**Step 4: Add brief "Copied!" feedback**

Add a small state + timeout to show a checkmark briefly:

```tsx
const [copied, setCopied] = useState(false);

// In onClick:
navigator.clipboard.writeText(url);
setCopied(true);
setTimeout(() => setCopied(false), 1500);

// In JSX:
<button ...>
  {copied ? <CheckIcon size={20} /> : <LinkIcon size={20} />}
</button>
```

Add a simple CheckIcon:

```tsx
function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
```

**Step 5: Commit**

```bash
git add apps/monolith-hackathon/app/components/InfoWindow.tsx
git commit -m "feat: add copy-to-clipboard deep-link button in taskbar"
```

---

### Task 4: Add Discord and Twitter/X icons to top-right page corner

Add the two pixel-art SVG social icons (provided by user) to the top-right corner of the page layout.

**Files:**
- Modify: `apps/monolith-hackathon/app/page.tsx`
- Modify: `apps/monolith-hackathon/app/globals.css`

**Step 1: Add social icons JSX to page.tsx**

Add a fixed-position container in the page JSX, above the mute button or as a sibling:

```tsx
{/* Social links — top-right corner */}
<div className="social-links">
  <a href="https://discord.gg/radiants" target="_blank" rel="noopener noreferrer" aria-label="Discord">
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="24" viewBox="0 0 26 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M0 7.79963H2.59998V2.59982H5.19995V-1.33514e-05H10.4V2.59982H7.79993V5.19966H18.2001V2.59982H15.6V-1.33514e-05H20.8V2.59982H23.4V7.79963H26V20.7989H23.4V23.3989H15.6V20.7989H10.4V23.3989H2.59998V20.7989H0V7.79963ZM15.6 10.3995H18.2001V15.5993H15.6V10.3995ZM10.4 10.3995H7.79993V15.5993H10.4V10.3995Z" fill="currentColor" />
    </svg>
  </a>
  <a href="https://x.com/RadiantsDAO" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="18" viewBox="0 0 22 18" fill="none">
      <path d="M14.5998 0.00976562H12.8017V1.80777H11.0036V3.60577V5.40377H9.20546H7.40734H5.60921V3.60577H3.81109V1.80777H2.01297V0.00976562H0.214844V1.80777V3.60577V5.40377H2.01297V7.20177H0.214844V8.99977H2.01297H3.81109V10.7978H2.01297V12.5958H3.81109H5.60921V14.3938H3.81109V16.1918H2.01297V14.3938H0.214844V16.1918H2.01297V17.9898H3.81109H5.60921H7.40734H9.20546H11.0036V16.1918H12.8017H14.5998V14.3938H16.398V12.5958H18.1961V10.7978V8.99977H19.9942V7.20177V5.40377V3.60577H21.7923V1.80777V0.00976562H19.9942V1.80777H18.1961V0.00976562H16.398H14.5998Z" fill="currentColor" />
    </svg>
  </a>
</div>
```

**Step 2: Add CSS for social-links container**

In `globals.css`:

```css
.social-links {
  position: fixed;
  top: 1em;
  right: 1em;
  z-index: 10001;
  display: flex;
  gap: 0.75em;
  align-items: center;
}

.social-links a {
  color: var(--color-content-secondary);
  transition: color 200ms ease-out;
  display: flex;
  align-items: center;
}

.social-links a:hover {
  color: var(--color-content-primary);
}

.social-links svg {
  width: 1.25em;
  height: auto;
}
```

**Step 3: Commit**

```bash
git add apps/monolith-hackathon/app/page.tsx apps/monolith-hackathon/app/globals.css
git commit -m "feat: add Discord and Twitter pixel icons to top-right corner"
```

---

### Task 5: Replace toolbox content with Webflow Dev Docs accordion

Replace the current 4-tab toolbox with 4 tabs: DEV DOCS (accordion), ASSETS (coming soon), AI (keep existing), LEGAL (full T&C). The Dev Docs tab uses `CrtAccordion` with all the Webflow resource content.

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx`

**Step 1: Restructure the toolbox content data**

Replace the current `toolbox` entry in the `CONTENT` object (lines 132-174). The new structure uses a `'tabs'` type but the Dev Docs tab content is rendered as an accordion instead of simple sections.

We need to extend the tab content type to support accordion content. Update the `WindowContent` type to allow tabs to have either `sections` or `accordion` content:

```tsx
// Add to the tabs type definition:
type TabContent = {
  id: string;
  label: string;
} & (
  | { contentType?: 'sections'; sections: { heading: string; body: string; link?: string }[] }
  | { contentType: 'accordion'; accordionItems: AccordionSection[] }
  | { contentType: 'coming-soon' }
);

type AccordionSection = {
  title: string;
  items: { label: string; url?: string; description?: string }[];
};
```

**Step 2: Write the Dev Docs accordion content**

Replace the toolbox CONTENT entry with:

```tsx
toolbox: {
  type: 'tabs',
  title: 'TOOLBOX.exe',
  tabs: [
    {
      id: 'dev-docs',
      label: 'DEV DOCS',
      contentType: 'accordion' as const,
      accordionItems: [
        {
          title: 'Solana Mobile Resources',
          items: [
            { label: 'Helius RPC — 50% Off Developer Plan', url: 'https://dashboard.helius.dev/signup?plan=developer', description: 'Helius provides unparalleled performance and reliability as Solana\'s leading RPC Infrastructure. After registration, you\'ll receive a 50% off coupon code via email.' },
            { label: 'Getting Started', url: 'https://docs.solanamobile.com/developers/overview', description: 'Visit the Solana Mobile docs and review the React Native Quickstart guide.' },
            { label: 'Development Setup (No Device Needed)', url: 'https://docs.solanamobile.com/developers/development-setup', description: 'You do not need a Solana Mobile device. All tools are available to start building today.' },
            { label: 'dApp Store Publishing', url: 'https://docs.solanamobile.com/dapp-publishing/publisher-policy', description: 'Android apps only. If you have a web app, convert it to Android. Ensure compliance with the Publisher Policy.' },
          ],
        },
        {
          title: 'General Solana Resources',
          items: [
            { label: 'Introduction to Solana Development', url: 'https://solana.com/docs/intro/dev', description: 'A great introduction to important Solana development knowledge.' },
            { label: 'Important Concepts', url: 'https://solana.com/docs#start-learning', description: 'Concepts you should be familiar with as you start your Solana journey.' },
            { label: 'Setup Your Environment', url: 'https://solana.com/developers/guides/getstarted/setup-local-development', description: 'Setting up a local environment. Highly recommended.' },
            { label: 'Hello World', url: 'https://solana.com/developers/guides/getstarted/hello-world-in-your-browser', description: 'Build your first hello world app on chain using a Web IDE.' },
            { label: 'Solana Bytes', url: 'https://www.youtube.com/watch?v=pRYs49MqapI&list=PLilwLeBwGuK51Ji870apdb88dnBr1Xqhm', description: 'Video playlist of byte-sized, important Solana concepts. Must watch.' },
            { label: 'Solana Cookbook', url: 'https://solanacookbook.com/', description: 'One of the most popular resources for concepts, guides, and reference code snippets.' },
            { label: 'Solana Bootcamp', url: 'https://www.youtube.com/watch?v=0P8JeL3TURU&list=PLilwLeBwGuK6NsYMPP_BlVkeQgff0NwvU', description: 'An incredible 7-hour crash course on Solana development.' },
            { label: 'Web3.js Library', url: 'https://github.com/solana-labs/solana-web3.js', description: 'Primary client library for interacting with Solana in JavaScript.' },
            { label: 'create-solana-dapp', url: 'https://github.com/solana-developers/create-solana-dapp', description: 'Quickly spin up a Solana application scaffold.' },
            { label: 'Solana Playground', url: 'https://beta.solpg.io/', description: 'Solana Program Web IDE.' },
            { label: 'Solana Stack Exchange', url: 'https://solana.stackexchange.com/', description: 'Ask technical questions or search previously answered questions.' },
            { label: 'Solana Mobile Expo Template', url: 'https://github.com/solana-mobile/solana-mobile-expo-template', description: 'Ready-to-go Android Expo dApp with web3.js, MWA, spl-token, polyfills, and re-usable hooks.' },
            { label: 'Solana App Kit', url: 'https://github.com/SendArcade/solana-app-kit', description: 'Open-source React Native scaffold for building iOS and Android crypto mobile apps.' },
          ],
        },
        {
          title: 'Guides, Videos & Self-Learning',
          items: [
            { label: 'Quick Guides', url: 'https://solana.com/developers/guides', description: 'Assortment of guides and tutorials from the main Solana website.' },
            { label: 'SolAndy', url: 'https://www.youtube.com/solandy', description: 'A wide variety of Solana developer content produced weekly.' },
            { label: 'THE Solana Course', url: 'https://soldev.app/course', description: 'Comprehensive, intermediate self-learning course for all things Solana.' },
            { label: 'Freecodecamp', url: 'https://web3.freecodecamp.org/solana', description: 'Fully interactive Solana course taught from your VS Code IDE.' },
            { label: 'RiseIn', url: 'https://www.risein.com/courses/build-on-solana', description: 'Introductory Solana course with text and video options.' },
            { label: 'Ideasoft Beginner', url: 'https://careerbooster.io/courses/full-solana-and-rust-programming-course-for-beginners', description: 'Solana/Rust course for beginners interested in building programs.' },
            { label: 'Ideasoft Advanced', url: 'https://careerbooster.io/courses/rust-solana-advance-development-course', description: 'Advanced course for completers of the beginner program.' },
            { label: 'Rareskills ETH to Solana', url: 'https://www.rareskills.io/solana-tutorial', description: 'For Ethereum developers learning Solana.' },
          ],
        },
        {
          title: 'Tooling, Ecosystem Docs & SDKs',
          items: [
            { label: 'Solana Core Docs', url: 'https://solana.com/docs', description: 'The core Solana documentation.' },
            { label: 'Metaplex (NFTs)', url: 'https://developers.metaplex.com/', description: 'All-in-one platform for developers to build with NFTs on Solana.' },
            { label: 'Solana Pay', url: 'https://docs.solanapay.com/', description: 'Start building payments apps on Solana using JavaScript/TypeScript.' },
            { label: 'Solana Mobile SDK', url: 'https://solanamobile.com/developers', description: 'All the tools to build native mobile apps on Solana.' },
            { label: 'Unity SDK', url: 'https://docs.magicblock.gg/SolanaUnitySDK/overview' },
            { label: 'Turbo Rust Engine', url: 'https://turbo.computer/' },
            { label: 'GameShift', url: 'https://gameshift.solanalabs.com/' },
            { label: 'Godot SDK', url: 'https://github.com/Virus-Axel/godot-solana-sdk' },
            { label: 'Phaser SDK', url: 'https://github.com/Bread-Heads-NFT/phaser-solana-platformer-template' },
            { label: 'Unreal SDK (Star Atlas)', url: 'https://github.com/staratlasmeta/FoundationKit' },
            { label: 'Unreal SDK (Bifrost)', url: 'https://github.com/Bifrost-Technologies/Solana-Unreal-SDK' },
            { label: 'Game Examples', url: 'https://github.com/solana-developers/solana-game-examples' },
            { label: 'Randomness Service', url: 'https://github.com/switchboard-xyz/solana-randomness-service-example' },
          ],
        },
        {
          title: 'Open Source References',
          items: [
            { label: 'Awesome Solana OSS', url: 'https://github.com/StockpileLabs/awesome-solana-oss', description: 'Curated list of open-source Solana projects for reference and learning.' },
          ],
        },
      ],
    },
    {
      id: 'assets',
      label: 'ASSETS',
      contentType: 'coming-soon' as const,
    },
    {
      id: 'ai',
      label: 'AI',
      contentType: 'sections' as const,
      sections: [
        { heading: 'Vibecoding', body: 'AI-assisted development with Claude, Cursor, and other AI coding tools. Build faster with intelligent code generation.' },
        { heading: 'AI Agent Frameworks', body: 'Build autonomous agents that interact with Solana. Frameworks, SDKs, and patterns for AI-native dApps.' },
        { heading: 'AI + Mobile', body: 'On-device AI capabilities, local inference, and edge computing patterns for mobile-first AI applications.' },
      ],
    },
  ],
},
```

**Step 3: Update renderTabs to handle new content types**

Modify `renderTabs` to dispatch on `contentType`:

```tsx
function renderTabs(
  data: Extract<WindowContent, { type: 'tabs' }>,
  initialTab?: string | null,
) {
  const defaultTab = data.tabs.find(t => t.id === initialTab)?.id ?? data.tabs[0]?.id;
  return (
    <CrtTabs defaultValue={defaultTab}>
      <CrtTabs.List>
        {data.tabs.map((tab) => (
          <CrtTabs.Trigger key={tab.id} value={tab.id}>
            {tab.label}
          </CrtTabs.Trigger>
        ))}
      </CrtTabs.List>
      {data.tabs.map((tab) => (
        <CrtTabs.Content key={tab.id} value={tab.id}>
          {renderTabContent(tab)}
        </CrtTabs.Content>
      ))}
    </CrtTabs>
  );
}

function renderTabContent(tab: TabContent) {
  if (tab.contentType === 'coming-soon') {
    return (
      <div className="coming-soon">
        <p className="coming-soon-text">COMING SOON</p>
      </div>
    );
  }
  if (tab.contentType === 'accordion') {
    return (
      <CrtAccordion type="multiple">
        {tab.accordionItems.map((section, i) => (
          <CrtAccordion.Item key={i} value={`section-${i}`}>
            <CrtAccordion.Trigger>{section.title}</CrtAccordion.Trigger>
            <CrtAccordion.Content>
              <div className="resource-list">
                {section.items.map((item, j) => (
                  <div key={j} className="resource-item">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                        {item.label}
                      </a>
                    ) : (
                      <span className="resource-label">{item.label}</span>
                    )}
                    {item.description && (
                      <p className="resource-description">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CrtAccordion.Content>
          </CrtAccordion.Item>
        ))}
      </CrtAccordion>
    );
  }
  // Default: sections (existing behavior)
  return (
    <div className="timeline-content">
      {tab.sections.map((section, i) => (
        <div key={i} className="timeline-entry">
          <div className="timeline-entry-header">
            <ScrambleText text={section.heading} speed={1} />
          </div>
          <div className="timeline-entry-body">
            <ScrambleText text={section.body} speed={0.9} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 4: Add CSS for resource list and coming-soon**

In `globals.css`:

```css
/* Resource list inside accordion */
.resource-list {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
}

.resource-item {
  padding: 0.5em 0;
  border-bottom: 1px solid var(--panel-accent-08, rgba(180, 148, 247, 0.08));
}

.resource-item:last-child {
  border-bottom: none;
}

.resource-link {
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  text-transform: uppercase;
  color: var(--panel-accent, #b494f7);
  text-decoration: none;
  letter-spacing: 0.05em;
}

.resource-link:hover {
  text-decoration: underline;
}

.resource-label {
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  text-transform: uppercase;
  color: var(--color-content-primary);
  letter-spacing: 0.05em;
}

.resource-description {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--color-content-secondary);
  line-height: 1.5;
  margin-top: 0.25em;
}

/* Coming soon placeholder */
.coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 12em;
}

.coming-soon-text {
  font-family: var(--font-ui);
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-content-tertiary);
  opacity: 0.5;
}
```

**Step 5: Commit**

```bash
git add apps/monolith-hackathon/app/components/InfoWindow.tsx apps/monolith-hackathon/app/globals.css
git commit -m "feat(toolbox): replace placeholder with Webflow Dev Docs accordion, Assets coming soon, AI tab"
```

---

### Task 6: Replace legal tab content with full Terms & Conditions

Replace the current abbreviated legal T&C tab with the full 15-section terms from the Webflow archive.

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx`

**Step 1: Replace the legal content data**

Replace the `legal` entry in CONTENT (lines 237-272) with the full terms. The T&C tab gets all 15 sections. Keep PRIVACY and KYC tabs as-is:

```tsx
legal: {
  type: 'tabs',
  title: 'LEGAL.exe',
  tabs: [
    {
      id: 'terms',
      label: 'T&C',
      sections: [
        { heading: '1. Introduction', body: 'These Terms and Conditions ("Terms") govern your participation in the Solana Mobile Hackathon ("Hackathon"), organized by Radiants DAO Ltd., corporation registered in the British Virgin Islands ("BVI"). By registering or participating in the Hackathon, you agree to be bound by these Terms.' },
        { heading: '2. Organizer Information', body: 'Radiants DAO Ltd. is a company registered in the BVI, and shall be hosting the hackathon in conjunction with other parties. All official communications can be directed to Lib@radiant.nexus.' },
        { heading: '3. Eligibility', body: 'To participate, individuals must: Be 18 years or older or the age of majority in their jurisdiction, whichever is higher. Not be a resident of any restricted jurisdiction as identified in our KYC Policy. Not be an employee or direct contractor of Radiants DAO Ltd. or a judge of the Hackathon. Be capable of complying with KYC/AML requirements if selected as a prize recipient.' },
        { heading: '4. Registration and Participation', body: 'Participants must register through the official Hackathon platform and provide accurate, truthful information. Each participant may only register once. Teams may be permitted based on the Hackathon guidelines. By submitting a project, participants warrant that their work is original and does not infringe on third-party rights.' },
        { heading: '5. Project Requirements', body: 'All projects must: Be built within the hackathon period. Follow the specified theme, track and technical requirements. Not contain malware or harmful code. Not promote illegal or discriminatory behavior. Be submitted before the designated deadline.' },
        { heading: '6. Judging and Prizes', body: 'Winners will be selected by a panel of judges appointed by the Organizer. Judging criteria may include innovation, technical execution, impact, and alignment with the theme. All decisions are final and not subject to appeal. Prize winners will be notified by email and required to complete KYC verification. Failure to do so may result in disqualification and forfeiture of the prize.' },
        { heading: '7. Intellectual Property', body: 'Participants retain ownership of their submissions. By entering the Hackathon, participants grant Radiants DAO Ltd. a non-exclusive, royalty-free license to use, display, and promote their submissions for marketing, promotional, and archival purposes.' },
        { heading: '8. KYC and AML Compliance', body: 'Prize winners are required to complete identity verification procedures in accordance with the Organizer\'s KYC Policy. The Organizer reserves the right to withhold prizes pending verification or to disqualify any participant deemed to have submitted false or misleading information.' },
        { heading: '9. Restricted Jurisdictions', body: 'Participants from countries or territories sanctioned by the United Nations, OFAC, FATF, or the BVI government are not eligible. A full list is provided in the KYC Policy.' },
        { heading: '10. Disqualification', body: 'The Organizer reserves the right to disqualify any participant who: Submits false information. Uses bots, automated systems, or unfair means. Fails to meet submission deadlines. Engages in harassment or discriminatory conduct.' },
        { heading: '11. Privacy', body: 'Personal data will be collected and processed in accordance with the Hackathon\'s Privacy Policy. By participating, you consent to such processing as detailed in the Privacy Policy.' },
        { heading: '12. Limitation of Liability', body: 'Radiants DAO Ltd. shall not be liable for: Any loss, damage, or liability incurred by participants as a result of participating in the Hackathon, including but not limited to losses arising from code errors, smart contract failures, or project deployment. Failures, malfunctions, interruptions, delays, bugs, or data loss associated with the Solana Blockchain or other decentralized protocols. Market volatility, token devaluation, or loss of digital assets. Any decisions, evaluations, or outcomes made by judges, mentors, partners, or third-party service providers. Participants acknowledge that blockchain technologies and cryptocurrencies are experimental and inherently risky. Participation is at each participant\'s sole risk and discretion.' },
        { heading: '13. Changes and Cancellation', body: 'The Organizer reserves the right to cancel, modify, or suspend the Hackathon due to force majeure, technical issues, or other events beyond its control. Any material changes will be communicated to registered participants.' },
        { heading: '14. Governing Law', body: 'These Terms shall be governed by and construed in accordance with the laws of the British Virgin Islands. Any disputes shall be subject to the exclusive jurisdiction of the BVI courts.' },
        { heading: '15. Contact', body: 'If you have any questions or concerns regarding these Terms, please contact Lib@radiant.nexus.' },
      ],
    },
    {
      id: 'privacy',
      label: 'PRIVACY',
      sections: [
        // Keep existing privacy sections unchanged
      ],
    },
    {
      id: 'kyc',
      label: 'KYC',
      sections: [
        // Keep existing KYC sections unchanged
      ],
    },
  ],
},
```

**Step 2: Commit**

```bash
git add apps/monolith-hackathon/app/components/InfoWindow.tsx
git commit -m "feat(legal): replace abbreviated T&C with full 15-section terms from Webflow"
```

---

### Task 7: Add evaluation criteria to judges panel

Add the judging evaluation criteria below the judges grid, re-using the existing criteria card pattern from the rules panel.

**Files:**
- Modify: `apps/monolith-hackathon/app/components/InfoWindow.tsx`

**Step 1: Add evaluation data to judges content**

Extend the judges type and content to include an `evaluation` array:

In the type definition, add to the judges type:

```tsx
| { type: 'judges'; title: string; judges: { name: string; role: string; org: string; twitter: string; image: string }[]; evaluation?: string[] }
```

In the CONTENT judges entry, add:

```tsx
judges: {
  type: 'judges',
  title: 'JUDGES.exe',
  judges: [ /* ... existing judges array ... */ ],
  evaluation: [
    'Completion based on the demo video',
    'Technical depth based on GitHub commits',
    'Mobile optimized user experience and usage of mobile features',
    'Usage and interaction with the Solana network',
    'Clarity and vision from the presentation',
  ],
},
```

**Step 2: Update renderJudges to show evaluation criteria**

After the judges grid, add a criteria section:

```tsx
function renderJudges(
  data: Extract<WindowContent, { type: 'judges' }>,
  revealed: number,
  advance: () => void,
) {
  return (
    <>
      <div className="judges-grid">
        {data.judges.map((judge, i) => {
          if (revealed < i + 2) return null;
          return (
            <a key={i} href={judge.twitter ? `https://x.com/${judge.twitter}` : undefined} target="_blank" rel="noopener noreferrer" className="judge-card-v2">
              {judge.image && <img src={judge.image} alt={judge.name} className="judge-pfp" />}
              <div className="judge-name-v2"><ScrambleText text={judge.name} /></div>
              <div className="judge-role"><ScrambleText text={judge.role} onDone={advance} /></div>
              <div className="judge-nameplate">{judge.org}</div>
            </a>
          );
        })}
      </div>

      {data.evaluation && revealed >= data.judges.length + 2 && (
        <div className="evaluation-section">
          <div className="timeline-entry-header" style={{ marginTop: '1.5em' }}>
            <ScrambleText text="EVALUATION PROCESS" />
          </div>
          <div className="timeline-entry-body" style={{ marginTop: '0.5em' }}>
            Judges will assess:
          </div>
          <ul className="evaluation-list">
            {data.evaluation.map((item, i) => (
              <li key={i} className="evaluation-item">{item}</li>
            ))}
          </ul>

          <div className="timeline-entry-header" style={{ marginTop: '1.5em' }}>
            <ScrambleText text="EVALUATION CRITERIA" />
          </div>
          <div className="criteria-grid">
            {[
              { category: 'Stickiness & PMF', pct: 25, description: 'How well does your app resonate with the Seeker community? Does it create habits and drive daily engagement?' },
              { category: 'User Experience', pct: 25, description: 'Is the app intuitive, polished, and enjoyable to use?' },
              { category: 'Innovation / X-factor', pct: 25, description: 'How novel and creative is the idea? Does it stand out from existing products?' },
              { category: 'Presentation & Demo Quality', pct: 25, description: 'How clearly did the team communicate their idea? Does the demo effectively showcase the core concept?' },
            ].map((c, i) => (
              <div key={i} className="criteria-card">
                <div className="criteria-icon">{CRITERIA_ICONS[c.category]}</div>
                <div className="criteria-header">
                  <span className="subsection-heading">{c.category}</span>
                  <span className="criteria-badge">{c.pct}%</span>
                </div>
                <div className="timeline-entry-body" style={{ marginTop: '0.375em' }}>
                  {c.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
```

**Step 3: Add CSS for evaluation list**

In `globals.css`:

```css
.evaluation-list {
  list-style: none;
  padding: 0;
  margin: 0.75em 0;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.evaluation-item {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--color-content-secondary);
  line-height: 1.5;
  padding-left: 1.25em;
  position: relative;
}

.evaluation-item::before {
  content: '>';
  position: absolute;
  left: 0;
  color: var(--panel-accent, #b494f7);
  font-family: var(--font-mono);
}
```

**Step 4: Commit**

```bash
git add apps/monolith-hackathon/app/components/InfoWindow.tsx apps/monolith-hackathon/app/globals.css
git commit -m "feat(judges): add evaluation process and criteria cards below judges grid"
```

---

### Task 8: Integration testing and polish

Verify all features work together end-to-end.

**Files:**
- Possibly modify any of the above files for fixes

**Step 1: Test deep linking**

1. Start dev server: `cd apps/monolith-hackathon && pnpm dev`
2. Navigate to `http://localhost:3000?panel=toolbox&tab=dev-docs` — should open toolbox with Dev Docs tab active
3. Navigate to `http://localhost:3000?panel=legal&tab=terms` — should open legal with T&C tab
4. Navigate to `http://localhost:3000?panel=judges` — should open judges panel
5. Click around tabs and verify URL updates

**Step 2: Test copy-to-clipboard**

1. Open any panel, click the link icon in taskbar
2. Paste from clipboard — should be a valid deep link
3. Navigate to the pasted URL — should open the same panel+tab

**Step 3: Test toolbox Dev Docs accordion**

1. Open toolbox → Dev Docs tab
2. Expand each accordion section
3. Click external links — should open in new tab
4. Test `type="multiple"` — multiple sections should be expandable simultaneously

**Step 4: Test legal T&C**

1. Open legal → T&C tab
2. Scroll through all 15 sections
3. Verify text renders correctly (no encoding issues with quotes/apostrophes)

**Step 5: Test judges evaluation criteria**

1. Open judges panel
2. Wait for all judge cards to reveal
3. Evaluation criteria should appear after judges
4. Verify criteria cards render with icons

**Step 6: Test social icons**

1. Verify Discord and Twitter icons appear in top-right corner
2. Click Discord → should open discord.gg/radiants in new tab
3. Click Twitter → should open x.com handle in new tab
4. Verify icons don't overlap with mute button

**Step 7: Test mobile**

1. Resize to mobile viewport
2. Verify social icons don't overlap
3. Verify toolbox accordion is scrollable
4. Verify tab strip works on mobile

**Step 8: Final commit**

```bash
git add -A
git commit -m "polish: integration fixes from end-to-end testing"
```

---

## Task Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | CrtTabs controlled mode | CrtTabs.tsx |
| 2 | URL deep-linking infrastructure | page.tsx, InfoWindow.tsx |
| 3 | Copy-to-clipboard button in taskbar | InfoWindow.tsx |
| 4 | Discord + Twitter social icons | page.tsx, globals.css |
| 5 | Toolbox Dev Docs accordion content | InfoWindow.tsx, globals.css |
| 6 | Full Terms & Conditions in legal | InfoWindow.tsx |
| 7 | Evaluation criteria in judges panel | InfoWindow.tsx, globals.css |
| 8 | Integration testing and polish | All files |
