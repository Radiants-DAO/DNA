'use client';

import { Fragment, useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useScramble } from 'use-scramble';
import CrtAccordion from '../CrtAccordion';
import CrtTabs from '../CrtTabs';
import ComponentLibraryContent from './ComponentLibraryContent';

// ============================================================================
// Content Types
// ============================================================================

export type AccordionSection = {
  title: string;
  icon?: React.ReactNode;
  items: { label: string; url?: string; description?: string }[];
};

export type FeaturedItem = {
  label: string;
  description?: string;
  url: string;
};

export type WorkshopEntry = {
  date: string;
  label: string;
  category: string;
  description?: string;
  summary?: string;
  broadcastUrl?: string;
  tweetId?: string;
  presentationUrl?: string;
};

export type TabContent = { id: string; label: string } & (
  | { contentType?: 'sections'; sections: { heading: string; body: string }[] }
  | { contentType: 'accordion'; accordionItems: AccordionSection[] }
  | { contentType: 'featured-accordion'; featuredItems: FeaturedItem[]; accordionItems: AccordionSection[] }
  | { contentType: 'coming-soon'; comingSoonMessage?: string }
  | { contentType: 'component-library' }
  | { contentType: 'workshops'; workshops: WorkshopEntry[] }
);

export type WindowContent =
  | { type: 'entries'; title: string; entries: { date: string; title: string; body: string }[] }
  | { type: 'sections'; title: string; sections: { heading: string; body: string }[] }
  | { type: 'tabs'; title: string; tabs: TabContent[] }
  | { type: 'accordion'; title: string; categories: { heading: string; items: { question: string; answer: string }[] }[] }
  | { type: 'judges'; title: string; judges: { name: string; role: string; org: string; twitter?: string; image?: string }[]; evaluation?: string[] }
  | { type: 'prizes'; title: string; poolTotal: string; tiers: { label: string; amount: string; description?: string; variant?: 'hero' | 'runner-up' | 'bonus' | 'extra' }[] }
  | { type: 'hackathon'; title: string; tagline?: string; prizes?: { amount: string; label: string }[]; stats: { value: string; label: string; tier: 'primary' | 'secondary' }[]; sections: { heading: string; body: string | string[] }[]; criteria?: { category: string; pct: number; description: string }[] }
  | { type: 'calendar'; title: string; events: { date: string; label: string; time?: string; category: 'launch' | 'vibecoding' | 'devshop' | 'deadline' | 'milestone' | 'mtndao'; description?: string; link?: string; broadcastUrl?: string; tweetId?: string; presentationUrl?: string }[] }
  | { type: 'rules'; title: string; sections: { heading: string; body: string | string[] }[]; criteria: { category: string; pct: number; description: string }[] };

// ============================================================================
// Shared Components
// ============================================================================

export function ScrambleText({ text, speed = 1, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const { ref } = useScramble({
    text,
    speed,
    tick: 1,
    step: 5,
    seed: 1,
    chance: 0.9,
    overdrive: false,
    overflow: false,
    range: [33, 125],
    playOnMount: true,
    onAnimationEnd: onDone,
  });

  return <span ref={ref as React.RefObject<HTMLSpanElement>} />;
}

export function useSequentialReveal() {
  const [revealed, setRevealed] = useState(1);
  const advance = useCallback(() => setRevealed((r) => r + 1), []);
  return { revealed, advance };
}

// ============================================================================
// Pixel Icon Components
// ============================================================================

const pxStyle = (size: number): React.CSSProperties => ({ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, imageRendering: 'pixelated' as const });

export function DiscordIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={pxStyle(size)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M0 7.79963H2.59998V2.59982H5.19995V-1.33514e-05H10.4V2.59982H7.79993V5.19966H18.2001V2.59982H15.6V-1.33514e-05H20.8V2.59982H23.4V7.79963H26V20.7989H23.4V23.3989H15.6V20.7989H10.4V23.3989H2.59998V20.7989H0V7.79963ZM15.6 10.3995H18.2001V15.5993H15.6V10.3995ZM10.4 10.3995H7.79993V15.5993H10.4V10.3995Z"/>
    </svg>
  );
}

export function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={pxStyle(size)}>
      <path d="M3,4H5V5H6V6H7V7H9V6H10V5H11V4H13V6H12V7H11V8H10V10H11V11H12V12H13V14H11V13H10V12H9V11H7V12H6V13H5V14H3V12H4V11H5V10H6V8H5V7H4V6H3V4Z"/>
    </svg>
  );
}

function TrophyIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={pxStyle(size)}><path d="M2,3H4V4H3V6H2V3ZM3,6H4V7H3V6ZM5,2H11V8H10V9H9V12H10V13H11V14H5V13H6V12H7V9H6V8H5V2ZM12,3H14V6H13V4H12V3ZM12,6H13V7H12V6Z"/></svg>;
}

function CoinsIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={pxStyle(size)}><path d="M2,4H3V5H5V6H10V5H11V6H12V7H10V8H5V7H3V6H2V4ZM2,7H3V8H5V9H10V8H11V9H12V10H10V11H5V10H3V9H2V7ZM2,10H3V11H5V12H10V11H11V12H12V13H10V14H5V13H3V12H2V10ZM3,3H5V4H3V3ZM5,2H10V3H5V2ZM10,3H12V4H10V3ZM12,4H13V6H12V4ZM12,7H13V9H12V7ZM12,10H13V12H12V10Z"/></svg>;
}

function ElectricIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={pxStyle(size)}><path d="M4,7H5V5H6V3H7V2H12V4H11V5H10V6H9V7H12V9H11V10H10V11H9V12H8V13H7V14H6V12H7V10H8V9H4V7Z"/></svg>;
}

function FireIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={pxStyle(size)}><path d="M3,9H4V8H5V9H6V8H7V3H9V4H10V5H11V6H12V9H13V12H12V11H11V9H10V8H9V9H8V10H7V11H5V10H4V12H3V9ZM9,8V7H8V8H9ZM4,5H5V6H4V5ZM4,12H5V13H4V12ZM5,13H11V14H5V13ZM6,2H7V3H6V2ZM9,9H10V10H9V9ZM11,12H12V13H11V12Z"/></svg>;
}

function LightbulbIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={pxStyle(size)}><path d="M4,4H5V3H6V2H10V3H9V4H10V5H11V4H12V8H11V9H10V11H6V9H5V8H4V4ZM6,12H10V13H6V12ZM6,14H10V15H6V14ZM10,3H11V4H10V3Z"/></svg>;
}

function WrenchIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={pxStyle(size)}><path d="M9,2H13V3H12V5H11V6H10V7H9V8H8V9H7V10H6V11H5V12H4V13H2V11H3V10H4V9H5V8H6V7H7V6H8V5H9V2ZM3,13H4V14H3V13ZM5,11H6V12H5V11Z"/></svg>;
}

function HourglassIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={pxStyle(size)}><path d="M4,2H12V3H4V2ZM4,14H12V15H4V14ZM5,4H6V5H7V6H6V7H5V4ZM5,10H6V13H5V10ZM6,7H7V8H6V7ZM6,9H7V10H6V9ZM7,6H8V7H7V6ZM7,8H8V7H9V6H8V5H10V4H11V7H10V8H9V9H7V8ZM9,9H10V10H9V9ZM10,10H11V13H10V10Z"/></svg>;
}

function GlobeIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={pxStyle(size)}><path d="M3,6H4V9H5V11H6V12H7V13H9V12H8V11H7V10H8V9H9V6H10V5H8V4H6V3H11V4H12V5H13V6H14V11H13V7H12V8H11V10H12V11H11V12H10V13H11V14H6V13H5V12H4V11H3V6ZM12,5H11V6H12V5ZM4,5H5V6H4V5ZM5,4H6V5H5V4ZM11,12H12V13H11V12ZM12,11H13V12H12V11Z"/></svg>;
}

function DocumentIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={pxStyle(size)}><path d="M3,2H9V6H13V14H3V2ZM5,5V6H8V5H5ZM5,7V8H11V7H5ZM5,9V10H11V9H5ZM5,11V12H11V11H5ZM10,2H11V3H12V4H13V5H10V2Z"/></svg>;
}

function PlayIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={pxStyle(size)}><path d="M6,4H8V5H9V6H10V7H11V8H12V9H11V10H10V11H9V12H8V13H6V4Z"/></svg>;
}

function CogIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={pxStyle(size)}><path d="M2,7H4V5H3V3H5V4H7V2H9V4H11V3H13V5H12V7H14V9H12V11H13V13H11V12H9V14H7V12H5V13H3V11H4V9H2V7ZM6,7V9H7V10H9V9H10V7H9V6H7V7H6Z"/></svg>;
}

function CodeFolderIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={pxStyle(size)}><path d="M1,4H2V12H1V4ZM2,3H5V4H2V3ZM2,12H14V13H2V12ZM4,9H5V10H4V9ZM5,4H14V5H5V4ZM5,8H6V9H5V8ZM5,10H6V11H5V10ZM7,10H8V11H7V10ZM8,9H9V10H8V9ZM9,8H10V9H9V8ZM11,8H12V9H11V8ZM11,10H12V11H11V10ZM12,9H13V10H12V9ZM14,5H15V12H14V5Z"/></svg>;
}

// Map categories to legend icons
export const CATEGORY_COLORS: Record<string, string> = {
  launch: '#14f1b2',
  vibecoding: '#fd8f3a',
  devshop: '#6939ca',
  deadline: '#ef5c6f',
  milestone: '#b494f7',
  mtndao: '#8dfff0',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  launch: <ElectricIcon size={10} />,
  vibecoding: <LightbulbIcon size={10} />,
  devshop: <WrenchIcon size={10} />,
  deadline: <HourglassIcon size={10} />,
  milestone: <TrophyIcon size={10} />,
  mtndao: <FireIcon size={10} />,
};

const CRITERIA_ICONS: Record<string, React.ReactNode> = {
  'Stickiness & PMF': <FireIcon size={24} />,
  'User Experience': <LightbulbIcon size={24} />,
  'Innovation / X-factor': <ElectricIcon size={24} />,
  'Presentation & Demo': <TrophyIcon size={24} />,
  'Presentation & Demo Quality': <TrophyIcon size={24} />,
};

const SPECIAL_BG_CATEGORIES = new Set(['launch', 'deadline', 'milestone', 'mtndao']);

// ============================================================================
// Pitch Playbook Markdown (for Copy as Markdown button)
// ============================================================================

const PITCH_PLAYBOOK_MARKDOWN = `# How to Build a Hackathon Pitch That Wins

*From the Monolith DePitch Masterclass with Sofiane ([@depitchsofian](https://x.com/depitchsofian)), founder of DePitch — the Pitch Academy of Solana. Over the last 12 months, teams he's coached have raised a cumulative $2.5M+ in pre-seed and three were accepted into the Colosseum Accelerator.*

---

## Part 1: Why Most Pitches Fail

### Mistake 1: Weak hook

If you don't grab attention in the first 15 seconds with something new, unique, or punchy, it's over. Judges sit through dozens of pitches. Once they mentally check out, they don't come back.

Don't open with "Hi, we're team X and we built Y." Open with novelty — humor, innovation, a surprising stat, or just being frank.

### Mistake 2: Trust-killing language

The way you speak matters as much as what you say. If you speak in future hopes and potential instead of validated facts, you destroy trust in everything — your data, your traction, your product.

**Ban these from your vocabulary:**
- "We're trying to..."
- "We hope to achieve..."
- "We imagine the market will..."
- "We could potentially..."

Replace all conditional forms (would, should, could, might) with present tense. Not "we're trying to build" — "we built." Not "we hope to achieve" — "we deliver." Keep future tense only for your roadmap slide.

Record yourself. Listen for these. Replace them. It changes how judges perceive your confidence.

### Mistake 3: No real pain

Your solution exists because you thought it was a good idea — but it's not backed by a real user with a real problem. If judges doubt your problem is real, every slide after is dead on arrival.

### Mistake 4: Too complex

Two things kill a pitch: "I don't believe this" and "I don't understand this." If it's not clear what you're doing, the audience turns off and won't re-engage. Simple messages. Simple images. That's it.

### Mistake 5: Nothing memorable

If a judge can't describe you in one sentence after watching, you failed. "That's the team that built a game with 500K users." "That's the app that lets you pay with crypto at any QR code stall." Build your pitch around that sentence.

---

## Part 2: The Right Mindset

### You're pitching a business, not a product

The goal is not to present what you've built. The goal is to show you've built something people are using — and that there's a business model behind it. The app is the vehicle. The business is the pitch.

### Think elevator pitch

You're not giving a full breakdown of everything you do. You're selecting simple facts that create one effect: the audience wants to know more.

If someone talks for three minutes straight at a conference, you walk away. Same energy. The pitch is a teaser. It exists to create a next step — they scan the QR code, try your app, or book a call.

You stand out by being concise and easy to understand, not by sharing everything.

### Know your audience

Check the hackathon website. See who's judging. Look at what they tweet about, what excites them. Those are the people who decide if you win.

For Monolith, the evaluation criteria are: product-market fit, user experience, innovation, and presentation. The pitch captures all four — it's the entry point for everything else being judged.

### Re-hook every 20–30 seconds

It's not because someone clicks your video that they'll watch the whole thing. Every 20–30 seconds, you need a transition, an intriguing hook, a surprising stat, or a demo moment that keeps the audience engaged. If you go 30 seconds without something compelling, they stop watching. Treat it like content — because it is.

---

## Part 3: Slide-by-Slide Structure

### Slide 1: The Hook

You have 15 seconds. What do you have that the judges have never heard before? Something that makes them intrigued, surprised, or excited to see what's next. The hook is the single most important moment of your pitch.

### Slide 2: The Problem

Define the problem you're solving and back it with real data — so no one can argue or doubt what you're saying. Focus on one main problem. You can add sub-problems, but you need one clear problem line that captures everything.

If you sell the problem well, judges are 100% locked in for the solution. If they doubt it, the rest of the pitch is dead.

**Example:** Surfcash targeted crypto travelers in countries with heavy QR code payment systems (Vietnam, Brazil). They showed that 70% of merchants don't take cards and users pay 10% fees. Clear problem, clear data, clear audience.

### Slide 3: Value Proposition

The bridge between your problem and solution. One sentence that makes it instantly obvious what you do for the user.

**Examples from past winners:**
- NOMADZ: "Crypto-friendly travel bookings"
- SP3ND: "Buy anything on Amazon with stablecoins"

It should come naturally after the problem slide. When the value prop appears, the audience should immediately see how it fixes everything you just described.

### Slide 4: How It Works

Show your app in three simple steps. No jargon. No architecture diagrams. Just: connect wallet → do thing → get result.

Simple messages. Maybe a short flow. This is not your demo — it's the conceptual walkthrough.

### Slide 5: The Demo

20–30 seconds max. Record your phone screen, embed it in the deck, and voiceover what's happening. No fancy animations. No music. Just real usage.

Build in a "wow moment" — one thing that makes judges go "oh, that's cool."

Some judges (especially UX-focused ones) will click the demo video first. If they can't understand what's going on in the demo, they won't pay much attention to the pitch. Make sure the demo stands on its own.

### Slide 6: The Market

Forget the "if we capture 1% of a $50B market" slide. That screams amateur.

Instead, show a specific user intersection: who exactly are your users, how many exist, and what behaviors or demographics define them. Add one growth trend — stablecoin adoption, digital nomad growth, etc. — rather than generic market sizing.

### Slide 7: Business Model

Non-negotiable. How do you capture value? Keep it dead simple. Most projects here: transaction fees. But show you've thought about it.

Optional bonus: "If we hit 10K users at X transactions, we reach Y ARR." But the baseline is a very clear explanation of how you make money — ideally something you've already tried or can prove will work.

### Slide 8: Traction

This is what judges actually want to see. Not what you built — what happened when real people used it.

**Strongest proof (in order):**
1. Revenue capture, on-chain metrics, in-app activity
2. Registered users, retention data, growth curves
3. Waitlist signups, ecosystem partnerships
4. Social followers (weakest — not really traction)

Show growth over time if you can. Retention data compared to your market is gold. If you don't have a timeline, stick to key data points: previous wins, unique paying customers, repeat buyers, partners you're working with.

Don't fake it. If you show partner logos, say something specific about each one. "We have this partnership. It allows us to do X. Here's where we're at." Not just logos on a slide.

### Slide 9: Roadmap

Show where you are now (Q1 2026) and the next 2–3 quarters. Every milestone needs a real date — quarters, months, whatever. Not just "Phase 1, Phase 2."

This proves you have a plan and know where you're going.

### Slide 10: Team

Don't just list names and roles. Every team slide looks like that.

Highlight 1–2 facts only your team can claim. "Built a game with 320K users." "Backed by Circle." "Previously shipped X that reached Y users."

The message: we did it before. We'll do it again.

### Slide 11: Call to Action

Don't rush the ending. This is your last impression.

QR code to try your app. Link to a longer demo. A way to book a call. Give judges a next step if they're interested. Make it easy.

---

## Part 4: Submission Tips

- **Time your review.** Give your full submission to someone unfamiliar with it. If it takes more than 5–7 minutes to go through everything, trim it down. Ideally it's 4 minutes to understand what you built and why it matters.
- **Record yourself.** Watch it back. Share it with others. It's hard to make a good pitch alone — iterate and pitch in public.
- **Make everything accessible.** Public or unlisted links only. We've had teams submit private YouTube videos and Google Drive links we couldn't open. Invite \`hackathon@radiant.nexus\` to your Google Drive and GitHub repo.
- **Demo video should stand alone.** Have a separate demo video in addition to your deck. Some judges watch demos first.
- **Explain what it does before how it works.** Jargon is fine in small doses, but if you can't explain the use case simply before getting technical, you're going to have a bad time.
- **Show you care.** Passion, conviction, curiosity — judges can hear it. A polished submission communicates that you take this seriously.

---

## Quick Reference: Pitch Structure

1. **Hook** — 15 seconds, grab attention with novelty
2. **Problem** — data-backed, one clear pain point
3. **Value Prop** — one sentence, bridge to solution
4. **How It Works** — 3 simple steps, no jargon
5. **Demo** — 20–30 sec screen recording with voiceover
6. **Market** — specific user intersection + growth trend
7. **Business Model** — how you capture value
8. **Traction** — real usage data, growth curves, retention
9. **Roadmap** — quarterly milestones with real dates
10. **Team** — unique achievements, not just roles
11. **Call to Action** — QR code, next step, make it easy
`;

// ============================================================================
// Copy Markdown Button
// ============================================================================

function CopyMarkdownButton({ markdown, label = 'Copy as Markdown' }: { markdown: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [markdown]);

  return (
    <button type="button" className="copy-markdown-button" onClick={handleCopy}>
      {copied ? 'Copied!' : label}
    </button>
  );
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ============================================================================
// Content Data
// ============================================================================

export const CONTENT: Record<string, WindowContent> = {
  hackathon: {
    type: 'hackathon',
    title: 'HACKATHON.EXE',
    tagline: 'Monolith is a 5-week sprint to compete and build a mobile app for the Solana dApp Store. Design, develop, and ship an Android application that serves the Seeker community — Solana Mobile\'s growing ecosystem of mobile-first crypto users.',
    prizes: [
      { amount: '$10,000', label: '10 WINNERS' },
      { amount: '$5,000', label: '5 HONORABLE' },
      { amount: '$10,000', label: 'SKR BONUS' },
    ],
    stats: [
      { value: '$125K+', label: 'IN PRIZES', tier: 'primary' },
      { value: '5 WEEKS', label: 'TO BUILD', tier: 'secondary' },
      { value: 'SOLANA', label: 'DAPP STORE', tier: 'secondary' },
    ],
    sections: [
      {
        heading: 'What to Build',
        body: [
          'Platform: Android — your app must produce a functional APK',
          'Must integrate the Solana Mobile Stack and Mobile Wallet Adapter',
          'Designed for mobile from the ground up — direct ports or PWA wrappers will score poorly',
          'Your app should interact meaningfully with the Solana network',
        ],
      },
      {
        heading: 'What to Submit',
        body: [
          'A functional Android APK',
          'A GitHub repository with your source code',
          'A demo video showcasing your app\'s functionality',
          'A pitch deck or brief presentation explaining your app',
        ],
      },
      {
        heading: 'Results',
        body: [
          'Results announced early April',
          'Winners must publish on dApp Store to claim prize (reasonable timeframe given)',
          'All winners are subject to technical review, including code verification and follow-up questions',
        ],
      },
    ],
    criteria: [
      { category: 'Stickiness & PMF', pct: 25, description: 'How well does your app resonate with the Seeker community? Does it create habits and drive daily engagement?' },
      { category: 'User Experience', pct: 25, description: 'Is the app intuitive, polished, and enjoyable to use?' },
      { category: 'Innovation / X-factor', pct: 25, description: 'How novel and creative is the idea? Does it stand out from existing products?' },
      { category: 'Presentation & Demo', pct: 25, description: 'How clearly did the team communicate their idea? Does the demo effectively showcase the core concept?' },
    ],
  },

  rules: {
    type: 'rules',
    title: 'RULES.exe',
    sections: [
      {
        heading: 'Eligibility',
        body: [
          'Project must have been started within 3 months of the hackathon launch date',
          'Projects that have raised outside capital are not eligible',
          'Pre-existing projects are allowed if they show significant new mobile development during the hackathon',
          'Teams with existing web apps can participate, but must build an Android app with significant mobile-specific development',
          'Direct ports or minimal conversions of existing web apps — including PWA wrappers with little to no mobile optimisation — will score poorly and are unlikely to win. We\'re looking for apps that take meaningful advantage of mobile',
        ],
      },
      {
        heading: 'Submission Requirements',
        body: 'All submissions must include: A functional Android APK, a GitHub repo, a demo video showcasing functionality, and a pitch deck or brief presentation explaining the app.',
      },
      {
        heading: 'Prize Eligibility',
        body: 'Publishing on the Solana dApp Store is not required by the submission deadline. However, winners must publish their app on the dApp Store to claim their prize. Winners will be given a reasonable timeframe after results are announced.',
      },
      {
        heading: 'Submission Deadline',
        body: 'All materials (GitHub repo, demo video, and pitch deck) must be submitted before the deadline. No late entries.',
      },
      {
        heading: 'Disqualification',
        body: 'Any team that lies on their registration or submission forms, or violates any rule, will forfeit all prizes.',
      },
    ],
    criteria: [
      { category: 'Stickiness & PMF', pct: 25, description: 'How well does your app resonate with the Seeker community? Does it create habits and drive daily engagement?' },
      { category: 'User Experience', pct: 25, description: 'Is the app intuitive, polished, and enjoyable to use?' },
      { category: 'Innovation / X-factor', pct: 25, description: 'How novel and creative is the idea? Does it stand out from existing products?' },
      { category: 'Presentation & Demo Quality', pct: 25, description: 'How clearly did the team communicate their idea? Does the demo effectively showcase the core concept?' },
    ],
  },

  prizes: {
    type: 'prizes',
    title: 'PRIZES.exe',
    poolTotal: '$125,000+',
    tiers: [
      { label: '10 Winners', amount: '$10,000 USD each', description: 'Top 10 projects receive $10,000 USD.', variant: 'hero' },
      { label: '5 Honorable Mentions', amount: '$5,000 USD each', description: 'Next 5 projects receive $5,000 USD.', variant: 'runner-up' },
      { label: 'SKR Bonus Track', amount: '$10,000 in SKR', description: 'SKR is the native asset of the Solana Mobile Ecosystem. The best SKR integration receives $10,000 worth of SKR. Integrate SKR with your app in a meaningful way to be eligible.', variant: 'bonus' },
      { label: 'Featured dApp Store Placement', amount: 'EXTRAS', variant: 'extra', description: 'High visibility features for top projects. Over 100,000 eyeballs from the get go.' },
      { label: 'Marketing & Launch Support', amount: 'EXTRAS', variant: 'extra', description: 'Go-to-market strategy and guidance. Marketing amplification from official Solana Mobile channels.' },
      { label: 'Seeker Devices', amount: 'EXTRAS', variant: 'extra', description: 'Free Seeker devices for all winning teams to continually grow and develop the Solana Mobile Ecosystem.' },
      { label: 'A Call with Toly', amount: 'PLUS', variant: 'extra', description: 'Winners & honorable mentions will get a chance to receive feedback directly from Toly.' },
    ],
  },

  judges: {
    type: 'judges',
    title: 'JUDGES.exe',
    judges: [
      { name: 'Toly', role: 'Phone Salesman', org: 'Solana Labs', twitter: 'toly', image: '/assets/judges/toly.avif' },
      { name: 'Emmett', role: 'General Manager', org: 'Solana Mobile', twitter: 'm_it', image: '/assets/judges/emmett.avif' },
      { name: 'Mert', role: 'Shitposter', org: 'Helius', twitter: 'mert', image: '/assets/judges/mert.avif' },
      { name: 'Mike S', role: 'Developer Relations', org: 'Solana Mobile', twitter: 'somemobiledev', image: '/assets/judges/mike.avif' },
      { name: 'Chase', role: 'Based Snarker', org: 'Solana Mobile', twitter: 'therealchaseeb', image: '/assets/judges/chase.avif' },
      { name: 'Akshay', role: 'BD & Ecosystem', org: 'Solana Mobile / Solana Labs', twitter: '0x_Diablo', image: '/assets/judges/akshay.jpg' },
    ],
    evaluation: [
      'Completion based on the demo video',
      'Technical depth based on GitHub commits',
      'Mobile optimized user experience and usage of mobile features',
      'Usage and interaction with the Solana network',
      'Clarity and vision from the presentation',
    ],
  },

  toolbox: {
    type: 'tabs',
    title: 'TOOLBOX.exe',
    tabs: [
      {
        id: 'dev-docs',
        label: 'DEV DOCS',
        contentType: 'featured-accordion' as const,
        featuredItems: [
          { label: 'Quickstart Template', url: 'https://docs.solanamobile.com/react-native/quickstart', description: 'Get started with the Solana Mobile React Native quickstart template.' },
          { label: 'Integrate Mobile Wallet Adapter', url: 'https://docs.solanamobile.com/mobile-wallet-adapter/mobile-apps', description: 'Add Mobile Wallet Adapter to your mobile app.' },
          { label: 'Solana Mobile Sample Apps', url: 'https://docs.solanamobile.com/sample-apps/sample_app_overview', description: 'Browse sample applications built with the Solana Mobile Stack.' },
          { label: 'Solana Development Docs', url: 'https://solana.com/docs', description: 'The core Solana documentation.' },
          { label: 'Expo / React Native Docs', url: 'https://docs.expo.dev/', description: 'Official Expo and React Native documentation.' },
        ],
        accordionItems: [
          {
            title: 'Solana Mobile Resources', icon: <GlobeIcon size={12} />,
            items: [
              { label: 'Getting Started', url: 'https://docs.solanamobile.com/developers/overview', description: 'Visit the Solana Mobile docs and review the React Native Quickstart guide.' },
              { label: 'Development Setup (No Device Needed)', url: 'https://docs.solanamobile.com/developers/development-setup', description: 'You do not need a Solana Mobile device. All tools are available to start building today.' },
              { label: 'Test with Any Android Device', url: 'https://docs.solanamobile.com/react-native/test-with-any-android-device', description: 'You don\'t need a Seeker — test your app on any Android phone.' },
              { label: 'dApp Store Publishing', url: 'https://docs.solanamobile.com/dapp-publishing/publisher-policy', description: 'Android apps only. If you have a web app, convert it to Android. Ensure compliance with the Publisher Policy.' },
            ],
          },
          {
            title: 'General Solana Resources', icon: <DocumentIcon size={12} />,
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
            title: 'Guides, Videos & Self-Learning', icon: <PlayIcon size={12} />,
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
            title: 'Tooling, Ecosystem Docs & SDKs', icon: <CogIcon size={12} />,
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
            title: 'Open Source References', icon: <CodeFolderIcon size={12} />,
            items: [
              { label: 'Awesome Solana OSS', url: 'https://github.com/StockpileLabs/awesome-solana-oss', description: 'Curated list of open-source Solana projects for reference and learning.' },
            ],
          },
        ],
      },
      {
        id: 'components',
        label: 'COMPONENTS',
        contentType: 'component-library' as const,
      },
      {
        id: 'workshops',
        label: 'WORKSHOPS',
        contentType: 'workshops' as const,
        workshops: [
          { date: 'Mar 3', label: 'Pitch Workshop', category: 'vibecoding', description: 'DePitch Masterclass with Sofiane and KEMOS4BE — how to build a hackathon pitch that wins.', summary: 'Hook in 15 sec, data-backed problems, 20-sec demos, traction over features, 11-slide structure.', tweetId: '2029006932024131884' },
          { date: 'Feb 12', label: 'Devshop', category: 'devshop', description: 'Hands-on devshop with Mike from Solana Mobile. Includes "The Handoff is Dead" presentation.', summary: 'Hands-on MWA integration, dApp Store submission walkthrough.', broadcastUrl: 'https://x.com/i/broadcasts/1yoKMPyYDalxQ', tweetId: '2023832513047646229', presentationUrl: '/the-handoff-is-dead.html' },
          { date: 'Feb 10', label: 'Design Workshop', category: 'vibecoding', description: 'Workshop 3 with KEMOS4BE: "The Handoff Is Dead" design loop for mobile apps (generate -> experience -> inspect -> critique -> regenerate).', summary: 'The Handoff Is Dead: generate → experience → inspect → critique → regenerate.', broadcastUrl: 'https://x.com/i/broadcasts/1rmxPvymkEZGN', presentationUrl: 'https://docs.google.com/presentation/d/1DigNlZvNdnFrLeae1yb-BohR8Fny4sEyVDnERhE2vUY/edit?usp=sharing' },
          { date: 'Feb 5', label: 'Devshop', category: 'devshop', description: 'Workshop 2 (Mobile AI Toolkit), hosted by Mike from Solana Mobile. Covers Solana Mobile Stack, MWA integration, and dApp Store publishing.', summary: 'Solana Mobile Stack, MWA integration, dApp Store publishing.', broadcastUrl: 'https://x.com/i/broadcasts/1RDxlAyqWBRKL', presentationUrl: 'https://docs.google.com/presentation/d/1qEQs8WePqbIcAOMlU_3B7Qp55jl8p_OfNkgysOHwe1w/edit?usp=sharing' },
          { date: 'Feb 3', label: 'Kickoff Workshop', category: 'vibecoding', description: 'Mike from Solana Mobile walks you through everything you need to know, while KEMOS4BE kicks off an all-day vibecoding session.', summary: 'Solana Mobile overview, hackathon rules, vibecoding setup with Claude Code.', broadcastUrl: 'https://x.com/i/broadcasts/1lPJqvvORYZxb', presentationUrl: 'https://docs.google.com/presentation/d/1f-VNMtBIfGZz2iCETL3ZU0dwZFHxJs4w9ABkWLltHU4/edit?usp=sharing' },
        ],
      },
    ],
  },

  faq: {
    type: 'accordion',
    title: 'FAQ.exe',
    categories: [
      {
        heading: 'Getting Started',
        items: [
          { question: 'How do I sign up?', answer: 'Connect your wallet and create a profile on Align — our on-chain hackathon dApp.' },
          { question: 'Do I need an organization profile on Align?', answer: 'Nope — a personal account is all you need.' },
          { question: 'What dimensions should my profile banner be?', answer: '1200 × 600 px.' },
          { question: 'When is the sign-up deadline?', answer: 'March 9, 2026.' },
          { question: 'Who should submit?', answer: 'One member per team.' },
          { question: 'Can I compete solo?', answer: 'Yes, but teaming up is encouraged.' },
        ],
      },
      {
        heading: 'Eligibility',
        items: [
          { question: 'Can I enter if I won a previous hackathon?', answer: 'Anyone can win cash prizes as long as they ship a new mobile app. We just don\'t want old projects lazily re-submitted — previous winners should not be entering the same app. Funded teams are not eligible.' },
          { question: 'Can I work on a pre-existing product?', answer: 'Only if it was started within 3 months of the hackathon. Otherwise, you\'ll need to show significant new mobile development.' },
          { question: 'Can I convert an existing web app to mobile?', answer: 'You can participate, but you must build a native or hybrid Android app with meaningful mobile-specific work during the hackathon. Direct ports and minimal conversions — including PWA wrappers — will score poorly and are unlikely to win cash prizes.' },
          { question: 'Are funded projects eligible?', answer: 'No.' },
          { question: 'Can I compete in both Monolith and the Solana Graveyard Hackathon?', answer: 'Yes — Graveyard Hackathon submissions can also be eligible for Monolith as long as they abide by the rules and submission requirements. More hackathons, more chances to win.' },
          { question: 'Are there tracks?', answer: 'One category: Mobile dApps.' },
        ],
      },
      {
        heading: 'Building & Submissions',
        items: [
          { question: 'What can I build?', answer: 'Anything — as long as it\'s an Android app compatible with the dApp Store.' },
          { question: 'Can I vibe-code my app?', answer: 'Yes — but AI-slop will score poorly.' },
          { question: 'Does my GitHub repo need to be public?', answer: 'Either make it public or invite the hackathon-Judges GitHub account.' },
          { question: 'Do I have to include an APK?', answer: 'Yes.' },
          { question: 'What are the submission requirements?', answer: 'A functional Android APK, a GitHub repo, a demo video showcasing functionality, and a pitch deck or brief presentation explaining the app. Check the Toolbox for templates.' },
          { question: 'Does my submission need to be a mobile app?', answer: 'Yes — a functioning Android app.' },
          { question: 'Is there a limit on the number of entries?', answer: 'No limit, but less is more — quality over quantity.' },
          { question: 'Can I edit my submission before the deadline?', answer: 'Yes, submissions stay editable until the hackathon closes.' },
          { question: 'When does submission close?', answer: 'March 9, 2026.' },
          { question: 'Can I keep working on my code after submission closes?', answer: 'Fork your repo and continue on a separate branch.' },
          { question: 'How do I test without a Seeker?', answer: 'Any Android phone works. Check the Toolbox for setup guides.' },
        ],
      },
      {
        heading: 'Prizes & Publishing',
        items: [
          { question: 'What is SKR?', answer: 'The native asset of the Solana Mobile ecosystem. The best SKR integration wins $10,000 in SKR as a bonus prize — integrate it meaningfully to be eligible.' },
          { question: 'Do I need to publish on the dApp Store?', answer: 'Not by the submission deadline. Winners must publish to claim their prize, but you\'ll be given a reasonable timeframe after results are announced.' },
          { question: 'How are projects evaluated?', answer: 'Judges look at demo completeness, technical depth via GitHub commits, mobile-optimized UX and use of mobile features, Solana Mobile Stack & MWA integration, and potential traction with Seeker users.' },
        ],
      },
    ],
  },

  calendar: {
    type: 'calendar',
    title: 'CALENDAR.exe',
    events: [
      // Week 1
      { date: '2026-02-02', label: 'LAUNCH DAY', category: 'launch' },
      { date: '2026-02-03', label: 'Kickoff Workshop', time: '9:30 AM PST', category: 'vibecoding', description: 'Get started with the hackathon! Mike from Solana Mobile walks you through everything you need to know, while KEMOS4BE kicks off an all-day vibecoding session — planning and building his hackathon project live. Join in the Radiants Discord.', link: 'https://discord.gg/radiants', broadcastUrl: 'https://x.com/i/broadcasts/1lPJqvvORYZxb', presentationUrl: 'https://docs.google.com/presentation/d/1f-VNMtBIfGZz2iCETL3ZU0dwZFHxJs4w9ABkWLltHU4/edit?usp=sharing' },
      { date: '2026-02-05', label: 'Devshop', time: '9:30 AM PST', category: 'devshop', description: 'Workshop 2 (Mobile AI Toolkit), hosted by Mike from Solana Mobile. Covers Solana Mobile Stack, MWA integration, and dApp Store publishing.', link: 'https://discord.gg/radiants', broadcastUrl: 'https://x.com/i/broadcasts/1RDxlAyqWBRKL', presentationUrl: 'https://docs.google.com/presentation/d/1qEQs8WePqbIcAOMlU_3B7Qp55jl8p_OfNkgysOHwe1w/edit?usp=sharing' },
      // MTNDAO
      { date: '2026-02-09', label: 'Solana Mobile MTNDAO', category: 'mtndao' },
      { date: '2026-02-10', label: 'Solana Mobile MTNDAO', category: 'mtndao' },
      { date: '2026-02-11', label: 'Solana Mobile MTNDAO', category: 'mtndao' },
      { date: '2026-02-12', label: 'Solana Mobile MTNDAO', category: 'mtndao' },
      // Week 2
      { date: '2026-02-10', label: 'Design Workshop', time: '9:30 AM PST', category: 'vibecoding', description: 'Workshop 3 with KEMOS4BE: "The Handoff Is Dead" design loop for mobile apps (generate -> experience -> inspect -> critique -> regenerate).', link: 'https://discord.gg/radiants', broadcastUrl: 'https://x.com/i/broadcasts/1rmxPvymkEZGN', presentationUrl: 'https://docs.google.com/presentation/d/1DigNlZvNdnFrLeae1yb-BohR8Fny4sEyVDnERhE2vUY/edit?usp=sharing' },
      { date: '2026-02-12', label: 'Devshop', time: '9:30 AM PST', category: 'devshop', description: 'Hands-on technical workshop hosted by Mike from Solana Mobile, covering Solana Mobile Stack, MWA integration, and dApp Store publishing.', link: 'https://discord.gg/radiants', broadcastUrl: 'https://x.com/i/broadcasts/1yoKMPyYDalxQ', tweetId: '2023832513047646229', presentationUrl: '/the-handoff-is-dead.html' },
      // Week 3
      { date: '2026-02-17', label: 'Vibecoding', time: '9:30 AM PST', category: 'vibecoding', description: 'Learn how to levelup your app dev process w/ Claude Code, hosted by KEMOS4BE in the Radiants Discord.', link: 'https://discord.gg/radiants' },
      { date: '2026-02-19', label: 'Devshop', time: '9:30 AM PST', category: 'devshop', description: 'Hands-on technical workshops covering Solana Mobile Stack, MWA integration, and dApp Store publishing with Mike from Solana Mobile.', link: 'https://discord.gg/radiants' },
      // Week 4
      { date: '2026-02-24', label: 'Vibecoding', time: '9:30 AM PST', category: 'vibecoding', description: 'Learn how to levelup your app dev process w/ Claude Code, hosted by KEMOS4BE in the Radiants Discord.', link: 'https://discord.gg/radiants' },
      { date: '2026-02-26', label: 'Devshop', time: '9:30 AM PST', category: 'devshop', description: 'Hands-on technical workshops covering Solana Mobile Stack, MWA integration, and dApp Store publishing with Mike from Solana Mobile.', link: 'https://discord.gg/radiants' },
      // Week 5
      { date: '2026-03-03', label: 'Pitch Workshop', time: '9:30 AM PST', category: 'vibecoding', description: 'DePitch Masterclass with Sofiane and KEMOS4BE — how to build a hackathon pitch that wins.', link: 'https://discord.gg/radiants', tweetId: '2029006932024131884' },
      { date: '2026-03-05', label: 'Devshop', time: '9:30 AM PST', category: 'devshop', description: 'Hands-on technical workshops covering Solana Mobile Stack, MWA integration, and dApp Store publishing with Mike from Solana Mobile.', link: 'https://discord.gg/radiants' },
      // Milestones
      { date: '2026-02-02', label: 'Open for Submissions', time: '11:00 AM EST', category: 'milestone' },
      { date: '2026-03-08', label: 'Submissions Closed', time: '7:00 PM PST', category: 'deadline' },
      { date: '2026-03-09', label: 'Voting Starts', time: '7:00 PM PST', category: 'milestone' },
      { date: '2026-04-29', label: 'Voting Ends', time: '7:00 PM PST', category: 'deadline' },
      { date: '2026-05-07', label: 'Prizes Distributed', time: '7:00 PM PST', category: 'milestone' },
    ],
  },

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
          { heading: 'Data Collection', body: 'We collect: name, email, wallet address, and project details. For prize winners: government ID, address, and selfie for KYC verification.' },
          { heading: 'Purpose', body: 'Data is used for hackathon administration, KYC/AML compliance, fraud prevention, and prize distribution.' },
          { heading: 'Data Sharing', body: 'Data may be shared with third-party KYC providers and regulatory authorities as required by law. We do not sell personal data.' },
          { heading: 'Retention', body: 'Data is retained for 5 years post-hackathon per BVI AML regulations. You may request access, correction, or deletion of your data.' },
        ],
      },
      {
        id: 'kyc',
        label: 'KYC',
        sections: [
          { heading: 'Purpose', body: 'KYC verification is required for AML/CFT compliance and fraud mitigation.' },
          { heading: 'Scope', body: 'KYC applies to all prizes of $2,500 USD or higher. Verification is required before prize disbursement.' },
          { heading: 'Procedure', body: 'Verification is conducted via third-party provider or manual review through a secure channel. Required: government-issued photo ID and selfie verification.' },
          { heading: 'Crypto Payouts', body: 'For crypto prize payouts, wallet address verification is required. Payouts are made to the verified wallet only.' },
        ],
      },
    ],
  },
};

// ============================================================================
// Content Renderers
// ============================================================================

function renderEntries(
  data: Extract<WindowContent, { type: 'entries' }>,
  revealed: number,
  advance: () => void,
) {
  return (
    <div className="timeline-content">
      {data.entries.map((entry, i) => {
        if (revealed < i + 2) return null;
        return (
          <div key={i} className="timeline-entry">
            <div className="timeline-entry-header">
              <ScrambleText text={`${entry.date} — ${entry.title}`} onDone={advance} />
            </div>
            <div className="timeline-entry-body">
              {entry.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderSections(
  data: Extract<WindowContent, { type: 'sections' }>,
  revealed: number,
  advance: () => void,
) {
  return (
    <div className="timeline-content">
      {data.sections.map((section, i) => {
        if (revealed < i + 2) return null;
        return (
          <div key={i} className="timeline-entry">
            <div className="timeline-entry-header">
              <ScrambleText text={section.heading} onDone={advance} />
            </div>
            <div className="timeline-entry-body">
              {section.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderTabs(
  data: Extract<WindowContent, { type: 'tabs' }>,
  initialTab?: string | null,
  activeSubTab?: string | null,
  setActiveSubTab?: (tab: string) => void,
) {
  const resolvedTab = activeSubTab && data.tabs.find(t => t.id === activeSubTab) ? activeSubTab : undefined;
  const defaultTab = data.tabs.find(t => t.id === initialTab)?.id ?? data.tabs[0]?.id;
  return (
    <CrtTabs defaultValue={defaultTab} value={resolvedTab} onValueChange={setActiveSubTab}>
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

function TabHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-[1.25em]">
      <h2 className="font-heading text-[1.5em] text-content-primary uppercase tracking-wider mb-[0.15em]">
        {title}
      </h2>
      {subtitle && (
        <p className="font-ui text-[0.8em] text-content-secondary uppercase tracking-wider">
          {subtitle}
        </p>
      )}
    </div>
  );
}

const TAB_META: Record<string, { title: string; subtitle?: string }> = {
  'dev-docs': { title: 'Dev Docs', subtitle: 'Curated SDKs, templates & learning resources' },
  'components': { title: 'Component Library', subtitle: 'Live UI patterns used in MONOLITH' },
  'workshops': { title: 'Workshops', subtitle: 'Replay archive for kickoff, vibecoding & devshops' },
};

function renderTabContent(tab: TabContent) {
  if ('contentType' in tab && tab.contentType === 'coming-soon') {
    return (
      <div className="coming-soon">
        <p className="coming-soon-text">{'comingSoonMessage' in tab && tab.comingSoonMessage ? tab.comingSoonMessage : 'COMING SOON'}</p>
      </div>
    );
  }
  const meta = TAB_META[tab.id];
  const heading = meta ? <TabHeading title={meta.title} subtitle={meta.subtitle} /> : null;
  if ('contentType' in tab && tab.contentType === 'component-library') {
    return <>{heading}<ComponentLibraryContent /></>;
  }
  if ('contentType' in tab && tab.contentType === 'workshops') {
    return (
      <>
        {heading}
        <div className="resource-list">
          {tab.workshops.map((ws, j) => (
            <div key={j} className="workshop-card">
              <div className="workshop-card-header">
                <span className="cal-dot" style={{ background: CATEGORY_COLORS[ws.category] || '#b494f7' }} />
                <span className="resource-link">{ws.label}</span>
                <span className="panel-muted" style={{ marginLeft: 'auto' }}>{ws.date}</span>
              </div>
              {ws.description && <p className="resource-description">{ws.description}</p>}
              {ws.summary && (
                <div className="workshop-card-summary">{ws.summary}</div>
              )}
              <div className="workshop-card-actions">
                {ws.broadcastUrl && (
                  <a href={ws.broadcastUrl} target="_blank" rel="noopener noreferrer" className="workshop-action-btn">
                    <PlayIcon size={12} /> Watch Replay
                  </a>
                )}
                {ws.presentationUrl && (
                  <a href={ws.presentationUrl} target="_blank" rel="noopener noreferrer" className="workshop-action-btn">
                    <DocumentIcon size={12} /> Slides
                  </a>
                )}
                {ws.tweetId && (
                  <a href={`https://x.com/i/status/${ws.tweetId}`} target="_blank" rel="noopener noreferrer" className="workshop-action-btn">
                    <PlayIcon size={12} /> Watch on X
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }
  if ('contentType' in tab && tab.contentType === 'featured-accordion') {
    return (
      <>
        {heading}
        <div className="resource-list" style={{ marginBottom: '1.5em' }}>
          {tab.featuredItems.map((item, j) => (
            <a key={j} href={item.url} target="_blank" rel="noopener noreferrer" className="resource-item resource-item--link">
              <span className="resource-link">{item.label}</span>
              {item.description && (
                <p className="resource-description">{item.description}</p>
              )}
            </a>
          ))}
        </div>
        <div className="evaluation-heading evaluation-heading--divider" style={{ marginBottom: '0.75em' }}>
          <ScrambleText text="MORE RESOURCES" />
        </div>
        <CrtAccordion type="multiple">
          {tab.accordionItems.map((section, i) => (
            <CrtAccordion.Item key={i} value={`section-${i}`}>
              <CrtAccordion.Trigger>{section.icon && <span className="accordion-icon">{section.icon}</span>}{section.title}</CrtAccordion.Trigger>
              <CrtAccordion.Content>
                <div className="resource-list">
                  {section.items.map((item, j) =>
                    item.url ? (
                      <a key={j} href={item.url} target="_blank" rel="noopener noreferrer" className="resource-item resource-item--link">
                        <span className="resource-link">{item.label}</span>
                        {item.description && (
                          <p className="resource-description">{item.description}</p>
                        )}
                      </a>
                    ) : (
                      <div key={j} className="resource-item">
                        <span className="resource-label">{item.label}</span>
                        {item.description && (
                          <p className="resource-description">{item.description}</p>
                        )}
                      </div>
                    )
                  )}
                </div>
              </CrtAccordion.Content>
            </CrtAccordion.Item>
          ))}
        </CrtAccordion>
      </>
    );
  }
  if ('contentType' in tab && tab.contentType === 'accordion') {
    return (
      <CrtAccordion type="multiple">
        {tab.accordionItems.map((section, i) => (
          <CrtAccordion.Item key={i} value={`section-${i}`}>
            <CrtAccordion.Trigger>{section.icon && <span className="accordion-icon">{section.icon}</span>}{section.title}</CrtAccordion.Trigger>
            <CrtAccordion.Content>
              <div className="resource-list">
                {section.items.map((item, j) =>
                  item.url ? (
                    <a key={j} href={item.url} target="_blank" rel="noopener noreferrer" className="resource-item resource-item--link">
                      <span className="resource-link">{item.label}</span>
                      {item.description && (
                        <p className="resource-description">{item.description}</p>
                      )}
                    </a>
                  ) : (
                    <div key={j} className="resource-item">
                      <span className="resource-label">{item.label}</span>
                      {item.description && (
                        <p className="resource-description">{item.description}</p>
                      )}
                    </div>
                  )
                )}
              </div>
            </CrtAccordion.Content>
          </CrtAccordion.Item>
        ))}
      </CrtAccordion>
    );
  }
  // Default: sections
  const sectionsTab = tab as TabContent & { sections: { heading: string; body: string }[] };
  return (
    <div className="timeline-content">
      {sectionsTab.sections.map((section, i) => (
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

function renderAccordion(
  data: Extract<WindowContent, { type: 'accordion' }>,
) {
  let itemIndex = 0;
  return (
    <div className="faq-categories">
      {data.categories.map((category, ci) => (
        <div key={ci} className="faq-category">
          <div className="evaluation-heading evaluation-heading--divider">
            <ScrambleText text={category.heading} />
          </div>
          <CrtAccordion type="single">
            {category.items.map((item) => {
              const idx = itemIndex++;
              return (
                <CrtAccordion.Item key={idx} value={`faq-${idx}`}>
                  <CrtAccordion.Trigger>
                    <ScrambleText text={item.question} speed={1} />
                  </CrtAccordion.Trigger>
                  <CrtAccordion.Content>
                    <span className="timeline-entry-body" style={{ display: 'block' }}>
                      {item.answer}
                    </span>
                  </CrtAccordion.Content>
                </CrtAccordion.Item>
              );
            })}
          </CrtAccordion>
        </div>
      ))}
    </div>
  );
}

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
            <a
              key={i}
              href={judge.twitter ? `https://x.com/${judge.twitter}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="judge-card-v2"
            >
              {judge.image && (
                <div className="judge-pfp-wrap">
                  <img src={judge.image} alt={judge.name} className="judge-pfp" />
                </div>
              )}
              <div className="judge-info">
                <div className="judge-name-v2">
                  <ScrambleText text={judge.name} />
                </div>
                {judge.role && (
                  <div className="judge-role">
                    <ScrambleText text={judge.role} onDone={advance} />
                  </div>
                )}
                {judge.org && (
                  <div className="judge-nameplate">
                    {judge.org}
                  </div>
                )}
              </div>
            </a>
          );
        })}
      </div>

      {data.evaluation && revealed >= data.judges.length + 2 && (
        <div className="evaluation-section">
          <div className="evaluation-heading">
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

          <div className="evaluation-heading evaluation-heading--divider">
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
                <div className="criteria-header">
                  <div className="criteria-icon-badge">{CRITERIA_ICONS[c.category]}</div>
                  <span className="subsection-heading">{c.category}</span>
                  <span className="criteria-divider" />
                  <span className="criteria-badge">{c.pct}%</span>
                </div>
                <div className="timeline-entry-body" style={{ padding: '0.75em' }}>
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

function renderPrizes(
  data: Extract<WindowContent, { type: 'prizes' }>,
  revealed: number,
  advance: () => void,
) {
  return (
    <div className="timeline-content">
      {/* Prize pool hero */}
      <div className="prize-pool-hero">
        <div className="prize-pool-label">
          <ScrambleText text="Total Prize Pool" onDone={advance} />
        </div>
        <div className="prize-pool-value">
          <ScrambleText text={data.poolTotal} />
        </div>
      </div>

      {data.tiers.map((tier, i) => {
        if (revealed < i + 2) return null;
        const variantClass = tier.variant ? ` prize-tier--${tier.variant}` : '';
        const prevTier = i > 0 ? data.tiers[i - 1] : null;
        const isFirstBonus = tier.variant === 'bonus' && (!prevTier || prevTier.variant !== 'bonus');
        const isFirstExtra = tier.variant === 'extra' && tier.amount !== 'PLUS' && (!prevTier || prevTier.variant !== 'extra');
        const isPlus = tier.amount === 'PLUS';
        return (
          <Fragment key={i}>
            {isFirstBonus && (
              <div className="prize-bonus-divider">
                <span className="prize-bonus-divider-text">Bonus Track</span>
              </div>
            )}
            {isFirstExtra && (
              <div className="prize-bonus-divider">
                <span className="prize-bonus-divider-text">Extras</span>
              </div>
            )}
            {isPlus && (
              <div className="prize-bonus-divider">
                <span className="prize-bonus-divider-text">Plus</span>
              </div>
            )}
            <div className={`prize-tier${variantClass}${isPlus ? ' prize-tier--plus' : ''}`}>
              {tier.variant !== 'extra' && (
                <div className="prize-amount">
                  <ScrambleText text={tier.amount} onDone={advance} />
                </div>
              )}
              <div className={tier.variant === 'extra' ? 'prize-amount' : 'prize-label'}>
                <ScrambleText text={tier.label} onDone={tier.variant === 'extra' ? advance : undefined} />
              </div>
              {tier.description && (
                <div className="prize-description">
                  {tier.description}
                </div>
              )}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function renderRules(
  data: Extract<WindowContent, { type: 'rules' }>,
  revealed: number,
  advance: () => void,
) {
  return (
    <div className="rules-content">
      <div className="timeline-content">
        {data.sections.map((section, i) => {
          if (revealed < i + 2) return null;
          return (
            <div key={i} className="timeline-entry">
              <div className="timeline-entry-header">
                <ScrambleText text={section.heading} onDone={advance} />
              </div>
              <div className="timeline-entry-body">
                {Array.isArray(section.body) ? (
                  <ul className="entry-bullets">
                    {section.body.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  section.body
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ============================================================================
// Calendar Components
// ============================================================================

/** Convert an event time string like "9:30 AM PST" into { local, utc } display strings */
function formatEventTime(dateStr: string, timeStr: string): { local: string; utc: string } | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*(.*)/i);
  if (!match) return null;
  let h = parseInt(match[1]);
  const min = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  const tz = match[4]?.trim() || '';
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const offsetHours = /P[SD]?T/i.test(tz) ? 8 : /E[SD]?T/i.test(tz) ? 5 : /C[SD]?T/i.test(tz) ? 6 : /M[SD]?T/i.test(tz) ? 7 : 0;
  const utcH = (h + offsetHours) % 24;
  const utcDate = new Date(Date.UTC(
    parseInt(dateStr.slice(0, 4)),
    parseInt(dateStr.slice(5, 7)) - 1,
    parseInt(dateStr.slice(8, 10)),
    utcH, min
  ));
  const local = utcDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  const utc = utcDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
  return { local, utc };
}

const DISCORD_EVENTS: Record<string, string> = {
  vibecoding: 'https://discord.com/events/1024891059135852604/1435332057030066379',
  devshop: 'https://discord.com/events/1024891059135852604/1467981149128233052',
};

const TZ_IANA: Record<string, string> = {
  PST: 'America/Los_Angeles', PDT: 'America/Los_Angeles', PT: 'America/Los_Angeles',
  EST: 'America/New_York', EDT: 'America/New_York', ET: 'America/New_York',
  CST: 'America/Chicago', CDT: 'America/Chicago',
  MST: 'America/Denver', MDT: 'America/Denver',
};

function buildGoogleCalUrl(ev: { date: string; label: string; time?: string; description?: string; link?: string; category?: string }) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const title = encodeURIComponent(`[MONOLITH] ${ev.label}`);
  const d = ev.date.replace(/-/g, '');
  let dates: string;
  let ctz = '';
  if (ev.time) {
    const match = ev.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*(.*)/i);
    if (match) {
      let h = parseInt(match[1]);
      const m = match[2];
      if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
      if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
      const hh = String(h).padStart(2, '0');
      const start = `${d}T${hh}${m}00`;
      const endH = String(h + 1).padStart(2, '0');
      const end = `${d}T${endH}${m}00`;
      dates = `${start}/${end}`;
      const tzAbbr = match[4]?.trim().toUpperCase();
      if (tzAbbr && TZ_IANA[tzAbbr]) ctz = TZ_IANA[tzAbbr];
    } else {
      dates = `${d}/${d}`;
    }
  } else {
    dates = `${d}/${d}`;
  }

  const discordEvent = ev.category ? DISCORD_EVENTS[ev.category] : undefined;
  const detailParts = [
    ev.description,
    discordEvent ? `Discord Event: ${discordEvent}` : null,
    ev.link ? `Join Discord: ${ev.link}` : null,
  ].filter(Boolean);
  const details = encodeURIComponent(detailParts.join('\n\n'));

  const location = encodeURIComponent('Radiants Discord — discord.gg/radiants');
  const sprop = encodeURIComponent('website:solanamobile.radiant.nexus');

  let recur = '';
  if (ev.category === 'vibecoding' || ev.category === 'devshop') {
    recur = `&recur=${encodeURIComponent('RRULE:FREQ=WEEKLY;UNTIL=20260309T000000Z')}`;
  }

  return `${base}&text=${title}&dates=${dates!}&details=${details}&location=${location}&sprop=${sprop}${ctz ? `&ctz=${encodeURIComponent(ctz)}` : ''}${recur}`;
}

/* Shared calendar Tailwind classes */
const CAL_HERO_BOX = 'flex flex-col gap-[0.5em] p-[1em] border border-[rgba(180,148,247,0.8)] border-b-[var(--color-bevel-shadow)] border-r-[var(--color-bevel-shadow)] bg-[var(--panel-accent-08)]';
const CAL_EVENT_CARD = 'flex flex-col gap-[0.375em] py-[0.5em] [&+&]:border-t [&+&]:border-[var(--panel-accent-15)]';
const CAL_CATEGORY_DOT = 'w-[0.5em] h-[0.5em] rounded-full shrink-0';
const CAL_TIME_LOCAL = 'font-mono text-[1.25em] text-[var(--panel-accent)] tracking-[0.02em] [text-shadow:0_0_0.5em_rgba(180,148,247,0.4)]';
const CAL_TIME_UTC = 'font-mono text-[0.75em] text-[var(--panel-accent-40)] tracking-[0.02em]';
const CAL_EVENT_DESC = 'font-body text-[0.8125em] text-[rgba(255,255,255,0.7)] leading-[1.5] m-0 pl-[1em]';

function CalendarMonth({ year, month, eventsByDate, selectedDate, onSelectDate }: { year: number; month: number; eventsByDate: Map<string, { label: string; category: string; time?: string; description?: string; link?: string }[]>; selectedDate: string | null; onSelectDate: (key: string) => void }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(new Date());
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const tt = tooltipRef.current;
    if (!tt) { setMousePos({ x: e.clientX, y: e.clientY }); return; }
    const w = tt.offsetWidth;
    const h = tt.offsetHeight;
    const pad = 12;
    let x = e.clientX + pad;
    let y = e.clientY - h - pad;
    if (x + w > window.innerWidth - pad) x = e.clientX - w - pad;
    if (y < pad) y = e.clientY + pad;
    setMousePos({ x, y });
  }, []);

  const hoverEvents = hoverKey ? eventsByDate.get(hoverKey) : null;

  return (
    <div className="cal-month">
      <div className="cal-month-header panel-label">{MONTH_NAMES[month]} {year}</div>
      <div className="cal-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="cal-cell cal-cell--header panel-muted">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} className="cal-cell" />;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = eventsByDate.get(key);
          const isToday = key === todayKey;
          const isPast = key < todayKey;

          const specialEvent = dayEvents?.find((ev) => SPECIAL_BG_CATEGORIES.has(ev.category));
          const specialClass = specialEvent ? ` cal-cell--${specialEvent.category}` : '';
          const hasNonSpecial = dayEvents?.some((ev) => !SPECIAL_BG_CATEGORIES.has(ev.category));

          const isSelected = key === selectedDate;

          return (
            <div
              key={key}
              className={`cal-cell cal-cell--day${isToday ? ' cal-cell--today' : ''}${isPast ? ' cal-cell--past' : ''}${dayEvents ? ' cal-cell--has-event' : ''}${specialClass}${isSelected ? ' cal-cell--selected' : ''}`}
              onClick={dayEvents ? () => onSelectDate(key) : undefined}
              onMouseEnter={dayEvents ? () => setHoverKey(key) : undefined}
              onMouseMove={dayEvents ? handleMouseMove : undefined}
              onMouseLeave={() => setHoverKey(null)}
              style={dayEvents ? { cursor: 'pointer' } : undefined}
            >
              <span className={`cal-date${specialEvent ? ' cal-date--bold' : ''}`}>{day}</span>
              {hasNonSpecial && (
                <div className="cal-dots">
                  {dayEvents!.filter((ev) => !SPECIAL_BG_CATEGORIES.has(ev.category)).map((ev, j) => (
                    <span key={j} className="cal-dot" style={{ background: CATEGORY_COLORS[ev.category] || '#b494f7' }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hoverEvents && createPortal(
        <div
          ref={tooltipRef}
          className="cal-tooltip cal-tooltip--visible"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          {hoverEvents.map((ev, j) => (
            <div key={j} className="cal-tooltip-event">
              <div className="cal-tooltip-header">
                <span className="cal-dot" style={{ background: CATEGORY_COLORS[ev.category] || '#b494f7' }} />
                <strong>{ev.label}</strong>
              </div>
              {ev.time && <div className="cal-tooltip-time">{ev.time}</div>}
              {ev.description && <div className="cal-tooltip-desc">{ev.description}</div>}
              {ev.link && ev.category === 'vibecoding' && (
                <div className="cal-tooltip-links">
                  <a href="https://discord.gg/radiants" target="_blank" rel="noopener noreferrer" className="cal-tooltip-link">
                    <DiscordIcon size={12} /> Discord
                  </a>
                  <a href={ev.link} target="_blank" rel="noopener noreferrer" className="cal-tooltip-link">@KEMOS4BE</a>
                </div>
              )}
              {ev.link && ev.category === 'devshop' && (
                <div className="cal-tooltip-links">
                  <a href="https://discord.gg/radiants" target="_blank" rel="noopener noreferrer" className="cal-tooltip-link">
                    <DiscordIcon size={12} /> Discord
                  </a>
                  <a href={ev.link} target="_blank" rel="noopener noreferrer" className="cal-tooltip-link">@somemobiledev</a>
                </div>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function CalendarContent({ data }: { data: Extract<WindowContent, { type: 'calendar' }> }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  type CalendarEvent = Extract<WindowContent, { type: 'calendar' }>['events'][number];
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const ev of data.events) {
    const list = eventsByDate.get(ev.date) || [];
    list.push(ev);
    eventsByDate.set(ev.date, list);
  }

  const todayKey = toDateKey(new Date());

  const heroDate = selectedDate || todayKey;
  const heroEvents = eventsByDate.get(heroDate);
  const isShowingSelected = selectedDate && selectedDate !== todayKey;

  const sorted = [...data.events].sort((a, b) => a.date.localeCompare(b.date));
  const nextEvent = sorted.find((e) => e.date >= todayKey);

  const formatDateLabel = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="calendar-content">
      {/* Today / Selected / Next Up hero */}
      <div className={CAL_HERO_BOX}>
        {heroEvents ? (
          <>
            <div className="flex items-center justify-between">
              <div className="panel-label">{isShowingSelected ? formatDateLabel(heroDate).toUpperCase() : 'TODAY'}</div>
              {isShowingSelected && (
                <button
                  className="cal-hero-reset"
                  onClick={() => setSelectedDate(null)}
                  aria-label="Back to today"
                >
                  <CloseIcon size={10} />
                </button>
              )}
            </div>
            {heroEvents.map((ev, i) => {
              const times = ev.time ? formatEventTime(heroDate, ev.time) : null;
              return (
              <div key={i} className={CAL_EVENT_CARD}>
                <div className="flex items-center gap-[0.5em]">
                  <span className={CAL_CATEGORY_DOT} style={{ background: CATEGORY_COLORS[ev.category] }} />
                  <span className="subsection-heading">{ev.label}</span>
                </div>
                {times && (
                  <div className="flex items-baseline gap-[0.75em] pl-[1em]">
                    <span className={CAL_TIME_LOCAL}>{times.local}</span>
                    <span className={CAL_TIME_UTC}>{times.utc}</span>
                  </div>
                )}
                {ev.description && <p className={CAL_EVENT_DESC}>{ev.description}</p>}
                <div className="flex gap-[0.5em] pl-[1em] flex-wrap">
                  {ev.broadcastUrl && (
                    <a href={ev.broadcastUrl} target="_blank" rel="noopener noreferrer" className="cal-event-link">
                      <PlayIcon size={10} /> Watch
                    </a>
                  )}
                  {ev.presentationUrl && (
                    <a href={ev.presentationUrl} target="_blank" rel="noopener noreferrer" className="cal-event-link">
                      <DocumentIcon size={10} /> Slides
                    </a>
                  )}
                  {ev.link && (
                    <a href={ev.link} target="_blank" rel="noopener noreferrer" className="cal-event-link">
                      <DiscordIcon size={10} /> Join
                    </a>
                  )}
                  {DISCORD_EVENTS[ev.category] && (
                    <a href={DISCORD_EVENTS[ev.category]} target="_blank" rel="noopener noreferrer" className="cal-event-link">
                      Event ↗
                    </a>
                  )}
                  <a href={buildGoogleCalUrl(ev)} target="_blank" rel="noopener noreferrer" className="cal-event-link">
                    + Google Calendar
                  </a>
                </div>
              </div>
            );
            })}
          </>
        ) : nextEvent ? (
          <>
            <div className="panel-label">NEXT UP</div>
            {(() => {
              const nextTimes = nextEvent.time ? formatEventTime(nextEvent.date, nextEvent.time) : null;
              return (
            <div className={CAL_EVENT_CARD}>
              <div className="flex items-center gap-[0.5em]">
                <span className={CAL_CATEGORY_DOT} style={{ background: CATEGORY_COLORS[nextEvent.category] }} />
                <span className="subsection-heading">{nextEvent.label}</span>
                <span className="panel-muted">{formatDateLabel(nextEvent.date)}</span>
              </div>
              {nextTimes && (
                <div className="flex items-baseline gap-[0.75em] pl-[1em]">
                  <span className={CAL_TIME_LOCAL}>{nextTimes.local}</span>
                  <span className={CAL_TIME_UTC}>{nextTimes.utc}</span>
                </div>
              )}
              {nextEvent.description && <p className={CAL_EVENT_DESC}>{nextEvent.description}</p>}
              <div className="flex gap-[0.5em] pl-[1em]">
                {nextEvent.link && (
                  <a href={nextEvent.link} target="_blank" rel="noopener noreferrer" className="cal-event-link">
                    Open ↗
                  </a>
                )}
                <a href={buildGoogleCalUrl(nextEvent)} target="_blank" rel="noopener noreferrer" className="cal-event-link">
                  + Google Calendar
                </a>
              </div>
            </div>
              );
            })()}
          </>
        ) : (
          <div className="panel-label">NO UPCOMING EVENTS</div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-[0.75em]">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} className="flex items-center gap-[0.35em] capitalize">
            <span className="cal-dot" style={{ background: color }} />
            <span className="panel-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2em', color }}>{CATEGORY_ICONS[cat]} {cat}</span>
          </span>
        ))}
      </div>

      {/* Monthly calendars */}
      <CalendarMonth year={2026} month={1} eventsByDate={eventsByDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <CalendarMonth year={2026} month={2} eventsByDate={eventsByDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
    </div>
  );
}

// ============================================================================
// Hackathon Components
// ============================================================================

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$!@#%&*+';
const SCRAMBLE_DURATION = 800;
const SCRAMBLE_FPS = 20;
const HOLD_DURATION = 3500;

function scrambleReveal(target: string, progress: number): string {
  let result = '';
  for (let i = 0; i < target.length; i++) {
    const revealPoint = i / target.length;
    if (progress > revealPoint + 0.2) {
      result += target[i];
    } else {
      result += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    }
  }
  return result;
}

function CyclingStat({ stats }: { stats: { value: string; label: string }[] }) {
  const [index, setIndex] = useState(0);
  const [valueDisplay, setValueDisplay] = useState(stats[0].value);
  const [labelDisplay, setLabelDisplay] = useState(stats[0].label);
  const [barProgress, setBarProgress] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    let holdTimeout: ReturnType<typeof setTimeout>;
    let barRaf: number;
    let cancelled = false;

    const target = stats[index];
    const scrambleStart = Date.now();

    const scrambleInterval = setInterval(() => {
      const progress = Math.min(1, (Date.now() - scrambleStart) / SCRAMBLE_DURATION);
      setValueDisplay(scrambleReveal(target.value, progress));
      setLabelDisplay(scrambleReveal(target.label, progress));

      if (progress >= 1) {
        clearInterval(scrambleInterval);
        setValueDisplay(target.value);
        setLabelDisplay(target.label);

        if (cancelled) return;

        const holdStart = Date.now();
        const tickBar = () => {
          if (cancelled) return;
          const elapsed = Date.now() - holdStart;
          setBarProgress(Math.min(1, elapsed / HOLD_DURATION));
          if (elapsed < HOLD_DURATION) {
            barRaf = requestAnimationFrame(tickBar);
          }
        };
        barRaf = requestAnimationFrame(tickBar);

        holdTimeout = setTimeout(() => {
          if (cancelled) return;
          setBarProgress(0);
          setIndex((i) => (i + 1) % stats.length);
          setCycle((c) => c + 1);
        }, HOLD_DURATION);
      }
    }, 1000 / SCRAMBLE_FPS);

    return () => {
      cancelled = true;
      clearInterval(scrambleInterval);
      clearTimeout(holdTimeout);
      cancelAnimationFrame(barRaf);
    };
  }, [index, cycle, stats]);

  const jumpTo = (i: number) => {
    if (i === index) return;
    setBarProgress(0);
    setIndex(i);
    setCycle((c) => c + 1);
  };

  return (
    <div className="hackathon-hero">
      <div className="hackathon-hero-value">{valueDisplay}</div>
      <div className="hackathon-hero-label">{labelDisplay}</div>
      <div className="hackathon-bar">
        {stats.map((_, i) => (
          <button
            key={i}
            className={`hackathon-bar-segment${i === index ? ' hackathon-bar-segment--active' : ''}`}
            onClick={() => jumpTo(i)}
            aria-label={stats[i].value}
          >
            {i === index && (
              <span className="hackathon-bar-fill" style={{ transform: `scaleX(${barProgress})` }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function HackathonContent({
  data,
  revealed,
  advance,
}: {
  data: Extract<WindowContent, { type: 'hackathon' }>;
  revealed: number;
  advance: () => void;
}) {
  return (
    <div className="hackathon-content">
      {/* Final Week Resources — full-width expandable banner at top */}
      <CrtAccordion type="single" collapsible className="final-week-accordion">
        <CrtAccordion.Item value="final-week" className="final-week-accordion-item">
          <CrtAccordion.Trigger className="final-week-banner-trigger">
            <svg width={18} height={18} viewBox="0 0 16 16" fill="currentColor" className="final-week-banner-icon" aria-hidden="true" style={{ imageRendering: 'pixelated' }}><path d="M2,11H3V9H4V7H5V5H6V8H7V10H9V8H10V5H11V7H12V9H13V11H14V13H13V14H3V13H2V11ZM7,11V13H9V11H7ZM6,3H7V2H9V3H10V5H9V4H7V5H6V3Z"/></svg>
            <span className="final-week-marquee">
              <span className="final-week-marquee-track">
                <span className="final-week-banner-text">FINAL WEEK!!!</span>
                <span className="final-week-banner-text" aria-hidden="true">GET YOUR RESOURCES HERE!!!!</span>
                <span className="final-week-banner-text" aria-hidden="true">TAP TO OPEN ME!!!!</span>
                <span className="final-week-banner-text" aria-hidden="true">FINAL WEEK!!!</span>
                <span className="final-week-banner-text" aria-hidden="true">GET YOUR RESOURCES HERE!!!!</span>
                <span className="final-week-banner-text" aria-hidden="true">TAP TO OPEN ME!!!!</span>
              </span>
            </span>
            <svg width={18} height={18} viewBox="0 0 16 16" fill="currentColor" className="final-week-banner-icon" aria-hidden="true" style={{ imageRendering: 'pixelated' }}><path d="M2,11H3V9H4V7H5V5H6V8H7V10H9V8H10V5H11V7H12V9H13V11H14V13H13V14H3V13H2V11ZM7,11V13H9V11H7ZM6,3H7V2H9V3H10V5H9V4H7V5H6V3Z"/></svg>
          </CrtAccordion.Trigger>
          <CrtAccordion.Content className="final-week-content">
            <CrtTabs defaultValue="demo" className="final-week-tabs">
              <CrtTabs.List className="final-week-tabs-list">
                <CrtTabs.Trigger value="demo" className="final-week-tab">DEMO</CrtTabs.Trigger>
                <CrtTabs.Trigger value="pitch" className="final-week-tab">PITCH</CrtTabs.Trigger>
                <CrtTabs.Trigger value="submit" className="final-week-tab">SUBMIT</CrtTabs.Trigger>
                <CrtTabs.Trigger value="skills" className="final-week-tab">AI SKILLS</CrtTabs.Trigger>
              </CrtTabs.List>

              <CrtTabs.Content value="demo">
                <div className="fw-suggested-note">Suggested workflow — use whatever tools work for you.</div>
                <div className="fw-steps">
                  <div className="fw-step">
                    <span className="fw-step-num">1</span>
                    <div className="fw-step-body">
                      <strong>Mirror your phone screen.</strong> Connect your device via USB, enable Developer Options & USB Debugging, then install <a href="https://github.com/Genymobile/scrcpy" target="_blank" rel="noopener noreferrer">scrcpy</a> to mirror your Android screen to your computer.
                    </div>
                  </div>
                  <div className="fw-step">
                    <span className="fw-step-num">2</span>
                    <div className="fw-step-body">
                      <strong>Record with Screen Studio.</strong> Open <a href="https://www.screen.studio/" target="_blank" rel="noopener noreferrer">Screen Studio</a>, choose "Record a Window," and select the scrcpy window. Walk through features one at a time — be concise, show polish, demonstrate web3 functionality.
                    </div>
                  </div>
                  <div className="fw-step">
                    <span className="fw-step-num">3</span>
                    <div className="fw-step-body">
                      <strong>Add voiceover.</strong> Show your face on camera if possible. Keep it to 1–2 minutes max. Don't send a 10-minute video — judges have a lot to watch.
                    </div>
                  </div>
                </div>
              </CrtTabs.Content>

              <CrtTabs.Content value="pitch">
                <div className="fw-suggested-note">Suggested workflow — use whatever tools work for you.</div>
                <div className="fw-steps">
                  <div className="fw-step">
                    <span className="fw-step-num">1</span>
                    <div className="fw-step-body">
                      <strong>Interview with Claude.</strong> Open a fresh Claude chat (no project context). Prompt: "Interview me to develop a meaningful pitch deck for my app." Then paste in the <a href="https://x.com/radaboratory/status/2029360458126504146" target="_blank" rel="noopener noreferrer">DePitch Masterclass playbook</a> so Claude has context. Let it ask about your audience, value prop, and progress.
                    </div>
                  </div>
                  <div className="fw-step">
                    <span className="fw-step-num">2</span>
                    <div className="fw-step-body">
                      <strong>Generate your deck.</strong> Take Claude's drafted slide text into Claude Code with the <a href="https://skills.sh/zarazhangrui/frontend-slides/frontend-slides" target="_blank" rel="noopener noreferrer">frontend-slides</a> skill. Point it at your app's repo to pull styles and generate a branded HTML slide deck. Cap it at 8–12 slides.
                    </div>
                  </div>
                  <div className="fw-step">
                    <span className="fw-step-num">3</span>
                    <div className="fw-step-body">
                      <strong>Record yourself presenting.</strong> Pair feature demos alongside your pitch narrative. The best submissions are 1–2 minute videos walking through features tied to the story. Rewrite Claude's output in your own voice — authenticity wins.
                    </div>
                  </div>
                </div>
                <CopyMarkdownButton markdown={PITCH_PLAYBOOK_MARKDOWN} label="Copy Pitch Playbook" />
              </CrtTabs.Content>

              <CrtTabs.Content value="submit">
                <div className="fw-steps">
                  <div className="fw-step">
                    <span className="fw-step-num">1</span>
                    <div className="fw-step-body">
                      <strong>Create your profile on Align.</strong> Connect your wallet on <a href="https://align.nexus" target="_blank" rel="noopener noreferrer">Align</a>, create a profile, upload a banner, and add your Twitter handle and Discord name.
                    </div>
                  </div>
                  <div className="fw-step">
                    <span className="fw-step-num">2</span>
                    <div className="fw-step-body">
                      <strong>Register for the hackathon.</strong> On the Monolith hackathon page, click Sign Up. Choose your country, provide your email, and accept the terms. Every team member needs an Align profile.
                    </div>
                  </div>
                  <div className="fw-step">
                    <span className="fw-step-num">3</span>
                    <div className="fw-step-body">
                      <strong>Submit your project.</strong> Fill out the submission form with your project name, description, GitHub repo, product link, and a Google Drive link containing your pitch deck and demo video.
                    </div>
                  </div>
                </div>
                <div className="fw-danger-box">
                  <div className="fw-danger-label">DANGER</div>
                  <div className="fw-danger-body">
                    Judges cannot review what they cannot access. Invite <strong>hackathon@radiant.nexus</strong> to your GitHub repo and Google Drive. When in doubt, make the Drive link public. Private links = invisible submission.
                  </div>
                </div>
              </CrtTabs.Content>

              <CrtTabs.Content value="skills">
                <div className="fw-resource-items">
                  <a href="https://skills.sh/solana-foundation/solana-dev-skill" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">solana-dev-skill <span className="fw-resource-creator">solana-foundation</span></div>
                    <div className="fw-resource-desc">End-to-end Solana development playbook. Client, RPC, transaction patterns, and best practices.</div>
                  </a>
                  <a href="https://skills.sh/quiknode-labs/solana-anchor-claude-skill" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">solana-anchor-claude-skill <span className="fw-resource-creator">quiknode-labs</span></div>
                    <div className="fw-resource-desc">Anchor framework skill for building Solana programs. Rust programs + TypeScript tests.</div>
                  </a>
                  <a href="https://skills.sh/sendaifun/skills/solana-kit" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">solana-kit <span className="fw-resource-creator">sendaifun</span></div>
                    <div className="fw-resource-desc">Modern @solana/kit — tree-shakeable, zero-dependency JavaScript SDK from Anza.</div>
                  </a>
                  <a href="https://skills.sh/sendaifun/skills/pinocchio-development" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">pinocchio-development <span className="fw-resource-creator">sendaifun</span></div>
                    <div className="fw-resource-desc">Zero-dependency, zero-copy Solana program framework for maximum performance.</div>
                  </a>
                  <a href="https://skills.sh/sendaifun/skills/helius" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">helius <span className="fw-resource-creator">sendaifun</span></div>
                    <div className="fw-resource-desc">Helius RPC, DAS API, webhooks, priority fees, and ZK compression.</div>
                  </a>
                  <a href="https://skills.sh/sendaifun/skills/metaplex" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">metaplex <span className="fw-resource-creator">sendaifun</span></div>
                    <div className="fw-resource-desc">Metaplex protocol for NFTs, digital assets, Core, Bubblegum, Candy Machine, and more.</div>
                  </a>
                  <a href="https://skills.sh/sendaifun/skills/surfpool" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">surfpool <span className="fw-resource-creator">sendaifun</span></div>
                    <div className="fw-resource-desc">Drop-in solana-test-validator replacement with mainnet forking and cheatcodes.</div>
                  </a>
                  <a href="https://skills.sh/expo/skills/building-native-ui" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">building-native-ui <span className="fw-resource-creator">expo</span></div>
                    <div className="fw-resource-desc">Native mobile UI guidelines — styling, navigation, component preferences, Apple HIG compliance.</div>
                  </a>
                  <a href="https://skills.sh/expo/skills/native-data-fetching" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">native-data-fetching <span className="fw-resource-creator">expo</span></div>
                    <div className="fw-resource-desc">Networking in Expo/RN apps — API requests, caching, auth, offline handling with TanStack Query.</div>
                  </a>
                  <a href="https://skills.sh/expo/skills/expo-dev-client" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">expo-dev-client <span className="fw-resource-creator">expo</span></div>
                    <div className="fw-resource-desc">EAS Build development clients for testing native code changes on physical devices.</div>
                  </a>
                  <a href="https://skills.sh/expo/skills/expo-deployment" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">expo-deployment <span className="fw-resource-creator">expo</span></div>
                    <div className="fw-resource-desc">Deploy Expo apps to iOS, Android, and web stores via EAS with automated CI/CD.</div>
                  </a>
                  <a href="https://skills.sh/expo/skills/expo-tailwind-setup" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">expo-tailwind-setup <span className="fw-resource-creator">expo</span></div>
                    <div className="fw-resource-desc">Set up Tailwind CSS v4 in Expo apps using NativeWind v5 for universal styling.</div>
                  </a>
                  <a href="https://skills.sh/expo/skills/upgrading-expo" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">upgrading-expo <span className="fw-resource-creator">expo</span></div>
                    <div className="fw-resource-desc">Step-by-step guide for upgrading Expo SDK versions, breaking changes, and migrations.</div>
                  </a>
                  <a href="https://skills.sh/expo/skills/use-dom" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">use-dom <span className="fw-resource-creator">expo</span></div>
                    <div className="fw-resource-desc">Run web-only libraries and DOM APIs inside Expo apps via an embedded webview.</div>
                  </a>
                  <a href="https://skills.sh/expo/skills/expo-api-routes" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">expo-api-routes <span className="fw-resource-creator">expo</span></div>
                    <div className="fw-resource-desc">Server-side API routes in Expo — secrets, DB operations, third-party API proxies.</div>
                  </a>
                  <a href="https://skills.sh/expo/skills/expo-cicd-workflows" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">expo-cicd-workflows <span className="fw-resource-creator">expo</span></div>
                    <div className="fw-resource-desc">Write and edit EAS CI/CD workflow YAML files for automated builds and deploys.</div>
                  </a>
                  <a href="https://skills.sh/madteacher/mad-agents-skills/flutter-animations" target="_blank" rel="noopener noreferrer" className="fw-resource-item fw-resource-item--link">
                    <div className="fw-resource-name">flutter-animations <span className="fw-resource-creator">madteacher</span></div>
                    <div className="fw-resource-desc">Smooth, performant Flutter animations — implicit, explicit, hero, staggered, and physics-based.</div>
                  </a>
                </div>
              </CrtTabs.Content>
            </CrtTabs>
          </CrtAccordion.Content>
        </CrtAccordion.Item>
      </CrtAccordion>

      {revealed >= 2 && <CyclingStat stats={data.stats} />}
      {data.prizes && (
        <div className="hackathon-prizes">
          {data.prizes.map((p, i) => (
            <div key={i} className="hackathon-prize-box">
              <div className="hackathon-prize-amount">{p.amount}</div>
              <div className="hackathon-prize-label">{p.label}</div>
            </div>
          ))}
        </div>
      )}
      <CrtAccordion type="single" className="hackathon-extras-accordion">
        <CrtAccordion.Item value="additional-prizes">
          <CrtAccordion.Trigger><span className="accordion-icon"><TrophyIcon size={12} /></span>Additional Prizes</CrtAccordion.Trigger>
          <CrtAccordion.Content>
            <div className="entry-bullets" style={{ margin: '0.5em 0' }}>
              <li><strong>Featured dApp Store Placement</strong> — High visibility features for top projects. Over 100,000 eyeballs from the get go.</li>
              <li><strong>Marketing & Launch Support</strong> — Go-to-market strategy and guidance. Marketing amplification from official Solana Mobile channels.</li>
              <li><strong>Seeker Devices</strong> — Free Seeker devices for all winning teams to continually grow and develop the Solana Mobile Ecosystem.</li>
              <li><strong>A Call with Toly</strong> — Winners & honorable mentions will get a chance to receive feedback directly from Toly.</li>
            </div>
          </CrtAccordion.Content>
        </CrtAccordion.Item>
      </CrtAccordion>
      {data.tagline && (
        <div className="hackathon-tagline">{data.tagline}</div>
      )}
      <div className="timeline-content">
        {data.sections.map((section, i) => {
          if (revealed < i + 3) return null;
          return (
            <div key={i} className="timeline-entry">
              <div className="timeline-entry-header">
                <ScrambleText text={section.heading} onDone={advance} />
              </div>
              <div className="timeline-entry-body">
                {Array.isArray(section.body) ? (
                  <ul className="entry-bullets">
                    {section.body.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                ) : section.body}
              </div>
            </div>
          );
        })}
      </div>

      {data.criteria && revealed >= data.sections.length + 3 && (
        <>
          <div className="evaluation-heading evaluation-heading--divider">
            <ScrambleText text="EVALUATION CRITERIA" />
          </div>
          <div className="criteria-grid">
            {data.criteria.map((c, i) => (
              <div key={i} className="criteria-card">
                <div className="criteria-header">
                  <div className="criteria-icon-badge">{CRITERIA_ICONS[c.category]}</div>
                  <span className="subsection-heading">{c.category}</span>
                  <span className="criteria-divider" />
                  <span className="criteria-badge">{c.pct}%</span>
                </div>
                <div className="timeline-entry-body" style={{ padding: '0.75em' }}>
                  {c.description}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main Dispatcher
// ============================================================================

export function renderContent(
  data: WindowContent,
  revealed: number,
  advance: () => void,
  initialTab?: string | null,
  activeSubTab?: string | null,
  setActiveSubTab?: (tab: string) => void,
  onTabChange?: (id: string) => void,
) {
  switch (data.type) {
    case 'hackathon': return <HackathonContent data={data} revealed={revealed} advance={advance} />;
    case 'entries': return renderEntries(data, revealed, advance);
    case 'sections': return renderSections(data, revealed, advance);
    case 'tabs': return renderTabs(data, initialTab, activeSubTab, setActiveSubTab);
    case 'accordion': return renderAccordion(data);
    case 'judges': return renderJudges(data, revealed, advance);
    case 'prizes': return renderPrizes(data, revealed, advance);
    case 'rules': return renderRules(data, revealed, advance);
    case 'calendar': return <CalendarContent data={data} />;
  }
}
