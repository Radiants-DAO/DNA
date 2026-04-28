'use client';

import { AppWindow, Badge, Button } from '@rdna/radiants/components/core';
import { useWindowManager } from '@/hooks/useWindowManager';
import { type AppProps } from '@/lib/apps';

const TABS = [
  { id: 'winners', label: 'Winners' },
  { id: 'submissions', label: 'Submissions' },
  { id: 'archive', label: 'Archive' },
] as const;

const WINNERS = [
  {
    title: 'Grand Prize',
    project: 'Winner reveal queue',
    note: 'Replace this placeholder with the official announcement copy and winning team profile.',
  },
  {
    title: 'Best UX',
    project: 'Submission spotlight',
    note: 'Designed for a short write-up, screenshot, and outbound link.',
  },
  {
    title: 'X-Factor',
    project: 'Judges pick',
    note: 'A flexible card for memorable projects that need more context than a list row.',
  },
];

const SUBMISSIONS = [
  'Seeker-native app submissions',
  'Demo links and repo links',
  'Track and prize metadata',
  'Judging notes or public blurbs',
];

function PanelHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <header className="space-y-3">
      <Badge variant="info" size="sm">{eyebrow}</Badge>
      <div>
        <h1 className="font-heading text-3xl text-head leading-tight tracking-normal">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl font-mondwest text-base text-mute">
          {copy}
        </p>
      </div>
    </header>
  );
}

function WinnersPanel() {
  return (
    <section className="space-y-5">
      <PanelHeader
        eyebrow="MONOLITH RESULTS"
        title="Hackathon.EXE"
        copy="Campaign launch surface for winners, submissions, and the permanent Monolith archive inside RadOS."
      />
      <div className="grid gap-4 @md:grid-cols-3">
        {WINNERS.map((winner) => (
          <article
            key={winner.title}
            className="pixel-rounded-6 bg-card p-4 pixel-shadow-floating"
          >
            <p className="font-mono text-xs uppercase text-accent">{winner.title}</p>
            <h2 className="mt-3 font-heading text-xl text-head">{winner.project}</h2>
            <p className="mt-2 font-mondwest text-sm text-mute">{winner.note}</p>
          </article>
        ))}
      </div>
      <div className="pixel-rounded-6 bg-depth p-4">
        <p className="font-mono text-sm uppercase text-accent">Launch behavior</p>
        <p className="mt-2 font-mondwest text-sm text-main">
          Visiting <span className="font-mono text-accent">#monolith</span> switches the whole
          OS to the MONOLITH theme and opens this results view.
        </p>
      </div>
    </section>
  );
}

function SubmissionsPanel() {
  return (
    <section className="space-y-5">
      <PanelHeader
        eyebrow="SUBMISSION INDEX"
        title="Projects to wire in"
        copy="This MVP reserves the first-class RadOS app surface. The next pass should connect final content, media, and links."
      />
      <div className="grid gap-3 @sm:grid-cols-2">
        {SUBMISSIONS.map((item) => (
          <div key={item} className="pixel-rounded-6 bg-card p-4">
            <p className="font-mono text-sm uppercase text-main">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ArchivePanel() {
  return (
    <section className="space-y-5">
      <PanelHeader
        eyebrow="ARCHIVE"
        title="Migration candidates"
        copy="Calendar, countdown, badges, cards, and CRT panels from the old Monolith app should be audited for shared RDNA promotion."
      />
      <div className="space-y-3 font-mondwest text-sm text-main">
        <p>
          Keep hackathon-specific content here. Promote reusable primitives to Radiants/DNA only
          when they can be tokenized and restyled across themes.
        </p>
        <p>
          The original Monolith app remains the content and asset reference, not the runtime base.
        </p>
      </div>
    </section>
  );
}

export default function HackathonExeApp({ windowId }: AppProps) {
  const { getActiveTab, setActiveTab } = useWindowManager();
  const activeTab = getActiveTab(windowId) ?? 'winners';

  return (
    <AppWindow.Content
      layout="single"
      className="monolith-campaign-surface monolith-scanline monolith-boot h-full min-h-0 overflow-auto bg-page p-4 text-main"
    >
      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col gap-5">
        <nav className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              size="sm"
              mode={activeTab === tab.id ? 'solid' : 'flat'}
              tone={activeTab === tab.id ? 'accent' : 'cream'}
              onClick={() => setActiveTab(windowId, tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </nav>
        {activeTab === 'submissions' ? <SubmissionsPanel /> : null}
        {activeTab === 'archive' ? <ArchivePanel /> : null}
        {activeTab !== 'submissions' && activeTab !== 'archive' ? <WinnersPanel /> : null}
      </div>
    </AppWindow.Content>
  );
}
