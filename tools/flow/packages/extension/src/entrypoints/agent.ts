import { FLOW_MESSAGE_SOURCE, type AgentPongMessage } from '@flow/shared';
// Import inspection handlers (sets up message listeners)
import '../agent/index';

export default defineUnlistedScript({
  main() {
    /**
     * Agent script — runs in the page's MAIN world.
     * Has access to window globals (React, gsap, etc.)
     * Communicates with content script via window.postMessage.
     *
     * Handles:
     * - content:ping → agent:pong (global detection)
     * - flow:content:request-fiber → flow:agent:fiber-result (inspection)
     */

    function detectGlobals(): string[] {
      const globals: string[] = [];
      const win = window as unknown as Record<string, unknown>;

      if (win.__REACT_DEVTOOLS_GLOBAL_HOOK__) globals.push('React');
      if (win.gsap) globals.push('gsap');
      if (win.__NEXT_DATA__) globals.push('Next.js');
      if (win.__NUXT__) globals.push('Nuxt');
      if (win.__VUE__) globals.push('Vue');
      if (win.__REACT_GRAB__) globals.push('React Grab');

      return globals;
    }

    // Listen for pings from content script
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.origin !== window.location.origin) return;
      if (
        !event.data ||
        event.data.source !== FLOW_MESSAGE_SOURCE ||
        event.data.type !== 'content:ping'
      ) {
        return;
      }

      const pong: AgentPongMessage = {
        type: 'agent:pong',
        source: FLOW_MESSAGE_SOURCE,
        payload: {
          timestamp: Date.now(),
          globals: detectGlobals(),
        },
      };
      window.postMessage(pong, window.location.origin);
    });
  },
});
