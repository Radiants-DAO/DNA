# Building a React component visual editor: Architecture deep dive

**For an infinite canvas displaying React component previews with near-instant updates, the optimal architecture combines CSS transform scaling for live previews, Vite's ESM-based HMR for sub-50ms refreshes, and the Storybook manager/preview iframe separation pattern.** Rust/WASM renderers like Vello are overkill—start with JavaScript canvas libraries. The critical "click-to-source" mapping requires Babel's `__source` injection plus fiber tree walking via the Bippy library.

---

## Rust/WASM canvas renderers: mostly unnecessary for your use case

The Rust ecosystem offers compelling GPU-accelerated rendering options, but **your core problem—displaying pre-rendered DOM thumbnails—doesn't require them**. You're blitting rasterized images, not computing complex vector paths.

**Vello** (formerly piet-gpu) provides GPU compute-based 2D rendering via wgpu. It compiles to WASM and now includes `vello_cpu` with SIMD optimizations for devices without WebGPU. Browser support reached a tipping point in late 2025: Chrome 113+, Firefox 141+, Safari 26+, and Edge all support WebGPU. However, Vello's documentation warns "WebGPU implementations are incomplete" and "web is not primary target." The API is clean—build a `Scene`, call `render_to_texture()`—but you'd need substantial wgpu knowledge. **Verdict: watch for 6-12 months; consider if you hit JS performance walls.**

**Makepad** is a complete Rust UI framework, not an extractable renderer. It uses WebGL (broader compatibility than WebGPU), produces tiny WASM output (~few hundred KB), and supports live design reload. But it requires rebuilding your entire editor in Makepad's DSL. **Verdict: skip—too tightly coupled.**

**Graphite** demonstrates the viable pattern: Rust WASM for computation, JavaScript for UI chrome. Their infinite canvas achieves resolution-independent rendering by treating artwork as data (always redrawn at viewing resolution). Currently integrating Vello as their rendering backend. **Verdict: study the architecture patterns, don't use directly.**

**wgpu** is production-ready (powers Firefox, Servo, Deno) with WebGL2 fallback on WASM. But it's a low-level GPU API—significant learning curve for displaying thumbnails. **Lyon** handles path tessellation for custom vector rendering; irrelevant for DOM captures.

| Tool | WASM Ready | Recommendation |
|------|------------|----------------|
| Vello | Yes (WebGPU) | Watch—revisit when WebGPU matures |
| Makepad | Yes (WebGL) | Skip—requires full framework buy-in |
| Graphite | Yes | Study architecture patterns only |
| wgpu | Yes | Only if building custom GPU rendering |
| Lyon | Yes | Skip—overkill for DOM captures |

**Start with Pixi.js or React-Konva** for your infinite canvas. Graduate to Rust/WASM only if you need compute-intensive layout algorithms or hit specific bottlenecks with 500+ visible thumbnails.

---

## Fast refresh architecture: the 30-50ms target is achievable

Vite's approach eliminates the primary bottleneck: **no bundling during development**. The browser handles module resolution via native `import` statements while Vite transforms on-demand. Dependencies get pre-bundled once at startup using esbuild (20-30x faster than JS bundlers).

### The HMR boundary detection algorithm

Vite's `propagateUpdate` function in `packages/vite/src/node/server/hmr.ts` walks the module graph:

1. Start with updated module
2. Walk up the importer chain recursively
3. Find HMR boundaries—modules calling `import.meta.hot.accept()`
4. Stop propagation at self-accepting modules
5. If root HTML is reached without boundary → full reload

The HMR client (`/@vite/client`) maintains a WebSocket connection, receives `update`/`full-reload`/`prune` messages, calls `dispose()` callbacks, dynamically imports the new module with a cache-busting timestamp (`?t=123`), then calls `accept()` callbacks.

### React Fast Refresh's state preservation

The Babel plugin transforms every component to track "signatures":

```javascript
// After transform
var _s = $RefreshSig$();
function App() {
  _s();
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
_s(App, "useState{count}");  // Hook signature
$RefreshReg$(App, "App");    // Component registration
```

**State is preserved** if the hook signature matches. `useState`/`useRef` values survive; `useEffect`/`useMemo`/`useCallback` always re-run. Class components get remounted (no state preservation).

### The complete pipeline achieves 30-70ms

```
File save → Chokidar detects (~1-5ms)
  → Module graph invalidation (~1-2ms)
  → WebSocket message to browser (~1ms)
  → Browser imports new module (~10-30ms)
  → React reconciliation (~10-30ms)
```

**Sandpack** runs entirely client-side within an iframe, using Web Workers for parallelized transpilation and a CDN for pre-bundled npm dependencies. The `sandpack-client` package is framework-agnostic and can be used standalone:

```javascript
import { loadSandpackClient } from "@codesandbox/sandpack-client";
const client = await loadSandpackClient(iframe, { files, entry, dependencies });
client.updateSandbox({ files: { "/App.js": { code: newCode } } });
```

The bundler can be self-hosted via the `bundlerURL` option. Good for embedded playgrounds; for a full visual editor, Vite's approach is more appropriate.

---

## DOM capture: CSS scaling beats html2canvas for live previews

**html2canvas does NOT take screenshots**—it reads computed styles and manually redraws every element onto canvas. Performance degrades catastrophically: monday.com measured **21 seconds for 10 dashboard widgets**. GitHub issues report 8 seconds for 883 DOM nodes, 66 seconds for 2,660 nodes. It blocks the main thread and doesn't support CSS animations, complex filters, or pseudo-elements reliably.

### CSS transform scale() is the correct approach

For live previews of 50-100 components, display the actual DOM scaled down:

```css
.preview-container {
  transform: scale(0.2);
  transform-origin: left top;
  will-change: transform;
}
```

**Why this works:** CSS transforms are GPU-composited—no main-thread blocking, no CPU repainting. An 800×600 RGBA texture costs ~1.9 MB GPU memory; 100 previews use ~190 MB (acceptable on modern devices). Updates are automatic and instant—no capture step needed.

**The architecture:**
```
┌─────────────────────────────────────────┐
│           Infinite Canvas               │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │0.2x │ │0.2x │ │0.2x │ │0.2x │       │
│  │Live │ │Live │ │Live │ │Live │       │
│  │DOM  │ │DOM  │ │DOM  │ │DOM  │       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
│        (GPU Composited Layers)          │
└─────────────────────────────────────────┘
```

Use virtualization to render only visible previews plus a buffer. Only capture to actual images (via `modern-screenshot`, a fork of html-to-image with better reliability) when exporting or generating static thumbnails.

### Cross-origin iframes have no good client-side solution

Cross-origin iframe content **cannot be captured programmatically**. The Element Capture API (Chrome 121+, experimental) requires user permission prompts. Same-origin iframes can use `iframe.contentDocument` access with html2canvas, but still inherit all performance limitations. For third-party iframe content, you need server-side rendering via Puppeteer or require the iframe to opt-in via postMessage.

---

## Existing tool architectures: what to extract from each

### Utopia: bidirectional code-canvas sync done right

Utopia maintains full two-way synchronization—visual changes write back to actual React code, selecting elements moves the cursor to corresponding JSX. Key files in `editor/src/templates/editor-canvas.tsx` show their coordinate system handling: `canvasPositionRaw`, `canvasPositionRounded`, `windowPosition` with an `elementsToRerender: []` optimization pattern.

**Extract:** The element-to-render tracking pattern and component property override system.
**Skip:** The nix-shell build complexity, heavy server dependencies, and Monaco worker build issues. Performance is noted as "sometimes very significantly slower."

### Sandpack: iframe communication done right

The three-runtime architecture (`SandpackRuntime` for frontend, `SandpackNode` for Node.js via Nodebox, `SandpackStatic` for vanilla HTML) shows clear separation. The `dispatch()`/`listen()` protocol handles file updates, compile status, and errors. Security isolation runs the bundler on a different subdomain.

**Extract:** The iframe communication protocol, hot reload triggers via `updateSandbox()`, Web Worker transpilation pattern.
**Skip:** Not designed for bidirectional visual editing—it's read-only preview.

### Plasmic: the wrapper pattern is brilliant

Plasmic separates presentation (generated, overwritable) from behavior (developer-owned, never touched):

```typescript
// Plasmic generates: PlasmicButton (presentation)
// You create: Button (wrapper)
export function Button(props) {
  return <PlasmicButton onClick={handleClick} {...props} />;
}
```

The component registration API defines props with types, defaults, and slots:

```typescript
PLASMIC.registerComponent(MyComponent, {
  name: 'Hero',
  props: { title: 'string', children: 'slot' }
});
```

**Extract:** The wrapper/blackbox separation, slot system via `repeatedElement()`, and `PlasmicCanvasContext` to disable effects when rendering in the editor.
**Skip:** The complex variant system and build-time codegen workflow.

### Storybook: manager/preview separation as the template

```
Manager (UI) ←→ Event Channel ←→ Preview (iframe)
     ↓                              ↓
  Addons                        Stories/Components
```

The Manager is pre-built React UI (cached, no HMR needed). The Preview iframe uses the project's framework with full Vite/Webpack HMR. Communication uses an event-bus pattern: `UPDATE_STORY_ARGS`, `FORCE_REMOUNT`, `STORY_PREPARED`. The decorator pattern wraps stories with context providers; loaders handle async data before render.

**Extract:** Manager/preview separation, event channel pattern, decorator pattern.
**Skip:** Multi-framework support complexity, MDX documentation mode.

---

## React fiber walking: mapping DOM to source without DevTools

The minimum instrumentation for "this DOM element came from line X of file Y" requires **Babel's source transform plus runtime fiber access**.

### The `_debugSource` prop

`@babel/preset-react` with `development: true` injects source locations:

```javascript
// Output
<div __source={{
  fileName: '/path/Component.tsx',
  lineNumber: 10,
  columnNumber: 6
}} />
```

This populates `fiber._debugSource` in development builds. For production-like environments, use `@react-dev-inspector/babel-plugin` which injects data attributes that survive to runtime:

```html
<div 
  data-inspector-relative-path="src/Component.tsx"
  data-inspector-line="10"
  data-inspector-column="6"
/>
```

### Fiber access without React DevTools

The **Bippy library** (~3kb) is the cleanest solution. Install your own hook before React loads:

```javascript
import { getFiberFromHostInstance, traverseFiber, getDisplayName } from 'bippy';

const fiber = getFiberFromHostInstance(clickedElement);
const componentFiber = traverseFiber(fiber, isCompositeFiber, true);
const source = componentFiber._debugSource;
// { fileName: '/path/to/file.tsx', lineNumber: 42, columnNumber: 5 }
```

You can also access fibers directly via the secret internal property (changes across React versions):

```javascript
const fiber = element[Object.keys(element).find(key => 
  key.startsWith('__reactFiber$') || 
  key.startsWith('__reactInternalInstance$')
)];
```

### The click-to-source pipeline

1. User Option+clicks element
2. `getFiberFromHostInstance(element)` returns fiber
3. Walk up to composite fiber (has `_debugSource`)
4. Open editor: `vscode://file/${source.fileName}:${source.lineNumber}:${source.columnNumber}`

**Third-party components** from node_modules won't have `_debugSource` unless compiled with dev mode. Solution: walk up the tree to find the first-party parent with source info; display component name via `getDisplayName(fiber.type)` as fallback.

---

## Recommended architecture for your visual editor

```
┌─────────────────────────────────────────────────────────┐
│                    MANAGER (Editor UI)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Code Editor │  │   Infinite   │  │  Component    │  │
│  │  (Monaco)   │  │    Canvas    │  │   Registry    │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└───────────────────────────┬─────────────────────────────┘
                            │ Event Channel (postMessage)
                            ↓
┌─────────────────────────────────────────────────────────┐
│              PREVIEW IFRAME (Component Renderer)         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │    Vite     │  │ React Fast   │  │    Bippy      │  │
│  │  Dev Server │  │   Refresh    │  │ Fiber Walker  │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key implementation decisions

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| Canvas rendering | Pixi.js or React-Konva | Proven, sufficient for 100+ thumbnails |
| Live previews | CSS `transform: scale()` | Zero capture overhead, GPU-composited |
| HMR pipeline | Vite + React Fast Refresh | 30-50ms updates, proven architecture |
| Iframe communication | Storybook's event channel pattern | Decoupled, well-tested |
| Code ↔ visual sync | Plasmic's wrapper pattern | Clean separation of presentation/behavior |
| Click-to-source | Bippy + Babel source transform | 3kb, works without DevTools |
| Export/thumbnails | modern-screenshot (on-demand) | Best reliability of capture libraries |

### What to build vs what to steal

**Build yourself:**
- The infinite canvas viewport and pan/zoom (specific to your needs)
- Component registry with props schema
- Event channel bridging editor ↔ preview

**Steal directly:**
- Sandpack's `dispatch()`/`listen()` protocol pattern
- Bippy's fiber walking utilities
- Storybook's decorator/loader patterns
- Plasmic's wrapper component architecture

**Skip entirely:**
- Rust/WASM renderers (premature optimization)
- html2canvas for live previews (too slow)
- WebContainers/Nodebox (proprietary, overkill)
- Utopia's full architecture (too coupled)

---

## Conclusion

The fastest path to a working visual editor combines **established JavaScript tools** rather than cutting-edge Rust/WASM renderers. CSS scaling solves the live preview problem without expensive captures. Vite's ESM-based HMR achieves sub-50ms updates when combined with React Fast Refresh. The Storybook manager/preview iframe pattern provides clean architectural separation, while Bippy enables click-to-source without requiring React DevTools.

The key insight from Plasmic—separating generated presentation from developer-owned behavior—solves the bidirectional sync problem elegantly. Start simple, instrument everything for performance measurement, and only reach for Vello/wgpu if you identify specific GPU-bound bottlenecks with 500+ visible components.