import { useEffect } from "react";
import { useAppStore } from "../stores/appStore";
import { sendToContent } from "../api/contentBridge";
import { useInspection } from "../../entrypoints/panel/Panel";
import { DogfoodBoundary } from './ui/DogfoodBoundary';

/**
 * CommentMode - Add feedback comments to inspected page elements.
 *
 * The panel listens for content-script element selection events and requests
 * an in-page composer bubble to be rendered on the inspected DOM.
 */
export function CommentMode() {
  const editorMode = useAppStore((s) => s.editorMode);
  const inCommentMode = editorMode === "comment";

  const activeFeedbackType = useAppStore((s) => s.activeFeedbackType);
  const { selectedElement } = useInspection();

  // Tell content script to highlight hovered elements in comment mode
  useEffect(() => {
    if (inCommentMode) {
      sendToContent({
        type: "panel:feature",
        payload: { featureId: "comment", action: "activate" },
      });
    } else {
      sendToContent({
        type: "panel:feature",
        payload: { featureId: "comment", action: "deactivate" },
      });
    }
  }, [inCommentMode]);

  // Open an on-page (DOM) composer bubble when an element is selected in comment/question mode.
  useEffect(() => {
    if (!inCommentMode || !selectedElement || !activeFeedbackType) return;

    const x = selectedElement.clickPoint?.x
      ?? Math.round(selectedElement.rect.left + selectedElement.rect.width / 2);
    const y = selectedElement.clickPoint?.y
      ?? Math.round(selectedElement.rect.top);
    const componentName = selectedElement.id
      ? `#${selectedElement.id}`
      : selectedElement.tagName;

    sendToContent({
      type: "panel:comment-compose",
      payload: {
        type: activeFeedbackType,
        selector: selectedElement.selector,
        componentName,
        x,
        y,
      },
    });
  }, [inCommentMode, selectedElement, activeFeedbackType]);

  if (!inCommentMode) return null;

  return (
    <DogfoodBoundary name="CommentMode" file="CommentMode.tsx" category="mode">
      <>
        {/* Mode indicator */}
        <div
          data-radflow-panel
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-yellow-500/90 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
            <span>{activeFeedbackType === "question" ? "Question" : "Comment"} Mode</span>
            <span className="text-white/60">Click an element to open an on-page bubble</span>
          </div>
        </div>
      </>
    </DogfoodBoundary>
  );
}
