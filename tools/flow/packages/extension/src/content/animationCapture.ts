import type { AnimationData } from '@flow/shared';

/**
 * Build a CSS selector string for an element (best effort).
 */
function selectorFor(el: Element): string {
  if (el.id) return `#${el.id}`;
  if (el.className && typeof el.className === 'string') {
    const classes = el.className.trim().split(/\s+/).slice(0, 2).join('.');
    if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
  }
  return el.tagName.toLowerCase();
}

/**
 * Capture all active animations on an element.
 */
export function captureAnimations(element: Element): AnimationData[] {
  const animations: AnimationData[] = [];
  const selector = selectorFor(element);

  // 1. Web Animations API (covers CSS animations and WAAPI)
  try {
    const webAnimations = element.getAnimations({ subtree: false });
    for (const anim of webAnimations) {
      const timing = anim.effect?.getComputedTiming();
      const keyframes = (anim.effect as KeyframeEffect)?.getKeyframes?.() ?? [];

      const isCSSAnimation = anim instanceof CSSAnimation;
      const isCSSTransition = anim instanceof CSSTransition;

      animations.push({
        name: isCSSAnimation
          ? (anim as CSSAnimation).animationName
          : isCSSTransition
            ? (anim as CSSTransition).transitionProperty
            : anim.id || 'anonymous',
        type: isCSSAnimation
          ? 'css-animation'
          : isCSSTransition
            ? 'css-transition'
            : 'web-animation',
        target: selector,
        duration: (timing?.duration as number) ?? 0,
        delay: timing?.delay ?? 0,
        easing: (timing as ComputedEffectTiming & { easing?: string })?.easing ?? 'linear',
        playState: anim.playState,
        currentTime: anim.currentTime as number | null,
        keyframes: keyframes.map((kf) => {
          const entry: Record<string, string> = {};
          for (const [key, val] of Object.entries(kf)) {
            if (
              key !== 'offset' &&
              key !== 'computedOffset' &&
              key !== 'easing' &&
              key !== 'composite' &&
              val !== undefined &&
              val !== null
            ) {
              entry[key] = String(val);
            }
          }
          return entry;
        }),
      });
    }
  } catch {
    // getAnimations not supported or errored
  }

  // 2. CSS transition properties (for elements not currently transitioning but configured)
  try {
    const computed = getComputedStyle(element);
    const transitionProp = computed.transitionProperty;
    const transitionDur = computed.transitionDuration;

    if (transitionProp && transitionProp !== 'none' && transitionProp !== 'all') {
      const props = transitionProp.split(',').map((s) => s.trim());
      const durs = transitionDur.split(',').map((s) => parseFloat(s) * 1000);
      const easings = computed.transitionTimingFunction.split(',').map((s) => s.trim());
      const delays = computed.transitionDelay.split(',').map((s) => parseFloat(s) * 1000);

      for (let i = 0; i < props.length; i++) {
        // Skip if already captured by getAnimations
        if (animations.some((a) => a.type === 'css-transition' && a.name === props[i])) {
          continue;
        }

        const dur = durs[i % durs.length];
        if (dur <= 0) continue;

        animations.push({
          name: props[i],
          type: 'css-transition',
          target: selector,
          duration: dur,
          delay: delays[i % delays.length] || 0,
          easing: easings[i % easings.length] || 'ease',
          playState: 'configured', // Not actively running
          currentTime: null,
          keyframes: [],
        });
      }
    }
  } catch {
    // Style reading failed
  }

  // 3. GSAP detection (via window.gsap or window.__FLOW_GSAP__)
  try {
    const win = window as unknown as Record<string, unknown>;
    const gsap = win.gsap || win.__FLOW_GSAP__;
    if (gsap && typeof gsap === 'object' && 'globalTimeline' in gsap) {
      const timeline = (gsap as { globalTimeline: { getChildren: (a: boolean, b: boolean, c: boolean) => GsapTween[] } }).globalTimeline;
      const tweens = timeline.getChildren(true, true, false);
      for (const tween of tweens) {
        const targets = tween.targets?.() ?? [];
        if (!targets.includes(element)) continue;

        const vars = tween.vars ?? {};
        animations.push({
          name: vars.id || 'gsap-tween',
          type: 'gsap',
          target: selector,
          duration: (tween.duration?.() ?? 0) * 1000,
          delay: (tween.delay?.() ?? 0) * 1000,
          easing: vars.ease || 'power1.out',
          playState: tween.isActive?.() ? 'running' : 'paused',
          currentTime: (tween.time?.() ?? 0) * 1000,
          keyframes: [],
        });
      }
    }
  } catch {
    // GSAP not available
  }

  return animations;
}

/** Internal type for GSAP tween shape */
interface GsapTween {
  targets?: () => Element[];
  vars?: { id?: string; ease?: string };
  duration?: () => number;
  delay?: () => number;
  time?: () => number;
  isActive?: () => boolean;
}
