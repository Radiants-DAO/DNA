import type { ComponentScanResult } from '@flow/shared';

/**
 * Scan all components from the inspected page via inspectedWindow.eval().
 * Tiered detection: React fibers → Vue → Svelte → Custom Elements → HTML landmarks.
 */
export async function scanComponents(): Promise<ComponentScanResult> {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(
      `(function() {
        var components = [];
        var framework = undefined;

        // ── Tier 1: React fiber tree ──
        var hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (hook) {
          framework = 'react';
          try {
            // Iterate ALL renderers — don't hardcode renderer ID.
            // hook._renderers is a Map<number, Renderer>. Each renderer
            // has its own set of fiber roots via hook.getFiberRoots(id).
            var rendererIds = hook._renderers ? Array.from(hook._renderers.keys()) : [];

            function walkFiber(fiber) {
              if (!fiber) return;
              var node = fiber;
              while (node) {
                if ((node.tag === 0 || node.tag === 1) && node.type) {
                  var name = node.type.displayName || node.type.name || null;
                  if (name && name[0] !== '_' && name[0] === name[0].toUpperCase()) {
                    var sel = '';
                    if (node.stateNode instanceof HTMLElement) {
                      sel = node.stateNode.tagName.toLowerCase();
                      if (node.stateNode.id) sel += '#' + node.stateNode.id;
                    }
                    var source = node._debugSource ? {
                      fileName: node._debugSource.fileName,
                      lineNumber: node._debugSource.lineNumber,
                      columnNumber: node._debugSource.columnNumber || 0
                    } : undefined;
                    components.push({ name: name, framework: 'react', selector: sel, instances: 1, source: source });
                  }
                }
                walkFiber(node.child);
                node = node.sibling;
              }
            }

            // Fallback: if _renderers is empty, try __reactFiber$ key approach
            // (same pattern as fiberWalker.ts:58-64 — works without DevTools hook)
            if (rendererIds.length === 0) {
              var visited = new Set();
              var allEls = document.querySelectorAll('*');
              for (var i = 0; i < allEls.length; i++) {
                var el = allEls[i];
                var keys = Object.keys(el);
                var fiberKey = null;
                for (var k = 0; k < keys.length; k++) {
                  if (keys[k].indexOf('__reactFiber$') === 0 || keys[k].indexOf('__reactInternalInstance$') === 0) {
                    fiberKey = keys[k];
                    break;
                  }
                }
                if (fiberKey) {
                  var fiber = el[fiberKey];
                  // Walk up to root
                  while (fiber && fiber.return) fiber = fiber.return;
                  if (fiber && !visited.has(fiber)) {
                    visited.add(fiber);
                    walkFiber(fiber);
                  }
                }
              }
            }

            // Primary path: iterate each renderer's fiber roots
            for (var ri = 0; ri < rendererIds.length; ri++) {
              var fiberRoots = hook.getFiberRoots ? hook.getFiberRoots(rendererIds[ri]) : null;
              if (!fiberRoots) continue;
              fiberRoots.forEach(function(root) {
                walkFiber(root.current);
              });
            }
          } catch(e) {}
        }

        // Query all elements once for Tier 2-4 scans
        var allPageEls = document.querySelectorAll('*');

        // ── Tier 2: Vue components ──
        if (window.__VUE__ || window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
          framework = framework || 'vue';
          for (var i = 0; i < allPageEls.length; i++) {
            var vm = allPageEls[i].__vue__ || allPageEls[i].__vueParentComponent;
            if (vm) {
              var name = (vm.$options && vm.$options.name) || (vm.type && (vm.type.name || vm.type.__name));
              if (name) {
                components.push({ name: name, framework: 'vue', selector: allPageEls[i].tagName.toLowerCase(), instances: 1 });
              }
            }
          }
        }

        // ── Tier 3: Svelte ──
        for (var i = 0; i < allPageEls.length; i++) {
          if (allPageEls[i].__svelte_meta) {
            framework = framework || 'svelte';
            var loc = allPageEls[i].__svelte_meta.loc;
            var name = (loc && loc.file) ? loc.file.split('/').pop().replace('.svelte', '') : 'SvelteComponent';
            components.push({ name: name, framework: 'svelte', selector: allPageEls[i].tagName.toLowerCase(), instances: 1 });
          }
        }

        // ── Tier 4: Custom Elements ──
        var customEls = {};
        for (var i = 0; i < allPageEls.length; i++) {
          var tag = allPageEls[i].localName;
          if (tag.indexOf('-') !== -1 && customElements.get(tag)) {
            if (customEls[tag]) { customEls[tag].instances++; }
            else { customEls[tag] = { name: tag, framework: 'web-component', selector: tag, instances: 1 }; }
          }
        }
        var ceKeys = Object.keys(customEls);
        for (var i = 0; i < ceKeys.length; i++) { components.push(customEls[ceKeys[i]]); }

        // ── Tier 5: Semantic HTML landmarks ──
        var landmarks = {};
        var landmarkEls = document.querySelectorAll('header, nav, main, section, article, aside, footer, form, dialog');
        for (var i = 0; i < landmarkEls.length; i++) {
          var tag = landmarkEls[i].tagName.toLowerCase();
          if (landmarks[tag]) { landmarks[tag].instances++; }
          else { landmarks[tag] = { name: tag, framework: 'html', selector: tag, instances: 1 }; }
        }
        var lmKeys = Object.keys(landmarks);
        for (var i = 0; i < lmKeys.length; i++) { components.push(landmarks[lmKeys[i]]); }

        // ── Dedup by framework:name ──
        var grouped = {};
        for (var i = 0; i < components.length; i++) {
          var c = components[i];
          var key = c.framework + ':' + c.name;
          if (grouped[key]) { grouped[key].instances += c.instances; }
          else { grouped[key] = { name: c.name, framework: c.framework, selector: c.selector, instances: c.instances, source: c.source }; }
        }
        var result = [];
        var gKeys = Object.keys(grouped);
        for (var i = 0; i < gKeys.length; i++) { result.push(grouped[gKeys[i]]); }

        return { components: result, framework: framework };
      })()`,
      (result: unknown, exceptionInfo?: { isError?: boolean; description?: string; value?: string }) => {
        if (exceptionInfo?.isError || !result) {
          console.error('[componentScanner] eval error:', exceptionInfo?.description ?? exceptionInfo?.value ?? 'no result');
          resolve({ components: [] });
          return;
        }
        resolve(result as ComponentScanResult);
      },
    );
  });
}
