export const SPECTATING_UPDATE_EVENT = 'spectating_update';

export type SpectatingUpdateMessage = {
  userId: string;
  isSpectating: boolean;
  spectatedUser: string;
  spectatingUsers: string[];
  configurationId: string;
};
