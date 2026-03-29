'use client';

/**
 * EditorialLayout — "First Things First" manifesto (1964, Ken Garland)
 * rendered with Radiants aesthetics.
 *
 * Showcases all 6 RDNA fonts in their editorial roles:
 *   Blackletter  → drop cap, title display
 *   Joystix      → year numeral, section headers
 *   Mondwest     → body text
 *   PixelCode    → the emphasized passage (typewriter voice)
 *   Pixeloid     → byline, signatories, dateline
 *   Tiny CPC     → colophon, decorative micro-text
 */

// ---------------------------------------------------------------------------
// Manifesto text (1964, Ken Garland — public domain)
// ---------------------------------------------------------------------------

const MANIFESTO_BODY_1 =
  'We, the undersigned, are graphic designers, photographers and students ' +
  'who have been brought up in a world in which the techniques and apparatus ' +
  'of advertising have persistently been presented to us as the most lucrative, ' +
  'effective and desirable means of using our talents. We have been bombarded ' +
  'with publications devoted to this belief, applauding the work of those who ' +
  'have flogged their skill and imagination to sell such things as: cat food, ' +
  'stomach powders, detergent, hair restorer, striped toothpaste, aftershave ' +
  'lotion, beforeshave lotion, slimming diets, fattening diets, deodorants, ' +
  'fizzy water, cigarettes, roll-ons and slip-ons.';

const MANIFESTO_BODY_2 =
  'By far the greatest effort of those working in the advertising industry ' +
  'are wasted on these trivial purposes, which contribute little or nothing ' +
  'to our national prosperity.';

const MANIFESTO_BODY_3 =
  'In common with an increasing number of the general public, we have reached ' +
  'a saturation point at which the high pitched scream of consumer selling is ' +
  'no more than sheer noise. We think that there are other things more worth ' +
  'using our skill and experience on.';

const MANIFESTO_EMPHASIS =
  'There are signs for streets and buildings, books and periodicals, ' +
  'catalogues, instructional manuals, industrial photography, educational ' +
  'aids, films, television features, scientific and industrial publications ' +
  'and all the other media through which we promote our trade, our education, ' +
  'our culture and our greater awareness of the world.';

const MANIFESTO_BODY_4 =
  'We do not advocate the abolition of high pressure consumer advertising: ' +
  'this is not feasible. Nor do we want to take any of the fun out of life. ' +
  'But we are proposing a reversal of priorities in favour of the more useful ' +
  'and more lasting forms of communication. We hope that our society will tire ' +
  'of gimmick merchants, status salesmen, hidden persuaders, and that the ' +
  'prior call on our skills will be for worthwhile purposes.';

const MANIFESTO_CLOSING =
  'With this in mind we propose to share our experience and opinions, and to ' +
  'make them available to colleagues, students and others who may be interested.';

const SIGNATORIES = [
  'Edward Wright',
  'Geoffrey White',
  'William Slack',
  'Caroline Rawlence',
  'Ian McLaren',
  'Sam Lambert',
  'Ivor Kamlish',
  'Gerald Jones',
  'Bernard Higton',
  'Brian Grimbly',
  'John Garner',
  'Ken Garland',
  'Anthony Froshaug',
  'Robin Fior',
  'Germano Facetti',
  'Ivan Dodd',
  'Harriet Crowder',
  'Anthony Clift',
  'Gerry Cinamon',
  'Robert Chapman',
  'Ray Carpenter',
  'Ken Briggs',
];

// ---------------------------------------------------------------------------
// Font role annotation — shows which font is used and why
// ---------------------------------------------------------------------------

function FontRole({ font, role }: { font: string; role: string }) {
  return (
    <span className="font-mono text-xs text-mute/60 block mt-1">
      {font} — {role}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main layout
// ---------------------------------------------------------------------------

export function EditorialLayout() {
  return (
    <div className="bg-page text-main min-h-full overflow-y-auto">
      <div className="max-w-[36rem] mx-auto px-6 py-8 space-y-8">

        {/* ── Year numeral — Joystix (The Shout) ── */}
        <div className="relative">
          <div className="font-heading text-5xl text-main/8 leading-none tracking-tight select-none" aria-hidden="true">
            1964
          </div>
          <FontRole font="Joystix" role="The Shout — date as visual anchor" />
        </div>

        {/* ── Title — Blackletter (The Ceremony) ── */}
        <header className="border-b-2 border-main pb-4">
          <h1
            className="text-main leading-tight"
            style={{ fontFamily: "'Waves Blackletter CPC', serif", fontSize: '2.5rem' }}
          >
            First Things First
          </h1>
          <p className="font-heading text-sm text-sub uppercase tracking-tight mt-2">
            A Manifesto
          </p>
          <FontRole font="Blackletter" role="The Ceremony — display headline, gravitas" />
        </header>

        {/* ── Dateline — Pixeloid (The Attribution) ── */}
        <div className="flex items-center justify-between border-b border-line pb-2">
          <span
            className="text-xs text-mute uppercase tracking-wide"
            style={{ fontFamily: "'Pixeloid Sans', sans-serif" }}
          >
            Published 1964 — London, England
          </span>
          <span
            className="text-xs text-mute"
            style={{ fontFamily: "'Pixeloid Sans', sans-serif" }}
          >
            Ken Garland et al.
          </span>
        </div>
        <FontRole font="Pixeloid Sans" role="The Attribution — dateline, byline" />

        {/* ── Drop cap + body — Blackletter cap, Mondwest body ── */}
        <div className="relative">
          <span
            className="float-left mr-2 text-main leading-none"
            style={{
              fontFamily: "'Waves Blackletter CPC', serif",
              fontSize: '4rem',
              lineHeight: 0.85,
            }}
          >
            W
          </span>
          <p className="font-sans text-base text-main leading-relaxed">
            {MANIFESTO_BODY_1.slice(1)}
          </p>
          <FontRole font="Blackletter + Mondwest" role="Drop cap (Ceremony) + body (The Voice)" />
        </div>

        {/* ── Body 2 — Mondwest (The Voice) ── */}
        <p className="font-sans text-base text-main leading-relaxed">
          {MANIFESTO_BODY_2}
        </p>

        {/* ── Body 3 ── */}
        <p className="font-sans text-base text-main leading-relaxed">
          {MANIFESTO_BODY_3}
        </p>

        {/* ── Divider ── */}
        <div className="border-t border-line" />

        {/* ── Emphasized passage — PixelCode (The Precision) ── */}
        <blockquote className="border-l-2 border-accent pl-4 py-2">
          <p
            className="font-mono text-sm text-main leading-relaxed"
            style={{ fontWeight: 700 }}
          >
            {MANIFESTO_EMPHASIS}
          </p>
          <FontRole font="PixelCode Bold" role="The Precision — the call to action, typewriter urgency" />
        </blockquote>

        {/* ── Divider ── */}
        <div className="border-t border-line" />

        {/* ── Body 4 — Mondwest ── */}
        <p className="font-sans text-base text-main leading-relaxed">
          {MANIFESTO_BODY_4}
        </p>

        {/* ── Pull quote — Joystix (The Shout) ── */}
        <div className="bg-inv px-5 py-4 my-4">
          <p className="font-heading text-sm text-flip uppercase tracking-tight leading-snug">
            Society will tire of gimmick merchants
          </p>
          <FontRole font="Joystix" role="The Shout — pull quote, maximum emphasis" />
        </div>

        {/* ── Closing — Mondwest ── */}
        <p className="font-sans text-base text-main leading-relaxed">
          {MANIFESTO_CLOSING}
        </p>

        {/* ── Signatories — Pixeloid (The Attribution) ── */}
        <div className="border-t-2 border-main pt-4">
          <span
            className="text-xs text-mute uppercase tracking-wide block mb-3"
            style={{ fontFamily: "'Pixeloid Sans', sans-serif" }}
          >
            Signed:
          </span>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {SIGNATORIES.map((name) => (
              <span
                key={name}
                className="text-xs text-sub"
                style={{ fontFamily: "'Pixeloid Sans', sans-serif" }}
              >
                {name}
              </span>
            ))}
          </div>
          <FontRole font="Pixeloid Sans" role="The Attribution — signatories as quiet authority" />
        </div>

        {/* ── Colophon — Waves Tiny CPC (The Whisper) ── */}
        <div className="border-t border-line pt-4 pb-2 text-center">
          <p
            className="text-mute leading-relaxed tracking-wide"
            style={{ fontFamily: "'Waves Tiny CPC', serif", fontSize: '0.625rem' }}
          >
            Set in Radiants — Waves Blackletter CPC · Joystix Monospace · Mondwest · PixelCode · Pixeloid Sans · Waves Tiny CPC
          </p>
          <p
            className="text-mute/40 mt-1 tracking-wider"
            style={{ fontFamily: "'Waves Tiny CPC', serif", fontSize: '0.5rem' }}
          >
            RDNA Design System · Six voices, one vocabulary
          </p>
          <FontRole font="Waves Tiny CPC" role="The Whisper — colophon, text as texture" />
        </div>

        {/* ── Font role legend ── */}
        <div className="border-t border-line pt-4 space-y-2">
          <span className="font-heading text-xs text-mute uppercase tracking-tight block">
            Fonts in this editorial
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { font: 'Blackletter', voice: 'The Ceremony', usage: 'Drop caps, display titles' },
              { font: 'Joystix', voice: 'The Shout', usage: 'Year, pull quotes, headers' },
              { font: 'Mondwest', voice: 'The Voice', usage: 'Body text, long-form' },
              { font: 'PixelCode', voice: 'The Precision', usage: 'Emphasized passages, code' },
              { font: 'Pixeloid', voice: 'The Attribution', usage: 'Bylines, signatories, dates' },
              { font: 'Tiny CPC', voice: 'The Whisper', usage: 'Colophon, decorative micro-text' },
            ].map(({ font, voice, usage }) => (
              <div key={font} className="flex flex-col py-1.5 border-b border-line last:border-0">
                <span className="font-mono text-xs text-main">{font}</span>
                <span className="font-mono text-xs text-accent">{voice}</span>
                <span className="font-mono text-xs text-mute">{usage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
