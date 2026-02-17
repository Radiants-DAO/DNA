'use client';

import { CATEGORY_COLORS } from './content-renderers';
import { Tweet } from 'react-tweet';

const WORKSHOPS = [
  {
    date: 'Feb 3',
    label: 'Kickoff Workshop',
    category: 'vibecoding',
    description:
      'Mike from Solana Mobile walks you through everything you need to know, while KEMOS4BE kicks off an all-day vibecoding session.',
    broadcastUrl: 'https://x.com/i/broadcasts/1lPJqvvORYZxb',
    presentationUrl: 'https://docs.google.com/presentation/d/1f-VNMtBIfGZz2iCETL3ZU0dwZFHxJs4w9ABkWLltHU4/edit?usp=sharing',
  },
  {
    date: 'Feb 5',
    label: 'Devshop',
    category: 'devshop',
    description:
      'Hands-on technical workshops covering Solana Mobile Stack, MWA integration, and dApp Store publishing with Mike from Solana Mobile.',
    broadcastUrl: 'https://x.com/i/broadcasts/1RDxlAyqWBRKL',
    presentationUrl: 'https://docs.google.com/presentation/d/1qEQs8WePqbIcAOMlU_3B7Qp55jl8p_OfNkgysOHwe1w/edit?usp=sharing',
  },
  {
    date: 'Feb 10',
    label: 'Vibecoding',
    category: 'vibecoding',
    description:
      'Learn how to levelup your app dev process w/ Claude Code, hosted by KEMOS4BE.',
    broadcastUrl: 'https://x.com/i/broadcasts/1rmxPvymkEZGN',
    presentationUrl: 'https://docs.google.com/presentation/d/1DigNlZvNdnFrLeae1yb-BohR8Fny4sEyVDnERhE2vUY/edit?usp=sharing',
  },
  {
    date: 'Feb 12',
    label: 'Devshop',
    category: 'devshop',
    description:
      'Hands-on devshop with Mike from Solana Mobile. Includes "The Handoff is Dead" presentation.',
    broadcastUrl: 'https://x.com/i/broadcasts/1yoKMPyYDalxQ',
    tweetId: '2023832513047646229',
    presentationUrl: '/the-handoff-is-dead.html',
  },
];

function PlayIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d="M6,4H8V5H9V6H10V7H11V8H12V9H11V10H10V11H9V12H8V13H6V4Z" />
    </svg>
  );
}

function DocumentIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d="M3,2H9V6H13V14H3V2ZM5,5V6H8V5H5ZM5,7V8H11V7H5ZM5,9V10H11V9H5ZM5,11V12H11V11H5ZM10,2H11V3H12V4H13V5H10V2Z" />
    </svg>
  );
}

export default function WorkshopsContent() {
  return (
    <div className="p-[1em] flex flex-col gap-[1em]">
      <div className="evaluation-heading" style={{ marginBottom: 0 }}>
        Workshop Replays
      </div>

      {WORKSHOPS.map((ws, i) => (
        <div key={i} className="workshop-card">
          <div className="workshop-card-header">
            <span
              className="cal-dot"
              style={{ background: CATEGORY_COLORS[ws.category] || '#b494f7' }}
            />
            <span className="resource-link">{ws.label}</span>
            <span className="panel-muted" style={{ marginLeft: 'auto' }}>
              {ws.date}
            </span>
          </div>
          {ws.description && (
            <p className="resource-description">{ws.description}</p>
          )}
          <div className="workshop-card-links">
            {ws.broadcastUrl && (
              <a
                href={ws.broadcastUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cal-event-link"
              >
                <PlayIcon size={10} /> Watch
              </a>
            )}
            {ws.presentationUrl && (
              <a
                href={ws.presentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cal-event-link"
              >
                <DocumentIcon size={10} /> Slides
              </a>
            )}
          </div>
        </div>
      ))}

      {/* Tweet embed for the Feb 12 devshop */}
      <div className="evaluation-heading evaluation-heading--divider" style={{ marginTop: '0.5em' }}>
        Featured
      </div>
      <div data-theme="dark" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <Tweet id="2023832513047646229" />
      </div>
    </div>
  );
}
