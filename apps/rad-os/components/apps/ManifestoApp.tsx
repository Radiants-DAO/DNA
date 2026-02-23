'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WindowSidebar } from '@/components/Rad_os';
import { AppProps } from '@/lib/constants';

// ============================================================================
// Data
// ============================================================================

const SECTIONS = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: `Welcome to Radiants.

We are a collective of creators, builders, and dreamers united by a singular vision: to forge a new frontier of digital ownership and community-driven art.

In a world of fleeting attention and disposable content, we believe in the power of permanence. We believe that art should be more than pixels on a screen—it should be a living, breathing testament to the creativity of its makers and the passion of its collectors.`,
  },
  {
    id: 'vision',
    title: 'Our Vision',
    content: `We envision a world where digital art carries the weight and significance of its physical counterparts.

Where every piece tells a story not just of its creation, but of its journey—the hands it has passed through, the communities it has touched, the moments it has witnessed.

Radiants are not just NFTs. They are beacons of light in the digital cosmos, each one carrying within it the accumulated energy of every sacrifice made in its name.`,
  },
  {
    id: 'values',
    title: 'Core Values',
    content: `Permanence over ephemera.
Community over isolation.
Creation over consumption.
Quality over quantity.

We believe that true value is built through sacrifice and commitment. The Murder Tree stands as a monument to this belief—a living archive of offerings made by those who sought to claim a Radiant.

Each branch tells a story. Each leaf represents a choice. And at the heart of it all, the Radiant shines brighter with every contribution.`,
  },
  {
    id: 'community',
    title: 'Community',
    content: `We are more than holders. We are stewards.

Every Radiant owner becomes a curator of their own branch of the Murder Tree. They can commission art, accept tributes, and shape the legacy of their piece.

This is collaborative ownership—a model where the boundaries between creator and collector blur, where every participant becomes an active author in an ever-expanding narrative.

Join us. Become a Radiant.`,
  },
  {
    id: 'future',
    title: 'The Future',
    content: `This is only the beginning.

As our community grows, so too will the ecosystem around it. New tools for creation. New ways to collaborate. New branches on the Murder Tree waiting to be grown.

We don't know exactly what the future holds, but we know one thing for certain: it will be built by all of us, together.

The sun rises on a new era of digital ownership.
Welcome to Radiants.`,
  },
];

// ============================================================================
// Component
// ============================================================================

export function ManifestoApp({ windowId }: AppProps) {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Update active section based on scroll position
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      // Find which section is most visible
      let currentSection = SECTIONS[0].id;
      let maxVisibility = 0;

      SECTIONS.forEach((section) => {
        const element = sectionRefs.current[section.id];
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate how much of the section is visible
        const top = Math.max(rect.top, containerRect.top);
        const bottom = Math.min(rect.bottom, containerRect.bottom);
        const visibility = Math.max(0, bottom - top);

        if (visibility > maxVisibility) {
          maxVisibility = visibility;
          currentSection = section.id;
        }
      });

      setActiveSection(currentSection);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    const container = contentRef.current;

    if (element && container) {
      const offsetTop = element.offsetTop - 20;
      container.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  return (
    <WindowSidebar
      contentRef={contentRef}
      nav={
        <>
          <h2 className="font-joystix text-xs text-content-muted uppercase mb-4">
            Contents
          </h2>
          <ul className="space-y-1">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className={`
                    w-full text-left px-3 py-2 rounded-sm
                    font-mondwest text-sm
                    transition-colors
                    ${activeSection === section.id
                      ? 'bg-sun-yellow text-content-primary font-medium'
                      : 'text-content-muted hover:bg-surface-muted'
                    }
                  `}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </>
      }
    >
      <div className="max-w-[42rem] mx-auto">
        {SECTIONS.map((section, index) => (
          <section
            key={section.id}
            ref={(el) => { sectionRefs.current[section.id] = el; }}
            id={section.id}
            className={index < SECTIONS.length - 1 ? 'mb-12' : ''}
          >
            <h2 className="font-joystix text-lg text-content-primary mb-4">
              {section.title}
            </h2>
            <div className="font-mondwest text-base text-content-secondary leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </WindowSidebar>
  );
}

export default ManifestoApp;
