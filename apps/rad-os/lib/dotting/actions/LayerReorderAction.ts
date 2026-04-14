import { Action, ActionType } from "./Action";

export class LayerReorderAction extends Action {
  override type = ActionType.LayerOrderChange;
  override layerId: string = "";
  previousLayerIds: Array<string>;
  reorderdLayerIds: Array<string>;

  constructor(
    previousLayerIds: Array<string>,
    reorderdLayerIds: Array<string>,
  ) {
    super();
    this.previousLayerIds = previousLayerIds;
    this.reorderdLayerIds = reorderdLayerIds;
  }

  createInverseAction(): Action {
    return new LayerReorderAction(this.reorderdLayerIds, this.previousLayerIds);
  }
}
