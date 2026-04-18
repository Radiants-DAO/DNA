/**
 * Minimal render props for hand-written BlockNote block renders.
 *
 * Intentionally loose — avoids requiring @blocknote/react as a dependency
 * of the radiants package. The actual BlockNote types are deeply generic;
 * render functions only need block.props, contentRef, and occasionally editor.
 *
 * `contentRef` is optional because BlockNote only provides it for
 * `content: "inline"` blocks. For `content: "none"` blocks the renderProps
 * shape is `{ block, editor }` with no contentRef — marking the field
 * optional lets this single type apply to both cases without `any`.
 */
export interface BlockNoteRenderProps {
  block: { props: Record<string, string>; id: string };
  editor: unknown;
  contentRef?: (node: HTMLElement | null) => void;
}
