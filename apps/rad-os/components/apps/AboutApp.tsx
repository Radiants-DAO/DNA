'use client';
import { Button, Card, Separator } from '@rdna/radiants/components/core';
import { WindowContent } from '@/components/Rad_os';
import { type AppProps } from '@/lib/apps';

// ============================================================================
// Data
// ============================================================================

const TEAM_MEMBERS = [
  { name: 'Founder', role: 'Vision & Strategy' },
  { name: 'Lead Developer', role: 'Smart Contracts & Infrastructure' },
  { name: 'Creative Director', role: 'Art Direction & Design' },
  { name: 'Community Lead', role: 'Discord & Social' },
];

const ACKNOWLEDGMENTS = [
  'The Radiants community for their unwavering support',
  'Early believers who helped shape our vision',
  'Artists who contributed to the Murder Tree',
  'All the NFTs sacrificed in pursuit of Radiants',
];

const OPEN_SOURCE = [
  { name: 'Next.js', license: 'MIT', url: 'https://nextjs.org' },
  { name: 'React', license: 'MIT', url: 'https://react.dev' },
  { name: 'Tailwind CSS', license: 'MIT', url: 'https://tailwindcss.com' },
  { name: 'Zustand', license: 'MIT', url: 'https://zustand-demo.pmnd.rs' },
  { name: 'react-draggable', license: 'MIT', url: 'https://github.com/react-grid-layout/react-draggable' },
];

// ============================================================================
// Component
// ============================================================================

export function AboutApp({ windowId: _windowId }: AppProps) {
  return (
    <WindowContent>
      <div className="max-w-[42rem] mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="mb-2">RadOS</h1>
          <p>
            Version 1.0.0
          </p>
        </div>

        {/* Project Description */}
        <section>
          <h2 className="mb-3">About</h2>
          <Card className="p-4">
            <p>
              RadOS is the digital home of the Radiants ecosystem—a desktop-like
              web experience that brings together our community tools, creative
              platforms, and the legendary Murder Tree.
            </p>
            <p className="mt-3">
              Built with love and pixel-perfect attention to detail, RadOS embodies
              the retro-futuristic aesthetic that defines Radiants: where nostalgia
              meets innovation, and every interaction feels intentional.
            </p>
          </Card>
        </section>

        <Separator />

        {/* Team */}
        <section>
          <h2 className="mb-3">Team</h2>
          <Card className="p-4">
            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
              {TEAM_MEMBERS.map((member) => (
                <div key={member.name} className="flex flex-col">
                  <span className="font-joystix text-sm text-main">
                    {member.name}
                  </span>
                  <span className="font-mondwest text-sm text-mute">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Separator />

        {/* Acknowledgments */}
        <section>
          <h2 className="mb-3">Acknowledgments</h2>
          <Card className="p-4">
            <ul className="space-y-2">
              {ACKNOWLEDGMENTS.map((ack, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2"
                >
                  <span className="text-accent mt-1">*</span>
                  {ack}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <Separator />

        {/* Open Source */}
        <section>
          <h2 className="mb-3">Open Source</h2>
          <Card className="p-4">
            <p className="mb-4">
              RadOS is built on the shoulders of giants. Thank you to all the
              open source projects that make this possible:
            </p>
            <div className="space-y-2">
              {OPEN_SOURCE.map((lib) => (
                <div
                  key={lib.name}
                  className="flex items-center justify-between py-1"
                >
                  <Button
                    href={lib.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    mode="text"
                    size="sm"
                  >
                    {lib.name}
                  </Button>
                  <span className="font-mono text-sm text-mute">
                    {lib.license}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Separator />

        {/* Version Info */}
        <section className="text-center pb-8">
          <p>
            RadOS v1.0.0 | Built with Next.js 16 & React 19
          </p>
          <p className="mt-1">
            &copy; {new Date().getFullYear()} Radiants. All rights reserved.
          </p>
        </section>
      </div>
    </WindowContent>
  );
}

export default AboutApp;
