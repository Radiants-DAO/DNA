'use client';

import React from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface DashboardCardProps {
  name: string;
  url: string;
  author: string;
  description: string;
  isLayer33?: boolean;
  categories: string[];
}

export function DashboardCard({ 
  name, 
  url, 
  author, 
  description, 
  categories 
}: DashboardCardProps) {
  const twitterHandle = author.replace('@', '');
  const twitterUrl = `https://x.com/${twitterHandle}`;
  const hasTwitterHandle = author.startsWith('@');

  const displayUrl = url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

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

  const handleCardClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      onClick={handleCardClick}
      className="block h-full cursor-pointer"
    >
      <Card 
        variant="default" 
        className="h-full flex flex-col group cursor-pointer"
        disableHover={false}
      >
        <CardHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold uppercase mb-1">
                {name}
              </h3>
              <p className="text-xs font-space-mono text-neutral-neutral-3 truncate">
                {displayUrl}
              </p>
            </div>
          </div>
          <div className="mt-2">
            {hasTwitterHandle ? (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
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
        </CardHeader>
        <CardBody className="flex-1 flex flex-col">
          <p className="text-sm text-black leading-relaxed mb-3 flex-1">
            {description}
          </p>
          <div className="flex flex-wrap gap-2 mt-auto">
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
        </CardBody>
      </Card>
    </div>
  );
}
