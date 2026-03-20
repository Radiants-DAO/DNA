"use client";

import { useState, type ReactNode } from "react";
import { Wrench, Pencil, Question, Sparkles, Moon } from "@rdna/radiants/icons";
import { ComposerShell, ComposerPill } from "./ComposerShell";
import { AnnotationPin } from "./AnnotationPin";
import { AnnotationDetail } from "./AnnotationDetail";
import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";

const DEMO_INTENTS = ["fix", "change", "question", "create"] as const;
const DEMO_PRIORITIES = ["P1", "P2", "P3", "P4"] as const;

const DEMO_INTENT_ICONS: Record<string, ReactNode> = {
  fix: <Wrench size={12} />,
  change: <Pencil size={12} />,
  question: <Question size={12} />,
  create: <Sparkles size={12} />,
};

const DEMO_PRIORITY_DOT_COLORS: Record<string, string> = {
  P1: "bg-danger",
  P2: "bg-warning",
  P3: "bg-link",
  P4: "bg-mute",
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_ANNOTATIONS: ClientAnnotation[] = [
  {
    id: "ann-1",
    componentId: "demo",
    intent: "fix",
    priority: "P1",
    status: "pending",
    message: "Border radius should use radius-sm token, not hardcoded 4px",
    createdAt: Date.now() - 120_000,
    x: 25,
    y: 30,
  },
  {
    id: "ann-2",
    componentId: "demo",
    intent: "change",
    priority: "P2",
    status: "pending",
    message: "Consider warmer hover state for the brand refresh",
    createdAt: Date.now() - 300_000,
    x: 70,
    y: 60,
  },
  {
    id: "ann-3",
    componentId: "demo",
    intent: "adopt",
    priority: null,
    status: "pending",
    message: "Use the bolder border treatment from iteration 3",
    createdAt: Date.now() - 600_000,
    x: 0,
    y: 0,
    iterationFile: "button.iteration-3.tsx",
    adoptionMode: "replacement",
    targetVariant: "default",
  },
  {
    id: "ann-4",
    componentId: "demo",
    intent: "question",
    priority: "P3",
    status: "resolved",
    message: "Is the disabled opacity correct?",
    resolution: "Yes, matches RDNA spec",
    createdAt: Date.now() - 3_600_000,
    resolvedAt: Date.now() - 1_800_000,
  },
];

// ---------------------------------------------------------------------------
// Current (v1) Demos
// ---------------------------------------------------------------------------

export function ComposerShellDemo() {
  const [submitting, setSubmitting] = useState(false);
  const [intent, setIntent] = useState<(typeof DEMO_INTENTS)[number]>("change");
  const [priority, setPriority] = useState<(typeof DEMO_PRIORITIES)[number] | "">("P2");
  const [colorModes, setColorModes] = useState<Set<"light" | "dark">>(new Set(["light"]));

  const isCreate = intent === "create";

  return (
    <div className="relative h-[340px] w-[300px]">
      <ComposerShell
        isOpen={true}
        position={{ left: 16, top: 16 }}
        headerLabel={isCreate ? "New variation" : "New annotation"}
        placeholder={isCreate ? "Describe the variation you want..." : "What needs attention here?"}
        submitLabel={isCreate ? "Create" : "Pin"}
        submitting={submitting}
        onSubmit={() => {
          setSubmitting(true);
          setTimeout(() => setSubmitting(false), 1500);
        }}
        onCancel={() => {}}
        requireMessage={!isCreate}
      >
        <div className="flex flex-col gap-2">
          {/* Intent + Priority — inline row */}
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {DEMO_INTENTS.map((i) => (
                <ComposerPill
                  key={i}
                  active={intent === i}
                  onClick={() => setIntent(i)}
                  title={i.charAt(0).toUpperCase() + i.slice(1)}
                >
                  {DEMO_INTENT_ICONS[i]}
                </ComposerPill>
              ))}
            </div>

            {!isCreate && (
              <>
                <span className="h-3 w-px bg-rule" />
                <div className="flex gap-1">
                  {DEMO_PRIORITIES.map((p) => (
                    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-dot-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density
                    <button
                      key={p}
                      onClick={() => setPriority(prev => prev === p ? "" : p)}
                      title={p}
                      className={`h-3 w-3 rounded-full border transition-colors ${
                        priority === p
                          ? `${DEMO_PRIORITY_DOT_COLORS[p]} border-transparent scale-125`
                          : "border-rule bg-transparent hover:border-mute"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Color mode row */}
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <ComposerPill
                active={colorModes.has("light")}
                onClick={() => setColorModes(prev => {
                  const next = new Set(prev);
                  if (next.has("light")) next.delete("light");
                  else next.add("light");
                  return next;
                })}
                title="Light mode"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </ComposerPill>
              <ComposerPill
                active={colorModes.has("dark")}
                onClick={() => setColorModes(prev => {
                  const next = new Set(prev);
                  if (next.has("dark")) next.delete("dark");
                  else next.add("dark");
                  return next;
                })}
                title="Dark mode"
              >
                <Moon size={12} />
              </ComposerPill>
            </div>

            {/* Demo interaction states */}
            <span className="h-3 w-px bg-rule" />
            <div className="flex flex-wrap gap-0.5">
              <ComposerPill active={false} onClick={() => {}} title="hover">hover</ComposerPill>
              <ComposerPill active={false} onClick={() => {}} title="focus">focus</ComposerPill>
            </div>
          </div>
        </div>
      </ComposerShell>
    </div>
  );
}

export function AnnotationPinDemo() {
  return (
    <div className="relative h-[200px] w-[300px] rounded-sm border border-line bg-page">
      <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-mute">
        Component render area
      </div>
      {MOCK_ANNOTATIONS.filter((a) => a.x != null && a.x > 0).map((a, i) => (
        <AnnotationPin key={a.id} annotation={a} index={i} onClick={() => {}} />
      ))}
    </div>
  );
}

export function AnnotationDetailDemo() {
  const [ref, setRef] = useState<HTMLElement | null>(null);

  return (
    <div className="relative h-[320px] w-[300px]">
      <div
        ref={(el) => { if (el && !ref) setRef(el); }}
        className="absolute left-[60px] top-[16px] flex h-5 w-5 items-center justify-center rounded-full border border-main/60 bg-main/[0.18] font-mono text-xs text-main"
      >
        1
      </div>
      {ref && (
        <AnnotationDetail
          isOpen={true}
          annotation={MOCK_ANNOTATIONS[0]}
          anchorElement={ref}
          onClose={() => {}}
          onResolved={() => {}}
        />
      )}
    </div>
  );
}


export function AnnotationBadgeDemo() {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="flex items-center gap-1 rounded-sm border border-line bg-hover px-1.5 py-0.5 font-mono text-xs text-main transition-colors hover:bg-active">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        3
      </div>
      <span className="font-mono text-xs text-mute">Current badge</span>
    </div>
  );
}


