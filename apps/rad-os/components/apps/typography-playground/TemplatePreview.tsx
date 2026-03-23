'use client';

import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { type FontEntry, type TemplateId } from './typography-data';

// -- Shared props for all templates --
interface TemplateProps {
  font: FontEntry;
  style: React.CSSProperties;
}

// ================================================================
// DraggableText wrapper
// Handles nodeRef for React 19, contentEditable, and cursor styling.
// ================================================================

function DraggableText({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Draggable bounds="parent" nodeRef={ref}>
      <div
        ref={ref}
        className={`cursor-move outline-none ${className}`}
        style={style}
        contentEditable
        suppressContentEditableWarning
      >
        {children}
      </div>
    </Draggable>
  );
}

// ================================================================
// TEMPLATES
// ================================================================

/** Display -- accent bg, huge headline, wordmark, commentary */
function Display({ font, style }: TemplateProps) {
  const heroSize = Math.max(parseInt(String(style.fontSize)) * 2.5, 48);
  return (
    <div className="relative w-full h-full bg-accent text-main overflow-hidden">
      <DraggableText
        className={`absolute top-[15%] left-[8%] w-[84%] ${font.className} leading-none`}
        style={{ ...style, fontSize: `${heroSize}px` }}
      >
        Ayyooooo
      </DraggableText>
      <div className="absolute bottom-[18%] left-[8%] font-joystix text-xs uppercase tracking-tight text-main/60">
        Radiants Type System
      </div>
      <DraggableText
        className={`absolute bottom-[8%] right-[8%] w-[50%] ${font.className} text-sm text-main/70`}
      >
        Three fonts. One system. Endless combinations.
      </DraggableText>
    </div>
  );
}

/** Statement -- inv bg, centered headline */
function Statement({ font, style }: TemplateProps) {
  const heroSize = Math.max(parseInt(String(style.fontSize)) * 2, 36);
  return (
    <div className="relative w-full h-full bg-inv text-flip">
      <DraggableText
        className={`absolute inset-[8%] flex items-center justify-center ${font.className} leading-tight`}
        style={{ ...style, fontSize: `${heroSize}px` }}
      >
        TYPE IS THE VOICE OF THE PAGE
      </DraggableText>
    </div>
  );
}

/** Document -- inv bg, title + body + list */
function Document({ font, style }: TemplateProps) {
  return (
    <div className="relative w-full h-full bg-inv text-flip p-[8%]">
      <DraggableText className={`${font.className} text-xl font-bold mb-4`}>
        The Rad Public License
      </DraggableText>
      <DraggableText className={`${font.className} mb-4`} style={style}>
        Permission is hereby granted, free of charge, to any person obtaining a
        copy of this typeface and associated documentation files.
      </DraggableText>
      <div
        className={`${font.className} space-y-1`}
        style={{ fontSize: style.fontSize, lineHeight: style.lineHeight }}
      >
        <div className="flex gap-3">
          <span className="text-flip/40 shrink-0">01</span>
          <span>You may use, copy, and distribute</span>
        </div>
        <div className="flex gap-3">
          <span className="text-flip/40 shrink-0">02</span>
          <span>You may modify and create derivatives</span>
        </div>
        <div className="flex gap-3">
          <span className="text-flip/40 shrink-0">03</span>
          <span>Attribution is appreciated, not required</span>
        </div>
      </div>
    </div>
  );
}

/** Dictionary -- inv bg, word + pronunciation + definition */
function Dictionary({ font, style }: TemplateProps) {
  const wordSize = Math.max(parseInt(String(style.fontSize)) * 1.8, 28);
  return (
    <div className="relative w-full h-full bg-inv text-flip p-[8%]">
      <DraggableText
        className={`${font.className} font-bold mb-1`}
        style={{ ...style, fontSize: `${wordSize}px` }}
      >
        rad-i-ant
      </DraggableText>
      <div className={`${font.className} text-sm text-flip/50 mb-4`}>
        /ˈreɪ.di.ənt/ &middot; adjective
      </div>
      <DraggableText className={`${font.className} mb-4`} style={style}>
        Sending out light; shining or glowing brightly. Clearly emanating great
        joy, love, or health.
      </DraggableText>
      <div
        className={`${font.className} text-sm text-flip/60 italic border-l-2 border-flip/20 pl-3`}
      >
        &ldquo;The radiant glow of the pixel grid illuminated the
        workspace.&rdquo;
      </div>
    </div>
  );
}

/** Quote -- inv bg, large quote + attribution */
function Quote({ font, style }: TemplateProps) {
  return (
    <div className="relative w-full h-full bg-inv text-flip p-[8%] flex flex-col justify-center">
      <div className="font-joystix text-[80px] text-flip/10 leading-none mb-2">
        &ldquo;
      </div>
      <DraggableText className={`${font.className} mb-6`} style={style}>
        Typography is the craft of endowing human language with a durable visual
        form.
      </DraggableText>
      <div className="font-joystix text-xs text-flip/40 uppercase tracking-tight">
        &mdash; Robert Bringhurst
      </div>
    </div>
  );
}

/** Poster -- inv bg, mixed display type */
function Poster({ font, style }: TemplateProps) {
  const heroSize = Math.max(parseInt(String(style.fontSize)) * 2, 40);
  return (
    <div className="relative w-full h-full bg-inv text-flip overflow-hidden">
      <DraggableText
        className="absolute top-[8%] left-[8%] w-[84%] font-joystix leading-none"
        style={{ ...style, fontSize: `${heroSize}px` }}
      >
        PIXEL
      </DraggableText>
      <DraggableText
        className={`absolute top-[40%] left-[8%] w-[84%] ${font.className}`}
        style={style}
      >
        Perfect is the enemy of shipped. Every pixel tells a story.
      </DraggableText>
      <div className="absolute bottom-[8%] left-[8%] font-joystix text-xs uppercase tracking-tight text-flip/30">
        Radiants Design System / 2026
      </div>
      <div className="absolute bottom-[6%] right-[8%] w-[30%] h-px bg-accent/40" />
    </div>
  );
}

// ================================================================
// DISPATCHER
// ================================================================

const TEMPLATE_COMPONENTS: Record<TemplateId, React.FC<TemplateProps>> = {
  display: Display,
  statement: Statement,
  document: Document,
  dictionary: Dictionary,
  quote: Quote,
  poster: Poster,
};

interface TemplatePreviewProps {
  templateId: TemplateId;
  font: FontEntry;
  style: React.CSSProperties;
}

export function TemplatePreview({
  templateId,
  font,
  style,
}: TemplatePreviewProps) {
  const Component = TEMPLATE_COMPONENTS[templateId];
  return <Component font={font} style={style} />;
}
