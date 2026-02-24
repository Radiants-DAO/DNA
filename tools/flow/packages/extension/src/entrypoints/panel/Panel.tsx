/**
 * Panel - DevTools panel entrypoint
 *
 * Uses the shared usePanelConnection hook for Chrome DevTools connection
 * and message routing. Renders EditorLayout inside InspectionContext.
 */

import { InspectionContext } from '../../panel/context/InspectionContext';
import { usePanelConnection } from '../../panel/hooks/usePanelConnection';
import { EditorLayout } from '../../panel/components/layout/EditorLayout';

// Re-export for backward compat — consumers should migrate to panel/context/InspectionContext
export { useInspection } from '../../panel/context/InspectionContext';

export function Panel() {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  const contextValue = usePanelConnection(tabId);

  return (
    <InspectionContext.Provider value={contextValue}>
      <EditorLayout />
    </InspectionContext.Provider>
  );
}
