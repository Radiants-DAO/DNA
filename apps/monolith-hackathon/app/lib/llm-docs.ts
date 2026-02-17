const DEFAULT_SITE_URL = 'https://solanamobile.radiant.nexus';

type InternalLink = {
  title: string;
  path: string;
  description: string;
};

type ExternalLink = {
  title: string;
  url: string;
  description: string;
};

const INTERNAL_LINKS: InternalLink[] = [
  {
    title: 'Homepage',
    path: '/',
    description: 'Interactive Monolith landing page and navigation shell.',
  },
  {
    title: 'Hackathon Overview Panel',
    path: '/?panel=hackathon',
    description: 'Program scope, build expectations, submission checklist, and outcomes.',
  },
  {
    title: 'Calendar Panel',
    path: '/?panel=calendar',
    description: 'Official event schedule, milestones, and deadlines.',
  },
  {
    title: 'Rules Panel',
    path: '/?panel=rules',
    description: 'Eligibility constraints, submission requirements, and disqualification policy.',
  },
  {
    title: 'Prizes Panel',
    path: '/?panel=prizes',
    description: 'Cash prizes, SKR bonus track, and extra winner benefits.',
  },
  {
    title: 'Judges Panel',
    path: '/?panel=judges',
    description: 'Judge roster and evaluation process.',
  },
  {
    title: 'Toolbox Panel',
    path: '/?panel=toolbox',
    description: 'Core development resources and docs for Solana Mobile builders.',
  },
  {
    title: 'FAQ Panel',
    path: '/?panel=faq',
    description: 'Operational Q&A on sign-up, submissions, eligibility, and publishing.',
  },
  {
    title: 'Legal Panel',
    path: '/?panel=legal',
    description: 'Terms and conditions, privacy policy, and KYC policy sections.',
  },
  {
    title: 'Component Showcase',
    path: '/components-showcase',
    description: 'Reference UI components for the Monolith visual system.',
  },
  {
    title: 'Embed View',
    path: '/embed',
    description: 'Minimal hero/embed version of the landing experience.',
  },
];

const EXTERNAL_DEV_LINKS: ExternalLink[] = [
  {
    title: 'Solana Mobile AI Development Toolkit',
    url: 'https://docs.solanamobile.com/developers/ai-toolkit',
    description: 'AI-assisted development tools and workflows for Solana Mobile.',
  },
  {
    title: 'Solana Mobile React Native Quickstart',
    url: 'https://docs.solanamobile.com/react-native/quickstart',
    description: 'Start template for React Native mobile app development.',
  },
  {
    title: 'Mobile Wallet Adapter (Mobile Apps)',
    url: 'https://docs.solanamobile.com/mobile-wallet-adapter/mobile-apps',
    description: 'MWA integration guide for Android apps.',
  },
  {
    title: 'Solana Mobile Sample Apps',
    url: 'https://docs.solanamobile.com/sample-apps/sample_app_overview',
    description: 'Reference implementations for common app patterns.',
  },
  {
    title: 'Solana Core Docs',
    url: 'https://solana.com/docs',
    description: 'Core Solana protocol and developer documentation.',
  },
];

const KEY_FACTS = [
  'Monolith is a 5-week Solana Mobile hackathon focused on Android dApps for the Seeker ecosystem.',
  'Prize pool: $125,000+ total, including a $10,000 SKR bonus track.',
  'Primary build target: Android APK with meaningful mobile-first product design.',
  'Required integrations: Solana Mobile Stack and Mobile Wallet Adapter (MWA).',
];

const ELIGIBILITY_RULES = [
  'Project should be started within 3 months of launch date.',
  'Projects that have raised outside capital are not eligible.',
  'Direct web-to-mobile ports and thin PWA wrappers are unlikely to win.',
  'Funded teams are not eligible for prizes.',
  'Winners must publish to the Solana dApp Store to claim prizes (post-deadline grace period allowed).',
];

const SUBMISSION_REQUIREMENTS = [
  'Functional Android APK.',
  'GitHub repository with source code.',
  'Demo video showing product functionality.',
  'Pitch deck or concise presentation.',
];

const JUDGING_CRITERIA = [
  { category: 'Stickiness & PMF', weight: '25%' },
  { category: 'User Experience', weight: '25%' },
  { category: 'Innovation / X-factor', weight: '25%' },
  { category: 'Presentation & Demo Quality', weight: '25%' },
];

const KEY_DATES = [
  { date: '2026-02-02', label: 'Launch day and submissions open' },
  { date: '2026-03-08', label: 'Submissions close (7:00 PM PST)' },
  { date: '2026-03-09', label: 'Voting starts (7:00 PM PST)' },
  { date: '2026-04-29', label: 'Voting ends (7:00 PM PST)' },
  { date: '2026-05-07', label: 'Prize distribution milestone' },
];

function toAbsoluteUrl(siteUrl: string, path: string): string {
  return new URL(path, siteUrl).toString();
}

function normalizeSiteUrl(siteUrl?: string): string {
  if (!siteUrl || !siteUrl.trim()) return DEFAULT_SITE_URL;
  return siteUrl.trim().replace(/\/+$/, '');
}

function bulletFromInternal(siteUrl: string, link: InternalLink): string {
  return `- [${link.title}](${toAbsoluteUrl(siteUrl, link.path)}): ${link.description}`;
}

function bulletFromExternal(link: ExternalLink): string {
  return `- [${link.title}](${link.url}): ${link.description}`;
}

function listWithHeading(heading: string, items: string[]): string {
  return `## ${heading}\n${items.join('\n')}`;
}

export function getCanonicalSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

export function buildLlmsTxt(siteUrl = getCanonicalSiteUrl()): string {
  const internalLinks = INTERNAL_LINKS.map((link) => bulletFromInternal(siteUrl, link));
  const externalLinks = EXTERNAL_DEV_LINKS.map((link) => bulletFromExternal(link));

  return [
    '# Monolith | Solana Mobile Hackathon',
    '',
    '> Official LLM index for the Monolith hackathon website.',
    `> Full machine-readable guide: ${toAbsoluteUrl(siteUrl, '/llms.md')}`,
    '',
    listWithHeading('Primary Docs', [
      `- [LLM Guide (Markdown)](${toAbsoluteUrl(siteUrl, '/llms.md')}): Complete structured program guide for autonomous agents and coding copilots.`,
      `- [Interactive Site](${toAbsoluteUrl(siteUrl, '/')}): Human-first landing experience with panel-based navigation.`,
    ]),
    '',
    listWithHeading('Site Sections', internalLinks),
    '',
    listWithHeading('External Developer Docs', externalLinks),
    '',
    listWithHeading('Important Program Facts', KEY_FACTS.map((fact) => `- ${fact}`)),
    '',
    listWithHeading('Contact', [
      '- Organizer: Radiants DAO + Solana Mobile',
      '- Email: lib@radiant.nexus',
      '- Discord: https://discord.gg/radiants',
      '- X: https://x.com/solanamobile and https://x.com/RadiantsDAO',
    ]),
    '',
    `Last updated: 2026-02-17 (${siteUrl})`,
    '',
  ].join('\n');
}

export function buildLlmsMarkdown(siteUrl = getCanonicalSiteUrl()): string {
  const internalLinks = INTERNAL_LINKS.map((link) => bulletFromInternal(siteUrl, link));
  const externalLinks = EXTERNAL_DEV_LINKS.map((link) => bulletFromExternal(link));

  return [
    '# Monolith | Solana Mobile Hackathon (LLM Guide)',
    '',
    `Canonical site: ${toAbsoluteUrl(siteUrl, '/')}`,
    `LLMs index: ${toAbsoluteUrl(siteUrl, '/llms.txt')}`,
    `Last updated: 2026-02-17`,
    '',
    '## Purpose',
    'This document is a machine-readable summary of the Monolith hackathon website.',
    'Use it as a source of structured context for assistants, agents, and coding copilots helping teams build submissions.',
    '',
    '## Program Snapshot',
    ...KEY_FACTS.map((fact) => `- ${fact}`),
    '',
    '## What Teams Should Build',
    '- Build an Android app intended for the Solana dApp Store and Seeker users.',
    '- Integrate Solana Mobile Stack and Mobile Wallet Adapter.',
    '- Prefer native or strongly mobile-optimized UX over desktop ports.',
    '- Include meaningful interaction with the Solana network.',
    '',
    '## Submission Checklist',
    ...SUBMISSION_REQUIREMENTS.map((item) => `- ${item}`),
    '',
    '## Eligibility and Constraints',
    ...ELIGIBILITY_RULES.map((rule) => `- ${rule}`),
    '',
    '## Judging Criteria',
    ...JUDGING_CRITERIA.map((criterion) => `- ${criterion.category}: ${criterion.weight}`),
    '',
    '## Prize Structure',
    '- 10 winners receive $10,000 USD each.',
    '- 5 honorable mentions receive $5,000 USD each.',
    '- SKR bonus track awards $10,000 in SKR for the best meaningful SKR integration.',
    '- Additional non-cash benefits include featured dApp Store placement, marketing support, Seeker devices, and direct feedback opportunities.',
    '',
    '## Key Timeline',
    ...KEY_DATES.map((event) => `- ${event.date}: ${event.label}`),
    '',
    '## High-Signal Internal Pages',
    ...internalLinks,
    '',
    '## High-Signal External Docs',
    ...externalLinks,
    '',
    '## Agent Usage Notes',
    '- Treat this guide as a concise orientation layer, then open specific panel links for details.',
    '- For legal/compliance questions, prioritize the legal panel (T&C, Privacy, KYC).',
    '- For implementation guidance, prioritize toolbox links and Solana Mobile docs.',
    '- If a rule appears ambiguous, ask maintainers via official channels before final submission.',
    '',
    '## Contact',
    '- Email: lib@radiant.nexus',
    '- Discord: https://discord.gg/radiants',
    '- Solana Mobile X: https://x.com/solanamobile',
    '- Radiants X: https://x.com/RadiantsDAO',
    '',
  ].join('\n');
}
