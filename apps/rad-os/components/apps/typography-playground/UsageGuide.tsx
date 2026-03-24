'use client';

import React from 'react';
import {
  type TypographyRule,
  USAGE_SECTIONS,
  getRulesByCategory,
} from './type-manual-copy';

// Map section IDs to the category strings used in TYPOGRAPHY_RULES
const SECTION_ID_TO_CATEGORY: Record<string, string> = {
  'font-roles': 'Font Roles',
  weights: 'Weights',
  tokens: 'Tokens',
  spacing: 'Spacing',
  cohesion: 'Cohesion',
  mixing: 'Mixing',
};

// -- Rendered example card for a single do/don't rule --

function RuleCard({ rule }: { rule: TypographyRule }) {
  const isDo = rule.type === 'do';

  return (
    <div
      className={`flex flex-col border pixel-rounded-sm overflow-hidden ${
        isDo
          ? 'border-success/40'
          : 'border-danger/40'
      }`}
    >
      {/* Rendered example area */}
      <div className="px-4 py-5 bg-depth min-h-[72px] flex items-center">
        <span
          className={`${rule.example.fontClass} ${rule.example.className ?? ''} text-main block w-full`}
          style={rule.example.style}
        >
          {rule.example.text}
        </span>
      </div>

      {/* Label + reason */}
      <div className="px-3 py-2.5 space-y-1 border-t border-rule bg-page">
        <div className="flex items-center gap-2">
          {/* Indicator */}
          <span
            className={`shrink-0 font-joystix text-xs uppercase tracking-tight px-1.5 py-0.5 pixel-rounded-sm ${
              isDo
                ? 'bg-success/15 text-success'
                : 'bg-danger/15 text-danger'
            }`}
          >
            {isDo ? 'DO' : "DON'T"}
          </span>
          <span className="font-mondwest text-sm text-main leading-tight">
            {rule.label}
          </span>
        </div>
        <p className="font-mondwest text-xs text-mute leading-relaxed">
          {rule.reason}
        </p>
      </div>
    </div>
  );
}

// -- Paired do/don't row --

function RulePair({
  dontRule,
  doRule,
}: {
  dontRule: TypographyRule;
  doRule: TypographyRule;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <RuleCard rule={dontRule} />
      <RuleCard rule={doRule} />
    </div>
  );
}

// -- Single full-width rule (odd one out) --

function RuleSingle({ rule }: { rule: TypographyRule }) {
  return (
    <div className="max-w-[50%]">
      <RuleCard rule={rule} />
    </div>
  );
}

// -- Section with header, intro, and grouped rules --

function UsageSection({
  section,
  rules,
}: {
  section: (typeof USAGE_SECTIONS)[number];
  rules: TypographyRule[];
}) {
  // Pair dont/do rules. The data is ordered as dont, do pairs.
  const pairs: { dont?: TypographyRule; do?: TypographyRule }[] = [];
  let i = 0;
  while (i < rules.length) {
    const current = rules[i];
    const next = rules[i + 1];

    if (current.type === 'dont' && next?.type === 'do') {
      pairs.push({ dont: current, do: next });
      i += 2;
    } else {
      // Odd rule out -- no natural pair
      pairs.push(
        current.type === 'do' ? { do: current } : { dont: current },
      );
      i += 1;
    }
  }

  return (
    <section className="space-y-4">
      {/* Section header -- follows BrandAssets color palette pattern */}
      <div className="border-b border-rule pb-3">
        <h2 className="font-joystix text-sm text-main uppercase tracking-tight leading-tight">
          {section.title}
        </h2>
        <p className="font-mondwest text-base text-sub mt-1.5 leading-relaxed">
          {section.intro}
        </p>
      </div>

      {/* Rule pairs */}
      <div className="space-y-3">
        {pairs.map((pair, idx) => {
          if (pair.dont && pair.do) {
            return (
              <RulePair
                key={pair.dont.id}
                dontRule={pair.dont}
                doRule={pair.do}
              />
            );
          }
          const rule = pair.do ?? pair.dont;
          if (!rule) return null;
          return <RuleSingle key={rule.id} rule={rule} />;
        })}
      </div>
    </section>
  );
}

// ============================================================================
// Main export
// ============================================================================

export function UsageGuide() {
  const rulesByCategory = getRulesByCategory();

  // Build a lookup from category name to rules
  const categoryMap = new Map<string, TypographyRule[]>();
  for (const group of rulesByCategory) {
    categoryMap.set(group.category, group.rules);
  }

  return (
    <div className="overflow-y-auto overflow-x-hidden h-full p-5 space-y-10">
      {USAGE_SECTIONS.map((section) => {
        const categoryName = SECTION_ID_TO_CATEGORY[section.id];
        const rules = categoryName ? categoryMap.get(categoryName) ?? [] : [];

        if (rules.length === 0) return null;

        return (
          <UsageSection
            key={section.id}
            section={section}
            rules={rules}
          />
        );
      })}
    </div>
  );
}
