export type ControlSurfaceDock = 'left' | 'right' | 'bottom';

export interface AppControlSurfaceConfig {
  enabled: boolean;
  dock?: ControlSurfaceDock;
  autoOpen?: boolean;
}

export const defaultControlSurface: AppControlSurfaceConfig = {
  enabled: false,
  dock: 'right',
  autoOpen: false
};
