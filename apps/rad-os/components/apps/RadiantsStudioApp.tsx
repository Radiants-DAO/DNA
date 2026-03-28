'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Switch, Tabs, useTabsState } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import {
  mockSubmissions,
  formatCreatedAt,
} from '@/lib/mockData/studioSubmissions';
import { useMockDataStore } from '@/store';
import { type AppProps } from '@/lib/apps';

// ============================================================================
// Constants
// ============================================================================

const CANVAS_SIZE = 32;
const PIXEL_SIZE = 10; // Each pixel rendered at 10x10 for visibility
const STUDIO_TAB_BAR_OFFSET = 56;
const COLORS = {
  cream: '#FEF8E2',
  yellow: '#FCE184',
  ink: '#0F0E0C',
} as const;

type ColorKey = keyof typeof COLORS;
type Tool = 'pencil' | 'fill';

// ============================================================================
// Tool Button Component
// ============================================================================

interface ToolButtonProps {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

function ToolButton({ active = false, onClick, children, className = '' }: ToolButtonProps) {
  return (
    <Button
      quiet
      size="sm"
      onClick={onClick}
      className={`
        size-8
        flex items-center justify-center
        font-joystix text-sm text-main
        bg-page pixel-rounded-sm
        hover:bg-hover
        ${active ? 'bg-accent' : ''}
        ${className}
      `}
    >
      {children}
    </Button>
  );
}

// ============================================================================
// Color Swatch Component
// ============================================================================

interface ColorSwatchProps {
  color: string;
  active: boolean;
  onClick: () => void;
}

function ColorSwatch({ color, active, onClick }: ColorSwatchProps) {
  return (
    <Button
      quiet
      size="sm"
      onClick={onClick}
      className={`
        size-8
        pixel-rounded-sm
        transition-transform
        ${active ? 'ring-2 ring-line ring-offset-1' : ''}
      `}
      style={{ backgroundColor: color }}
    />
  );
}

// ============================================================================
// Action Button Component
// ============================================================================

interface ActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
  className?: string;
}

function ActionButton({ onClick, icon, children, primary = false, className = '' }: ActionButtonProps) {
  return (
    <Button
      quiet={!primary}
      size="sm"
      onClick={onClick}
      className={`
        h-9 px-2
        flex items-center gap-1.5
        font-joystix text-sm text-main
        pixel-rounded-sm
        ${primary ? 'bg-accent' : 'bg-page hover:bg-hover'}
        ${className}
      `}
    >
      {icon}
      {children}
    </Button>
  );
}

// ============================================================================
// Pixel Art Creation Tab
// ============================================================================

function PixelArtCreation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pixels, setPixels] = useState<ColorKey[][]>(() =>
    Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE).fill('cream'))
  );
  const [currentColor, setCurrentColor] = useState<ColorKey>('ink');
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Render canvas whenever pixels change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw pixels
    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        ctx.fillStyle = COLORS[pixels[y][x]];
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }

    // Draw grid lines if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= CANVAS_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * PIXEL_SIZE, 0);
        ctx.lineTo(i * PIXEL_SIZE, CANVAS_SIZE * PIXEL_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * PIXEL_SIZE);
        ctx.lineTo(CANVAS_SIZE * PIXEL_SIZE, i * PIXEL_SIZE);
        ctx.stroke();
      }
    }
  }, [pixels, showGrid]);

  const getPixelCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) * scaleY / PIXEL_SIZE);
    if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return null;
    return { x, y };
  }, []);

  const fillBucket = useCallback((startX: number, startY: number, newColor: ColorKey) => {
    const targetColor = pixels[startY][startX];
    if (targetColor === newColor) return;

    const newPixels = pixels.map(row => [...row]);
    const stack: [number, number][] = [[startX, startY]];

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) continue;
      if (newPixels[y][x] !== targetColor) continue;

      newPixels[y][x] = newColor;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    setPixels(newPixels);
  }, [pixels]);

  const handlePixelAction = useCallback((x: number, y: number) => {
    if (currentTool === 'pencil') {
      setPixels(prev => {
        const next = prev.map(row => [...row]);
        next[y][x] = currentColor;
        return next;
      });
    } else if (currentTool === 'fill') {
      fillBucket(x, y, currentColor);
    }
  }, [currentTool, currentColor, fillBucket]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    handlePixelAction(coords.x, coords.y);
  }, [getPixelCoords, handlePixelAction]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getPixelCoords(e);
    if (!coords) return;
    if (currentTool === 'pencil') {
      handlePixelAction(coords.x, coords.y);
    }
  }, [isDrawing, getPixelCoords, currentTool, handlePixelAction]);

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    setPixels(Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE).fill('cream')));
  }, []);

  const mirrorHorizontal = useCallback(() => {
    setPixels(prev => prev.map(row => [...row].reverse()));
  }, []);

  const flipVertical = useCallback(() => {
    setPixels(prev => [...prev].reverse());
  }, []);

  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a clean export canvas without grid
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_SIZE;
    exportCanvas.height = CANVAS_SIZE;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        ctx.fillStyle = COLORS[pixels[y][x]];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const link = document.createElement('a');
    link.download = 'radiant-pixel-art.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }, [pixels]);

  return (
    <div className="flex flex-col gap-2 p-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between pr-10">
        <div className="flex items-center gap-3">
          <Switch
            checked={showGrid}
            onChange={setShowGrid}
            size="sm"
          />
          <span className="font-joystix text-sm text-main">SHOW GRID</span>
        </div>
        <div className="flex items-center gap-2">
          <Button quiet size="sm" iconOnly aria-label="Previous">
            <Icon name="chevron-left" size={24} />
          </Button>
          <Button quiet size="sm" iconOnly aria-label="Next">
            <Icon name="chevron-right" size={24} />
          </Button>
        </div>
      </div>

      {/* Canvas + Tools Row */}
      <div className="flex items-start justify-center gap-2">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE * PIXEL_SIZE}
          height={CANVAS_SIZE * PIXEL_SIZE}
          className="pixel-rounded-sm cursor-crosshair bg-accent"
          style={{ width: 350, height: 350, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* Tools Sidebar */}
        <div className="flex flex-col justify-between h-[350px]">
          {/* Top Tools */}
          <div className="flex flex-col gap-2">
            {/* Fill Bucket */}
            <ToolButton
              active={currentTool === 'fill'}
              onClick={() => setCurrentTool(currentTool === 'fill' ? 'pencil' : 'fill')}
            >
              <Icon name="fill-bucket" size={20} />
            </ToolButton>

            {/* Color Swatches */}
            <div className="flex flex-col gap-1">
              {(Object.keys(COLORS) as ColorKey[]).map((colorKey) => (
                <ColorSwatch
                  key={colorKey}
                  color={COLORS[colorKey]}
                  active={currentColor === colorKey}
                  onClick={() => setCurrentColor(colorKey)}
                />
              ))}
            </div>
          </div>

          {/* Bottom Tools */}
          <div className="flex flex-col gap-1">
            <ToolButton onClick={mirrorHorizontal}>M</ToolButton>
            <ToolButton onClick={flipVertical}>F</ToolButton>
            <ToolButton onClick={clearCanvas}>C</ToolButton>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-start justify-between pr-10">
        <div className="flex items-center gap-2">
          <ActionButton onClick={clearCanvas} icon={<Icon name="trash" size={20} />}>
            Clear
          </ActionButton>
          <ActionButton onClick={exportCanvas} icon={<Icon name="save" size={20} />}>
            Save
          </ActionButton>
        </div>
        <ActionButton onClick={() => {}} primary>
          NEXT
        </ActionButton>
      </div>
    </div>
  );
}

// ============================================================================
// Voting Tab
// ============================================================================

function VotingSystem() {
  const { studioSubmissions, updateSubmissionVotes } = useMockDataStore();
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  // Use store submissions or fall back to mock data
  const submissions = studioSubmissions.length > 0 ? studioSubmissions : mockSubmissions;

  // Derived state — first unvoted submission
  const currentSubmission = submissions.find(s => !votedIds.has(s.id)) ?? null;

  const handleVote = useCallback((isUpvote: boolean) => {
    if (!currentSubmission) return;

    const update = isUpvote
      ? { upvotes: currentSubmission.upvotes + 1 }
      : { downvotes: currentSubmission.downvotes + 1 };
    updateSubmissionVotes(currentSubmission.id, update);
    setVotedIds(prev => new Set([...prev, currentSubmission.id]));
  }, [currentSubmission, updateSubmissionVotes]);

  if (!currentSubmission) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
        <p>
          You&apos;ve voted on all submissions!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Submission Preview */}
      <div className="w-64 h-64 bg-accent pixel-rounded-sm">
        <img
          src={currentSubmission.image}
          alt={currentSubmission.name}
          className="w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Submission Info */}
      <div className="text-center">
        <h3 className="mb-1">
          {currentSubmission.name}
        </h3>
        <p>
          by {currentSubmission.creator} • {formatCreatedAt(currentSubmission.createdAt)}
        </p>
      </div>

      {/* Vote Buttons */}
      <div className="flex items-center gap-6">
        <Button
          quiet
          size="lg"
          onClick={() => handleVote(false)}
          className="size-16 flex items-center justify-center text-3xl bg-page pixel-rounded-sm hover:bg-hover"
        >
          👎
        </Button>
        <Button
          size="lg"
          onClick={() => handleVote(true)}
          className="size-16 flex items-center justify-center text-3xl bg-accent pixel-rounded-sm hover:brightness-105"
        >
          👍
        </Button>
      </div>

      <p>
        {submissions.length - votedIds.size} submissions remaining
      </p>
    </div>
  );
}

// ============================================================================
// Leaderboard Tab
// ============================================================================

function Leaderboard() {
  const { studioSubmissions } = useMockDataStore();
  const submissions = studioSubmissions.length > 0 ? studioSubmissions : mockSubmissions;
  const sortedByVotes = [...submissions].sort((a, b) => b.netVotes - a.netVotes);

  return (
    <div className="flex flex-col gap-3 p-4">
      <h3>Top Submissions</h3>

      <div className="flex flex-col gap-2">
        {sortedByVotes.slice(0, 10).map((sub, index) => (
          <div
            key={sub.id}
            className="flex items-center gap-3 p-2 bg-page pixel-rounded-sm"
          >
            <span className="font-joystix text-sm text-mute w-6">
              #{index + 1}
            </span>
            <div className="w-10 h-10 bg-accent pixel-rounded-sm">
              <img
                src={sub.image}
                alt={sub.name}
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate">{sub.name}</p>
              <p>{sub.creator}</p>
            </div>
            <div className="text-right">
              <p>{sub.netVotes}</p>
              <p>votes</p>
            </div>
          </div>
        ))}

        {sortedByVotes.length === 0 && (
          <div className="text-center py-8">
            <p>No submissions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RadiantsStudioApp({ windowId: _windowId }: AppProps) {
  const tabs = useTabsState({ defaultValue: 'creation', mode: 'pill', layout: 'bottom-tabs' });

  const renderPanel = (value: string, children: React.ReactNode) => (
    <Tabs.Content value={value} className="mx-2">
      <div
        className="overflow-auto bg-card border border-line rounded"
        style={{ maxHeight: `calc(var(--app-content-max-height) - ${STUDIO_TAB_BAR_OFFSET}px)` }}
      >
        {children}
      </div>
    </Tabs.Content>
  );

  return (
    <div className="h-full flex flex-col bg-page pixel-rounded-sm">
      <Tabs.Provider state={tabs.state} actions={tabs.actions} meta={tabs.meta}>
        <Tabs.Frame className="h-full flex flex-col">
          {renderPanel('creation', <PixelArtCreation />)}
          {renderPanel('voting', <VotingSystem />)}
          {renderPanel('leaderboard', <Leaderboard />)}
          <Tabs.List className="mt-auto">
            <Tabs.Trigger value="creation">Creation</Tabs.Trigger>
            <Tabs.Trigger value="voting">Voting</Tabs.Trigger>
            <Tabs.Trigger value="leaderboard">Leaderboard</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Frame>
      </Tabs.Provider>
    </div>
  );
}

export default RadiantsStudioApp;
