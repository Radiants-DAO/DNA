export function addEvent(
  el: EventTarget,
  type: string,
  fn: EventListener,
  capturing?: boolean,
) {
  return el.addEventListener(type, fn, capturing);
}

export function removeEvent(
  el: EventTarget,
  type: string,
  fn: EventListener,
  capturing?: boolean,
) {
  return el.removeEventListener(type, fn, capturing);
}

const touch: Record<string, string> = {
  mouseup: "touchend",
  mouseout: "touchend",
  mousedown: "touchstart",
  mousemove: "touchmove",
};

type MouseType = "mouseup" | "mouseout" | "mousedown" | "mousemove";

export type TouchyEvent = MouseEvent & TouchEvent;

type EventBinder = (
  el: EventTarget,
  type: string,
  fn: EventListener,
  capturing?: boolean,
) => void;

export function touchy(
  el: EventTarget,
  event: EventBinder,
  type: MouseType,
  fn: (evt: TouchyEvent) => void,
) {
  event(el, touch[type], fn as EventListener);
  event(el, type, fn as EventListener);
}
