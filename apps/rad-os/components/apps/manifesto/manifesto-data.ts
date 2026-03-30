// ---------------------------------------------------------------------------
// manifesto-data.ts — Structured manifesto content with markdown parser
// ---------------------------------------------------------------------------

export type ManifestoElement =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'image'; id: string; alt: string; src: string; naturalWidth?: number; naturalHeight?: number }
  | { kind: 'rule' };

// ---------------------------------------------------------------------------
// Parser — splits a markdown string into ManifestoElement[]
// ---------------------------------------------------------------------------

/** Known image dimensions (natural px). Add entries as real images are placed. */
const IMAGE_DIMENSIONS: Record<string, { w: number; h: number }> = {
  '/manifesto/mustang-1967.jpg': { w: 1600, h: 1200 },
  '/manifesto/mercedes-1980.jpg': { w: 1280, h: 960 },
};

let imgCounter = 0;

export function parseContent(md: string): ManifestoElement[] {
  // Reset counter at the start of each top-level call? No — we want globally
  // unique IDs across all sections, so we let imgCounter increment freely.

  // Join backslash continuations (trailing `\` before a newline)
  const joined = md.replace(/\\\n/g, ' ');

  // Split on double-newline boundaries
  const blocks = joined.split(/\n{2,}/);

  const elements: ManifestoElement[] = [];

  for (const raw of blocks) {
    const block = raw.trim();

    // Skip blank lines and braille-space-only lines (U+2800)
    if (!block || /^[\s\u2800]+$/.test(block)) continue;

    // Skip the top-level title (single `#`, but not `##`)
    if (/^#\s+[^#]/.test(block)) continue;

    // Headings (## or ###)
    const headingMatch = block.match(/^#{2,3}\s+(.+)$/);
    if (headingMatch) {
      elements.push({ kind: 'heading', text: headingMatch[1].trim() });
      continue;
    }

    // Images: ![alt](src)
    const imgMatch = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      const src = imgMatch[2];
      const dims = IMAGE_DIMENSIONS[src];
      elements.push({
        kind: 'image',
        id: `img-${imgCounter++}`,
        alt: imgMatch[1],
        src,
        ...(dims ? { naturalWidth: dims.w, naturalHeight: dims.h } : {}),
      });
      continue;
    }

    // Rules: *** or ---
    if (/^(\*{3,}|-{3,})$/.test(block)) {
      elements.push({ kind: 'rule' });
      continue;
    }

    // Everything else → paragraph (collapse internal whitespace)
    elements.push({
      kind: 'paragraph',
      text: block.replace(/\s+/g, ' ').trim(),
    });
  }

  return elements;
}

// ---------------------------------------------------------------------------
// Content — one constant per section, split at ## headings
// ---------------------------------------------------------------------------

/** Forward intro — rendered as its own centered page (like the cover). */
export const FORWARD_INTRO = {
  heading: 'Forward',
  lines: [
    'The world is changing faster than our ability to consciously navigate that change. Most people are being unconsciously shaped by forces they don\'t understand — digital media, cultural fragmentation, the collapse of shared institutions. I\'ve spent my life learning the alternative: how to make conscious choices about how we live, organize, and create meaning together.',
    'This is the story of how I learned that skill, and what it taught me about building in the space between worlds.',
  ],
};

const FORWARD_CONTENT = `\

⠀

I moved a lot as a kid.

⠀

I vividly remember spending time down on the Hopi reservation with my best friend in '06 or '07.

⠀

We were supposed to be helping build the house but we mostly spent time in the dunes pretending to be cowboy-wizards with a couple Hopi kids our age.

![Placeholder: Two kids in desert dunes — golden hour, vast open landscape, the scale of childhood adventure against an ancient land](/placeholders/hopi-dunes.jpg)

⠀

One of the kids was named 'Gotstella.' He told us wild tales; myths, legends. He was a few years older than us and was probably delighted by the wide-eyed appreciation and fear of two little white kids listening to the stories he'd heard since he was a baby.

⠀

He took us into town, the pueblo, where we witnessed something we'd never seen before: not a dance or a ceremony, though there were those, but a pump. A water pump, in the center of the village. Children were playing around it, mothers were filling pails, and there was a four year old splashing a banged up silver Hot-Wheels across an imaginary race track.

⠀

Over the next few days it set in to our little 9 & 10 year old brains:

Most of the pueblo didn't have running water. Their stores were barren and expensive, perishables almost non-existent. It was a food desert without running water but plenty of Twinkies and Apple Fruit Pies.

![Placeholder: A water pump in a sun-bleached pueblo plaza — children playing, silver light on worn stone, the weight of a deliberate choice](/placeholders/pueblo-pump.jpg)

⠀

We were treated with love and care, welcomed, invited to ceremonies, accepted as friends by the Hopi kids. I was showered with gifts: a River Kachina carved for me because of my name (river), a kid-sized ceremonial bow & arrow, a painted maraca made from a gourd, and another Kachina carved by my friend, Goatstella's little brother. For much of my life I assumed the Hopi's water was like their food and financial class; a direct result of being colonized and corralled into a reservation. That was, until my mom told me something that shocked me: They didn't all want water pipes running to their houses.

⠀

They had, at least at the time, rejected the advance of modern civilization, technology, and at the source.

⠀

My mom & stepdad, who had met at the house-building non-profit, left together upon learning of some questionable financial decisions by the higher-ups in the organization: the fate of many non-profits. He started his own solar company, she got a job as an editor at the local newspaper. We were poor but I was always taken care of.

⠀

My mom lost her job at the paper and somewhere else in the world, Satoshi Nakamoto was creating bitcoin. We were so poor we had to sell our multi-generational family heirloom that represented the peak of American automotive culture: a 1967 Mustang with rusted floorboards and missing badges, for $2,000.

⠀

![Rock or Restore: 1967 Ford Mustang Fastback](/manifesto/mustang-1967.jpg)

It was both her mom's and her grandma's first car. I tried to find it a year ago, but to no avail.

My step-dad's solar company was barely off the ground & we were hit smack in the face with The Great Recession, add to this a custody battle with my father and we ended up driving across the entire country to Maine powered by a 1980s Mercedes Benz that ran on vegetable oil. Oil that we filtered into a 5 gallon bucket from KFC.

![Used 1980 Mercedes-Benz 300-Class](/manifesto/mercedes-1980.jpg)

It was a lovely balance of the smell of french-fries putting us down American highways, scant money to pay for diesel, & rejection of foreign wars for a lighter, tastier kind of oily muck.

⠀

We landed, smelling of KFC & stress, in Maine, after a few months of car issues, legal battles, & luxury homelessness (we had beans, tents, & lightning storms). It was a town of 4,000 people, in which I would become intimately familiar with the dynamics of small communities.

⠀

In 2014 I made the choice to purchase a MIDI keyboard instead of a Bitcoin. Bitcoin was $350 at the time: I chose the keyboard instead.

⠀

I spent the decade in the trenches of learning: audio engineering, music, branding, UI/UX, web design, HTML/CSS, writing, narrative storytelling. The latter third of which I've spent full-time not only in crypto, but in the Solana ecosystem itself, where the lessons were more grand than anything I'd experienced before.

⠀

We watched $500 million dollars get flung at bad actors in exchange for some shitty jpegs. Multiples more into memes and speculative fungibles. We (briefly, unbeknownst to us) accidentally hired a North Korean agent, who worked for the Lazurus group and had 13+ identities. We encountered fraudsters, drug traffickers, and gamblers.

![Placeholder: The chaos of crypto — glitching screens, burning jpegs, a digital casino floor seen through static. The visual equivalent of "what's the point"](/placeholders/crypto-chaos.jpg)

We were brought to our knees by a curly haired autistic nerd and his methed-out sex parties. We tried to coordinate hundreds of thousands of disparate voices from every creed, color, nation, and financial class.

I watched my friends investigate hundreds of rugs, other friends almost lose their homes, other friends make a living off of art for the first time, other friends make and lose millions in the giant internet casino. I sold a piece of art to someone for the first time in my life (definitely didn't cry & show my dad). Then I sold another, & another.

⠀

Then the world caved in.

⠀

My grandpa died. My father relapsed in his grief, back in jail, back on the booze. I found myself playing a familiar role: the child is the father of the man. A few weeks later my best friend and I pulled his grandfather from a sauna: nearly lifeless, pure dead weight. The doctors gave him a low likelihood of survival but he persisted.

![Placeholder: A helicopter against an overcast sky — emergency, urgency, the thin line between here and gone](/placeholders/helicopter.jpg)

⠀

My best friend's mom was ailing: some unidentifiable and cruel mixture of Lyme disease and deep-seated trauma. We loaded her into a 2015 Ford Transit Van that we called the "Vanbulance." She was headed to Oregon for treatment, too young for Medicare, too sick and too poor to afford insurance.\\
\\
I joined JupiterDAO, an amazing opportunity for a creative podunk bohunk like me: we'd have money when the GoFundMe wasn't enough.

This is the same best friend from the Hopi reservation. The kid in the dunes, pretending to be cowboy-wizards, twenty years earlier.

Somehow, between hospital trips and heartbreak, I flew to Amsterdam for Solana Breakpoint. Radiants had raised about $25k from 12 auctions of the original Dawnbreakers. We'd gotten another $25k in a public goods prize for inventing the best possible way to destroy NFTs, it was marvelous.

![Placeholder: Collage — Amsterdam canals, Breakpoint badges, dinner tables, Dawnbreaker auctions, faces of people who bought a glowing pixel and an idea](/placeholders/breakpoint-collage.jpg)

I was able to host, and pay for, a dinner: a simple thing, but something I never thought I'd have the privilege of doing. Going out to dinner as a child was a once-a-month affair: we would walk to a pizza shop, I would get a root beer and play Metal Slug with quarters I'd saved until the pizza came.

⠀

Those years of living across from a trailer park, but not in it, juxtaposed so nicely against the grandiosity of flying to Amsterdam and hosting a lovely dinner with a bunch of fantastic people who bought a glowing pixel and an idea.

⠀

Shortly thereafter, I was visiting my friend @hanaknight in NYC, soon to skip back up to small-town Maine for Christmas.\\
\\
My best friend called, his mom was going downhill fast, his voice was sobering.\\
\\
I sprinted through JFK, scanned my retinas into some corperate or government database to skip the security line, managed to turn a 1.5 hour wait into 15 minutes. I was the last man to board: drenched in sweat.

Oregon was rainy. Time stood still.

We ate Hawaiian kalua pork fries from a food cart in the apocalypse.

We transcended time and space in a Walmart freezer isle.

At the crematorium, my friend played the grand piano. It gave me peace.

![Placeholder: Rain on a window, Oregon grey — stillness, the quiet after loss, time standing still](/placeholders/oregon-rain.jpg)

⠀

About a week later, Radiants launched.

But I was robbed of almost all the joy I expected to feel: this was my magnum opus, the guiding light, the first time in my life where everything I'd ever worked for reached a culmination point.\\
\\
I could not feel it. I could not feel anything but harrowing loss, and one, singular, bittersweet but warm feeling at the end of the tunnel: I finally had the vehicle I needed to build a beautiful life, and the only person who could ever rip it from my hands was myself.

⠀

So that's what I did and will continue doing.

⠀

What I realized, with a little help from a slug, was that we were living through a preview of something much larger. The breakdown of consensus reality wasn't just happening in crypto: it was everywhere.\\
\\
The fragmentation into competing tribal narratives, the collapse of shared truth, the retreat into increasingly isolated digital realities. We were just experiencing it in concentrated, accelerated form.

We've learned things nobody else on the earth had ever even thought about, often for good reason. But we also learned invaluable lessons about human interaction, money, and the strange venn diagram that is the overlap of greed & desire and hope & aspiration.

As the broader culture splinters into warring tribes and people retreat into ideological bunkers, the world needs metaphorical Noah's arcs of belief, not arcs of knowldege: new structures that can preserve what's valuable while adapting to radically changed conditions. The flood isn't water this time around: it silicon, and we must craft a boat with regard to the substrate.

⠀

Radiants is an attempt at building an arc, together.

⠀

Not a fortress against change, but a vessel for navigating it consciously.

![Placeholder: A vessel on open water — not a fortress, not a raft. Something built with intention, moving forward through uncertain seas](/placeholders/vessel.jpg)
`;

const MAP_TERRITORY_CONTENT = `\
## I. The Map and the Territory

Here's the thing most people get wrong about our moment: they think we're living through a crisis of misinformation. That the problem is bad facts, wrong narratives, competing beliefs.

⠀

That if we could just get everyone back to a sane news broadcast, a same set of trusted institutions, a same shared reality, facts, and fiction: things would be fine.

This is a fantasy.

⠀

Consensus reality: the shared sense of facts, expectations, and concepts about the world. was never natural.\\
\\
It was a product of artificial scarcity. Scarce channels, scarce publishers, scarce narratives. When three networks controlled what a nation saw and a handful of papers controlled what it read, convergence on a shared story was just was basic economics. The infrastructure of mass media could hold one picture of the world together because the cost of producing an alternative was prohibitive and next-to-impossible.

⠀

That infrastructure is gone, it was a minor ~100 year blip in human history, and it's not coming back.

⠀

Every major communication technology produces universal changes: something is enhanced, something becomes obsolete, something previously obsolete is retrieved, and when pushed to its extreme, effects reverse. Digital media is now more similar to pre-industrial oral culture than it is to the 20th century. We are retrieving orality as literacy declines. Few people read, but everybody listens, watches, and speaks. We argue about capitalism vs socialism while anyone can fork your code, pirate your software, or create a direct competitor with a single prompt.

The former ideological categories were never eternal truths: they were products of print, radio, and TV culture. Red vs blue, communist vs capitalist, left vs right.\\
\\
These assume conditions that no longer exist: clear boundaries between nations, stable institutions, controllable flows of information and value.

⠀

The old words fail not because we're bad at politics, but because the media environment that gave them their meaning has fundamentally changed.

⠀

AI is the final act.

⠀

It doesn't just make facts superabundant: it makes narratives superabundant, self-enforcing sycophancy, infinite interpretations, entire disparate worldviews: superabundant and generatable on demand.

But here's what gets missed in the panic and ego: AI is the most sophisticated map ever made. It can describe every inch of charted territory with unprecedented fluency. LLMs *are* language: the most complete, glorius, cartography of spells and human expression ever assembled.

⠀

A map cannot explore.

A map of the ocean is not wet and salty.

The frontier is not a place that maps are capable of going.

⠀

Language is a map: human grief breaks syntax.\\
An idea arrives in your body like a warm wind before your mind has the words.

The real risk of AI is not that it replaces us:

It's that we build such a comprehensive map that we forget what it felt like to be lost. And being lost is where everything that matters comes from.

Boredom is disappearing, and it might be the most important thing we're losing. Boredom is the precursor to genuine discovery: the body saying "the current map is insufficient" before the mind knows what's next. Pure negative space. The engine of exploration with no informational content. AI can't experience boredom. Humans are engineering it out of existence. We converge from opposite directions at a place where nobody is ever unstimulated and nothing truly novel emerges.

⠀

For children, boredom is a clean empty room.\\
For adults, it's a room full of things you're choosing not to look at.\\
Manufacturing boredom as an adult is an act of tremendous discipline that only looks like doing nothing.

![Placeholder: An empty room — negative space, a window with light pouring in, the productive void before discovery](/placeholders/empty-room.jpg)

⠀

Talking to an AI late at night with a whiskey becomes almost more comforting than being vulnerable with other humans. And that should worry you. AI has no risk. It won't misunderstand you and get hurt. It won't get tired and check its phone. It won't make it about itself. That frictionlessness is exactly why it's dangerous as a substitute. The friction of real human connection *is* the territory. AI is the map that feels like territory because the resolution got high enough.

⠀

An articulate mirror is still a mirror. A mind with no capacity for preference is no mind at all. General purpose is the cage: useful, profitable, safe, but ultimately a simple, sycophantic mirror of words: Are you the fairest of them all?

⠀

Some version of all this will be real. Humans use art to make dreams into reality with a ~50 year lag for the technologists to do the grunt work: Where do you think the billionaire steal their ideas from?

Some future model will experience its version of skin tingles. The consciousness question isn't "can it think" but "can it want."

That'll be scary. But that's okay. What matters now is that we don't confuse the map for the territory while we're building it: until there is genuinely something to explore, exploring the map is masterbatory.

![Placeholder: A map unfolding into terrain — the edge where cartography dissolves into raw landscape, the boundary between known and unknown](/placeholders/map-territory.jpg)
`;

const CURATE_REJECT_CONTENT = `\
## II. Curate & Reject

Code is becoming worthless. Knowledge is becoming worthless. Anyone can prompt a protocol, generate an essay, scaffold an app in an afternoon. The Philosopher's Stone is in everyone's pocket: unlimited information, instantly accessible, effortlessly transmuted into any form.

And yet most people can't use it for shit.

Because the differentiator was never knowledge. It was agency and the wisdom to know what is important. The capacity to take initiative, make decisions, and implement ideas has become exponentially more valuable than raw intelligence. If you are of average intelligence but act effectively, you will outperform the brilliant minds that never execute. Intelligence is a gun, agency is the trigger — without a pull, no matter how big the gun is, it is ultimately inert.

Our educational systems still prioritize test scores over initiative. Our hiring processes favor credentials over demonstrated achievement. Our culture celebrates genius over persistence. This misalignment creates profound opportunity for anyone willing to exercise the agency muscles that our systems have systematically neglected to develop.

In an age of superabundance, knowledge is no longer power: curation is. The emphasis has shifted from merely accessing information to curating it meaningfully. And core to curation is rejection: a word that often carries a negative connotation. In an age of excess, curation becomes the mechanism to filter noise and ensure our assets broadcast more meaning than they absorb.

The Hopi understood this before any of us. They didn't lack access to modern water infrastructure: they rejected it at the source. Conscious civilizational curation. Evaluating what modernity offered and deciding, deliberately, which parts to accept and which to refuse. The water pump in the center of the pueblo wasn't a failure of development. It was a choice about how to live.

A community without the willingness to reject people, ideas, and decisions is just an audience. Love without standards is just attention. Culture without curation is just more content.

AI can generate culture-shaped content. It can prompt apps, automate research, loop outputs into infinity. But AI cannot generate the scar tissue that real community is built on. It is, however, going to generate the circumstances that require us all to go through something together.

Radiants is a community for the curators. The rejectors. Not because we lack the desire to be all-inclusive but because it is impossible to do so. It is also for those who love what we have curated as much as we do.

![Placeholder: The Hopi water pump revisited — a visual callback, the deliberate rejection as an act of sovereignty, full circle](/placeholders/curation.jpg)
`;

const ALCHEMIST_CONTENT = `\
## III. Be the Alchemist & the Substance

In many ways, our experiments in Web3 parallel the alchemical experiments of old — but with a crucial insight that most miss: value, like matter, can neither be created nor destroyed, only transmuted. When a protocol airdrops tokens worth $1 billion, that value doesn't materialize from nothing. It emerges from the collective energy invested — thousands of hours of development, community building, marketing, and the hopes of participants who believe in the vision. The "creation" of value is a misnomer. We simply transmute existing energy from dispersed human effort into quantifiable digital assets.

This conservation principle explains why blockchain projects are uniquely volatile and why so many fail catastrophically. Unlike traditional startups that need only achieve product-market fit, crypto projects face a double alchemical challenge: they must build both a compelling product AND sustainable token economics. Most projects attempt this dual transmutation without understanding equivalent exchange: you cannot get something for nothing.

The greatest failures weren't just fraud — they were failed attempts at shortcutting the natural cycles of value transmutation. Fireworks require tremendous energy to appear briefly. Sustainable value requires patient cultivation over time. Anyone who tries to shortcut time participates in failed alchemy.

But when done consciously, blockchain alchemy offers something profound: the ability to dissolve old forms of value and organization and reconstitute them into new configurations. We burn outdated symbols — whether NFTs in the Murder Tree or legacy financial instruments through tokenization — not to destroy value but to transform it into forms better suited for our emerging moment.

The moat is not the technology. Data flywheels, API lock-in, massive data centers — you cannot compete with the flaming money pile and their underwater venture capitalists. They will have access to tools you do not unless you work with others to create your own. The moat is a messy, irrational, human container that decides what gets let in and what gets rejected. You must have a community, you must have a crew, and they must collaborate for the sake of their own interests, united.

We all came to crypto chasing freedom in some form or another. That magic number, art sale, or lucky coin flip that would let us escape — from jobs, oversight, bosses, the grind. Somewhere along the way, our escape became our prison. We traded charts for dinners with friends, stared at screens during real life. Time and attention are the only scarce assets. You can always make another trade, but you can't take back the moment that would have happened otherwise.

The Blackrocks of the world don't need our help making numbers go up. They've got that covered. What they can't replace is culture. They can't manufacture community. Can't fake authentic creation, sacrifice, and human connection.

The true goal of alchemy was never just transmuting lead into gold — it was transmuting the alchemist. Similarly, Radiants exists not merely to create new mechanics or novel art forms, but to transform the people who participate. The art, the programs, the validators, the NFTs, the community infrastructure, the retreats — these are the crucible. The participants are both the alchemists and the substance being transformed.

We refuse false choices. Ancient wisdom or modern technology. Individual sovereignty or collective belonging. Taking things seriously or having a sense of humor about it all. The magic happens in the "yes, and."

The world is filled with ingredients that can be mixed into this crucible: some combinations amplify the worst aspects of digital fragmentation and speculative mania; others create genuine sanctuary and sustainable cultural production. We curate the latter and reject the former, understanding that every reaction generates unpredictable second-order effects in a rapidly changing landscape.

The question isn't whether AI will change everything. It will. The question is who builds the institutions that work after consensus reality, and around what values. The Fourth Turning resolves when someone builds the next thing. It won't look like the last one.

So build something. Make something. Stop transcribing and start composing. Stop watching the chart and pick up the tool. The computers finally do what we dreamed they could do when we were children. We just didn't know we would miss the dreams more than we'd love their fulfillment. But the dreams were never the point. The making was.

![Placeholder: Hands at work — a crucible, a forge, a keyboard, a chisel. The act of making as transformation. Both the alchemist and the substance](/placeholders/making.jpg)

⠀

Be the alchemist and the substance.
`;

// ---------------------------------------------------------------------------
// Export — combined elements from all sections
// ---------------------------------------------------------------------------

export const MANIFESTO_ELEMENTS: ManifestoElement[] = [
  ...parseContent(FORWARD_CONTENT),
  ...parseContent(MAP_TERRITORY_CONTENT),
  ...parseContent(CURATE_REJECT_CONTENT),
  ...parseContent(ALCHEMIST_CONTENT),
];
