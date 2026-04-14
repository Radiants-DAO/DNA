export class DottingError extends Error {
  override name = "DottingError";
  constructor(message: string) {
    super(message);
  }
}

export class DuplicateLayerIdError extends DottingError {
  override name = "DuplicateLayerIdError";
  constructor(layerId: string) {
    super(
      `Duplicate layer id ${layerId}. Please make sure all layer ids are unique.`,
    );
  }
}

export class InvalidSquareDataError extends DottingError {
  override name = "InvalidSquareDataError";
  constructor(layerId?: string) {
    const message = layerId ? ` for layer ${layerId}` : "";
    super(
      `Invalid square data${message}. Please make sure all data have the same row and column count.`,
    );
  }
}

export class InvalidDataDimensionsError extends DottingError {
  override name = "InvalidDataDimensionsError";
  constructor(layerId?: string) {
    const message = layerId ? ` for layer ${layerId}` : "";
    super(
      `Invalid data dimensions${message}. Please make sure all data have the same dimensions.`,
    );
  }
}

export class InvalidDataIndicesError extends DottingError {
  override name = "InvalidDataIndicesError";
  constructor(layerId?: string) {
    const message = layerId ? ` for layer ${layerId}` : "";
    super(
      `Invalid data indices${message}. Please make sure all data have the same topRowIndex and leftColumnIndex.`,
    );
  }
}

export class UnspecifiedLayerIdError extends DottingError {
  override name = "UnspecifiedLayerIdError";
  constructor() {
    super(`Layer id has not been specified`);
  }
}

export class InvalidLayerIdError extends DottingError {
  override name = "InvalidLayerIdError";
  constructor(layerId: string) {
    super(`Invalid layer id ${layerId}.`);
  }
}

export class LayerNotFoundError extends DottingError {
  override name = "LayerNotFoundError";
  constructor(layerId: string) {
    super(`Layer ${layerId} not found.`);
  }
}

export class UnrecognizedDownloadOptionError extends DottingError {
  override name = "UnrecognizedDownloadOptionError";
  constructor() {
    super(`Unrecognized download option.`);
  }
}

export class NoDataToMakeSvgError extends DottingError {
  override name = "NoDataToMakeSvgError";
  constructor() {
    super(`No data to make svg.`);
  }
}
