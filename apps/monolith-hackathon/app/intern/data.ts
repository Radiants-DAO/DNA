// app/intern/data.ts

// Re-export calendar events from InfoWindow for merging
export { CONTENT } from '../components/InfoWindow';

// ============================================================================
// Types
// ============================================================================

export type ContentStatus = 'SENT' | 'Scheduled' | 'Ready' | 'Waiting';

export type AssetStatus = 'pending' | 'in-progress' | 'pending-review' | 'approved';

export interface Asset {
  name: string;
  url?: string;
  status: AssetStatus;
}

export interface Question {
  q: string;
  answered: boolean;
  answer?: string;
}

export interface ContentPost {
  status: ContentStatus;
  time?: string;
  title: string;
  topic?: string;
  caption?: string;
  todos?: string[];
  notes?: string;
  assets?: Asset[];
}

export interface DayPlan {
  day: string;
  posts: ContentPost[];
  questions: Question[];
  links: { label: string; url: string }[];
}

// ============================================================================
// Status Colors (matches theme tokens)
// ============================================================================

export const STATUS_COLORS: Record<ContentStatus, string> = {
  SENT: '#14f1b2',      // --green
  Scheduled: '#fd8f3a', // --amber
  Ready: '#6939ca',     // --ultraviolet
  Waiting: '#0e151a',   // --slate (muted)
};

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  pending: '#0e151a',
  'in-progress': '#fd8f3a',
  'pending-review': '#6939ca',
  approved: '#14f1b2',
};

// ============================================================================
// Planning Data (keyed by date YYYY-MM-DD)
// ============================================================================

export const PLANNING_DATA: Record<string, DayPlan> = {
  '2026-02-03': {
    day: 'Tuesday',
    posts: [
      {
        status: 'SENT',
        time: '6 PM UTC',
        title: 'REMINDER: Hackathon kickoff event',
        topic: 'Kickoff reminder 30 min before',
        caption: 'REMINDER:\n\nThe hackathon kickoff event starts in 30 minutes!\n\n@somemobiledev will be giving you the full download of all important infos and we\'ll follow it up w/ some project scope planning w/ Claude Code & @KEMOS4BE.\n\nLink below',
      },
    ],
    questions: [],
    links: [{ label: 'Typefully', url: 'https://typefully.com' }],
  },
  '2026-02-04': {
    day: 'Wednesday',
    posts: [
      {
        status: 'SENT',
        time: '6 PM UTC',
        title: 'Lets cook, Devshop teaches us how!',
        topic: 'Remind people of day and time of Devshop on Thursday and what to expect',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-05': {
    day: 'Thursday',
    posts: [
      {
        status: 'Waiting',
        time: '4 PM UTC',
        title: 'DEVSHOP REMINDER',
        topic: 'DEVSHOP STARTING IN TWO HOURS!',
      },
      {
        status: 'Waiting',
        time: '6 PM UTC',
        title: 'Glory, money and more.',
        topic: 'What prizes are up for offer. Focus not only money but the support and go to market strategy.',
        caption: '$125k prizes, SKR tokens, Featured dApp store placement, A CALL WITH TOLY. OOMMGGGGG',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-06': {
    day: 'Friday',
    posts: [
      {
        status: 'Scheduled',
        time: '6 PM UTC',
        title: 'Its always more fun in a team',
        topic: 'Join discord to meet other builders, encourage teams to collaborate',
        caption: 'Have a dream, find a friend, build something they can\'t move. It all happens here https://discord.com/channels/1024891059135852604/1467511533377687673',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-08': {
    day: 'Sunday',
    posts: [
      {
        status: 'Waiting',
        title: 'If you seek answers, look no further.',
        topic: 'Guide to FAQ\'s for all silly questions that the public may have.',
        caption: 'The answers you seek, may be closer than one would expect. Look here https://solanamobile.radiant.nexus/?panel=faq',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-09': {
    day: 'Monday',
    posts: [
      {
        status: 'Waiting',
        title: 'A word from our creators',
        topic: 'A word from the team, maybe a quick edited video from Solana and Radiants about what this hackathon is about and what it means to us?',
        caption: 'Ever wondered how the Monolith came about? So did we, now we get to hear it from the creators themselves @kemo @ross @mike @akshay @magellan',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-10': {
    day: 'Tuesday',
    posts: [
      {
        status: 'Waiting',
        title: 'Meet the Judges',
        topic: 'Introducing the judges who they are and their titles. F1 animation idea where the Judges transition in and out with their names and small bio.',
        caption: 'Some old, some new. We keeping it fresh and fair.',
        todos: ['F1-style animation with judge transitions'],
        notes: 'Cronus - please cook this ser',
        assets: [{ name: 'Judge intro video', status: 'pending' }],
      },
      {
        status: 'Waiting',
        title: 'Never Forget',
        topic: 'Reminder Do\'s and don\'ts, important deadlines or dates',
        caption: 'These may or may not be incredibly important. Up to you.',
      },
    ],
    questions: [],
    links: [{ label: 'F1 Animation Reference', url: 'https://www.youtube.com/watch?v=7U_fFy9vOyY' }],
  },
  '2026-02-11': {
    day: 'Wednesday',
    posts: [
      {
        status: 'Waiting',
        title: 'Show us what you got!',
        topic: 'Bait engagement, Get contestants to show previews or submissions',
        caption: 'We have built Solitaire on Claude. What have you done?',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-12': {
    day: 'Thursday',
    posts: [
      {
        status: 'Waiting',
        title: 'You\'re being judged.',
        topic: 'Judging criteria What we looking for, dont forget about your presentation. Its easy to build, difficult to convey value',
        caption: 'What would Toly say?',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-13': {
    day: 'Friday',
    posts: [
      {
        status: 'Waiting',
        title: 'Update from the giant Stone',
        topic: 'Update on the hackathon, how many entries, countries submissions etc. Bonus prize SKR integration',
        caption: 'Numbers dont lie.',
        todos: ['Worldmap animation with stats'],
        notes: 'Cronus - please cook this ser',
      },
    ],
    questions: [
      { q: 'Can we get current submission stats for the post?', answered: false },
    ],
    links: [],
  },
};
