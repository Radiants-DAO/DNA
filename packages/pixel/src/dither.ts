export { bayerMatrix } from './dither/bayer.js';
export { bandDensity, bayerThresholdBits, ditherRampBits } from './dither/ramp.js';
export { defaultDitherSteps, ditherBands } from './dither/prepare.js';

export type { BayerMatrixSize } from './dither/bayer.js';
export type {
  BayerThresholdOptions,
  DitherDirection,
  DitherRampOptions,
} from './dither/ramp.js';
export type {
  DitherBand,
  DitherBandsOptions,
  PreparedDitherBands,
} from './dither/types.js';
