'use client';

import { Fragment, useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useScramble } from 'use-scramble';
import CrtAccordion from './CrtAccordion';
import CrtTabs from './CrtTabs';
import { ORBITAL_ITEMS } from './OrbitalNav';

interface InfoWindowProps {
  activeId: string;
  onTabChange: (id: string) => void;
  onClose: () => void;
  initialTab?: string | null;
}

// ============================================================================
// Content Types
// ============================================================================

type AccordionSection = {
  title: string;
  icon?: React.ReactNode;
  items: { label: string; url?: string; description?: string }[];
};

type TabContent = { id: string; label: string } & (
  | { contentType?: 'sections'; sections: { heading: string; body: string }[] }
  | { contentType: 'accordion'; accordionItems: AccordionSection[] }
  | { contentType: 'featured-accordion'; featuredItems: { label: string; url: string; description?: string }[]; accordionItems: AccordionSection[] }
  | { contentType: 'coming-soon'; comingSoonMessage?: string }
);

type WindowContent =
  | { type: 'entries'; title: string; entries: { date: string; title: string; body: string }[] }
  | { type: 'sections'; title: string; sections: { heading: string; body: string }[] }
  | { type: 'tabs'; title: string; tabs: TabContent[] }
  | { type: 'accordion'; title: string; categories: { heading: string; items: { question: string; answer: string }[] }[] }
  | { type: 'judges'; title: string; judges: { name: string; role: string; org: string; twitter?: string; image?: string }[]; evaluation?: string[] }
  | { type: 'prizes'; title: string; poolTotal: string; tiers: { label: string; amount: string; description?: string; variant?: 'hero' | 'runner-up' | 'bonus' | 'extra' }[] }
  | { type: 'hackathon'; title: string; tagline?: string; prizes?: { amount: string; label: string }[]; stats: { value: string; label: string; tier: 'primary' | 'secondary' }[]; sections: { heading: string; body: string | string[] }[]; criteria?: { category: string; pct: number; description: string }[] }
  | { type: 'calendar'; title: string; events: { date: string; label: string; time?: string; category: 'launch' | 'vibecoding' | 'devshop' | 'deadline' | 'milestone' | 'mtndao'; description?: string; link?: string }[] }
  | { type: 'rules'; title: string; sections: { heading: string; body: string | string[] }[]; criteria: { category: string; pct: number; description: string }[] };

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
          { label: 'Solana Mobile AI Development Toolkit', url: 'https://docs.solanamobile.com/developers/ai-toolkit', description: 'AI-assisted development tools for Solana Mobile.' },
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
        id: 'assets',
        label: 'ASSETS',
        contentType: 'coming-soon' as const,
      },
      {
        id: 'ai',
        label: 'AI',
        contentType: 'coming-soon' as const,
        comingSoonMessage: 'Skills, MCPs, & Libraries coming soon. Join the first vibecoding camp for alpha.',
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
          { question: 'Can I compete in both Monolith and Colosseum\'s Agent Hackathon?', answer: 'Yes — teams are welcome to enter both. Ship a Solana Mobile app for Monolith and an agent project for Colosseum. More hackathons, more chances to win.' },
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
      { date: '2026-02-03', label: 'Kickoff Workshop', time: '9:30 AM PST', category: 'vibecoding', description: 'Get started with the hackathon! Mike from Solana Mobile walks you through everything you need to know, while KEMOS4BE kicks off an all-day vibecoding session — planning and building his hackathon project live. Join in the Radiants Discord.', link: 'https://discord.gg/radiants' },
      { date: '2026-02-05', label: 'Devshop', time: '9:30 AM PST', category: 'devshop', description: 'Hands-on technical workshops covering Solana Mobile Stack, MWA integration, and dApp Store publishing with Mike from Solana Mobile.', link: 'https://discord.gg/radiants' },
      // MTNDAO
      { date: '2026-02-09', label: 'Solana Mobile MTNDAO', category: 'mtndao' },
      { date: '2026-02-10', label: 'Solana Mobile MTNDAO', category: 'mtndao' },
      { date: '2026-02-11', label: 'Solana Mobile MTNDAO', category: 'mtndao' },
      { date: '2026-02-12', label: 'Solana Mobile MTNDAO', category: 'mtndao' },
      // Week 2
      { date: '2026-02-10', label: 'Vibecoding', time: '9:30 AM PST', category: 'vibecoding', description: 'Learn how to levelup your app dev process w/ Claude Code, hosted by KEMOS4BE in the Radiants Discord.', link: 'https://discord.gg/radiants' },
      { date: '2026-02-12', label: 'Devshop', time: '9:30 AM PST', category: 'devshop', description: 'Hands-on technical workshops covering Solana Mobile Stack, MWA integration, and dApp Store publishing with Mike from Solana Mobile.', link: 'https://discord.gg/radiants' },
      // Week 3
      { date: '2026-02-17', label: 'Vibecoding', time: '9:30 AM PST', category: 'vibecoding', description: 'Learn how to levelup your app dev process w/ Claude Code, hosted by KEMOS4BE in the Radiants Discord.', link: 'https://discord.gg/radiants' },
      { date: '2026-02-19', label: 'Devshop', time: '9:30 AM PST', category: 'devshop', description: 'Hands-on technical workshops covering Solana Mobile Stack, MWA integration, and dApp Store publishing with Mike from Solana Mobile.', link: 'https://discord.gg/radiants' },
      // Week 4
      { date: '2026-02-24', label: 'Vibecoding', time: '9:30 AM PST', category: 'vibecoding', description: 'Learn how to levelup your app dev process w/ Claude Code, hosted by KEMOS4BE in the Radiants Discord.', link: 'https://discord.gg/radiants' },
      { date: '2026-02-26', label: 'Devshop', time: '9:30 AM PST', category: 'devshop', description: 'Hands-on technical workshops covering Solana Mobile Stack, MWA integration, and dApp Store publishing with Mike from Solana Mobile.', link: 'https://discord.gg/radiants' },
      // Week 5
      { date: '2026-03-03', label: 'Vibecoding', time: '9:30 AM PST', category: 'vibecoding', description: 'Learn how to levelup your app dev process w/ Claude Code, hosted by KEMOS4BE in the Radiants Discord.', link: 'https://discord.gg/radiants' },
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

function renderTabContent(tab: TabContent) {
  if ('contentType' in tab && tab.contentType === 'coming-soon') {
    return (
      <div className="coming-soon">
        <p className="coming-soon-text">{'comingSoonMessage' in tab && tab.comingSoonMessage ? tab.comingSoonMessage : 'COMING SOON'}</p>
      </div>
    );
  }
  if ('contentType' in tab && tab.contentType === 'featured-accordion') {
    return (
      <>
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

const CATEGORY_COLORS: Record<string, string> = {
  launch: '#14f1b2',
  vibecoding: '#fd8f3a',
  devshop: '#6939ca',
  deadline: '#ef5c6f',
  milestone: '#b494f7',
  mtndao: '#8dfff0',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Pixel icon components from radiants icon set
const pxStyle = (size: number): React.CSSProperties => ({ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, imageRendering: 'pixelated' as const });

function DiscordIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={pxStyle(size)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M0 7.79963H2.59998V2.59982H5.19995V-1.33514e-05H10.4V2.59982H7.79993V5.19966H18.2001V2.59982H15.6V-1.33514e-05H20.8V2.59982H23.4V7.79963H26V20.7989H23.4V23.3989H15.6V20.7989H10.4V23.3989H2.59998V20.7989H0V7.79963ZM15.6 10.3995H18.2001V15.5993H15.6V10.3995ZM10.4 10.3995H7.79993V15.5993H10.4V10.3995Z"/>
    </svg>
  );
}

function TwitterIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={pxStyle(size)}>
      <path d="M14.5998 0.00976562H12.8017V1.80777H11.0036V3.60577V5.40377H9.20546H7.40734H5.60921V3.60577H3.81109V1.80777H2.01297V0.00976562H0.214844V1.80777V3.60577V5.40377H2.01297V7.20177H0.214844V8.99977H2.01297H3.81109V10.7978H2.01297V12.5958H3.81109H5.60921V14.3938H3.81109V16.1918H2.01297V14.3938H0.214844V16.1918H2.01297V17.9898H3.81109H5.60921H7.40734H9.20546H11.0036V16.1918H12.8017H14.5998V14.3938H16.398V12.5958H18.1961V10.7978V8.99977H19.9942V7.20177V5.40377V3.60577H21.7923V1.80777V0.00976562H19.9942V1.80777H18.1961V0.00976562H16.398H14.5998Z"/>
    </svg>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={pxStyle(size)}>
      <path d="M3,4H5V5H6V6H7V7H9V6H10V5H11V4H13V6H12V7H11V8H10V10H11V11H12V12H13V14H11V13H10V12H9V11H7V12H6V13H5V14H3V12H4V11H5V10H6V8H5V7H4V6H3V4Z"/>
    </svg>
  );
}

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={pxStyle(size)}>
      <path d="M3,4H4V13H12V4H13V14H3V4ZM4,3H5V4H4V3ZM5,5H6V6H10V5H11V12H5V5ZM6,7V8H10V7H6ZM6,9V10H10V9H6ZM6,3H7V4H9V3H10V5H6V3ZM7,2H9V3H7V2ZM11,3H12V4H11V3Z"/>
    </svg>
  );
}

function CopiedIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={pxStyle(size)}>
      <path d="M2,3H3V13H2V3ZM3,2H5V3H3V2ZM3,13H12V14H3V13ZM4,5H11V6H5V11H7V12H4V5ZM5,1H10V2H9V3H10V4H5V3H6V2H5V1ZM6,8H7V9H6V8ZM7,9H8V10H7V9ZM8,10H9V11H8V10ZM9,9H10V10H9V9ZM10,2H12V3H10V2ZM10,8H11V9H10V8ZM10,11H11V12H10V11ZM11,7H12V8H11V7ZM12,3H13V5H12V3ZM12,6H13V7H12V6ZM12,8H13V13H12V8ZM13,5H14V6H13V5Z"/>
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
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  launch: <ElectricIcon size={10} />,
  vibecoding: <LightbulbIcon size={10} />,
  devshop: <WrenchIcon size={10} />,
  deadline: <HourglassIcon size={10} />,
  milestone: <TrophyIcon size={10} />,
  mtndao: <FireIcon size={10} />,
};

// Map criteria categories to icons
const CRITERIA_ICONS: Record<string, React.ReactNode> = {
  'Stickiness & PMF': <FireIcon size={24} />,
  'User Experience': <LightbulbIcon size={24} />,
  'Innovation / X-factor': <ElectricIcon size={24} />,
  'Presentation & Demo': <TrophyIcon size={24} />,
  'Presentation & Demo Quality': <TrophyIcon size={24} />,
};

const SPECIAL_BG_CATEGORIES = new Set(['launch', 'deadline', 'milestone', 'mtndao']);

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
  // Map common US timezone abbreviations to UTC offsets
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

  // Weekly recurrence for vibecoding/devshop until hackathon end (Mar 9)
  let recur = '';
  if (ev.category === 'vibecoding' || ev.category === 'devshop') {
    recur = `&recur=${encodeURIComponent('RRULE:FREQ=WEEKLY;UNTIL=20260309T000000Z')}`;
  }

  return `${base}&text=${title}&dates=${dates!}&details=${details}&location=${location}&sprop=${sprop}${ctz ? `&ctz=${encodeURIComponent(ctz)}` : ''}${recur}`;
}

function CalendarContent({ data }: { data: Extract<WindowContent, { type: 'calendar' }> }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventsByDate = new Map<string, { label: string; category: string; time?: string; description?: string; link?: string }[]>();
  for (const ev of data.events) {
    const list = eventsByDate.get(ev.date) || [];
    list.push(ev);
    eventsByDate.set(ev.date, list);
  }

  const todayKey = toDateKey(new Date());

  // Hero shows selected day's events, or falls back to today / next up
  const heroDate = selectedDate || todayKey;
  const heroEvents = eventsByDate.get(heroDate);
  const isShowingSelected = selectedDate && selectedDate !== todayKey;

  // Find next upcoming event (fallback)
  const sorted = [...data.events].sort((a, b) => a.date.localeCompare(b.date));
  const nextEvent = sorted.find((e) => e.date >= todayKey);

  const formatDateLabel = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="calendar-content">
      {/* Today / Selected / Next Up hero */}
      <div className="cal-today-hero">
        {heroEvents ? (
          <>
            <div className="cal-hero-header">
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
              <div key={i} className="cal-today-event">
                <div className="cal-event-top">
                  <span className="cal-today-dot" style={{ background: CATEGORY_COLORS[ev.category] }} />
                  <span className="subsection-heading">{ev.label}</span>
                </div>
                {times && (
                  <div className="cal-event-time-block">
                    <span className="cal-event-time-local">{times.local}</span>
                    <span className="cal-event-time-utc">{times.utc}</span>
                  </div>
                )}
                {ev.description && <p className="cal-event-desc">{ev.description}</p>}
                <div className="cal-event-actions">
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
            <div className="cal-today-event">
              <div className="cal-event-top">
                <span className="cal-today-dot" style={{ background: CATEGORY_COLORS[nextEvent.category] }} />
                <span className="subsection-heading">{nextEvent.label}</span>
                <span className="panel-muted">{formatDateLabel(nextEvent.date)}</span>
              </div>
              {nextTimes && (
                <div className="cal-event-time-block">
                  <span className="cal-event-time-local">{nextTimes.local}</span>
                  <span className="cal-event-time-utc">{nextTimes.utc}</span>
                </div>
              )}
              {nextEvent.description && <p className="cal-event-desc">{nextEvent.description}</p>}
              <div className="cal-event-actions">
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
      <div className="cal-legend">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} className="cal-legend-item">
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
      <a href="https://colosseum.com/agent-hackathon/" target="_blank" rel="noopener noreferrer" className="colosseum-banner">
        <img src="/icons/colosseum.svg" alt="Colosseum" className="colosseum-banner-logo" />
        <div className="colosseum-banner-heading">TWO IS BETTER THAN ONE</div>
        <p className="colosseum-banner-body">
          Clawd, Moltbot, and OpenClaw projects for the Colosseum Agent Hackathon are eligible for submission to the Solana Mobile Hackathon as well — as long as you, or your agent, produces a mobile app that meets our requirements.
        </p>
        <span className="colosseum-banner-cta">Learn More ↗</span>
      </a>
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
// Helpers
// ============================================================================

function renderContent(
  data: WindowContent,
  revealed: number,
  advance: () => void,
  initialTab?: string | null,
  activeSubTab?: string | null,
  setActiveSubTab?: (tab: string) => void,
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

// ============================================================================
// InfoWindow Component
// ============================================================================

export default function InfoWindow({ activeId, onTabChange, onClose, initialTab }: InfoWindowProps) {
  const data = CONTENT[activeId];
  const highlightRef = useRef<HTMLDivElement>(null);
  const prevIdRef = useRef(activeId);
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<string | null>(initialTab ?? null);
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 1000);
  }, []);

  // Reset sub-tab when switching panels
  useEffect(() => {
    setActiveSubTab(null);
  }, [activeId]);

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

  // Swipe between panels
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.t;
    touchStartRef.current = null;

    // Must be horizontal, fast enough, and long enough
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.7 || dt > 400) return;

    const ids = ORBITAL_ITEMS.map(i => i.id);
    const idx = ids.indexOf(activeId);
    if (dx < 0 && idx < ids.length - 1) {
      onTabChange(ids[idx + 1]);
    } else if (dx > 0 && idx > 0) {
      onTabChange(ids[idx - 1]);
    }
  }, [activeId, onTabChange]);

  // Comet tail on tab switch
  useEffect(() => {
    if (prevIdRef.current !== activeId && highlightRef.current) {
      prevIdRef.current = activeId;
      highlightRef.current.classList.add('moving');
      const t = setTimeout(() => highlightRef.current?.classList.remove('moving'), 450);
      return () => clearTimeout(t);
    }
  }, [activeId]);

  const { revealed, advance } = useSequentialReveal();

  if (!data) return null;

  return (
    <div
      className={`door-info-overlay${isScrolling ? ' is-scrolling' : ''}`}
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
          <button
            className="close_button"
            aria-label={copied ? 'Copied' : 'Copy link'}
            onClick={() => {
              const params = new URLSearchParams();
              params.set('panel', activeId);
              if (activeSubTab) params.set('tab', activeSubTab);
              const url = `${window.location.origin}${window.location.pathname}?${params}`;
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <CopiedIcon size={20} /> : <CopyIcon size={20} />}
            <span className="close-button-tooltip">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
          <button className="close_button" onClick={onClose} aria-label="Close">
            <CloseIcon size={20} />
            <span className="close-button-tooltip">Close</span>
          </button>
        </div>
      </div>

      <div className="app_contents" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onScroll={handleScroll}>
        {renderContent(data, revealed, advance, initialTab, activeSubTab, setActiveSubTab)}
      </div>

      {/* Persistent CTA footer */}
      <div className="taskbar_wrap taskbar_wrap--bottom">
        <a
          href="https://discord.gg/radiants"
          target="_blank"
          rel="noopener noreferrer"
          className="close_button close_button--amber"
          aria-label="Discord"
          style={{ textDecoration: 'none' }}
        >
          <DiscordIcon size={20} />
          <span className="close-button-tooltip">Discord</span>
        </a>
        <a
          href="https://x.com/RadiantsDAO"
          target="_blank"
          rel="noopener noreferrer"
          className="close_button close_button--amber"
          aria-label="Twitter"
          style={{ textDecoration: 'none' }}
        >
          <TwitterIcon size={20} />
          <span className="close-button-tooltip">Twitter</span>
        </a>
        <a
          href="https://align.nexus/organizations/8b216ce8-dd0e-4f96-85a1-0d95ba3022e2/hackathons/6unDGXkWmY1Yw99SsKMt6pPCQTpSSQh5kSiJRgqTwHXE"
          target="_blank"
          rel="noopener noreferrer"
          className="modal-cta-button modal-cta-magma"
          title="Register"
          style={{ textDecoration: 'none' }}
        >
          Register
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 127 2" fill="currentColor" className="svg-line">
            <rect y="0.5" width="127" height="1" fill="currentColor" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 8 10" fill="currentColor" className="icon-arrow">
            <path d="M0 5H1.00535V5.75536H0V5ZM1.00535 4.24465H2.0107V5H1.00535V4.24465ZM1.00535 5H2.0107V5.75536H1.00535V5ZM1.00535 8.00536H2.0107V8.74465H1.00535V8.00536ZM1.00535 8.74465H2.0107V9.5H1.00535V8.74465ZM2.0107 3.50536H2.99465V4.24465H2.0107V3.50536ZM2.0107 4.24465H2.99465V5H2.0107V4.24465ZM2.0107 5H2.99465V5.75536H2.0107V5ZM2.0107 6.49465H2.99465V7.25H2.0107V6.49465ZM2.0107 7.25H2.99465V8.00536H2.0107V7.25ZM2.0107 8.00536H2.99465V8.74465H2.0107V8.00536ZM2.99465 2.75H4V3.50536H2.99465V2.75ZM2.99465 3.50536H4V4.24465H2.99465V3.50536ZM2.99465 4.24465H4V5H2.99465V4.24465ZM2.99465 5H4V5.75536H2.99465V5ZM2.99465 5.75536H4V6.49465H2.99465V5.75536ZM2.99465 6.49465H4V7.25H2.99465V6.49465ZM2.99465 7.25H4V8.00536H2.99465V7.25ZM4 1.99465H5.00535V2.75H4V1.99465ZM4 2.75H5.00535V3.50536H4V2.75ZM4 3.50536H5.00535V4.24465H4V3.50536ZM4 4.24465H5.00535V5H4V4.24465ZM4 5H5.00535V5.75536H4V5ZM4 5.75536H5.00535V6.49465H4V5.75536ZM4 6.49465H5.00535V7.25H4V6.49465ZM5.00535 1.25536H5.9893V1.99465H5.00535V1.25536ZM5.00535 1.99465H5.9893V2.75H5.00535V1.99465ZM5.00535 2.75H5.9893V3.50536H5.00535V2.75ZM5.00535 4.24465H5.9893V5H5.00535V4.24465ZM5.00535 5H5.9893V5.75536H5.00535V5ZM5.00535 5.75536H5.9893V6.49465H5.00535V5.75536ZM5.9893 0.5H6.99465V1.25536H5.9893V0.5ZM5.9893 1.25536H6.99465V1.99465H5.9893V1.25536ZM5.9893 4.24465H6.99465V5H5.9893V4.24465ZM5.9893 5H6.99465V5.75536H5.9893V5ZM6.99465 4.24465H8V5H6.99465V4.24465Z" />
          </svg>
        </a>
      </div>

      {/* Tab strip — vertical icon bar on right edge */}
      <div className="modal-tab-strip">
        <div
          ref={highlightRef}
          className="tab-highlight"
          style={{
            '--icon-glow': ORBITAL_ITEMS.find(i => i.id === activeId)?.glowColor,
            positionAnchor: `--tab-${ORBITAL_ITEMS.findIndex(i => i.id === activeId)}`,
          } as React.CSSProperties}
        />
        {ORBITAL_ITEMS.map((item, i) => (
          <button
            key={item.id}
            className={`modal-tab-icon${activeId === item.id ? ' modal-tab-icon--active' : ''}`}
            style={{ '--icon-glow': item.glowColor, anchorName: `--tab-${i}` } as React.CSSProperties}
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
