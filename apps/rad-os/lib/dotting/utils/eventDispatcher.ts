// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (...args: any[]) => void;

class DottingEvent {
  private name: string;
  callbacks: Array<EventCallback>;

  constructor(name: string) {
    this.name = name;
    this.callbacks = [];
  }

  on(cb: EventCallback) {
    this.callbacks.push(cb);
  }

  off(cb: EventCallback) {
    const idx = this.callbacks.findIndex(callback => callback === cb);
    if (idx !== -1) {
      this.callbacks.splice(idx, 1);
    }
  }

  toString() {
    return this.name;
  }
}

export default class EventDispatcher {
  events: { [name: string]: DottingEvent };

  constructor() {
    this.events = {};
  }

  emit(name: string, ...args: Array<unknown>) {
    if (!this.events[name]) {
      return;
    }

    this.events[name].callbacks.forEach(cb => {
      cb(...args);
    });
  }

  addEventListener(name: string, cb: EventCallback): void {
    if (!this.events[name]) {
      this.events[name] = new DottingEvent(name);
    }

    this.events[name].on(cb);
  }

  removeEventListener(name: string, cb?: EventCallback) {
    if (!cb) {
      delete this.events[name];
      return;
    }

    this.events[name]?.off(cb);
  }
}
