'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Divider } from '@/components/ui/Divider';

interface DashboardListItemProps {
  name: string;
  url: string;
  author: string;
  description: string;
  isLayer33?: boolean;
  categories: string[];
}

export function DashboardListItem({ 
  name, 
  url, 
  author, 
  categories 
}: DashboardListItemProps) {
  const twitterHandle = author.replace('@', '');
  const twitterUrl = `https://x.com/${twitterHandle}`;
  const hasTwitterHandle = author.startsWith('@');

  const getCategoryBadgeVariant = (category: string): 'info' | 'success' | 'default' => {
    switch (category) {
      case 'network':
        return 'info'; // blue
      case 'revenue':
        return 'success'; // green
      case 'governance':
        return 'default'; // will be styled with purple
      default:
        return 'default';
    }
  };

  const getCategoryClassName = (category: string): string => {
    if (category === 'governance') {
      return 'bg-purple text-black border border-black';
    }
    return '';
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 p-4 border border-black bg-white hover:bg-neutral-neutral-1 transition-all cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h3 className="font-bold text-base uppercase group-hover:text-green transition-colors">
            {name}
          </h3>
          {categories.map((category) => {
            const variant = getCategoryBadgeVariant(category);
            const customClass = getCategoryClassName(category);
            
            return (
              <Badge
                key={category}
                variant={variant}
                size="sm"
                className={customClass}
              >
                {category}
              </Badge>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {hasTwitterHandle ? (
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(twitterUrl, '_blank');
              }}
              className="text-xs font-space-mono text-neutral-neutral-4 hover:text-black transition-colors uppercase"
            >
              {author}
            </a>
          ) : (
            <p className="text-xs font-space-mono text-neutral-neutral-4 uppercase">
              {author}
            </p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        <svg 
          width="18" 
          height="15" 
          viewBox="0 0 18 15" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-black group-hover:text-green transition-colors"
        >
          <path 
            d="M1 7.5H17M17 7.5L11 1.5M17 7.5L11 13.5" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </a>
  );
}
