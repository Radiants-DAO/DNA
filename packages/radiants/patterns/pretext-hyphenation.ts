/**
 * Pretext Hyphenation — English syllable hyphenation for justified text.
 *
 * Injects soft hyphens (\u00AD) at syllable boundaries so that pretext's
 * line-breaking can split words mid-syllable. Used by the Knuth-Plass
 * optimal layout engine to produce dramatically better justification.
 *
 * Approach: exception dictionary (~120 common multi-syllable words) +
 * prefix/suffix fallback heuristics. Words under 5 characters pass through
 * unchanged.
 *
 * Reference: chenglou.me/pretext/justification-comparison/
 *
 * Usage:
 *   import { hyphenateText } from '@rdna/radiants/patterns/pretext-hyphenation'
 *   const softHyphenated = hyphenateText('The relationship between typographic colour')
 *   // → 'The re\u00ADla\u00ADtion\u00ADship be\u00ADtween ty\u00ADpo\u00ADgraph\u00ADic col\u00ADour'
 */

// ---------------------------------------------------------------------------
// Exception dictionary — common English words with known syllable breaks
// ---------------------------------------------------------------------------

const HYPHEN_EXCEPTIONS: Record<string, string[]> = {
  'extensively': ['ex','ten','sive','ly'],
  'relationship': ['re','la','tion','ship'],
  'typographic': ['ty','po','graph','ic'],
  'comfortable': ['com','fort','a','ble'],
  'horizontal': ['hor','i','zon','tal'],
  'vertically': ['ver','ti','cal','ly'],
  'disrupting': ['dis','rupt','ing'],
  'comprehension': ['com','pre','hen','sion'],
  'traditional': ['tra','di','tion','al'],
  'combination': ['com','bi','na','tion'],
  'techniques': ['tech','niques'],
  'hyphenation': ['hy','phen','a','tion'],
  'dictionaries': ['dic','tion','ar','ies'],
  'permitted': ['per','mit','ted'],
  'syllable': ['syl','la','ble'],
  'boundaries': ['bound','a','ries'],
  'letterspacing': ['let','ter','spac','ing'],
  'adjustments': ['ad','just','ments'],
  'distributed': ['dis','trib','u','ted'],
  'additional': ['ad','di','tion','al'],
  'individual': ['in','di','vid','u','al'],
  'characters': ['char','ac','ters'],
  'significantly': ['sig','nif','i','cant','ly'],
  'optimization': ['op','ti','mi','za','tion'],
  'evaluated': ['e','val','u','at','ed'],
  'thousands': ['thou','sands'],
  'possible': ['pos','si','ble'],
  'arrangement': ['ar','range','ment'],
  'minimizing': ['min','i','miz','ing'],
  'deviation': ['de','vi','a','tion'],
  'paragraph': ['par','a','graph'],
  'algorithm': ['al','go','rithm'],
  'developed': ['de','vel','oped'],
  'typesetting': ['type','set','ting'],
  'constructs': ['con','structs'],
  'feasible': ['fea','si','ble'],
  'breakpoints': ['break','points'],
  'produces': ['pro','du','ces'],
  'uniform': ['u','ni','form'],
  'throughout': ['through','out'],
  'simplified': ['sim','pli','fied'],
  'implementation': ['im','ple','men','ta','tion'],
  'dramatically': ['dra','mat','i','cal','ly'],
  'processors': ['proc','es','sors'],
  'justification': ['jus','ti','fi','ca','tion'],
  'operates': ['op','er','ates'],
  'strictly': ['strict','ly'],
  'distributes': ['dis','trib','utes'],
  'remaining': ['re','main','ing'],
  'uniformly': ['u','ni','form','ly'],
  'requires': ['re','quires'],
  'lookahead': ['look','a','head'],
  'executes': ['ex','e','cutes'],
  'quickly': ['quick','ly'],
  'inconsistent': ['in','con','sis','tent'],
  'particularly': ['par','tic','u','lar','ly'],
  'enormous': ['e','nor','mous'],
  'preceding': ['pre','ced','ing'],
  'compositor': ['com','pos','i','tor'],
  'twentieth': ['twen','ti','eth'],
  'century': ['cen','tu','ry'],
  'perceived': ['per','ceived'],
  'streaks': ['streaks'],
  'scanning': ['scan','ning'],
  'impediment': ['im','ped','i','ment'],
  'addressed': ['ad','dressed'],
  'combinations': ['com','bi','na','tions'],
  'measuring': ['meas','ur','ing'],
  'measurable': ['meas','ur','a','ble'],
  'reading': ['read','ing'],
  'spacing': ['spac','ing'],
  'between': ['be','tween'],
  'excessive': ['ex','ces','sive'],
  'aesthetic': ['aes','thet','ic'],
  'merely': ['mere','ly'],
  'constitute': ['con','sti','tute'],
  'lateral': ['lat','er','al'],
  'skilled': ['skilled'],
  'readers': ['read','ers'],
  'depend': ['de','pend'],
  'studying': ['stud','y','ing'],
  'studied': ['stud','ied'],
  'comfort': ['com','fort'],
  'colour': ['col','our'],
  'working': ['work','ing'],
  'horrified': ['hor','ri','fied'],
  'especially': ['es','pe','cial','ly'],
  'precisely': ['pre','cise','ly'],
  'browsers': ['brows','ers'],
  'modern': ['mod','ern'],
  'approach': ['ap','proach'],
  'wildly': ['wild','ly'],
  'columns': ['col','umns'],
  'single': ['sin','gle'],
  'standard': ['stan','dard'],
  'michael': ['mi','cha','el'],
  'donald': ['don','ald'],
  'remains': ['re','mains'],
  'system': ['sys','tem'],
  'rather': ['rath','er'],
  'greedily': ['greed','i','ly'],
  'filling': ['fill','ing'],
  'shortest': ['short','est'],
  'results': ['re','sults'],
  'greedy': ['greed','y'],
  'number': ['num','ber'],
  'completely': ['com','plete','ly'],
  'different': ['dif','fer','ent'],
  'problem': ['prob','lem'],
  'amounts': ['a','mounts'],
  'entire': ['en','tire'],
  'global': ['glob','al'],
  'metal': ['met','al'],
  'every': ['ev','ery'],
  'inter': ['in','ter'],
  // Manifesto-domain words
  'permanence': ['per','ma','nence'],
  'ephemera': ['e','phem','er','a'],
  'community': ['com','mu','ni','ty'],
  'isolation': ['i','so','la','tion'],
  'consumption': ['con','sump','tion'],
  'creation': ['cre','a','tion'],
  'sacrifice': ['sac','ri','fice'],
  'commitment': ['com','mit','ment'],
  'monument': ['mon','u','ment'],
  'accumulated': ['ac','cu','mu','lat','ed'],
  'collaborative': ['col','lab','o','ra','tive'],
  'ownership': ['own','er','ship'],
  'narrative': ['nar','ra','tive'],
  'expanding': ['ex','pand','ing'],
  'participant': ['par','tic','i','pant'],
  'ecosystem': ['e','co','sys','tem'],
  'beginning': ['be','gin','ning'],
  'together': ['to','geth','er'],
  'collectors': ['col','lec','tors'],
  'significance': ['sig','nif','i','cance'],
  'physical': ['phys','i','cal'],
  'counterparts': ['coun','ter','parts'],
  'contributions': ['con','tri','bu','tions'],
  'representing': ['rep','re','sent','ing'],
  'stewards': ['stew','ards'],
  'digital': ['dig','i','tal'],
  'offering': ['of','fer','ing'],
  'offerings': ['of','fer','ings'],
  'substance': ['sub','stance'],
  'becoming': ['be','com','ing'],
  'manifesto': ['man','i','fes','to'],
  'architecture': ['ar','chi','tec','ture'],
  'experience': ['ex','pe','ri','ence'],
  'connection': ['con','nec','tion'],
  'authentic': ['au','then','tic'],
  'intentional': ['in','ten','tion','al'],
  'meaningful': ['mean','ing','ful'],
  'beautiful': ['beau','ti','ful'],
  'powerful': ['pow','er','ful'],
  'everything': ['ev','ery','thing'],
  'something': ['some','thing'],
  'nothing': ['noth','ing'],
  'anything': ['any','thing'],
  'wherever': ['wher','ev','er'],
  'whatever': ['what','ev','er'],
  'however': ['how','ev','er'],
  'another': ['an','oth','er'],
  'important': ['im','por','tant'],
  'impossible': ['im','pos','si','ble'],
  'invisible': ['in','vis','i','ble'],
  'understand': ['un','der','stand'],
  'underneath': ['un','der','neath'],
  'remember': ['re','mem','ber'],
  'different': ['dif','fer','ent'],
  'permanent': ['per','ma','nent'],
  'temporary': ['tem','po','rar','y'],
  'necessary': ['nec','es','sar','y'],
  'ordinary': ['or','di','nar','y'],
  'extraordinary': ['ex','tra','or','di','nar','y'],
};

// ---------------------------------------------------------------------------
// Prefix / suffix fallback lists
// ---------------------------------------------------------------------------

const PREFIXES = [
  'anti','auto','be','bi','co','com','con','contra','counter','de','dis',
  'en','em','ex','extra','fore','hyper','il','im','in','inter','intra',
  'ir','macro','mal','micro','mid','mis','mono','multi','non','omni',
  'out','over','para','poly','post','pre','pro','pseudo','quasi','re',
  'retro','semi','sub','super','sur','syn','tele','trans','tri','ultra',
  'un','under',
];

const SUFFIXES = [
  'able','ible','tion','sion','ment','ness','ous','ious','eous','ful',
  'less','ive','ative','itive','al','ial','ical','ing','ling','ed',
  'er','est','ism','ist','ity','ety','ty','ence','ance','ly','fy',
  'ify','ize','ise','ure','ture',
];

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Split a word into syllable parts. Returns a single-element array
 * if the word cannot be hyphenated (too short or no pattern match).
 */
export function hyphenateWord(word: string): string[] {
  // Strip punctuation for dictionary lookup, preserve for reconstruction
  const punctMatch = word.match(/^([.,;:!?"'""''—–\-]*)(.+?)([.,;:!?"'""''—–\-]*)$/);
  if (!punctMatch) return [word];

  const leading = punctMatch[1]!;
  const core = punctMatch[2]!;
  const trailing = punctMatch[3]!;
  const lower = core.toLowerCase();

  if (lower.length < 5) return [word];

  // Dictionary lookup
  const exc = HYPHEN_EXCEPTIONS[lower];
  if (exc) {
    const parts: string[] = [];
    let pos = 0;
    for (const part of exc) {
      parts.push(core.slice(pos, pos + part.length));
      pos += part.length;
    }
    // Reattach any remaining chars (safety)
    if (pos < core.length) {
      parts[parts.length - 1] += core.slice(pos);
    }
    // Reattach punctuation to first/last parts
    if (leading) parts[0] = leading + parts[0]!;
    if (trailing) parts[parts.length - 1] += trailing;
    return parts.filter(p => p.length > 0);
  }

  // Prefix fallback
  for (const prefix of PREFIXES) {
    if (lower.startsWith(prefix) && lower.length - prefix.length >= 3) {
      const cut = prefix.length;
      return [
        leading + core.slice(0, cut),
        core.slice(cut) + trailing,
      ];
    }
  }

  // Suffix fallback
  for (const suffix of SUFFIXES) {
    if (lower.endsWith(suffix) && lower.length - suffix.length >= 3) {
      const cut = core.length - suffix.length;
      return [
        leading + core.slice(0, cut),
        core.slice(cut) + trailing,
      ];
    }
  }

  return [word];
}

/**
 * Inject soft hyphens (\u00AD) at syllable boundaries throughout a text.
 * Whitespace tokens pass through unchanged. Words under 5 characters
 * are not hyphenated.
 */
export function hyphenateText(text: string): string {
  const tokens = text.split(/(\s+)/);
  return tokens.map(token => {
    if (/^\s+$/.test(token)) return token;
    const parts = hyphenateWord(token);
    return parts.length <= 1 ? token : parts.join('\u00AD');
  }).join('');
}
