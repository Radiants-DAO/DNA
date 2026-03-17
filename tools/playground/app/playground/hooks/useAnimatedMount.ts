"use client";

import { useEffect, useRef, useState } from "react";

type AnimState = "unmounted" | "entering" | "entered" | "exiting";

interface UseAnimatedMountOptions {
  enterDuration?: number;  // ms to wait before setting "entered" (should match CSS animation)
  exitDuration?: number;   // ms to wait before unmounting after exit starts
}

/**
 * State machine for CSS-based enter/exit animations.
 * "unmounted" → "entering" → "entered" → "exiting" → "unmounted"
 *
 * Usage:
 *   const { mounted, animState } = useAnimatedMount(isOpen, { enterDuration: 200, exitDuration: 150 });
 *   return mounted ? <div data-anim={animState}>...</div> : null;
 *
 * Apply animations in CSS via [data-anim="entering"], [data-anim="exiting"] selectors.
 */
export function useAnimatedMount(
  isOpen: boolean,
  { enterDuration = 200, exitDuration = 150 }: UseAnimatedMountOptions = {}
) {
  const [animState, setAnimState] = useState<AnimState>(
    isOpen ? "entered" : "unmounted"
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isOpen) {
      if (animState === "unmounted") {
        setAnimState("entering");
        timerRef.current = setTimeout(() => setAnimState("entered"), enterDuration);
      } else if (animState === "exiting") {
        setAnimState("entering");
        timerRef.current = setTimeout(() => setAnimState("entered"), enterDuration);
      }
    } else {
      if (animState === "entering" || animState === "entered") {
        setAnimState("exiting");
        timerRef.current = setTimeout(() => setAnimState("unmounted"), exitDuration);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    mounted: animState !== "unmounted",
    animState,
    isEntering: animState === "entering",
    isEntered: animState === "entered",
    isExiting: animState === "exiting",
  };
}
