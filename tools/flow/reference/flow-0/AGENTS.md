# RadFlow Tauri — Agent Context

IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for Tauri, Tailwind v4, and DNA-specific tasks.

## File Index
app/stores/slices/:{uiSlice,panelsSlice,commentSlice,componentIdSlice,textEditSlice,tokensSlice,componentsSlice,violationsSlice,watcherSlice,bridgeSlice,projectSlice,selectionSlice,editsSlice,viewportSlice,undoSlice,outputSlice,spatialViewportSlice,componentCanvasSlice,assetsSlice,workspaceSlice}.ts
app/components/layout/:{EditorLayout,LeftPanel,RightPanel,PreviewCanvas,SettingsBar}.tsx
app/components/spatial/:{SpatialCanvas,FileNode,ConnectionLines,Minimap,ZoomControls,MarqueeSelection,SpatialControls}.tsx
app/components/component-canvas/:{ComponentCanvas,ComponentNode}.tsx
app/hooks/:{useKeyboardShortcuts,useTauriCommands,useCanvasGestures,useCanvasPhysics,useCanvasSounds,usePanZoom,useMarqueeSelection,useSpatialKeyboard,useSpatialLayout}.ts
app/utils/:{tokenResolver,colorConversions,parseStyleValue,styleValueToCss,fuzzySearch,fiberSource}.ts
app/utils/spatial/:{treeLayout,treeHelpers,constants}.ts
tauri/src/commands/:{mod,project,workspace,components,tokens,schema,spatial,assets,violations,watcher,text_edit,dev_server}.rs
tauri/src/types/mod.rs

## Docs Index
tasks/IMPLEMENTATION.md — comprehensive implementation reference
docs/webstudio-adoption.md — Webstudio pattern adoption rationale
~/Desktop/vault/radflow/01-Architecture/system-overview.md
~/Desktop/vault/radflow/02-Features/{comment-mode,editor-panels,page-builder,designer-panels,component-canvas,ai-integration,infrastructure}.md
