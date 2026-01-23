'use client';

import React from 'react';
import { Divider } from '@/components/ui/Divider';

// ============================================================================
// Types
// ============================================================================

interface FooterLink {
  label: string;
  href: string;
}

interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  /** Additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Footer - Shared site footer component
 * 
 * @example
 * <Footer />
 */
export function Footer({ className = '' }: FooterProps) {
  const linkGroups: FooterLinkGroup[] = [
    {
      title: 'Staking',
      links: [
        { label: 'IndieSOL', href: '/staking' },
        { label: 'ORE Rewards', href: '#' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Media kit', href: '/media' },
      ],
    },
    {
      title: 'help',
      links: [
        { label: 'faq', href: '/#faq' },
      ],
    },
  ];

  const socialLinks = [
    { icon: '/assets/icons/telegram.svg', alt: 'Telegram', href: '#' },
    { icon: '/assets/icons/discord.svg', alt: 'Discord', href: '#' },
    { icon: '/assets/icons/twitter.svg', alt: 'Twitter/X', href: '#' },
  ];

  return (
    <section className={`section-footer ${className}`.trim()}>
      <div className="page-padding">
        <div className="container-large">
          <div>
            <div className="footer">
              <img src="/assets/logos/logomark.svg" alt="Layer33" className="footer_logo w-full h-auto" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {linkGroups.map((group) => (
                  <div key={group.title} className="footer_links">
                    <div className="caption text-neutral-neutral-3 mb-2">{group.title}</div>
                    {group.links.map((link) => (
                      <a key={link.label} href={link.href} className="text-sm">
                        {link.label}
                      </a>
                    ))}
                  </div>
                ))}
                <div className="footer_links">
                  <div className="caption text-neutral-neutral-3 mb-2">Socials</div>
                  <div className="flex flex-row items-start gap-x-4 gap-y-4">
                    {socialLinks.map((social) => (
                      <a key={social.alt} href={social.href} className="inline-block">
                        <div className="flex relative inline-block">
                          <img src={social.icon} alt={social.alt} className="w-[1.25rem] h-auto" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Divider variant="mix-blend" className="mt-4" />
            <div className="flex flex-col md:flex-row items-start justify-between text-neutral-neutral-3 uppercase gap-2">
              <div>© Copyright 2025. layer33. All rights reserved.</div>
              <div className="flex flex-row items-start gap-x-2 gap-y-2">
                <div>Terms</div>
                <div>policy</div>
                <div>Contact</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Footer;
