export const SPECTATING_UPDATE_EVENT = 'spectating_update';

export type SpectatingUpdateMessage = {
  isSpectating: boolean;
  spectatedUser: string;
  spectatingUsers: string[];
  configurationId: string;
  configuration: { deviceId: string; projectionMatrix: number[] }[] | null;
};
