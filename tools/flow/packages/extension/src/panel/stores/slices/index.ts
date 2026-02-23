/**
 * Store Slices Index
 *
 * Exports all slice creators for the unified app store.
 */

export { createCanvasSlice } from "./canvasSlice";
export { createUiStateSlice } from "./uiStateSlice";
export { createTokensSlice } from "./tokensSlice";
export { createComponentsSlice } from "./componentsSlice";
export { createBridgeSlice } from "./bridgeSlice";
export { createCommentSlice } from "./commentSlice";
export { createAssetsSlice } from "./assetsSlice";
export { createWorkspaceSlice } from "./workspaceSlice";
export { createMutationSlice } from "./mutationSlice";
export { createPromptOutputSlice } from "./promptOutputSlice";
export { createPromptBuilderSlice } from "./promptBuilderSlice";
export { createTextEditsSlice } from "./textEditsSlice";
export { createAnimationDiffsSlice } from "./animationDiffsSlice";
export { createModeSlice } from "./modeSlice";

// Re-export slice types
export type { CanvasSlice } from "./canvasSlice";
export type { UiStateSlice } from "./uiStateSlice";
export type { TokensSlice } from "./tokensSlice";
export type { ComponentsSlice } from "./componentsSlice";
export type { BridgeSlice } from "./bridgeSlice";
export type { AssetsSlice } from "./assetsSlice";
export type { WorkspaceSlice } from "./workspaceSlice";
export type { MutationSlice } from "./mutationSlice";
export type { PromptOutputSlice } from "./promptOutputSlice";
export type { PromptBuilderSlice } from "./promptBuilderSlice";
export type { TextEditsSlice } from "./textEditsSlice";
export type { AnimationDiffsSlice } from "./animationDiffsSlice";
export type { ModeSlice } from "./modeSlice";
