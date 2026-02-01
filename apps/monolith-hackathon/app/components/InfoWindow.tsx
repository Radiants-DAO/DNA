'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useScramble } from 'use-scramble';
import CrtAccordion from './CrtAccordion';
import CrtTabs from './CrtTabs';
import { ORBITAL_ITEMS } from './OrbitalNav';

interface InfoWindowProps {
  activeId: string;
  onTabChange: (id: string) => void;
  onClose: () => void;
  visitedIds: Set<string>;
}

// ============================================================================
// Content Types
// ============================================================================

type WindowContent =
  | { type: 'entries'; title: string; entries: { date: string; title: string; body: string }[] }
  | { type: 'sections'; title: string; sections: { heading: string; body: string }[] }
  | { type: 'tabs'; title: string; tabs: { id: string; label: string; sections: { heading: string; body: string }[] }[] }
  | { type: 'accordion'; title: string; items: { question: string; answer: string }[] }
  | { type: 'judges'; title: string; judges: { name: string; role: string; org: string; twitter?: string; image?: string }[] }
  | { type: 'prizes'; title: string; tiers: { label: string; amount: string; description?: string }[] }
  | { type: 'hackathon'; title: string; tagline?: string; prizes?: { amount: string; label: string }[]; stats: { value: string; label: string; tier: 'primary' | 'secondary' }[]; sections: { heading: string; body: string }[]; criteria?: { category: string; pct: number; description: string }[] }
  | { type: 'calendar'; title: string; events: { date: string; label: string; time?: string; category: 'launch' | 'vibecoding' | 'devshop' | 'deadline' | 'milestone' }[] }
  | { type: 'rules'; title: string; sections: { heading: string; body: string }[]; criteria: { category: string; pct: number; description: string }[]; hideCta?: boolean };

// ============================================================================
// Content Data
// ============================================================================

const CONTENT: Record<string, WindowContent> = {
  hackathon: {
    type: 'hackathon',
    title: 'HACKATHON.EXE',
    tagline: 'A 5-week sprint to build a working mobile app for the Solana dApp Store.',
    prizes: [
      { amount: '$10,000', label: '10 WINNERS' },
      { amount: '$5,000', label: '5 HONORABLE' },
      { amount: '$10,000', label: 'SKR BONUS' },
    ],
    stats: [
      { value: '$125,000+', label: 'IN PRIZES', tier: 'primary' },
      { value: '5 WEEKS', label: 'SPRINT', tier: 'secondary' },
      { value: '2/02-3/09', label: '2026', tier: 'secondary' },
    ],
    sections: [
      {
        heading: 'What to Build',
        body: 'A functional Android APK that integrates the Solana Mobile Stack and Mobile Wallet Adapter. Core features must be implemented and demonstrable. The app should solve a real problem for the Seeker community.',
      },
      {
        heading: 'What to Submit',
        body: 'A functional Android APK, a GitHub repo, a demo video (2-3 min) showcasing key features and user flow, a pitch deck covering your problem statement, solution, and roadmap, and technical documentation with a high-level architecture overview.',
      },
      {
        heading: 'Results',
        body: 'Results announced early April. Winners must publish on dApp Store to claim prize (reasonable timeframe given). Incomplete or non-functional submissions may not be eligible for judging.',
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
        heading: 'Call to Action',
        body: 'A 5-week sprint to compete and build a mobile app for the Solana dApp Store.',
      },
      {
        heading: 'Eligibility',
        body: 'Your project must have been started within 3 months of the hackathon launch date. Projects that have raised outside capital are not eligible. Pre-existing projects are allowed if they show significant new mobile development. Teams with existing web apps can participate but must build an Android app with significant mobile-specific development.',
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
    hideCta: true,
  },

  prizes: {
    type: 'prizes',
    title: 'PRIZES.exe',
    tiers: [
      { label: '10 Winners', amount: '$10,000 USD each', description: 'Top 10 projects receive $10,000 USD.' },
      { label: '5 Honorable Mentions', amount: '$5,000 USD each', description: 'Next 5 projects receive $5,000 USD.' },
      { label: 'SKR Bonus Track', amount: '$10,000 in SKR', description: 'SKR is the native asset of the Solana Mobile Ecosystem. The best SKR integration receives $10,000 worth of SKR. Integrate SKR with your app in a meaningful way to be eligible.' },
    ],
  },

  judges: {
    type: 'judges',
    title: 'JUDGES.exe',
    judges: [
      { name: 'Toly', role: 'Phone Salesman', org: 'Solana Labs', twitter: 'aeyakovenko', image: '/assets/judges/toly.avif' },
      { name: 'Emmett', role: 'General Manager', org: 'Solana Mobile', twitter: 'm_it', image: '/assets/judges/emmett.avif' },
      { name: 'Mert', role: 'Shitposter', org: 'Helius', twitter: '0xMert_', image: '/assets/judges/mert.avif' },
      { name: 'Mike', role: 'Developer Relations', org: 'Solana Mobile', twitter: 'somemobiledev', image: '/assets/judges/mike.avif' },
      { name: 'Chase', role: 'Based Snarker', org: 'Solana Mobile', twitter: 'therealchaseeb', image: '/assets/judges/chase.avif' },
      { name: 'Ben', role: 'Biz Dev', org: 'Solana Mobile', twitter: 'bennybitcoins', image: '/assets/judges/ben.avif' },
    ],
  },

  toolbox: {
    type: 'tabs',
    title: 'TOOLBOX.exe',
    tabs: [
      {
        id: 'smd',
        label: 'SOL MOBILE',
        sections: [
          { heading: 'Solana Mobile Stack', body: 'The core SDK for building Solana dApps on mobile. Includes seed vault, mobile wallet adapter, and dApp Store integration.' },
          { heading: 'Mobile Wallet Adapter', body: 'Connect your dApp to any Solana wallet on mobile. React Native and Android SDK available.' },
          { heading: 'React Native Quickstart', body: 'Scaffold a Solana Mobile dApp in minutes with the official React Native starter template.' },
          { heading: 'Seeker Resources', body: 'Seeker device documentation, hardware features, and exclusive APIs for Seeker-optimized apps.' },
        ],
      },
      {
        id: 'gmd',
        label: 'MOBILE DEV',
        sections: [
          { heading: 'Android Development', body: 'Android Studio setup, Kotlin/Java basics, and building your first APK for the dApp Store.' },
          { heading: 'APK Building & Testing', body: 'How to build, sign, and test your Android APK. Includes ADB commands and device testing tips.' },
          { heading: 'React Native', body: 'Cross-platform mobile development with React Native. Recommended for web developers entering mobile.' },
        ],
      },
      {
        id: 'spd',
        label: 'PROGRAMS',
        sections: [
          { heading: 'Anchor Framework', body: 'The most popular Solana program framework. Write, test, and deploy programs with Rust and TypeScript.' },
          { heading: 'Program Examples', body: 'Reference implementations for common patterns: token minting, staking, governance, and marketplace programs.' },
          { heading: 'Devnet Tools', body: 'Solana devnet faucet, explorer, and testing infrastructure. Deploy and iterate without real SOL.' },
        ],
      },
      {
        id: 'ai',
        label: 'AI',
        sections: [
          { heading: 'Vibecoding', body: 'AI-assisted development with Claude, Cursor, and other AI coding tools. Build faster with intelligent code generation.' },
          { heading: 'AI Agent Frameworks', body: 'Build autonomous agents that interact with Solana. Frameworks, SDKs, and patterns for AI-native dApps.' },
          { heading: 'AI + Mobile', body: 'On-device AI capabilities, local inference, and edge computing patterns for mobile-first AI applications.' },
        ],
      },
    ],
  },

  faq: {
    type: 'accordion',
    title: 'FAQ.exe',
    items: [
      {
        question: 'How do I sign up?',
        answer: 'Visit Align — our on-chain hackathon dApp. Create a profile, then sign up on the Solana Mobile Hackathon page.',
      },
      {
        question: 'What is SKR?',
        answer: 'SKR is the native asset of the Solana Mobile Ecosystem. The best SKR integration will receive $10,000 worth of SKR as a bonus prize. Integrate SKR with your app in a meaningful way to be eligible.',
      },
      {
        question: 'Do I need to publish on the dApp Store?',
        answer: 'Publishing is not required by the submission deadline. However, winners must publish their app on the dApp Store to claim their prize. Winners will be given a reasonable timeframe after results are announced.',
      },
      {
        question: 'What are the submission requirements?',
        answer: 'All submissions must include: a functional Android APK, a GitHub repo, a demo video showcasing functionality, and a pitch deck or brief presentation explaining the app.',
      },
      {
        question: 'How are projects evaluated?',
        answer: 'Judges assess: completion and functionality, clarity and vision, potential traction with Seeker users, integration of Solana Mobile Stack and MWA, mobile-optimized UX, and usage of the Solana network.',
      },
      {
        question: 'Can I use an existing project?',
        answer: 'Pre-existing projects are allowed if they show significant new mobile development during the hackathon. Teams with existing web apps can participate but must build an Android app with meaningful mobile-specific development. Direct ports or PWA wrappers will score poorly.',
      },
    ],
  },

  calendar: {
    type: 'calendar',
    title: 'CALENDAR.exe',
    events: [
      // Week 1
      { date: '2026-02-02', label: 'LAUNCH DAY', category: 'launch' },
      { date: '2026-02-04', label: 'Kickoff Workshop', time: '9:30 AM PST', category: 'vibecoding' },
      { date: '2026-02-06', label: 'Devshop', time: '9:30 AM PST', category: 'devshop' },
      // Week 2
      { date: '2026-02-11', label: 'Vibecoding', time: '9:30 AM PST', category: 'vibecoding' },
      { date: '2026-02-13', label: 'Devshop', time: '9:30 AM PST', category: 'devshop' },
      // Week 3
      { date: '2026-02-18', label: 'Vibecoding', time: '9:30 AM PST', category: 'vibecoding' },
      { date: '2026-02-20', label: 'Devshop', time: '9:30 AM PST', category: 'devshop' },
      // Week 4
      { date: '2026-02-25', label: 'Vibecoding', time: '9:30 AM PST', category: 'vibecoding' },
      { date: '2026-02-27', label: 'Devshop', time: '9:30 AM PST', category: 'devshop' },
      // Week 5
      { date: '2026-03-04', label: 'Vibecoding', time: '9:30 AM PST', category: 'vibecoding' },
      { date: '2026-03-06', label: 'Devshop', time: '9:30 AM PST', category: 'devshop' },
      // Deadline
      { date: '2026-03-09', label: 'SUBMISSIONS DUE', time: '11:59 PM EST', category: 'deadline' },
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
          { heading: 'Organizer', body: 'The Solana Mobile Hackathon is organized by Radiants DAO Ltd., a BVI-registered entity, in partnership with Solana Mobile.' },
          { heading: 'Eligibility', body: 'Participants must be 18 years or older. KYC compliance is required for prize winners. Teams may consist of individuals or groups.' },
          { heading: 'Intellectual Property', body: 'All submissions remain the intellectual property of their creators. By submitting, you grant organizers a non-exclusive license to showcase your project for promotional purposes.' },
          { heading: 'Liability', body: 'Organizers are not liable for any losses, damages, or technical issues arising from participation. Participants are responsible for their own submissions and compliance with applicable laws.' },
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
// Shared Components
// ============================================================================

function ScrambleText({ text, speed = 1, onDone }: { text: string; speed?: number; onDone?: () => void }) {
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

function useSequentialReveal() {
  const [revealed, setRevealed] = useState(1);
  const advance = useCallback(() => setRevealed((r) => r + 1), []);
  return { revealed, advance };
}

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
) {
  return (
    <CrtTabs defaultValue={data.tabs[0]?.id}>
      <CrtTabs.List>
        {data.tabs.map((tab) => (
          <CrtTabs.Trigger key={tab.id} value={tab.id}>
            {tab.label}
          </CrtTabs.Trigger>
        ))}
      </CrtTabs.List>
      {data.tabs.map((tab) => (
        <CrtTabs.Content key={tab.id} value={tab.id}>
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
        </CrtTabs.Content>
      ))}
    </CrtTabs>
  );
}

function renderAccordion(
  data: Extract<WindowContent, { type: 'accordion' }>,
) {
  return (
    <CrtAccordion type="single">
      {data.items.map((item, i) => (
        <CrtAccordion.Item key={i} value={`faq-${i}`}>
          <CrtAccordion.Trigger>
            <ScrambleText text={item.question} speed={1} />
          </CrtAccordion.Trigger>
          <CrtAccordion.Content>
            <span className="timeline-entry-body" style={{ display: 'block' }}>
              {item.answer}
            </span>
          </CrtAccordion.Content>
        </CrtAccordion.Item>
      ))}
    </CrtAccordion>
  );
}

function renderJudges(
  data: Extract<WindowContent, { type: 'judges' }>,
  revealed: number,
  advance: () => void,
) {
  return (
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
              <img src={judge.image} alt={judge.name} className="judge-pfp" />
            )}
            <div className="judge-name-v2">
              <ScrambleText text={judge.name} />
            </div>
            <div className="judge-role">
              <ScrambleText text={judge.role} onDone={advance} />
            </div>
            <div className="judge-nameplate">
              {judge.org}
            </div>
          </a>
        );
      })}
    </div>
  );
}

function renderPrizes(
  data: Extract<WindowContent, { type: 'prizes' }>,
  revealed: number,
  advance: () => void,
) {
  return (
    <div className="timeline-content">
      {data.tiers.map((tier, i) => {
        if (revealed < i + 2) return null;
        return (
          <div key={i} className="prize-tier">
            <div className="prize-amount timeline-entry-header">
              <ScrambleText text={tier.amount} onDone={advance} />
            </div>
            <div className="prize-label">
              <ScrambleText text={tier.label} />
            </div>
            {tier.description && (
              <div className="prize-description">
                {tier.description}
              </div>
            )}
          </div>
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
                {section.body}
              </div>
            </div>
          );
        })}
      </div>

      {revealed >= data.sections.length + 2 && (
        <>
          <div className="timeline-entry-header" style={{ marginTop: '1.5em' }}>
            <ScrambleText text="EVALUATION CRITERIA" />
          </div>
          <div className="criteria-grid">
            {data.criteria.map((c, i) => (
              <div key={i} className="criteria-card">
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
        </>
      )}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  launch: '#14f1b2',
  vibecoding: '#fd8f3a',
  devshop: '#6939ca',
  deadline: '#ef5c6f',
  milestone: '#b494f7',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function CalendarMonth({ year, month, eventsByDate }: { year: number; month: number; eventsByDate: Map<string, { label: string; category: string }[]> }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(new Date());
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

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
          return (
            <div key={key} className={`cal-cell cal-cell--day${isToday ? ' cal-cell--today' : ''}${dayEvents ? ' cal-cell--has-event' : ''}`}>
              <span className="cal-date">{day}</span>
              {dayEvents && (
                <div className="cal-dots">
                  {dayEvents.map((ev, j) => (
                    <span key={j} className="cal-dot" style={{ background: CATEGORY_COLORS[ev.category] || '#b494f7' }} title={ev.label} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderCalendar(
  data: Extract<WindowContent, { type: 'calendar' }>,
) {
  const eventsByDate = new Map<string, { label: string; category: string; time?: string }[]>();
  for (const ev of data.events) {
    const list = eventsByDate.get(ev.date) || [];
    list.push(ev);
    eventsByDate.set(ev.date, list);
  }

  // Find today's events (or next upcoming)
  const todayKey = toDateKey(new Date());
  const todayEvents = eventsByDate.get(todayKey);

  // Find next upcoming event
  const sorted = [...data.events].sort((a, b) => a.date.localeCompare(b.date));
  const nextEvent = sorted.find((e) => e.date >= todayKey);

  return (
    <div className="calendar-content">
      {/* Today / Next Up hero */}
      <div className="cal-today-hero">
        {todayEvents ? (
          <>
            <div className="panel-label">TODAY</div>
            {todayEvents.map((ev, i) => (
              <div key={i} className="cal-today-event">
                <span className="cal-today-dot" style={{ background: CATEGORY_COLORS[ev.category] }} />
                <span className="subsection-heading">{ev.label}</span>
                {ev.time && <span className="panel-muted">{ev.time}</span>}
              </div>
            ))}
          </>
        ) : nextEvent ? (
          <>
            <div className="panel-label">NEXT UP</div>
            <div className="cal-today-event">
              <span className="cal-today-dot" style={{ background: CATEGORY_COLORS[nextEvent.category] }} />
              <span className="subsection-heading">{nextEvent.label}</span>
              <span className="panel-muted">
                {new Date(nextEvent.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {nextEvent.time && ` · ${nextEvent.time}`}
              </span>
            </div>
          </>
        ) : (
          <div className="panel-label">NO UPCOMING EVENTS</div>
        )}
      </div>

      {/* Legend */}
      <div className="cal-legend">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} className="cal-legend-item">
            <span className="cal-dot" style={{ background: color }} />
            <span className="panel-muted">{cat}</span>
          </span>
        ))}
      </div>

      {/* Monthly calendars */}
      <CalendarMonth year={2026} month={1} eventsByDate={eventsByDate} />
      <CalendarMonth year={2026} month={2} eventsByDate={eventsByDate} />
    </div>
  );
}

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
    let scrambleInterval: ReturnType<typeof setInterval>;
    let holdTimeout: ReturnType<typeof setTimeout>;
    let barRaf: number;
    let cancelled = false;

    // Phase 1: Scramble in (800ms)
    const target = stats[index];
    const scrambleStart = Date.now();

    scrambleInterval = setInterval(() => {
      const progress = Math.min(1, (Date.now() - scrambleStart) / SCRAMBLE_DURATION);
      setValueDisplay(scrambleReveal(target.value, progress));
      setLabelDisplay(scrambleReveal(target.label, progress));

      if (progress >= 1) {
        clearInterval(scrambleInterval);
        setValueDisplay(target.value);
        setLabelDisplay(target.label);

        if (cancelled) return;

        // Phase 2: Hold with progress bar
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
                {section.body}
              </div>
            </div>
          );
        })}
      </div>

      {data.criteria && revealed >= data.sections.length + 3 && (
        <>
          <div className="timeline-entry-header" style={{ marginTop: '1.5em' }}>
            <ScrambleText text="EVALUATION CRITERIA" />
          </div>
          <div className="criteria-grid">
            {data.criteria.map((c, i) => (
              <div key={i} className="criteria-card">
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
        </>
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function renderContent(data: WindowContent, revealed: number, advance: () => void) {
  switch (data.type) {
    case 'hackathon': return <HackathonContent data={data} revealed={revealed} advance={advance} />;
    case 'entries': return renderEntries(data, revealed, advance);
    case 'sections': return renderSections(data, revealed, advance);
    case 'tabs': return renderTabs(data);
    case 'accordion': return renderAccordion(data);
    case 'judges': return renderJudges(data, revealed, advance);
    case 'prizes': return renderPrizes(data, revealed, advance);
    case 'rules': return renderRules(data, revealed, advance);
    case 'calendar': return renderCalendar(data);
  }
}

// ============================================================================
// InfoWindow Component
// ============================================================================

export default function InfoWindow({ activeId, onTabChange, onClose, visitedIds }: InfoWindowProps) {
  const data = CONTENT[activeId];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const { revealed, advance } = useSequentialReveal();

  if (!data) return null;

  return (
    <div
      className="door-info-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="taskbar_wrap">
        <div className="taskbar_title">
          <span className="taskbar_text">
            {revealed >= 1 ? <ScrambleText text={data.title} onDone={advance} /> : '\u00A0'}
          </span>
        </div>
        <div className="taskbar_lines-wrap">
          <div className="taskbar_line" />
          <div className="taskbar_line" />
        </div>
        <div className="taskbar_button-wrap">
          <button className="close_button" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1.5L9 9.5M9 1.5L1 9.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="app_contents">
        {renderContent(data, revealed, advance)}
      </div>

      {/* Persistent CTA footer — hidden on rules panel */}
      {!('hideCta' in data && data.hideCta) && <div className="modal-cta-footer">
        <a
          href="https://align.nexus/organizations/8b216ce8-dd0e-4f96-85a1-0d95ba3022e2/hackathons/6unDGXkWmY1Yw99SsKMt6pPCQTpSSQh5kSiJRgqTwHXE"
          target="_blank"
          rel="noopener noreferrer"
          className="modal-cta-button modal-cta-primary"
        >
          Register
        </a>
        <a
          href="https://discord.gg/radiants"
          target="_blank"
          rel="noopener noreferrer"
          className="modal-cta-button modal-cta-secondary"
        >
          Discord
        </a>
      </div>}

      {/* Tab strip — vertical icon bar on right edge */}
      <div className="modal-tab-strip">
        {ORBITAL_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`modal-tab-icon${activeId === item.id ? ' modal-tab-icon--active' : ''}${visitedIds.has(item.id) ? ' modal-tab-icon--visited' : ''}`}
            style={{ '--icon-glow': item.glowColor } as React.CSSProperties}
            onClick={() => onTabChange(item.id)}
          >
            <img src={item.icon} alt={item.label} />
            <span className="modal-tab-tooltip">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
