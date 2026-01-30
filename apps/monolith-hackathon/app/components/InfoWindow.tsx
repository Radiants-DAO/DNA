'use client';

import { useEffect, useCallback, useState } from 'react';
import { useScramble } from 'use-scramble';
import CrtAccordion from './CrtAccordion';
import CrtTabs from './CrtTabs';

export type WindowVariant = 'glass' | 'clear' | 'magma' | 'ultraviolet' | 'amber';

interface InfoWindowProps {
  id: string;
  onClose: () => void;
  variant?: WindowVariant;
}

// ============================================================================
// Content Types
// ============================================================================

type WindowContent =
  | { type: 'entries'; title: string; entries: { date: string; title: string; body: string }[] }
  | { type: 'sections'; title: string; sections: { heading: string; body: string }[] }
  | { type: 'tabs'; title: string; tabs: { id: string; label: string; sections: { heading: string; body: string }[] }[] }
  | { type: 'accordion'; title: string; items: { question: string; answer: string }[] }
  | { type: 'judges'; title: string; judges: { name: string; role: string; org: string; twitter?: string }[] }
  | { type: 'prizes'; title: string; tiers: { label: string; amount: string; description?: string }[] };

// ============================================================================
// Content Data
// ============================================================================

const CONTENT: Record<string, WindowContent> = {
  timeline: {
    type: 'entries',
    title: 'TIMELINE.exe',
    entries: [
      { date: 'WK 0', title: '1/26 — PRE-LAUNCH', body: 'Hype tweet with link to hackathon site. Email signup live.' },
      { date: 'WK 1', title: '2/02 — LAUNCH', body: 'Announce hackathon & launch tweet. Spaces. Categories & prize reveals.' },
      { date: 'WK 2-4', title: '2/09 — BUILD PHASE', body: 'Building focused updates. Vibecoding progress, MWA integration, code snippets, SKR / Staking, Genesis Token. Registration hype.' },
      { date: 'WK 5', title: '3/09 — FINAL WEEK', body: 'Call-to-action to wrap up and submit.' },
      { date: 'WK 6', title: '3/16 — POST-HACKATHON', body: 'Wrap up, thanks, results coming soon.' },
    ],
  },

  rules: {
    type: 'sections',
    title: 'RULES.exe',
    sections: [
      {
        heading: 'Call to Action',
        body: 'A 5-week sprint to compete and build a mobile app for the Solana dApp Store.',
      },
      {
        heading: 'Eligibility',
        body: 'Your project must have been started within 3 months of the hackathon launch date. Projects that have raised outside capital are not eligible. Pre-existing projects are allowed if they show significant new mobile development. Teams with existing web apps can participate but must build an Android app with significant mobile-specific development. Direct ports or minimal conversions of existing web apps will score poorly.',
      },
      {
        heading: 'Submission Requirements',
        body: 'All submissions must include: A functional Android APK, a GitHub repo, a demo video showcasing functionality, and a pitch deck or brief presentation explaining the app.',
      },
      {
        heading: 'Evaluation Criteria',
        body: 'Judges will assess: Completion and functionality (demo video), clarity and vision (presentation), potential traction and product-market fit with Seeker users, integration of Solana Mobile Stack and Mobile Wallet Adapter, mobile-optimized user experience, and usage and interaction with the Solana network.',
      },
      {
        heading: 'Prize Eligibility',
        body: 'Publishing on the Solana dApp Store is not required by the submission deadline. However, winners must publish their app on the dApp Store to claim their prize. Winners will be given a reasonable timeframe after results are announced. All winners are subject to technical review.',
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
      { name: 'Toly', role: 'Co-Founder', org: 'Solana Labs', twitter: 'aeyakovenko' },
      { name: 'Emmett', role: 'General Manager', org: 'Solana Mobile', twitter: 'm_it' },
      { name: 'Mert', role: 'CEO', org: 'Helius', twitter: '0xMert_' },
      { name: 'Mike S', role: 'Developer Relations', org: 'Solana Mobile', twitter: 'somemobiledev' },
      { name: 'Chase', role: 'Judge', org: 'Solana Mobile' },
      { name: 'Akshay', role: 'Judge', org: 'Solana Mobile' },
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
    type: 'entries',
    title: 'CALENDAR.exe',
    entries: [
      { date: 'WK 1', title: '2/02 — KICKOFF', body: 'Hackathon launches. Start building. Spaces event and category reveals.' },
      { date: 'WK 2', title: '2/09 — BUILD', body: 'Deep focus building. MWA integration guides, code snippets, and community support.' },
      { date: 'WK 3', title: '2/16 — BUILD', body: 'Continued building. SKR integration resources and staking guides available.' },
      { date: 'WK 4', title: '2/23 — BUILD', body: 'Final build week. Polish your app, record your demo video, prepare your pitch deck.' },
      { date: 'WK 5', title: '3/02 — FINAL WEEK', body: 'Call-to-action to wrap up and submit. All materials due before the deadline.' },
      { date: 'WK 6', title: '3/09 — SUBMISSIONS DUE', body: 'Submission deadline. No late entries. Results announced shortly after.' },
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

function ScrambleText({ text, speed = 0.6 }: { text: string; speed?: number }) {
  const { ref } = useScramble({
    text,
    speed,
    tick: 1,
    step: 1,
    seed: 2,
    chance: 0.8,
    overdrive: false,
    overflow: false,
    range: [33, 125],
    playOnMount: true,
  });

  return <span ref={ref as React.RefObject<HTMLSpanElement>} />;
}

function useStaggerReveal(totalLines: number) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(1);
    let current = 1;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals = [250, 300, 400, 500, 600];

    function scheduleNext() {
      if (current >= totalLines) return;
      const delay = intervals[Math.min(current - 1, intervals.length - 1)];
      const timer = setTimeout(() => {
        current++;
        setRevealed(current);
        scheduleNext();
      }, delay);
      timers.push(timer);
    }
    scheduleNext();

    return () => timers.forEach(clearTimeout);
  }, [totalLines]);

  return revealed;
}

// ============================================================================
// Content Renderers
// ============================================================================

function renderEntries(
  data: Extract<WindowContent, { type: 'entries' }>,
  variant: WindowVariant,
  revealed: number,
) {
  return (
    <div className="timeline-content">
      {data.entries.map((entry, i) => {
        if (revealed < i + 2) return null;
        return (
          <div key={i} className={`timeline-entry timeline-entry--${variant}`}>
            <div className={`timeline-entry-header timeline-entry-header--${variant}`}>
              <ScrambleText text={`${entry.date} — ${entry.title}`} speed={0.7} />
            </div>
            <div className={`timeline-entry-body timeline-entry-body--${variant}`}>
              <ScrambleText text={entry.body} speed={0.5} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderSections(
  data: Extract<WindowContent, { type: 'sections' }>,
  variant: WindowVariant,
  revealed: number,
) {
  return (
    <div className="timeline-content">
      {data.sections.map((section, i) => {
        if (revealed < i + 2) return null;
        return (
          <div key={i} className={`timeline-entry timeline-entry--${variant}`}>
            <div className={`timeline-entry-header timeline-entry-header--${variant}`}>
              <ScrambleText text={section.heading} speed={0.7} />
            </div>
            <div className={`timeline-entry-body timeline-entry-body--${variant}`}>
              <ScrambleText text={section.body} speed={0.5} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderTabs(
  data: Extract<WindowContent, { type: 'tabs' }>,
  variant: WindowVariant,
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
              <div key={i} className={`timeline-entry timeline-entry--${variant}`}>
                <div className={`timeline-entry-header timeline-entry-header--${variant}`}>
                  <ScrambleText text={section.heading} speed={0.7} />
                </div>
                <div className={`timeline-entry-body timeline-entry-body--${variant}`}>
                  <ScrambleText text={section.body} speed={0.5} />
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
  variant: WindowVariant,
) {
  return (
    <CrtAccordion type="single">
      {data.items.map((item, i) => (
        <CrtAccordion.Item key={i} value={`faq-${i}`}>
          <CrtAccordion.Trigger>
            <ScrambleText text={item.question} speed={0.7} />
          </CrtAccordion.Trigger>
          <CrtAccordion.Content>
            <span className={`timeline-entry-body--${variant}`} style={{ display: 'block' }}>
              <ScrambleText text={item.answer} speed={0.5} />
            </span>
          </CrtAccordion.Content>
        </CrtAccordion.Item>
      ))}
    </CrtAccordion>
  );
}

function renderJudges(
  data: Extract<WindowContent, { type: 'judges' }>,
  variant: WindowVariant,
  revealed: number,
) {
  return (
    <div className="timeline-content">
      {data.judges.map((judge, i) => {
        if (revealed < i + 2) return null;
        return (
          <div key={i} className="judge-card">
            <div>
              <div className={`judge-name timeline-entry-header--${variant}`}>
                <ScrambleText text={judge.name} speed={0.7} />
              </div>
              <div className="judge-title">
                <ScrambleText text={`${judge.role} — ${judge.org}`} speed={0.5} />
              </div>
              {judge.twitter && (
                <a
                  href={`https://x.com/${judge.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`judge-link timeline-entry-header--${variant}`}
                >
                  @{judge.twitter}
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderPrizes(
  data: Extract<WindowContent, { type: 'prizes' }>,
  variant: WindowVariant,
  revealed: number,
) {
  return (
    <div className="timeline-content">
      {data.tiers.map((tier, i) => {
        if (revealed < i + 2) return null;
        return (
          <div key={i} className="prize-tier">
            <div className={`prize-amount timeline-entry-header--${variant}`}>
              <ScrambleText text={tier.amount} speed={0.7} />
            </div>
            <div className="prize-label">
              <ScrambleText text={tier.label} speed={0.6} />
            </div>
            {tier.description && (
              <div className="prize-description">
                <ScrambleText text={tier.description} speed={0.5} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getRevealCount(data: WindowContent): number {
  switch (data.type) {
    case 'entries': return data.entries.length + 1;
    case 'sections': return data.sections.length + 1;
    case 'judges': return data.judges.length + 1;
    case 'prizes': return data.tiers.length + 1;
    case 'tabs': return 2;
    case 'accordion': return 2;
  }
}

function renderContent(data: WindowContent, variant: WindowVariant, revealed: number) {
  switch (data.type) {
    case 'entries': return renderEntries(data, variant, revealed);
    case 'sections': return renderSections(data, variant, revealed);
    case 'tabs': return renderTabs(data, variant);
    case 'accordion': return renderAccordion(data, variant);
    case 'judges': return renderJudges(data, variant, revealed);
    case 'prizes': return renderPrizes(data, variant, revealed);
  }
}

// ============================================================================
// InfoWindow Component
// ============================================================================

export default function InfoWindow({ id, onClose, variant = 'glass' }: InfoWindowProps) {
  const data = CONTENT[id];

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

  const revealed = useStaggerReveal(data ? getRevealCount(data) : 0);

  if (!data) return null;

  return (
    <div
      className={`door-info-overlay door-info-overlay--${variant}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`taskbar_wrap taskbar_wrap--${variant}`}>
        <div className="taskbar_title">
          <span className="taskbar_text">
            {revealed >= 1 ? <ScrambleText text={data.title} speed={0.8} /> : '\u00A0'}
          </span>
        </div>
        <div className="taskbar_lines-wrap">
          <div className="taskbar_line" />
          <div className="taskbar_line" />
        </div>
        <div className="taskbar_button-wrap">
          <button className={`close_button close_button--${variant}`} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1.5L9 9.5M9 1.5L1 9.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="app_contents">
        {renderContent(data, variant, revealed)}
      </div>
    </div>
  );
}
