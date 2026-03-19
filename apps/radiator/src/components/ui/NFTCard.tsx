'use client';

import { Button } from '@rdna/radiants/components/core';

interface NFTCardProps {
  name: string;
  image: string;
  selected?: boolean;
  burned?: boolean;
  onClick?: () => void;
}

export function NFTCard({ name, image, selected, burned, onClick }: NFTCardProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={burned}
      className={`
        border pixel-rounded-sm overflow-hidden text-left
        transition-shadow duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1
        ${burned
          ? 'border-rule opacity-40 cursor-not-allowed grayscale'
          : selected
            ? 'border-focus shadow-glow-success cursor-pointer'
            : 'border-line cursor-pointer hover:shadow-lifted'
        }
      `}
    >
      <div className="relative aspect-square overflow-hidden bg-depth">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        {burned && (
          <div className="absolute inset-0 flex items-center justify-center bg-page/60">
            <span className="font-joystix text-xs uppercase text-mute">Burned</span>
          </div>
        )}
      </div>
      <div className="p-2">
        <span className="font-joystix text-xs uppercase text-head line-clamp-1">
          {name}
        </span>
      </div>
    </Button>
  );
}
