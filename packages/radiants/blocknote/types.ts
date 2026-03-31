/**
 * Minimal render props for hand-written BlockNote block renders.
 *
 * Intentionally loose — avoids requiring @blocknote/react as a dependency
 * of the radiants package. The actual BlockNote types are deeply generic;
 * render functions only need block.props, contentRef, and occasionally editor.
 */
export interface BlockNoteRenderProps {
  block: { props: Record<string, string>; id: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: unknown;
  contentRef: (node: HTMLElement | null) => void;
}
