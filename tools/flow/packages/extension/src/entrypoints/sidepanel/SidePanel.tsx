/**
 * SidePanel - Chrome Side Panel entrypoint
 *
 * Uses useActiveTabId for async tab resolution and the shared
 * usePanelConnection hook. Reconnects when the active tab changes.
 *
 * Uses SidePanelLayout (not EditorLayout) to avoid pulling in
 * DevTools-only modules (ComponentsPanel → navigationWatcher → chrome.devtools).
 */

import { useActiveTabId } from '../../panel/hooks/useActiveTabId';
import { usePanelConnection } from '../../panel/hooks/usePanelConnection';
import { InspectionContext } from '../../panel/context/InspectionContext';
import { SidePanelLayout } from '../../panel/components/layout/SidePanelLayout';

export function SidePanel() {
  const tabId = useActiveTabId();
  const contextValue = usePanelConnection(tabId);

  if (tabId === null) {
    return (
      <div className="h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">Waiting for active tab...</p>
      </div>
    );
  }

  return (
    <InspectionContext.Provider value={contextValue}>
      <SidePanelLayout />
    </InspectionContext.Provider>
  );
}
