export const APP_OPENED_EVENT = 'app_opened';

export type AppOpenedMessage = {
  id: string;
  position: number[];
  quaternion: number[];
  scale: number[];
};
