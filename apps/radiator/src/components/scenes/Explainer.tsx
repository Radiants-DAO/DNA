'use client';

import { useState, useEffect } from 'react';
import { Button } from '@rdna/radiants/components/core';
import { useAppStore } from '@/store';
import { Icon } from '@rdna/radiants/icons';

const STORAGE_KEY = 'radiator-seen-explainer';

const slides = [
  {
    heading: 'What is the Radiator?',
    body: 'A nuclear forge for your NFT collection. Feed it your NFTs and watch something entirely new emerge from the atomic fire.',
  },
  {
    heading: 'How it Works',
    body: 'Select your NFTs. Feed them to the radiator. Each sacrifice fuels the reaction until the radiation reaches critical mass — and a 1/1 mutation is born.',
  },
  {
    heading: 'Your Collection. Concentrated.',
    body: 'Burn the many. Receive the one. Every radNFT is a unique mutation forged from the ashes of your collection.',
  },
] as const;

export function Explainer() {
  const setView = useAppStore((s) => s.setView);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Skip if already seen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen === 'true') {
        setView('landing');
      }
    }
  }, [setView]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentSlide((s) => s + 1);
        setAnimating(false);
      }, 150);
    }
  };

  const handleEnter = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setView('landing');
  };

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-8">
      {/* Slide content */}
      <div
        key={currentSlide}
        className={`flex flex-col items-center text-center gap-4 max-w-[32rem] ${animating ? 'opacity-0' : 'animate-fadeIn'}`}
      >
        <Icon name="electric" size={32} className="text-accent" />

        <h2 className="font-joystix text-xl uppercase text-head">
          {slide.heading}
        </h2>

        <p className="font-mondwest text-lg text-sub leading-relaxed">
          {slide.body}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {slides.map((_, i) => (
          <Button
            key={i}
            variant="ghost"
            size="sm"
            onClick={() => {
              setAnimating(true);
              setTimeout(() => {
                setCurrentSlide(i);
                setAnimating(false);
              }, 150);
            }}
            className={`w-2 h-2 rounded-full transition-colors duration-150 ease-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 ${
              i === currentSlide
                ? 'bg-accent'
                : 'bg-rule'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* CTA */}
      {isLast ? (
        <Button variant="solid" size="lg" onClick={handleEnter}>
          Enter the Radiator
        </Button>
      ) : (
        <Button
          variant="outline"
          size="md"
          onClick={handleNext}
          icon={<Icon name="go-forward" size={16} />}
        >
          Next
        </Button>
      )}

      {/* Skip link */}
      {!isLast && (
        <Button variant="ghost" size="sm" onClick={handleEnter}>
          Skip intro
        </Button>
      )}
    </div>
  );
}
