'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/icons';

export function PhoneStatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-8 px-5 flex items-center justify-between text-content-secondary shrink-0">
      {/* Left: time */}
      <span className="font-mono text-sm font-semibold">{time}</span>

      {/* Center: dynamic island pill */}
      <div className="w-20 h-5 bg-surface-muted rounded-full" />

      {/* Right: status icons */}
      <div className="flex items-center gap-1.5">
        <Icon name="wifi" size={12} />
        <Icon name="cell-bars" size={12} />
        <Icon name="battery-full" size={12} />
      </div>
    </div>
  );
}
