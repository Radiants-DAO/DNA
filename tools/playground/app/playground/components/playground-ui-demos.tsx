"use client";

import { useState } from "react";
import { ComposerShell, ComposerLabel, ComposerPill } from "./ComposerShell";
import { AnnotationPin } from "./AnnotationPin";
import { AnnotationDetail } from "./AnnotationDetail";
import { AnnotationList } from "./AnnotationList";
import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";

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

  return (
    <div className="relative h-[340px] w-[300px]">
      <ComposerShell
        isOpen={true}
        position={{ left: 16, top: 16 }}
        headerLabel="New annotation"
        placeholder="What needs attention here?"
        submitLabel="Pin"
        submitting={submitting}
        onSubmit={() => {
          setSubmitting(true);
          setTimeout(() => setSubmitting(false), 1500);
        }}
        onCancel={() => {}}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <ComposerLabel>Intent</ComposerLabel>
            <div className="flex gap-1">
              <ComposerPill active onClick={() => {}}>fix</ComposerPill>
              <ComposerPill active={false} onClick={() => {}}>change</ComposerPill>
              <ComposerPill active={false} onClick={() => {}}>question</ComposerPill>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <ComposerLabel>Priority</ComposerLabel>
            <div className="flex gap-1">
              <ComposerPill active={false} onClick={() => {}}>P1</ComposerPill>
              <ComposerPill active onClick={() => {}}>P2</ComposerPill>
              <ComposerPill active={false} onClick={() => {}}>P3</ComposerPill>
              <ComposerPill active={false} onClick={() => {}}>P4</ComposerPill>
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

export function AnnotationListDemo() {
  return (
    <div className="relative h-[400px] w-[320px]">
      <div className="absolute right-0 top-0">
        <AnnotationList
          isOpen={true}
          componentId="demo"
          annotations={MOCK_ANNOTATIONS}
          onClose={() => {}}
          onResolved={() => {}}
          onAnnotateClick={() => {}}
        />
      </div>
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


