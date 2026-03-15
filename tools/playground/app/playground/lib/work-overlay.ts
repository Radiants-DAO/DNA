export type WorkOverlayPhase = "active" | "complete";

const WORK_STATUS_MESSAGES = [
  "modifying",
  "beautifying",
  "polishing pixels",
  "teaching borders manners",
  "sweet-talking the layout",
  "coaxing it into behaving",
  "adding unnecessary drama",
  "making the glow glowier",
];

const STATUS_HOLD_TICKS = 12;
const STATUS_TOTAL_TICKS = WORK_STATUS_MESSAGES.reduce(
  (sum, message) => sum + message.length + STATUS_HOLD_TICKS,
  0,
);

export const WORK_COMPLETION_FLASH_MS = 1150;

function getWorkStatusFrame(tick: number): { message: string; typedLength: number } {
  let cursor = tick % STATUS_TOTAL_TICKS;

  for (const message of WORK_STATUS_MESSAGES) {
    const span = message.length + STATUS_HOLD_TICKS;
    if (cursor < span) {
      return {
        message,
        typedLength: Math.min(cursor + 1, message.length),
      };
    }
    cursor -= span;
  }

  return {
    message: WORK_STATUS_MESSAGES[0],
    typedLength: WORK_STATUS_MESSAGES[0].length,
  };
}

export function shouldStartCompletionFlash(
  previouslyWorking: boolean,
  nextWorking: boolean,
): boolean {
  return previouslyWorking && !nextWorking;
}

export function getWorkOverlayCopy(
  phase: WorkOverlayPhase,
  tick: number,
): {
  eyebrow: string;
  message: string;
  dots: string;
  showCursor: boolean;
} {
  if (phase === "complete") {
    return {
      eyebrow: "Agent Complete",
      message: "completed",
      dots: "",
      showCursor: false,
    };
  }

  const { message, typedLength } = getWorkStatusFrame(tick);

  return {
    eyebrow: "Agent Active",
    message: message.slice(0, typedLength),
    dots: ".".repeat((Math.floor(tick / 4) % 3) + 1),
    showCursor: true,
  };
}
