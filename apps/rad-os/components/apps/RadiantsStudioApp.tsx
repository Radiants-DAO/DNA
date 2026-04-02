'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppWindow, Button, Input, Switch, Tabs } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons/runtime';
import { mockSubmissions } from '@/lib/mockData/studioSubmissions';
import { useMockDataStore } from '@/store';
import { type AppProps } from '@/lib/apps';

// ============================================================================
// Constants
// ============================================================================

const CANVAS_SIZE = 32;
const PIXEL_SIZE = 10;
const COLORS = {
  cream: '#FEF8E2',
  yellow: '#FCE184',
  ink: '#0F0E0C',
} as const;

type ColorKey = keyof typeof COLORS;
type Tool = 'pencil' | 'fill';
type CreationStep = 'draw' | 'metadata' | 'confirmed';

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
  const [step, setStep] = useState<CreationStep>('draw');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        ctx.fillStyle = COLORS[pixels[y][x]];
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }

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

  const handleSubmit = useCallback(() => {
    setStep('confirmed');
    setName('');
    setDescription('');
  }, []);

  const handleContinue = useCallback(() => {
    setStep('draw');
    clearCanvas();
  }, [clearCanvas]);

  // ── Submission Confirmed ──────────────────────────────────────────────
  if (step === 'confirmed') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-6 bg-accent">
        <Icon name="checkmark" large />
        <div className="flex flex-col items-center gap-4 text-center">
          <h3 className="font-joystix text-lg">SUBMISSION CONFIRMED</h3>
          <p className="font-body text-base text-main leading-snug max-w-72">
            Congrats, your artwork has been submitted and will now be available
            to vote on by the community.
          </p>
        </div>
        <Button
          mode="flat"
          tone="accent"
          size="sm"
          onClick={handleContinue}
          className="font-joystix"
        >
          Continue
        </Button>
      </div>
    );
  }

  // ── NFT Metadata Step ─────────────────────────────────────────────────
  if (step === 'metadata') {
    return (
      <div className="flex flex-col gap-2 p-2">
        {/* Art Preview */}
        <div className="border border-line rounded-sm overflow-hidden">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE * PIXEL_SIZE}
            height={CANVAS_SIZE * PIXEL_SIZE}
            className="w-full"
            style={{ imageRendering: 'pixelated', aspectRatio: '1' }}
          />
        </div>

        {/* Metadata Form */}
        <div className="bg-card border border-line rounded-sm flex flex-col gap-4 items-center px-2 pt-4 pb-2">
          <h3 className="font-joystix text-base text-main">ADD NFT METADATA</h3>
          <div className="flex flex-col gap-2 w-full">
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="md"
              fullWidth
              className="font-joystix"
            />
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              size="md"
              fullWidth
              className="font-joystix"
            />
            <Button
              mode="solid"
              tone="accent"
              size="md"
              onClick={handleSubmit}
              className="w-full font-joystix gap-2"
              icon={<Icon name="paper-plane" />}
            >
              SUBMIT NFT
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Drawing Canvas Step ───────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2 p-4 pt-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between pr-10">
        <div className="flex items-center gap-3">
          <Switch checked={showGrid} onChange={setShowGrid} size="sm" />
          <span className="font-joystix text-xs text-main">SHOW GRID</span>
        </div>
        <div className="flex items-center gap-2">
          <Button quiet size="sm" iconOnly aria-label="Previous">
            <Icon name="chevron-left" large />
          </Button>
          <Button quiet size="sm" iconOnly aria-label="Next">
            <Icon name="chevron-right" large />
          </Button>
        </div>
      </div>

      {/* Canvas + Tools Row */}
      <div className="flex items-start justify-center gap-2">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE * PIXEL_SIZE}
          height={CANVAS_SIZE * PIXEL_SIZE}
          className="rounded-sm border border-line cursor-crosshair bg-accent"
          style={{ width: 350, height: 350, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* Tools Sidebar */}
        <div className="flex flex-col justify-between h-[350px]">
          <div className="flex flex-col gap-2">
            {/* Fill Bucket Tool */}
            <Button
              quiet
              size="sm"
              iconOnly
              active={currentTool === 'fill'}
              onClick={() => setCurrentTool(currentTool === 'fill' ? 'pencil' : 'fill')}
              aria-label="Fill bucket"
              className="size-8"
            >
              <Icon name="design-color-bucket" large />
            </Button>

            {/* Color Swatches */}
            <div className="flex flex-col gap-1">
              {(Object.keys(COLORS) as ColorKey[]).map((colorKey) => (
                <Button
                  key={colorKey}
                  quiet
                  size="sm"
                  iconOnly
                  onClick={() => setCurrentColor(colorKey)}
                  active={currentColor === colorKey}
                  className={`
                    size-8 rounded-sm
                    ${currentColor === colorKey ? 'ring-2 ring-main ring-offset-1' : ''}
                  `}
                  style={{ backgroundColor: COLORS[colorKey] }}
                  aria-label={`Color: ${colorKey}`}
                >
                  <span className="sr-only">{colorKey}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Bottom Tools: Mirror / Flip / Clear */}
          <div className="flex flex-col gap-1">
            <Button
              quiet
              size="sm"
              iconOnly
              onClick={mirrorHorizontal}
              aria-label="Mirror horizontal"
              className="size-8 font-joystix text-sm"
            >
              M
            </Button>
            <Button
              quiet
              size="sm"
              iconOnly
              onClick={flipVertical}
              aria-label="Flip vertical"
              className="size-8 font-joystix text-sm"
            >
              F
            </Button>
            <Button
              quiet
              size="sm"
              iconOnly
              onClick={clearCanvas}
              aria-label="Clear canvas"
              className="size-8 font-joystix text-sm"
            >
              C
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-start justify-between pr-10">
        <div className="flex items-center gap-2">
          <Button
            mode="flat"
            tone="neutral"
            size="sm"
            onClick={clearCanvas}
            icon={<Icon name="trash" />}
            className="font-joystix"
          >
            Clear
          </Button>
          <Button
            mode="flat"
            tone="neutral"
            size="sm"
            onClick={exportCanvas}
            icon={<Icon name="save" />}
            className="font-joystix"
          >
            Save
          </Button>
        </div>
        <Button
          mode="solid"
          tone="accent"
          size="sm"
          onClick={() => setStep('metadata')}
          className="font-joystix"
        >
          NEXT
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Voting Card Component
// ============================================================================

interface VoteCardProps {
  name: string;
  creator: string;
  image: string;
  upvotes: number;
  downvotes: number;
  style?: React.CSSProperties;
  className?: string;
}

function VoteCard({ name, creator, image, upvotes, downvotes, style, className = '' }: VoteCardProps) {
  return (
    <div
      className={`bg-card border border-line rounded-sm overflow-hidden flex flex-col items-center justify-end ${className}`}
      style={style}
    >
      {/* Artwork */}
      <div className="border-b border-line w-full aspect-square">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Info Bar */}
      <div className="flex items-end justify-between w-full px-4 py-3 bg-page rounded-md">
        <div className="flex flex-col gap-2">
          <span className="font-joystix text-sm text-main">{name.toUpperCase()}</span>
          <span className="inline-flex bg-accent px-2 py-1 rounded-md font-body text-sm text-main w-fit">
            by {creator}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Icon name="hand-dislike" />
            <span className="font-joystix text-xs text-main">{downvotes}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="hand-love-sign" />
            <span className="font-joystix text-xs text-main">{upvotes}</span>
          </div>
        </div>
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
  const [voteAnimation, setVoteAnimation] = useState<'bad' | 'rad' | null>(null);

  const submissions = studioSubmissions.length > 0 ? studioSubmissions : mockSubmissions;
  const unvoted = submissions.filter(s => !votedIds.has(s.id));
  const currentSubmission = unvoted[0] ?? null;

  const handleVote = useCallback((isRad: boolean) => {
    if (!currentSubmission) return;

    setVoteAnimation(isRad ? 'rad' : 'bad');

    setTimeout(() => {
      const update = isRad
        ? { upvotes: currentSubmission.upvotes + 1 }
        : { downvotes: currentSubmission.downvotes + 1 };
      updateSubmissionVotes(currentSubmission.id, update);
      setVotedIds(prev => new Set([...prev, currentSubmission.id]));
      setVoteAnimation(null);
    }, 600);
  }, [currentSubmission, updateSubmissionVotes]);

  if (!currentSubmission) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center gap-4">
        <Icon name="checkmark" large />
        <p className="font-joystix text-sm text-main">
          You&apos;ve voted on all submissions!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Card Stack Area */}
      <div className="relative w-[342px] h-[420px] mt-8">
        {/* Background cards (stack effect) */}
        {unvoted.slice(1, 3).reverse().map((sub, i) => {
          const offset = (2 - i) * 12;
          return (
            <div
              key={sub.id}
              className="absolute inset-0 bg-card border border-line rounded-sm"
              style={{
                top: offset,
                transform: `scale(${0.92 + i * 0.04})`,
                opacity: 0.7 - (1 - i) * 0.2,
                zIndex: i,
              }}
            />
          );
        })}

        {/* Active Card */}
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{
            zIndex: 10,
            transform: voteAnimation === 'rad'
              ? 'rotate(8deg) translateX(60px)'
              : voteAnimation === 'bad'
              ? 'rotate(-6deg) translateX(-60px)'
              : 'none',
          }}
        >
          <VoteCard
            name={currentSubmission.name}
            creator={currentSubmission.creator}
            image={currentSubmission.image}
            upvotes={currentSubmission.upvotes}
            downvotes={currentSubmission.downvotes}
            className="w-full h-full"
          />

          {/* Vote Overlay */}
          {voteAnimation && (
            <div className="absolute inset-0 top-0 h-[calc(100%-60px)] backdrop-blur-sm bg-inv/60 flex flex-col items-center justify-center gap-4 rounded-t-sm">
              <Icon
                name={voteAnimation === 'rad' ? 'hand-love-sign' : 'hand-dislike'}
                large
                className="text-accent"
              />
              <span className="font-joystix text-2xl text-card drop-shadow-glow">
                {voteAnimation === 'rad' ? 'RAD' : 'BAD'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Vote Buttons */}
      <div className="flex items-center gap-2 pb-4">
        <Button
          quiet
          size="lg"
          onClick={() => handleVote(false)}
          className={`
            flex flex-col items-center justify-center gap-2
            w-[70px] h-[88px] rounded-sm
            ${voteAnimation === 'bad' ? 'bg-accent' : 'bg-card'}
          `}
        >
          <Icon name="hand-dislike" large />
          <span className="font-joystix text-sm text-main drop-shadow-glow">BAD</span>
        </Button>
        <Button
          quiet
          size="lg"
          onClick={() => handleVote(true)}
          className={`
            flex flex-col items-center justify-center gap-2
            w-[70px] h-[88px] rounded-sm
            ${voteAnimation === 'rad' ? 'bg-accent' : 'bg-card'}
          `}
        >
          <Icon name="hand-love-sign" large />
          <span className="font-joystix text-sm text-main drop-shadow-glow">RAD</span>
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Leaderboard Entry Component
// ============================================================================

interface LeaderboardEntryProps {
  rank: number;
  name: string;
  creator: string;
  image: string;
  upvotes: number;
  downvotes: number;
  isFirst: boolean;
}

function LeaderboardEntry({ rank: _rank, name, creator, image, upvotes, downvotes, isFirst }: LeaderboardEntryProps) {
  return (
    <div
      className={`
        flex items-center justify-between p-1 rounded-sm border border-line
        ${isFirst ? 'bg-card shadow-glow' : 'bg-page'}
      `}
    >
      {/* Left: Thumbnail + Info */}
      <div className="flex items-center gap-2.5">
        <div className="size-12 rounded-sm border border-line overflow-hidden shrink-0">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 h-4">
            <span className="font-joystix text-sm text-main">{name}</span>
            {isFirst && <Icon name="interface-essential-crown" />}
          </div>
          <span className="font-body text-sm text-main">by {creator}</span>
        </div>
      </div>

      {/* Right: Vote Counts */}
      <div className="flex items-center gap-2 px-2">
        <div className="flex items-center gap-1">
          <Icon name="hand-dislike" />
          <span className="font-joystix text-xs text-main">{downvotes}</span>
        </div>
        <div className="flex items-center gap-1">
          <Icon name="hand-love-sign" />
          <span className="font-joystix text-xs text-main">{upvotes.toLocaleString()}</span>
        </div>
      </div>
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
    <div className="flex flex-col gap-1 py-2">
      {sortedByVotes.map((sub, index) => (
        <LeaderboardEntry
          key={sub.id}
          rank={index + 1}
          name={sub.name}
          creator={sub.creator}
          image={sub.image}
          upvotes={sub.upvotes}
          downvotes={sub.downvotes}
          isFirst={index === 0}
        />
      ))}

      {sortedByVotes.length === 0 && (
        <div className="text-center py-8">
          <p className="font-joystix text-sm text-mute">No submissions yet.</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RadiantsStudioApp({ windowId: _windowId }: AppProps) {
  return (
    <AppWindow.Content layout="bleed">
      <Tabs defaultValue="creation" position="top">
        <Tabs.List>
          <Tabs.Trigger value="creation">Creation</Tabs.Trigger>
          <Tabs.Trigger value="voting">Voting</Tabs.Trigger>
          <Tabs.Trigger value="leaderboard">Leaderboard</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="creation" className="flex-1 overflow-auto">
          <PixelArtCreation />
        </Tabs.Content>
        <Tabs.Content value="voting" className="flex-1 overflow-auto">
          <VotingSystem />
        </Tabs.Content>
        <Tabs.Content value="leaderboard" className="flex-1 overflow-auto px-2">
          <Leaderboard />
        </Tabs.Content>
      </Tabs>
    </AppWindow.Content>
  );
}

export default RadiantsStudioApp;
