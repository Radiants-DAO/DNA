'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MenuButton } from '@/components/ui/MenuButton';
import { Logo } from '@/components/icons';
import { useScrollHide } from '@/hooks/useScrollHide';

export interface MenuItem {
  /** Main title of the menu item */
  title: string;
  /** Optional subtitle/category */
  subtitle?: string;
  /** Link URL */
  href: string;
  /** Button text (defaults to "Get started") */
  buttonText?: string;
  /** Optional icon name for the button */
  iconName?: string;
  /** Card variant (defaults to "default") */
  variant?: 'default' | 'dark' | 'grey';
}

interface MobileNavProps {
  /** Array of menu items to display */
  menuItems: MenuItem[];
}

export function MobileNav({ menuItems }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { translateY, opacity } = useScrollHide({ threshold: 100 });

  useEffect(() => {
    // Prevent body scroll when menu is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    // Close menu on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Calculate stagger delays for menu items (200ms, 300ms, 400ms, etc.)
  const getStaggerDelay = (index: number) => {
    return `${(index + 2) * 100}ms`;
  };

  return (
    <div className="mobile-nav flex">
      {/* Mobile Nav Header - Fixed container with scroll hide animation */}
      <header 
        className={`fixed top-4 left-4 right-4 sm:left-6 sm:right-6 md:left-10 md:right-10 z-[99] flex items-center justify-between transition-all duration-150 ease-out pointer-events-none ${
          isOpen ? 'text-black' : 'text-white mix-blend-difference'
        }`}
        style={{
          transform: `translateY(${translateY}%)`,
          opacity: opacity,
        }}
      >
        {/* Left slot - Logomark */}
        <div className="flex-shrink-0 pointer-events-auto">
          <Link href="/" aria-label="Go to home page" className="transition-opacity duration-150 ease-out opacity-100 hover:opacity-70">
            <Logo variant="logomark" height="1.25rem" className={isOpen ? 'text-black' : 'text-white'} useBlendMode={!isOpen} aria-label="Layer33 logo" />
          </Link>
        </div>
        
        {/* Center slot - Wordmark (absolute for true centering) */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
          <Link href="/" aria-label="Go to home page" className="transition-opacity duration-150 ease-out opacity-100 hover:opacity-70">
            <Logo variant="wordmark" height="1.6rem" className={isOpen ? 'text-black' : 'text-white'} useBlendMode={!isOpen} aria-label="Layer33" />
          </Link>
        </div>
        
        {/* Right slot - Menu Button */}
        <div className="flex-shrink-0 pointer-events-auto">
          <MenuButton isOpen={isOpen} onClick={toggleMenu} onClose={closeMenu} useBlendMode={!isOpen} />
        </div>
      </header>

      {/* Scrim layer - smooth fade provides visual continuity */}
      <div 
        className={`fixed inset-0 z-[93] bg-black/30 transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
        onClick={closeMenu}
      />
      
      {/* Backdrop filter layer - delayed visibility so it appears after scrim starts fading */}
      <div 
        className={`fixed inset-0 z-[94] backdrop-blur-[2rem] backdrop-invert transition-opacity duration-200 ease-in ${
          isOpen ? 'opacity-100 delay-75 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ willChange: 'opacity' }}
        aria-hidden="true"
      />

      {/* Mobile Nav Overlay - Content layer separated from backdrop filters */}
      <nav 
        className={`fixed inset-0 z-[95] text-white flex flex-col justify-center items-center w-full h-full overflow-hidden transition-all duration-500 ease-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
        aria-label="Mobile navigation menu"
      >
        {/* Menu content - animates in from top */}
        <div 
          className={`flex justify-center items-center w-full absolute inset-0 overflow-auto py-20 px-4 md:py-[14vh] md:px-10 transition-all duration-500 ease-out ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
          }`}
          onClick={(e) => {
            // Only stop propagation if clicking on the content area, not the backdrop
            if (e.target === e.currentTarget) {
              // Clicked on the backdrop area (padding/empty space), allow it to close
              return;
            }
            // Clicked on content, prevent closing
            e.stopPropagation();
          }}
        >
          <div className="w-full max-w-[90rem] mx-auto">
            {/* Menu grid - animates in from top with slight delay */}
            <div 
              className={`grid grid-cols-2 grid-rows-2 gap-4 transition-all duration-500 ease-out ${
                isOpen ? 'opacity-100 translate-y-0 delay-100' : 'opacity-0 -translate-y-[30px] delay-0'
              }`}
            >
              {/* Menu Items with Stagger Animation - slide in from top */}
              {menuItems.map((item, index) => (
                <Card
                  key={item.href}
                  variant={item.variant || 'default'}
                  disableHover={true}
                  className={`w-full mix-blend-difference flex flex-col gap-4 transition-all duration-500 ease-out ${
                    isOpen 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 -translate-y-5'
                  }`}
                  style={isOpen ? { transitionDelay: getStaggerDelay(index) } : { transitionDelay: '0ms' }}
                >
                  <div>
                    {item.subtitle && <small>{item.subtitle}</small>}
                    {item.subtitle && (
                      <div 
                        className={`mix-blend-difference w-full h-px my-4 ${
                          item.variant === 'dark' ? 'bg-black' : 'bg-white'
                        }`}
                      />
                    )}
                    <h3>{item.title}</h3>
                  </div>
                  <Button 
                    variant="primary" 
                    size="md" 
                    href={item.href}
                    iconName={item.iconName}
                    asLink={true}
                    onClick={() => {
                      // Close menu after navigation
                      closeMenu();
                    }}
                  >
                    {item.buttonText || 'Get started'}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
