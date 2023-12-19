export const SPECTATING_UPDATE_EVENT = 'spectating_update';

export type SpectatingUpdateMessage = {
  isSpectating: boolean;
  spectatedUserId: string;
  spectatingUserIds: string[];
  configurationId: string;
  configuration: { deviceId: string; projectionMatrix: number[] }[] | null;
};
