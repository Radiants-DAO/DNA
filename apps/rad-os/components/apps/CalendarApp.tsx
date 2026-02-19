'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@rdna/radiants/components/core';
import { Button } from '@/components/ui/Button';
import {
  mockEvents,
  eventTypeColors,
  eventTypeLabels,
  type CalendarEvent,
} from '@/lib/mockData/events';
import { AppProps } from '@/lib/constants';

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function isUpcoming(dateString: string): boolean {
  return new Date(dateString) > new Date();
}

// ============================================================================
// Sub-components
// ============================================================================

interface EventCardProps {
  event: CalendarEvent;
}

function EventCard({ event }: EventCardProps) {
  const upcoming = isUpcoming(event.date);

  return (
    <Card className={`transition-all hover:shadow-lg ${!upcoming ? 'opacity-60' : ''}`}>
      <CardBody className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <h3 className="font-joystix text-sm text-primary mb-1 leading-tight">
              {event.title}
            </h3>
            <p className="font-mondwest text-xs text-primary/70">
              {event.description}
            </p>
          </div>
          <Badge
            variant={
              event.type === 'auction'
                ? 'warning'
                : event.type === 'drop'
                ? 'info'
                : event.type === 'community'
                ? 'default'
                : 'success'
            }
            size="sm"
          >
            {eventTypeLabels[event.type]}
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary/10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-primary/80">
              {formatDate(event.date)}
            </span>
            <span className="text-primary/40">•</span>
            <span className="font-mono text-xs text-primary/60">
              {formatTime(event.date)}
            </span>
          </div>

          {event.link && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (event.link?.startsWith('#')) {
                  window.location.hash = event.link.substring(1);
                } else if (event.link) {
                  window.open(event.link, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              View →
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// Filter Buttons
// ============================================================================

type FilterType = 'all' | CalendarEvent['type'];

interface FilterButtonsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

function FilterButtons({ activeFilter, onFilterChange }: FilterButtonsProps) {
  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'auction', label: 'Auctions' },
    { value: 'drop', label: 'Drops' },
    { value: 'community', label: 'Community' },
    { value: 'announcement', label: 'News' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CalendarApp({ windowId }: AppProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredEvents = useMemo(() => {
    const sorted = [...mockEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (filter === 'all') {
      return sorted;
    }

    return sorted.filter((event) => event.type === filter);
  }, [filter]);

  const upcomingCount = filteredEvents.filter((e) => isUpcoming(e.date)).length;

  return (
    <div className="mx-2 h-full overflow-auto bg-white p-6 border border-black rounded-sm max-h-[var(--app-content-max-height)]">
      <div className="max-w-[42rem] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-joystix text-lg text-primary mb-1">Events</h1>
          <p className="font-mondwest text-sm text-primary/60">
            {upcomingCount} upcoming event{upcomingCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FilterButtons activeFilter={filter} onFilterChange={setFilter} />
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <Card>
              <CardBody className="p-8 text-center">
                <p className="font-mondwest text-primary/60">
                  No events found for this filter.
                </p>
              </CardBody>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarApp;
