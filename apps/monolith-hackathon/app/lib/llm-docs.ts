const DEFAULT_SITE_URL = 'https://solanamobile.radiant.nexus';
const LAST_UPDATED = '2026-02-17';

type LinkSpec = {
  title: string;
  href: string;
  description: string;
};

type PanelTabDoc = {
  id: string;
  label: string;
  markdown: string;
};

type PanelDoc = {
  id: string;
  title: string;
  description: string;
  markdown: string;
  tabs?: PanelTabDoc[];
};

const PRIMARY_DOC_LINKS: LinkSpec[] = [
  {
    title: 'LLM Guide (Concise)',
    href: '/llms.md',
    description: 'Short, high-signal summary for assistants and copilots.',
  },
  {
    title: 'LLM Guide (Full Content)',
    href: '/llms-full.md',
    description: 'Full-fidelity markdown export of panel content and policies.',
  },
  {
    title: 'Interactive Site',
    href: '/',
    description: 'Human-facing Monolith website with panel navigation.',
  },
];

const OPTIONAL_LINKS: LinkSpec[] = [
  {
    title: 'Component Showcase',
    href: '/components-showcase',
    description: 'Reference view for @rdna/monolith components.',
  },
  {
    title: 'Embed View',
    href: '/embed',
    description: 'Minimal hero embed version of the Monolith landing page.',
  },
];

const EXTERNAL_DEV_LINKS: LinkSpec[] = [
  {
    title: 'Solana Mobile AI Development Toolkit',
    href: 'https://docs.solanamobile.com/developers/ai-toolkit',
    description: 'AI-assisted development workflow docs for Solana Mobile.',
  },
  {
    title: 'Solana Mobile React Native Quickstart',
    href: 'https://docs.solanamobile.com/react-native/quickstart',
    description: 'Quickstart template for Android-focused React Native apps.',
  },
  {
    title: 'Mobile Wallet Adapter (Mobile Apps)',
    href: 'https://docs.solanamobile.com/mobile-wallet-adapter/mobile-apps',
    description: 'Mobile Wallet Adapter integration guide.',
  },
  {
    title: 'Solana Mobile Sample Apps',
    href: 'https://docs.solanamobile.com/sample-apps/sample_app_overview',
    description: 'Reference sample applications and architecture patterns.',
  },
  {
    title: 'Solana Core Docs',
    href: 'https://solana.com/docs',
    description: 'Core Solana protocol and development documentation.',
  },
];

const PROGRAM_SNAPSHOT = [
  'Monolith is a 5-week Solana Mobile hackathon focused on Android dApps for Seeker users.',
  'Prize pool is $125,000+ total, including a $10,000 SKR bonus track.',
  'Primary build target is a functional Android APK with meaningful mobile-first UX.',
  'Required integrations include Solana Mobile Stack and Mobile Wallet Adapter.',
];

const SUBMISSION_CHECKLIST = [
  'Functional Android APK.',
  'GitHub repository with source code.',
  'Demo video showing product functionality.',
  'Pitch deck or concise presentation.',
];

const ELIGIBILITY_CONSTRAINTS = [
  'Project should be started within 3 months of launch date.',
  'Projects that have raised outside capital are not eligible.',
  'Direct web ports and thin PWA wrappers are unlikely to win.',
  'Winners must publish on the Solana dApp Store to claim prizes (post-deadline grace period allowed).',
];

const JUDGING_CRITERIA = [
  'Stickiness & PMF - 25%',
  'User Experience - 25%',
  'Innovation / X-factor - 25%',
  'Presentation & Demo Quality - 25%',
];

const KEY_DATES = [
  '2026-02-02 - Launch day and submissions open',
  '2026-03-08 - Submissions close (7:00 PM PST)',
  '2026-03-09 - Voting starts (7:00 PM PST)',
  '2026-04-29 - Voting ends (7:00 PM PST)',
  '2026-05-07 - Prize distribution milestone',
];

const PANEL_DOCS: PanelDoc[] = [
  {
    id: 'hackathon',
    title: 'HACKATHON.EXE',
    description: 'Program scope, build targets, submission requirements, and judging criteria.',
    markdown: `
### Tagline
Monolith is a 5-week sprint to build a mobile app for the Solana dApp Store. Teams design, develop, and ship an Android application for the Seeker community in the Solana Mobile ecosystem.

### Prize Callouts
- $10,000 - 10 winners
- $5,000 - 5 honorable mentions
- $10,000 in SKR - bonus track

### Headline Stats
- $125K+ in prizes
- 5 weeks to build
- Solana dApp Store target

### Additional Prizes
- Featured dApp Store placement (high visibility launch support)
- Marketing and launch support from official Solana Mobile channels
- Seeker devices for winning teams
- A call with Toly for winners and honorable mentions

### Dual-Hackathon Eligibility Note
Projects built for the Colosseum Agent Hackathon are also eligible for Monolith if they produce a qualifying mobile app that meets Monolith requirements.

### What to Build
- Platform: Android (submission must include a functional APK)
- Must integrate Solana Mobile Stack and Mobile Wallet Adapter
- Must be mobile-first; direct ports and wrapper-style PWAs score poorly
- App should meaningfully interact with the Solana network

### What to Submit
- Functional Android APK
- GitHub repository with source code
- Demo video
- Pitch deck or concise presentation

### Results
- Results announced early April
- Winners must publish on dApp Store to claim prize (reasonable timeframe provided)
- Winners are subject to technical review and code verification

### Evaluation Criteria
- Stickiness & PMF (25%): fit for Seeker users and potential for repeat engagement
- User Experience (25%): usability, polish, and mobile quality
- Innovation / X-factor (25%): novelty, creativity, and differentiation
- Presentation & Demo (25%): clarity of communication and demo quality
    `.trim(),
  },
  {
    id: 'calendar',
    title: 'CALENDAR.exe',
    description: 'Official timeline with launch, workshops, milestones, and deadlines.',
    markdown: `
### Event Categories
- launch
- vibecoding
- devshop
- deadline
- milestone
- mtndao

### Full Event Timeline
- 2026-02-02 - LAUNCH DAY (launch)
- 2026-02-02 - Open for Submissions (milestone) - 11:00 AM EST
- 2026-02-03 - Kickoff Workshop (vibecoding) - 9:30 AM PST  
  Get started with hackathon setup, then an all-day vibecoding session with KEMOS4BE in the Radiants Discord.  
  Link: https://discord.gg/radiants
- 2026-02-05 - Devshop (devshop) - 9:30 AM PST  
  Technical workshop covering Solana Mobile Stack, MWA integration, and dApp Store publishing.  
  Link: https://discord.gg/radiants
- 2026-02-09 - Solana Mobile MTNDAO (mtndao)
- 2026-02-10 - Solana Mobile MTNDAO (mtndao)
- 2026-02-10 - Vibecoding (vibecoding) - 9:30 AM PST  
  Session on leveling up app development with Claude Code, hosted by KEMOS4BE.  
  Link: https://discord.gg/radiants
- 2026-02-11 - Solana Mobile MTNDAO (mtndao)
- 2026-02-12 - Solana Mobile MTNDAO (mtndao)
- 2026-02-12 - Devshop (devshop) - 9:30 AM PST  
  Technical workshop with Solana Mobile support.  
  Link: https://discord.gg/radiants
- 2026-02-17 - Vibecoding (vibecoding) - 9:30 AM PST  
  Claude Code app dev session with KEMOS4BE.  
  Link: https://discord.gg/radiants
- 2026-02-19 - Devshop (devshop) - 9:30 AM PST  
  Solana Mobile Stack + MWA + dApp Store workshop.  
  Link: https://discord.gg/radiants
- 2026-02-24 - Vibecoding (vibecoding) - 9:30 AM PST  
  Claude Code app dev session with KEMOS4BE.  
  Link: https://discord.gg/radiants
- 2026-02-26 - Devshop (devshop) - 9:30 AM PST  
  Solana Mobile Stack + MWA + dApp Store workshop.  
  Link: https://discord.gg/radiants
- 2026-03-03 - Vibecoding (vibecoding) - 9:30 AM PST  
  Claude Code app dev session with KEMOS4BE.  
  Link: https://discord.gg/radiants
- 2026-03-05 - Devshop (devshop) - 9:30 AM PST  
  Solana Mobile Stack + MWA + dApp Store workshop.  
  Link: https://discord.gg/radiants
- 2026-03-08 - Submissions Closed (deadline) - 7:00 PM PST
- 2026-03-09 - Voting Starts (milestone) - 7:00 PM PST
- 2026-04-29 - Voting Ends (deadline) - 7:00 PM PST
- 2026-05-07 - Prizes Distributed (milestone) - 7:00 PM PST
    `.trim(),
  },
  {
    id: 'rules',
    title: 'RULES.exe',
    description: 'Eligibility rules, submission requirements, deadlines, and disqualification terms.',
    markdown: `
### Eligibility
- Project must have been started within 3 months of hackathon launch date.
- Projects that have raised outside capital are not eligible.
- Pre-existing projects are allowed only if they demonstrate significant new mobile development during the hackathon.
- Teams with existing web apps can participate, but must ship an Android app with significant mobile-specific development.
- Direct ports or minimal conversions of web apps (including PWA wrappers with little optimization) score poorly and are unlikely to win.

### Submission Requirements
All submissions must include:
- Functional Android APK
- GitHub repository
- Demo video
- Pitch deck or concise presentation

### Prize Eligibility
Publishing on the Solana dApp Store is not required by submission deadline. Winners must publish to claim prize and will receive a reasonable post-results timeframe.

### Submission Deadline
All materials must be submitted before deadline. No late entries.

### Disqualification
Teams that provide false information or violate rules forfeit prizes.

### Scoring Breakdown
- Stickiness & PMF (25%): fit with Seeker user behavior and repeat usage
- User Experience (25%): polish, intuition, and mobile quality
- Innovation / X-factor (25%): novelty and strategic differentiation
- Presentation & Demo Quality (25%): clarity and quality of demonstration
    `.trim(),
  },
  {
    id: 'prizes',
    title: 'PRIZES.exe',
    description: 'Prize pool structure, cash tiers, SKR bonus track, and non-cash extras.',
    markdown: `
### Prize Pool
$125,000+

### Tiers
- 10 Winners - $10,000 USD each  
  Top 10 projects each receive $10,000 USD.
- 5 Honorable Mentions - $5,000 USD each  
  Next 5 projects each receive $5,000 USD.
- SKR Bonus Track - $10,000 in SKR  
  Best meaningful SKR integration receives $10,000 worth of SKR.

### Extras
- Featured dApp Store Placement  
  High visibility featuring for top projects and broad discovery at launch.
- Marketing & Launch Support  
  Go-to-market and amplification from official Solana Mobile channels.
- Seeker Devices  
  Devices for winning teams to continue ecosystem development.

### Plus
- A Call with Toly  
  Winners and honorable mentions may receive direct feedback.
    `.trim(),
  },
  {
    id: 'judges',
    title: 'JUDGES.exe',
    description: 'Judge roster and the evaluation process used for submissions.',
    markdown: `
### Judge Roster
- Toly - Phone Salesman, Solana Labs (X: @toly)
- Emmett - General Manager, Solana Mobile (X: @m_it)
- Mert - Shitposter, Helius (X: @mert)
- Mike S - Developer Relations, Solana Mobile (X: @somemobiledev)
- Chase - Based Snarker, Solana Mobile (X: @therealchaseeb)
- Akshay - BD & Ecosystem, Solana Mobile / Solana Labs (X: @0x_Diablo)

### Evaluation Process
Judges assess:
- Completion based on demo video
- Technical depth via GitHub commits
- Mobile-optimized UX and mobile feature usage
- Solana network usage and interaction quality
- Clarity and vision from presentation

### Evaluation Criteria
- Stickiness & PMF (25%)
- User Experience (25%)
- Innovation / X-factor (25%)
- Presentation & Demo Quality (25%)
    `.trim(),
  },
  {
    id: 'toolbox',
    title: 'TOOLBOX.exe',
    description: 'Developer docs, templates, ecosystem references, and learning resources.',
    tabs: [
      {
        id: 'dev-docs',
        label: 'DEV DOCS',
        markdown: `
### Featured Links
- [Component Library](/components-showcase): Browse the @rdna/monolith design system components.
- [Quickstart Template](https://docs.solanamobile.com/react-native/quickstart): Solana Mobile React Native quickstart.
- [Integrate Mobile Wallet Adapter](https://docs.solanamobile.com/mobile-wallet-adapter/mobile-apps): MWA integration guide.
- [Solana Mobile Sample Apps](https://docs.solanamobile.com/sample-apps/sample_app_overview): Sample applications.
- [Solana Mobile AI Development Toolkit](https://docs.solanamobile.com/developers/ai-toolkit): AI-assisted development toolkit.
- [Solana Development Docs](https://solana.com/docs): Core Solana docs.
- [Expo / React Native Docs](https://docs.expo.dev/): Expo and RN docs.

### Solana Mobile Resources
- [Getting Started](https://docs.solanamobile.com/developers/overview): Solana Mobile dev overview and quickstart path.
- [Development Setup (No Device Needed)](https://docs.solanamobile.com/developers/development-setup): Build and test without a Solana Mobile device.
- [Test with Any Android Device](https://docs.solanamobile.com/react-native/test-with-any-android-device): Any Android phone can be used.
- [dApp Store Publishing](https://docs.solanamobile.com/dapp-publishing/publisher-policy): Publisher policy and Android requirements.

### General Solana Resources
- [Introduction to Solana Development](https://solana.com/docs/intro/dev)
- [Important Concepts](https://solana.com/docs#start-learning)
- [Setup Your Environment](https://solana.com/developers/guides/getstarted/setup-local-development)
- [Hello World](https://solana.com/developers/guides/getstarted/hello-world-in-your-browser)
- [Solana Bytes](https://www.youtube.com/watch?v=pRYs49MqapI&list=PLilwLeBwGuK51Ji870apdb88dnBr1Xqhm)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Bootcamp](https://www.youtube.com/watch?v=0P8JeL3TURU&list=PLilwLeBwGuK6NsYMPP_BlVkeQgff0NwvU)
- [Web3.js Library](https://github.com/solana-labs/solana-web3.js)
- [create-solana-dapp](https://github.com/solana-developers/create-solana-dapp)
- [Solana Playground](https://beta.solpg.io/)
- [Solana Stack Exchange](https://solana.stackexchange.com/)
- [Solana Mobile Expo Template](https://github.com/solana-mobile/solana-mobile-expo-template)
- [Solana App Kit](https://github.com/SendArcade/solana-app-kit)

### Guides, Videos, and Self-Learning
- [Quick Guides](https://solana.com/developers/guides)
- [SolAndy](https://www.youtube.com/solandy)
- [THE Solana Course](https://soldev.app/course)
- [Freecodecamp Solana](https://web3.freecodecamp.org/solana)
- [RiseIn Build on Solana](https://www.risein.com/courses/build-on-solana)
- [Ideasoft Beginner](https://careerbooster.io/courses/full-solana-and-rust-programming-course-for-beginners)
- [Ideasoft Advanced](https://careerbooster.io/courses/rust-solana-advance-development-course)
- [Rareskills ETH to Solana](https://www.rareskills.io/solana-tutorial)

### Tooling, Ecosystem Docs, and SDKs
- [Solana Core Docs](https://solana.com/docs)
- [Metaplex (NFTs)](https://developers.metaplex.com/)
- [Solana Pay](https://docs.solanapay.com/)
- [Solana Mobile SDK](https://solanamobile.com/developers)
- [Unity SDK](https://docs.magicblock.gg/SolanaUnitySDK/overview)
- [Turbo Rust Engine](https://turbo.computer/)
- [GameShift](https://gameshift.solanalabs.com/)
- [Godot SDK](https://github.com/Virus-Axel/godot-solana-sdk)
- [Phaser SDK](https://github.com/Bread-Heads-NFT/phaser-solana-platformer-template)
- [Unreal SDK (Star Atlas)](https://github.com/staratlasmeta/FoundationKit)
- [Unreal SDK (Bifrost)](https://github.com/Bifrost-Technologies/Solana-Unreal-SDK)
- [Game Examples](https://github.com/solana-developers/solana-game-examples)
- [Randomness Service](https://github.com/switchboard-xyz/solana-randomness-service-example)

### Open Source References
- [Awesome Solana OSS](https://github.com/StockpileLabs/awesome-solana-oss): Curated open-source references.
        `.trim(),
      },
      {
        id: 'assets',
        label: 'ASSETS',
        markdown: `
### Assets
COMING SOON
        `.trim(),
      },
      {
        id: 'ai',
        label: 'AI',
        markdown: `
### AI
Skills, MCPs, and libraries coming soon. Join the first vibecoding camp for alpha.
        `.trim(),
      },
    ],
    markdown: `
### DEV DOCS
See full curated docs, SDKs, templates, and learning resources in the DEV DOCS tab.

### ASSETS
COMING SOON

### AI
Skills, MCPs, and libraries coming soon.
    `.trim(),
  },
  {
    id: 'faq',
    title: 'FAQ.exe',
    description: 'Operational Q&A covering sign-up, eligibility, submissions, and prizes.',
    markdown: `
### Getting Started
- Q: How do I sign up?  
  A: Connect your wallet and create a profile on Align.
- Q: Do I need an organization profile on Align?  
  A: No. A personal account is sufficient.
- Q: What dimensions should my profile banner be?  
  A: 1200 x 600 px.
- Q: When is the sign-up deadline?  
  A: March 9, 2026.
- Q: Who should submit?  
  A: One member per team.
- Q: Can I compete solo?  
  A: Yes, but teaming up is encouraged.

### Eligibility
- Q: Can I enter if I won a previous hackathon?  
  A: Yes, if you ship a new mobile app. Old projects should not be lazily re-submitted. Funded teams are not eligible.
- Q: Can I work on a pre-existing product?  
  A: Only if started within 3 months of the hackathon, otherwise you must show significant new mobile development.
- Q: Can I convert an existing web app to mobile?  
  A: Yes, but you must build a native or hybrid Android app with meaningful mobile-specific work. Thin ports and wrappers score poorly.
- Q: Are funded projects eligible?  
  A: No.
- Q: Can I compete in both Monolith and Colosseum Agent Hackathon?  
  A: Yes. Teams may enter both.
- Q: Are there tracks?  
  A: One category: Mobile dApps.

### Building and Submissions
- Q: What can I build?  
  A: Any Android app compatible with the dApp Store.
- Q: Can I vibe-code my app?  
  A: Yes, but low-quality AI output scores poorly.
- Q: Does my GitHub repo need to be public?  
  A: Either public, or invite the hackathon-Judges GitHub account.
- Q: Do I have to include an APK?  
  A: Yes.
- Q: What are submission requirements?  
  A: Functional Android APK, GitHub repo, demo video, and pitch deck/presentation.
- Q: Does my submission need to be a mobile app?  
  A: Yes, a functioning Android app.
- Q: Is there a limit on number of entries?  
  A: No formal limit, but quality over quantity is encouraged.
- Q: Can I edit submission before the deadline?  
  A: Yes, until submissions close.
- Q: When does submission close?  
  A: March 9, 2026.
- Q: Can I keep working after submission closes?  
  A: Fork your repo and continue on a separate branch.
- Q: How do I test without a Seeker?  
  A: Use any Android phone; see Toolbox setup guides.

### Prizes and Publishing
- Q: What is SKR?  
  A: Native asset of the Solana Mobile ecosystem; best meaningful integration gets $10,000 in SKR.
- Q: Do I need to publish on the dApp Store?  
  A: Not by submission deadline, but winners must publish to claim prize.
- Q: How are projects evaluated?  
  A: By demo completeness, technical depth, mobile UX quality, Solana Mobile Stack/MWA integration, and Seeker traction potential.
    `.trim(),
  },
  {
    id: 'legal',
    title: 'LEGAL.exe',
    description: 'Terms and conditions, privacy policy, and KYC policy.',
    tabs: [
      {
        id: 'terms',
        label: 'T&C',
        markdown: `
### 1. Introduction
These Terms and Conditions govern participation in the Solana Mobile Hackathon, organized by Radiants DAO Ltd. (BVI). Participation means acceptance of these terms.

### 2. Organizer Information
Radiants DAO Ltd. (BVI) hosts the hackathon with partner support. Official contact: Lib@radiant.nexus.

### 3. Eligibility
Participants must:
- Be 18+ or age of majority in their jurisdiction.
- Not be resident in restricted jurisdictions listed in KYC policy.
- Not be an employee/direct contractor of Radiants DAO Ltd. or a judge.
- Be capable of complying with KYC/AML if selected for prizes.

### 4. Registration and Participation
Participants must register via official platform with truthful information. One registration per participant. Team participation depends on hackathon guidelines. Submissions must be original and non-infringing.

### 5. Project Requirements
Projects must:
- Be built within the hackathon period.
- Follow theme/track/technical requirements.
- Not contain malware or harmful code.
- Not promote illegal or discriminatory behavior.
- Be submitted before deadline.

### 6. Judging and Prizes
Judges are appointed by organizer. Criteria may include innovation, execution, impact, and alignment. Decisions are final. Prize winners must complete KYC; failure may result in forfeiture.

### 7. Intellectual Property
Participants retain ownership. By entering, participants grant Radiants DAO Ltd. a non-exclusive, royalty-free license to use/display/promote submissions for marketing, promotional, and archival purposes.

### 8. KYC and AML Compliance
Prize winners must complete identity verification under KYC policy. Organizer may withhold prizes pending verification or disqualify false/misleading submissions.

### 9. Restricted Jurisdictions
Participants from jurisdictions sanctioned by UN, OFAC, FATF, or BVI government are not eligible.

### 10. Disqualification
Organizer may disqualify participants who submit false information, use unfair automation, miss deadlines, or engage in harassment/discrimination.

### 11. Privacy
Personal data is processed under the hackathon privacy policy.

### 12. Limitation of Liability
Radiants DAO Ltd. is not liable for losses from participation, including code errors, smart contract failures, blockchain/network failures, market volatility, token loss, or third-party judging/service outcomes. Blockchain participation is inherently risky.

### 13. Changes and Cancellation
Organizer may cancel/modify/suspend due to force majeure, technical issues, or events beyond control, with material changes communicated to participants.

### 14. Governing Law
Governed by laws of the British Virgin Islands; disputes subject to BVI courts.

### 15. Contact
Questions: Lib@radiant.nexus
        `.trim(),
      },
      {
        id: 'privacy',
        label: 'PRIVACY',
        markdown: `
### Data Collection
Collected data includes name, email, wallet address, and project details. Prize winners provide government ID, address, and selfie for KYC.

### Purpose
Data is used for administration, KYC/AML compliance, fraud prevention, and prize distribution.

### Data Sharing
Data may be shared with KYC providers and authorities where legally required. Personal data is not sold.

### Retention
Data retained for 5 years post-hackathon under BVI AML regulations. Participants may request access, correction, or deletion.
        `.trim(),
      },
      {
        id: 'kyc',
        label: 'KYC',
        markdown: `
### Purpose
KYC verification is required for AML/CFT compliance and fraud mitigation.

### Scope
KYC applies to prizes of $2,500 USD or higher; verification required before payout.

### Procedure
Verification is performed via third-party provider or secure manual review. Requirements: government-issued photo ID and selfie verification.

### Crypto Payouts
Wallet address verification is required. Payouts are made only to verified wallets.
        `.trim(),
      },
    ],
    markdown: `
### T&C
Full legal participation terms covering eligibility, conduct, IP, liability, and governing law.

### PRIVACY
Data collection, processing purposes, sharing model, and retention policy.

### KYC
KYC scope, verification process, and payout compliance requirements.
    `.trim(),
  },
];

function isAbsoluteUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function normalizeSiteUrl(siteUrl?: string): string {
  if (!siteUrl || !siteUrl.trim()) return DEFAULT_SITE_URL;
  return siteUrl.trim().replace(/\/+$/, '');
}

function toAbsoluteUrl(siteUrl: string, path: string): string {
  return new URL(path, siteUrl).toString();
}

function panelPath(panelId: string, tabId?: string): string {
  const params = new URLSearchParams();
  params.set('panel', panelId);
  if (tabId) params.set('tab', tabId);
  return `/?${params.toString()}`;
}

function resolveLink(siteUrl: string, href: string): string {
  return isAbsoluteUrl(href) ? href : toAbsoluteUrl(siteUrl, href);
}

function asBullet(siteUrl: string, link: LinkSpec): string {
  return `- [${link.title}](${resolveLink(siteUrl, link.href)}): ${link.description}`;
}

function section(title: string, lines: string[]): string {
  return `## ${title}\n${lines.join('\n')}`;
}

function getPanelById(panelId: string): PanelDoc | undefined {
  return PANEL_DOCS.find((panel) => panel.id === panelId);
}

function buildPanelSection(panel: PanelDoc, siteUrl: string): string {
  const panelUrl = toAbsoluteUrl(siteUrl, panelPath(panel.id));
  const tabLinks = panel.tabs?.map((tab) => {
    const tabUrl = toAbsoluteUrl(siteUrl, panelPath(panel.id, tab.id));
    return `- [${tab.label}](${tabUrl}): Tab-specific view for ${panel.title}.`;
  });

  const parts = [
    `## ${panel.title}`,
    '',
    `Source page: ${panelUrl}`,
    '',
    panel.markdown.trim(),
  ];

  if (tabLinks && tabLinks.length > 0) {
    parts.push('', '### Tabs', ...tabLinks);
  }

  return parts.join('\n');
}

export function getCanonicalSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

export function buildPanelMarkdown(
  panelId: string,
  tabId?: string,
  siteUrl = getCanonicalSiteUrl(),
): string | null {
  const panel = getPanelById(panelId);
  if (!panel) return null;

  const tab = tabId ? panel.tabs?.find((candidate) => candidate.id === tabId) : undefined;
  const heading = tab ? `${panel.title} / ${tab.label}` : panel.title;
  const path = panelPath(panelId, tab?.id);
  const source = toAbsoluteUrl(siteUrl, path);
  const markdownBody = tab ? tab.markdown : panel.markdown;

  return [
    `# ${heading}`,
    '',
    `Source page: ${source}`,
    '',
    markdownBody.trim(),
    '',
  ].join('\n');
}

export function buildLlmsTxt(siteUrl = getCanonicalSiteUrl()): string {
  const panelLinks = PANEL_DOCS.map((panel) =>
    asBullet(siteUrl, {
      title: panel.title,
      href: panelPath(panel.id),
      description: panel.description,
    }),
  );

  return [
    '# Monolith | Solana Mobile Hackathon',
    '',
    '> LLM index for the official Monolith hackathon website.',
    '',
    'Use this file as a navigation map. Start with the concise guide, then use the full guide for complete source content.',
    '',
    section('Core', PRIMARY_DOC_LINKS.map((link) => asBullet(siteUrl, link))),
    '',
    section('Panels', panelLinks),
    '',
    section('Developer Resources', EXTERNAL_DEV_LINKS.map((link) => asBullet(siteUrl, link))),
    '',
    section('Optional', OPTIONAL_LINKS.map((link) => asBullet(siteUrl, link))),
    '',
    `Last updated: ${LAST_UPDATED}`,
    '',
  ].join('\n');
}

export function buildLlmsMarkdown(siteUrl = getCanonicalSiteUrl()): string {
  const panelLinks = PANEL_DOCS.map((panel) =>
    asBullet(siteUrl, {
      title: panel.title,
      href: panelPath(panel.id),
      description: panel.description,
    }),
  );

  return [
    '# Monolith | Solana Mobile Hackathon (LLM Guide)',
    '',
    `Canonical site: ${toAbsoluteUrl(siteUrl, '/')}`,
    `LLMs index: ${toAbsoluteUrl(siteUrl, '/llms.txt')}`,
    `Full content guide: ${toAbsoluteUrl(siteUrl, '/llms-full.md')}`,
    `Last updated: ${LAST_UPDATED}`,
    '',
    '## How to Use This',
    '- Use this file for fast orientation.',
    '- Use `/llms-full.md` for complete panel/legal/calendar/FAQ/toolbox content.',
    '- Use panel URLs with query parameters when you need the exact in-app view.',
    '',
    '## Program Snapshot',
    ...PROGRAM_SNAPSHOT.map((line) => `- ${line}`),
    '',
    '## Submission Checklist',
    ...SUBMISSION_CHECKLIST.map((line) => `- ${line}`),
    '',
    '## Eligibility and Constraints',
    ...ELIGIBILITY_CONSTRAINTS.map((line) => `- ${line}`),
    '',
    '## Judging Criteria',
    ...JUDGING_CRITERIA.map((line) => `- ${line}`),
    '',
    '## Key Timeline',
    ...KEY_DATES.map((line) => `- ${line}`),
    '',
    '## Panel Links',
    ...panelLinks,
    '',
    '## External Docs',
    ...EXTERNAL_DEV_LINKS.map((link) => asBullet(siteUrl, link)),
    '',
    '## Contact',
    '- Email: lib@radiant.nexus',
    '- Discord: https://discord.gg/radiants',
    '- Solana Mobile X: https://x.com/solanamobile',
    '- Radiants X: https://x.com/RadiantsDAO',
    '',
  ].join('\n');
}

export function buildLlmsFullMarkdown(siteUrl = getCanonicalSiteUrl()): string {
  const panelSections = PANEL_DOCS.map((panel) => buildPanelSection(panel, siteUrl)).join('\n\n');

  return [
    '# Monolith | Solana Mobile Hackathon (LLM Full Guide)',
    '',
    `Canonical site: ${toAbsoluteUrl(siteUrl, '/')}`,
    `LLMs index: ${toAbsoluteUrl(siteUrl, '/llms.txt')}`,
    `Concise guide: ${toAbsoluteUrl(siteUrl, '/llms.md')}`,
    `Last updated: ${LAST_UPDATED}`,
    '',
    '## Scope',
    'This file is the full-fidelity markdown export for the in-site panel content used by Monolith.',
    'It is intended for agentic workflows that require complete context instead of short summaries.',
    '',
    '## Panels',
    ...PANEL_DOCS.map((panel) => `- [${panel.title}](${toAbsoluteUrl(siteUrl, panelPath(panel.id))})`),
    '',
    panelSections,
    '',
    '## Contact',
    '- Email: lib@radiant.nexus',
    '- Discord: https://discord.gg/radiants',
    '- Solana Mobile X: https://x.com/solanamobile',
    '- Radiants X: https://x.com/RadiantsDAO',
    '',
  ].join('\n');
}
